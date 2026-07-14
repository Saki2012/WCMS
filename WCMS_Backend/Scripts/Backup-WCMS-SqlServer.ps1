<#
.SYNOPSIS
    WCMS 單一 Case SQL Server 每日完整備份腳本。

.DESCRIPTION
    1. 僅備份指定的單一資料庫。
    2. 支援 Windows 驗證或 SQL Login 驗證。
    3. 使用 COMPRESSION、CHECKSUM 建立完整 BAK。
    4. 備份完成後執行 RESTORE VERIFYONLY。
    5. 驗證成功後才清除超過保留天數的舊備份。
    6. 適用 SQL Server Standard、Developer 與 Express。

.NOTES
    - BACKUP DATABASE 的檔案寫入者是 SQL Server 服務帳號。
    - @BackupDirectory 必須是 SQL Server 主機可寫入的本機路徑或 UNC 路徑。
    - SQL 驗證密碼建議使用 Export-Clixml 建立加密 Credential 檔，不要寫死於腳本。
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

#region Property

# 指定 SQL Server 執行個體，例如 localhost、.\SQLEXPRESS、ServerName\Instance。
$ServerInstance = ".\SQLEXPRESS"

# 指定此 Case 唯一允許備份的資料庫名稱。
$DatabaseName = "WCMS1817"

# 指定驗證方式：Windows 或 SqlLogin。
$AuthenticationMode = "Windows"

# SQL Login 模式使用的加密 Credential 檔；Windows 驗證時留空。
$CredentialFilePath = ""

# 指定 SQLCMD 執行檔；若已加入 PATH 可只填 sqlcmd.exe。
$SqlCmdPath = "sqlcmd.exe"

# 指定 SQL Server 可寫入，且 PowerShell 可清理的備份目錄。
$BackupDirectory = "F:\Web\Backup\WCMS1817"

# 指定 BAK 檔名格式，可使用 {DatabaseName} 與 {Timestamp}。
$BackupFileNamePattern = "{DatabaseName}_{Timestamp}.bak"

# 指定檔名時間格式。
$TimestampFormat = "yyyyMMdd_HHmmss"

# 指定備份檔保留天數。
$RetentionDays = 7

# 指定執行紀錄目錄。
$LogDirectory = "C:\WCMS\BackupLogs"

# 指定 SQLCMD 連線逾時秒數。
$ConnectionTimeoutSeconds = 30

# 指定 SQLCMD 查詢逾時秒數；0 代表不限制。
$QueryTimeoutSeconds = 0

#endregion

#region Public

<#
.SYNOPSIS
    執行指定 WCMS Case 的 SQL Server 完整備份流程。
#>
function Invoke-WcmsSqlBackup {
    $context = New-BackupContext
    Initialize-BackupEnvironment -Context $context
    Invoke-DatabaseBackup -Context $context
    Invoke-BackupVerification -Context $context
    Remove-ExpiredBackups -Context $context
    Write-BackupLog -Context $context -Message "Backup completed successfully."
    return $context.BackupFilePath
}

#endregion

#region Protected

<#
.SYNOPSIS
    建立本次備份需要的路徑、檔名與執行參數。
#>
function New-BackupContext {
    $timestamp = Get-Date -Format $TimestampFormat
    $fileName = $BackupFileNamePattern.Replace("{DatabaseName}", $DatabaseName)
    $fileName = $fileName.Replace("{Timestamp}", $timestamp)
    $backupFilePath = Join-Path $BackupDirectory $fileName
    $logFilePath = Join-Path $LogDirectory "$DatabaseName.log"

    return [PSCustomObject]@{
        Timestamp      = $timestamp
        BackupFilePath = $backupFilePath
        LogFilePath    = $logFilePath
    }
}

<#
.SYNOPSIS
    驗證參數並建立備份與紀錄目錄。
#>
function Initialize-BackupEnvironment {
    param([Parameter(Mandatory)] $Context)

    Assert-BackupConfiguration
    New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null
    New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null
    Write-BackupLog -Context $Context -Message "Backup started."
}

<#
.SYNOPSIS
    呼叫 SQL Server 建立指定資料庫的壓縮完整備份。
#>
function Invoke-DatabaseBackup {
    param([Parameter(Mandatory)] $Context)

    $database = ConvertTo-SqlIdentifier -Value $DatabaseName
    $backupPath = ConvertTo-SqlString -Value $Context.BackupFilePath
    $query = @"
BACKUP DATABASE $database
TO DISK = N'$backupPath'
WITH COMPRESSION, CHECKSUM, INIT, STATS = 10;
"@

    Invoke-SqlCmdProcess -Query $query
    Assert-BackupFileCreated -Path $Context.BackupFilePath
    Write-BackupLog -Context $Context -Message "Database backup created."
}

<#
.SYNOPSIS
    使用 RESTORE VERIFYONLY 驗證備份檔基本完整性。
#>
function Invoke-BackupVerification {
    param([Parameter(Mandatory)] $Context)

    $backupPath = ConvertTo-SqlString -Value $Context.BackupFilePath
    $query = @"
RESTORE VERIFYONLY
FROM DISK = N'$backupPath'
WITH CHECKSUM;
"@

    Invoke-SqlCmdProcess -Query $query
    Write-BackupLog -Context $Context -Message "Backup verification completed."
}

<#
.SYNOPSIS
    僅在新備份驗證成功後，刪除超過保留天數的同 Case BAK。
#>
function Remove-ExpiredBackups {
    param([Parameter(Mandatory)] $Context)

    $cutoffTime = (Get-Date).AddDays(-$RetentionDays)
    $pattern = $BackupFileNamePattern.Replace("{DatabaseName}", $DatabaseName)
    $pattern = $pattern.Replace("{Timestamp}", "*")
    $expiredFiles = Get-ChildItem $BackupDirectory -Filter $pattern -File |
        Where-Object LastWriteTime -lt $cutoffTime

    $expiredFiles | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-BackupLog -Context $Context -Message "Removed expired backup: $($_.Name)"
    }
}

#endregion

#region Private

<#
.SYNOPSIS
    驗證必要參數，避免誤備份其他資料庫或使用不支援的驗證方式。
#>
function Assert-BackupConfiguration {
    $validModes = @("Windows", "SqlLogin")

    if ([string]::IsNullOrWhiteSpace($DatabaseName)) {
        throw "DatabaseName is required."
    }
    if ($AuthenticationMode -notin $validModes) {
        throw "AuthenticationMode must be Windows or SqlLogin."
    }
    if ($AuthenticationMode -eq "SqlLogin" -and -not (Test-Path $CredentialFilePath)) {
        throw "SqlLogin requires a valid CredentialFilePath."
    }
    if ($RetentionDays -lt 1) {
        throw "RetentionDays must be greater than 0."
    }
}

<#
.SYNOPSIS
    執行 sqlcmd，並依驗證模式加入必要參數。
#>
function Invoke-SqlCmdProcess {
    param([Parameter(Mandatory)][string] $Query)

    $arguments = New-SqlCmdArguments -Query $Query
    $process = Start-Process -FilePath $SqlCmdPath `
        -ArgumentList $arguments `
        -Wait -NoNewWindow -PassThru

    if ($process.ExitCode -ne 0) {
        throw "sqlcmd failed with exit code $($process.ExitCode)."
    }
}

<#
.SYNOPSIS
    組裝 sqlcmd 連線、逾時、錯誤回傳與驗證參數。
#>
function New-SqlCmdArguments {
    param([Parameter(Mandatory)][string] $Query)

    $arguments = @(
        "-S", $ServerInstance,
        "-d", "master",
        "-b",
        "-l", $ConnectionTimeoutSeconds,
        "-t", $QueryTimeoutSeconds,
        "-Q", $Query
    )

    $arguments += Get-AuthenticationArguments
    return $arguments
}

<#
.SYNOPSIS
    依 Windows 或 SQL Login 模式建立 sqlcmd 驗證參數。
#>
function Get-AuthenticationArguments {
    if ($AuthenticationMode -eq "Windows") {
        return @("-E")
    }

    $credential = Import-Clixml $CredentialFilePath
    $password = $credential.GetNetworkCredential().Password
    return @("-U", $credential.UserName, "-P", $password)
}

<#
.SYNOPSIS
    確認 SQL Server 已實際建立非空白備份檔。
#>
function Assert-BackupFileCreated {
    param([Parameter(Mandatory)][string] $Path)

    if (-not (Test-Path $Path -PathType Leaf)) {
        throw "Backup file was not created: $Path"
    }

    $backupFile = Get-Item $Path
    if ($backupFile.Length -le 0) {
        throw "Backup file is empty: $Path"
    }
}

<#
.SYNOPSIS
    將資料庫名稱安全轉為 SQL Server Identifier。
#>
function ConvertTo-SqlIdentifier {
    param([Parameter(Mandatory)][string] $Value)

    $escapedValue = $Value.Replace("]", "]]")
    return "[$escapedValue]"
}

<#
.SYNOPSIS
    將檔案路徑中的單引號跳脫為 SQL 字串。
#>
function ConvertTo-SqlString {
    param([Parameter(Mandatory)][string] $Value)

    return $Value.Replace("'", "''")
}

<#
.SYNOPSIS
    將備份流程資訊追加到單一 Case 的 Log。
#>
function Write-BackupLog {
    param(
        [Parameter(Mandatory)] $Context,
        [Parameter(Mandatory)][string] $Message
    )

    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $Context.LogFilePath -Value "[$time] $Message"
}

#endregion

try {
    $backupFilePath = Invoke-WcmsSqlBackup
    Write-Host "Backup succeeded: $backupFilePath"
    exit 0
}
catch {
    $fallbackLog = Join-Path $LogDirectory "$DatabaseName.log"
    New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null
    Add-Content -Path $fallbackLog `
        -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backup failed: $($_.Exception.Message)"
    Write-Error $_
    exit 1
}