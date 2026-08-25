param(
    [string]$Configuration = "Debug",
    [string]$BaselineName = "Baseline",
    [string]$TempSnapName = "TempSnap_1_1",
    [string]$UpgradeName = "Upgrade_1_1_to_Latest",
    [switch]$GenerateSqlOnly,
    [switch]$SkipDbSpecCodeCheck
)

$ErrorActionPreference = "Stop"

function Get-MatchingBraceIndex {
    param([string]$Text, [int]$OpenBraceIndex)

    if ($OpenBraceIndex -lt 0 -or $Text[$OpenBraceIndex] -ne "{") {
        throw "Invalid open brace index."
    }

    $depth = 0
    $inString = $false
    $inChar = $false
    $inLineComment = $false
    $inBlockComment = $false
    $escape = $false

    for ($i = $OpenBraceIndex; $i -lt $Text.Length; $i++) {
        $ch = $Text[$i]
        $next = if ($i + 1 -lt $Text.Length) { $Text[$i + 1] } else { [char]0 }

        if ($inLineComment) {
            if ($ch -eq "`n") { $inLineComment = $false }
            continue
        }

        if ($inBlockComment) {
            if ($ch -eq "*" -and $next -eq "/") {
                $inBlockComment = $false
                $i++
            }
            continue
        }

        if ($inString -or $inChar) {
            if ($escape) { $escape = $false; continue }
            if ($ch -eq "\") { $escape = $true; continue }
            if ($inString -and $ch -eq '"') { $inString = $false }
            if ($inChar -and $ch -eq "'") { $inChar = $false }
            continue
        }

        if ($ch -eq "/" -and $next -eq "/") { $inLineComment = $true; $i++; continue }
        if ($ch -eq "/" -and $next -eq "*") { $inBlockComment = $true; $i++; continue }
        if ($ch -eq '"') { $inString = $true; continue }
        if ($ch -eq "'") { $inChar = $true; continue }

        if ($ch -eq "{") { $depth++ }
        elseif ($ch -eq "}") {
            $depth--
            if ($depth -eq 0) { return $i }
        }
    }

    throw "Matching brace not found."
}

function Get-LineIndent {
    param([string]$Text, [int]$Index)

    $lineStart = $Text.LastIndexOf("`n", $Index)
    $lineStart = if ($lineStart -lt 0) { 0 } else { $lineStart + 1 }
    $i = $lineStart
    while ($i -lt $Text.Length -and ($Text[$i] -eq " " -or $Text[$i] -eq "`t")) { $i++ }
    return $Text.Substring($lineStart, $i - $lineStart)
}

function Get-CSharpMethodBody {
    param([string]$Text, [string]$MethodName)

    $methodMarker = "protected override void $MethodName"
    $methodIndex = $Text.IndexOf($methodMarker, [System.StringComparison]::Ordinal)
    if ($methodIndex -lt 0) { throw "Method not found: $MethodName" }

    $openBraceIndex = $Text.IndexOf("{", $methodIndex)
    if ($openBraceIndex -lt 0) { throw "Open brace not found for method: $MethodName" }

    $closeBraceIndex = Get-MatchingBraceIndex -Text $Text -OpenBraceIndex $openBraceIndex
    return @{
        OpenBraceIndex = $openBraceIndex
        CloseBraceIndex = $closeBraceIndex
        Body = $Text.Substring($openBraceIndex + 1, $closeBraceIndex - $openBraceIndex - 1)
    }
}

function Set-CSharpMethodBody {
    param([string]$Text, [string]$MethodName, [string]$NewBody)

    $method = Get-CSharpMethodBody -Text $Text -MethodName $MethodName
    $openBraceIndex = [int]$method.OpenBraceIndex
    $closeBraceIndex = [int]$method.CloseBraceIndex
    $closeIndent = Get-LineIndent -Text $Text -Index $closeBraceIndex
    $prefix = $Text.Substring(0, $openBraceIndex + 1)
    $suffix = $Text.Substring($closeBraceIndex)

    if ([string]::IsNullOrWhiteSpace($NewBody)) {
        return "$prefix`r`n$closeIndent$suffix"
    }

    return "$prefix`r`n$NewBody`r`n$closeIndent$suffix"
}

function Invoke-DotnetStep {
    param([string]$Title, [scriptblock]$Command)

    Write-Host ""
    Write-Host "== $Title =="
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Title failed." }
}

function Backup-And-ClearMigrations {
    param([string]$MigrationsDir, [string]$ProjectRoot)

    if (!(Test-Path $MigrationsDir)) {
        New-Item -ItemType Directory -Path $MigrationsDir | Out-Null
        return
    }

    $items = Get-ChildItem $MigrationsDir -Force
    if ($items.Count -eq 0) {
        Write-Host "Migrations folder is already empty."
        return
    }

    $backupRoot = Join-Path $ProjectRoot "obj\MigrationBackups"
    $backupDir = Join-Path $backupRoot ("Migrations_" + (Get-Date -Format "yyyyMMddHHmmss"))
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Copy-Item -Path (Join-Path $MigrationsDir "*") -Destination $backupDir -Recurse -Force
    Get-ChildItem $MigrationsDir -Force | Remove-Item -Recurse -Force
    Write-Host "Migrations backup: $backupDir"
}

function Find-ApplicationSnapshotFile {
    param([string]$MigrationsDir)

    return Get-ChildItem $MigrationsDir -Recurse -File -Filter "ApplicationDbContextModelSnapshot.cs" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

function Get-CSharpNamespace {
    param([string]$Text)

    $match = [regex]::Match($Text, "namespace\s+([A-Za-z0-9_.]+)")
    if ($match.Success) { return $match.Groups[1].Value }
    return "WCMS.Migrations"
}

function Get-CSharpUsingDirectives {
    param([string]$Text)

    $requiredUsings = @(
        "using Microsoft.EntityFrameworkCore;",
        "using Microsoft.EntityFrameworkCore.Infrastructure;",
        "using Microsoft.EntityFrameworkCore.Metadata;",
        "using Microsoft.EntityFrameworkCore.Storage.ValueConversion;"
    )
    $designerUsings = [regex]::Matches($Text, "(?m)^\s*using\s+[^;]+;\s*$") |
        ForEach-Object { $_.Value.Trim() }

    return (@($requiredUsings + $designerUsings) | Select-Object -Unique) -join "`r`n"
}

function Create-ApplicationSnapshotFromDesigner {
    param([string]$DesignerPath, [string]$SnapshotPath)

    $designerText = Get-Content $DesignerPath -Raw -Encoding UTF8
    $designerNamespace = Get-CSharpNamespace -Text $designerText
    $usingDirectives = Get-CSharpUsingDirectives -Text $designerText
    $target = Get-CSharpMethodBody -Text $designerText -MethodName "BuildTargetModel"
    $targetBody = $target.Body.Trim("`r", "`n")

    $snapshotText = @"
$usingDirectives

#nullable disable

namespace $designerNamespace
{
    [DbContext(typeof(ApplicationDbContext))]
    partial class ApplicationDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
$targetBody
        }
    }
}
"@
    Set-Content $SnapshotPath $snapshotText -Encoding UTF8
    Write-Host "ApplicationDbContextModelSnapshot.cs created from designer: $SnapshotPath"
}

function Format-SpecCode {
    param([string]$SpecCode)

    if ([string]::IsNullOrWhiteSpace($SpecCode)) { return "(empty)" }
    return $SpecCode
}

# 從 SystemVersion C# 原始碼讀取指定版本欄位的整數值。
function Get-VersionValueFromSource {
    param([string]$SourcePath, [string]$PropertyName)

    if (!(Test-Path $SourcePath)) { throw "Version source not found: $SourcePath" }
    $sourceText = Get-Content $SourcePath -Raw -Encoding UTF8
    $escapedName = [regex]::Escape($PropertyName)
    $pattern = "\b$escapedName\s*=\s*(?<value>\d+)\s*[,;]"
    $match = [regex]::Match($sourceText, $pattern)
    if (!$match.Success) { throw "Version property '$PropertyName' not found: $SourcePath" }
    return [int]$match.Groups["value"].Value
}

# 依目前 SpecCode、Feature ModelVersion 與 SpecModelVersion 組成 SQL 檔名。
function Get-UpgradeSqlFileName {
    param([string]$ProjectRoot, [string]$SpecCode)

    $featureVersionPath = Join-Path $ProjectRoot "SysCore\Configuration\SystemVersion.cs"
    $featureModelVersion = Get-VersionValueFromSource -SourcePath $featureVersionPath -PropertyName "ModelVersion"
    if ([string]::IsNullOrWhiteSpace($SpecCode)) { return "Feature-$featureModelVersion.sql" }

    $specVersionPath = Join-Path $ProjectRoot "SpecFeatures\$SpecCode\SYS\SystemVersion\SystemVersion_Biz.cs"
    $specModelVersion = Get-VersionValueFromSource -SourcePath $specVersionPath -PropertyName "SpecModelVersion"
    return "$SpecCode-$featureModelVersion.$specModelVersion.sql"
}

function Invoke-SqlScalar {
    param([string]$ConnectionString, [string]$Sql)

    $connObj = New-Object System.Data.SqlClient.SqlConnection $ConnectionString
    $cmd = $connObj.CreateCommand()
    $cmd.CommandText = $Sql
    $cmd.CommandTimeout = 30

    try {
        $connObj.Open()
        return $cmd.ExecuteScalar()
    }
    finally {
        $connObj.Dispose()
    }
}

# 執行查詢並保留完整 DataTable，供 FK Schema Metadata 分析使用。
function Invoke-SqlQuery {
    param([string]$ConnectionString, [string]$Sql)

    $connObj = New-Object System.Data.SqlClient.SqlConnection $ConnectionString
    $cmd = $connObj.CreateCommand()
    $cmd.CommandText = $Sql
    $cmd.CommandTimeout = 60
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter $cmd
    $table = New-Object System.Data.DataTable

    try {
        [void]$adapter.Fill($table)
        Write-Output -NoEnumerate $table
    }
    finally {
        $adapter.Dispose()
        $connObj.Dispose()
    }
}

function Assert-DbSpecCode {
    param([string]$ConnectionString, [string]$ExpectedSpecCode)

    $tableSql = @"
SELECT COUNT(1)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_NAME = 'SysDbProfile';
"@
    $tableCount = Invoke-SqlScalar -ConnectionString $ConnectionString -Sql $tableSql
    if ([int]$tableCount -le 0) {
        throw "SysDbProfile table not found. Run initial migration first or use -SkipDbSpecCodeCheck only for the first migration that creates SysDbProfile."
    }

    $profileSql = @"
SELECT TOP 1 [ProfileValue]
FROM [dbo].[SysDbProfile]
WHERE [ProfileKey] = N'SpecCode';
"@
    $dbSpecCode = Invoke-SqlScalar -ConnectionString $ConnectionString -Sql $profileSql
    if ($null -eq $dbSpecCode) {
        throw "SysDbProfile.SpecCode not found. Start the system once to initialize it, insert it manually, or use -SkipDbSpecCodeCheck only for the first migration."
    }

    $expectedText = $ExpectedSpecCode.Trim()
    $dbSpecCodeText = $dbSpecCode.ToString().Trim()
    Write-Host "Config SpecCode: $(Format-SpecCode $expectedText)"
    Write-Host "DB SpecCode: $(Format-SpecCode $dbSpecCodeText)"
    if ($dbSpecCodeText -ne $expectedText) {
        throw "SpecCode mismatch. Config SpecCode is '$(Format-SpecCode $expectedText)', but DB SpecCode is '$(Format-SpecCode $dbSpecCodeText)'. Migration stopped."
    }
}

# 將 SQL Server Identifier 安全包成方括號格式。
function Quote-SqlIdentifier {
    param([string]$Name)

    return "[" + $Name.Replace("]", "]]" ) + "]"
}

# 從 EF 產生的 SQL 擷取所有 ALTER COLUMN 目標欄位。
function Get-AlteredColumnsFromSql {
    param([string]$SqlText)

    $pattern = 'ALTER\s+TABLE\s+(?:\[(?<schema>[^\]]+)\]\.)?\[(?<table>[^\]]+)\]\s+ALTER\s+COLUMN\s+\[(?<column>[^\]]+)\]'
    $items = foreach ($match in [regex]::Matches($SqlText, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
        [pscustomobject]@{
            Schema = if ($match.Groups["schema"].Success) { $match.Groups["schema"].Value } else { "dbo" }
            Table = $match.Groups["table"].Value
            Column = $match.Groups["column"].Value
        }
    }

    return @($items)
}

# 從目前資料庫讀取完整 FK 定義與原始信任/啟用狀態。
function Get-ForeignKeyRows {
    param([string]$ConnectionString)

    $sql = @"
SELECT
    fk.object_id AS ForeignKeyObjectId,
    fk.name AS ForeignKeyName,
    ps.name AS ParentSchema,
    pt.name AS ParentTable,
    pc.name AS ParentColumn,
    rs.name AS ReferencedSchema,
    rt.name AS ReferencedTable,
    rc.name AS ReferencedColumn,
    fkc.constraint_column_id AS ColumnOrder,
    fk.delete_referential_action_desc AS DeleteAction,
    fk.update_referential_action_desc AS UpdateAction,
    fk.is_not_for_replication AS IsNotForReplication,
    fk.is_disabled AS IsDisabled,
    fk.is_not_trusted AS IsNotTrusted
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
INNER JOIN sys.tables pt ON pt.object_id = fk.parent_object_id
INNER JOIN sys.schemas ps ON ps.schema_id = pt.schema_id
INNER JOIN sys.columns pc ON pc.object_id = pt.object_id AND pc.column_id = fkc.parent_column_id
INNER JOIN sys.tables rt ON rt.object_id = fk.referenced_object_id
INNER JOIN sys.schemas rs ON rs.schema_id = rt.schema_id
INNER JOIN sys.columns rc ON rc.object_id = rt.object_id AND rc.column_id = fkc.referenced_column_id
ORDER BY fk.object_id, fkc.constraint_column_id;
"@
    return Invoke-SqlQuery -ConnectionString $ConnectionString -Sql $sql
}

# 將 FK 欄位列依 Constraint 分組成可重建的完整定義。
function Convert-ForeignKeyRowsToDefinitions {
    param([System.Data.DataTable]$Rows)

    $definitions = foreach ($group in ($Rows.Rows | Group-Object ForeignKeyObjectId)) {
        $ordered = @($group.Group | Sort-Object { [int]$_.ColumnOrder })
        $first = $ordered[0]

        [pscustomobject]@{
            Name = [string]$first.ForeignKeyName
            ParentSchema = [string]$first.ParentSchema
            ParentTable = [string]$first.ParentTable
            ParentColumns = @($ordered | ForEach-Object { [string]$_.ParentColumn })
            ReferencedSchema = [string]$first.ReferencedSchema
            ReferencedTable = [string]$first.ReferencedTable
            ReferencedColumns = @($ordered | ForEach-Object { [string]$_.ReferencedColumn })
            DeleteAction = [string]$first.DeleteAction
            UpdateAction = [string]$first.UpdateAction
            IsNotForReplication = [bool]$first.IsNotForReplication
            IsDisabled = [bool]$first.IsDisabled
            IsNotTrusted = [bool]$first.IsNotTrusted
        }
    }

    return @($definitions)
}

# 判斷 FK 的父欄位或被參照欄位是否命中本次 ALTER COLUMN。
function Test-ForeignKeyTouchesAlteredColumn {
    param([object]$ForeignKey, [object[]]$AlteredColumns)

    foreach ($column in $AlteredColumns) {
        $parentMatch = $column.Schema -eq $ForeignKey.ParentSchema -and
            $column.Table -eq $ForeignKey.ParentTable -and
            $ForeignKey.ParentColumns -contains $column.Column
        $referenceMatch = $column.Schema -eq $ForeignKey.ReferencedSchema -and
            $column.Table -eq $ForeignKey.ReferencedTable -and
            $ForeignKey.ReferencedColumns -contains $column.Column

        if ($parentMatch -or $referenceMatch) { return $true }
    }

    return $false
}

# 將 SQL Server Referential Action Metadata 轉成 ON DELETE/UPDATE 片段。
function Convert-ReferentialAction {
    param([string]$Clause, [string]$Action)

    if ([string]::IsNullOrWhiteSpace($Action) -or $Action -eq "NO_ACTION") { return "" }
    return " ON $Clause " + $Action.Replace("_", " ")
}

# 產生單一 FK 的 DROP CONSTRAINT SQL。
function Build-ForeignKeyDropSql {
    param([object]$ForeignKey)

    $table = "$(Quote-SqlIdentifier $ForeignKey.ParentSchema).$(Quote-SqlIdentifier $ForeignKey.ParentTable)"
    $name = Quote-SqlIdentifier $ForeignKey.Name
    return "ALTER TABLE $table DROP CONSTRAINT $name;"
}

# 依目前 DB Metadata 產生 FK 還原 SQL，保留複合欄位與 Constraint 狀態。
function Build-ForeignKeyCreateSql {
    param([object]$ForeignKey)

    $parentTable = "$(Quote-SqlIdentifier $ForeignKey.ParentSchema).$(Quote-SqlIdentifier $ForeignKey.ParentTable)"
    $referencedTable = "$(Quote-SqlIdentifier $ForeignKey.ReferencedSchema).$(Quote-SqlIdentifier $ForeignKey.ReferencedTable)"
    $parentColumns = ($ForeignKey.ParentColumns | ForEach-Object { Quote-SqlIdentifier $_ }) -join ", "
    $referencedColumns = ($ForeignKey.ReferencedColumns | ForEach-Object { Quote-SqlIdentifier $_ }) -join ", "
    $trust = if ($ForeignKey.IsNotTrusted -or $ForeignKey.IsDisabled) { "NOCHECK" } else { "CHECK" }
    $deleteAction = Convert-ReferentialAction -Clause "DELETE" -Action $ForeignKey.DeleteAction
    $updateAction = Convert-ReferentialAction -Clause "UPDATE" -Action $ForeignKey.UpdateAction
    $replication = if ($ForeignKey.IsNotForReplication) { " NOT FOR REPLICATION" } else { "" }

    $sql = "ALTER TABLE $parentTable WITH $trust ADD CONSTRAINT $(Quote-SqlIdentifier $ForeignKey.Name) FOREIGN KEY ($parentColumns) REFERENCES $referencedTable ($referencedColumns)$deleteAction$updateAction$replication;"
    $state = if ($ForeignKey.IsDisabled) { "NOCHECK" } else { "CHECK" }
    return "$sql`r`nALTER TABLE $parentTable $state CONSTRAINT $(Quote-SqlIdentifier $ForeignKey.Name);"
}

# 避免 EF 已自行處理的 FK 被 WCMS Guard 重複 DROP/ADD。
function Test-SqlAlreadyDropsForeignKey {
    param([string]$SqlText, [string]$ForeignKeyName)

    $escapedName = [regex]::Escape($ForeignKeyName)
    return [regex]::IsMatch($SqlText, "DROP\s+CONSTRAINT\s+\[$escapedName\]", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
}

# 找出 ALTER COLUMN 的 FK Dependency，並將 Guard 注入最終 Upgrade SQL。
function Add-ForeignKeyGuardsToSql {
    param([string]$ConnectionString, [string]$SqlText)

    $alteredColumns = Get-AlteredColumnsFromSql -SqlText $SqlText
    if ($alteredColumns.Count -eq 0) { return Add-XactAbortToSql -SqlText $SqlText }

    $rows = Get-ForeignKeyRows -ConnectionString $ConnectionString
    $definitions = Convert-ForeignKeyRowsToDefinitions -Rows $rows
    $dependencies = @($definitions | Where-Object {
        (Test-ForeignKeyTouchesAlteredColumn -ForeignKey $_ -AlteredColumns $alteredColumns) -and
        !(Test-SqlAlreadyDropsForeignKey -SqlText $SqlText -ForeignKeyName $_.Name)
    })

    if ($dependencies.Count -eq 0) { return Add-XactAbortToSql -SqlText $SqlText }
    Write-Host "Foreign key guards detected: $($dependencies.Count)"
    return Add-ForeignKeyGuardBlocks -SqlText $SqlText -ForeignKeys $dependencies
}

# 強制 DDL 失敗時讓 Transaction 進入可回滾狀態，避免半套 Schema。
function Add-XactAbortToSql {
    param([string]$SqlText)

    if ([regex]::IsMatch($SqlText, "(?im)^\s*SET\s+XACT_ABORT\s+ON\s*;")) { return $SqlText }
    return "SET XACT_ABORT ON;`r`n`r`n$SqlText"
}

# 將 FK Drop/Restore Block 放進真正執行 ALTER COLUMN 的 Migration Transaction。
function Add-ForeignKeyGuardBlocks {
    param([string]$SqlText, [object[]]$ForeignKeys)

    $alterRegex = [regex]::new(
        'ALTER\s+TABLE\s+(?:\[[^\]]+\]\.)?\[[^\]]+\]\s+ALTER\s+COLUMN\s+\[[^\]]+\]',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
    $alterMatches = $alterRegex.Matches($SqlText)
    if ($alterMatches.Count -eq 0) { return Add-XactAbortToSql -SqlText $SqlText }

    $dropBlock = New-ForeignKeyDropBlock -ForeignKeys $ForeignKeys
    $restoreBlock = New-ForeignKeyRestoreBlock -ForeignKeys $ForeignKeys
    $result = Add-RestoreBlockAfterAlterSection -SqlText $SqlText -AlterMatches $alterMatches -RestoreBlock $restoreBlock
    $result = Add-DropBlockBeforeAlterSection -SqlText $result -FirstAlterIndex $alterMatches[0].Index -DropBlock $dropBlock
    return Add-XactAbortToSql -SqlText $result
}

# 組成所有相依 FK 的統一 Drop Block。
function New-ForeignKeyDropBlock {
    param([object[]]$ForeignKeys)

    $lines = $ForeignKeys | ForEach-Object { Build-ForeignKeyDropSql $_ }
    return "-- WCMS FK Guard: drop dependencies before AlterColumn`r`n" + ($lines -join "`r`n")
}

# 組成所有相依 FK 的統一 Restore Block。
function New-ForeignKeyRestoreBlock {
    param([object[]]$ForeignKeys)

    $lines = $ForeignKeys | ForEach-Object { Build-ForeignKeyCreateSql $_ }
    return "-- WCMS FK Guard: restore dependencies after schema changes`r`n" + ($lines -join "`r`n`r`n")
}

# 將 Drop Block 插入最接近第一個 ALTER COLUMN 的 BEGIN TRANSACTION 後。
function Add-DropBlockBeforeAlterSection {
    param([string]$SqlText, [int]$FirstAlterIndex, [string]$DropBlock)

    $beginRegex = [regex]::new("(?im)^\s*BEGIN\s+TRANSACTION\s*;\s*$")
    $beginMatch = $null
    foreach ($match in $beginRegex.Matches($SqlText)) {
        if ($match.Index -ge $FirstAlterIndex) { break }
        $beginMatch = $match
    }

    $insertIndex = if ($null -eq $beginMatch) { $FirstAlterIndex } else { $beginMatch.Index + $beginMatch.Length }
    return $SqlText.Insert($insertIndex, "`r`n`r`n$DropBlock")
}

# 將 Restore Block 插入最後 ALTER COLUMN 後、Migration History/COMMIT 前。
function Add-RestoreBlockAfterAlterSection {
    param([string]$SqlText, [object]$AlterMatches, [string]$RestoreBlock)

    $lastAlter = $AlterMatches[$AlterMatches.Count - 1]
    $searchStart = $lastAlter.Index + $lastAlter.Length
    $historyRegex = [regex]::new("(?im)^\s*INSERT\s+INTO\s+\[__EFMigrationsHistory\]")
    $historyMatch = $historyRegex.Match($SqlText, $searchStart)
    if ($historyMatch.Success) {
        return $SqlText.Insert($historyMatch.Index, "$RestoreBlock`r`n`r`n")
    }

    $commitRegex = [regex]::new("(?im)^\s*COMMIT\s*;\s*$")
    $commitMatch = $commitRegex.Match($SqlText, $searchStart)
    if (!$commitMatch.Success) { throw "Migration history INSERT and COMMIT were both not found after AlterColumn." }
    return $SqlText.Insert($commitMatch.Index, "$RestoreBlock`r`n`r`n")
}

# 使用同一 SQL Connection 逐 Batch 執行 Hardened Upgrade SQL。
function Invoke-SqlScriptFile {
    param([string]$ConnectionString, [string]$SqlPath)

    $sqlText = Get-Content $SqlPath -Raw -Encoding UTF8
    $batches = [regex]::Split($sqlText, "(?im)^\s*GO\s*;?\s*$")
    $connObj = New-Object System.Data.SqlClient.SqlConnection $ConnectionString
    $connObj.Open()

    try {
        foreach ($batch in $batches) {
            if ([string]::IsNullOrWhiteSpace($batch)) { continue }
            $cmd = $connObj.CreateCommand()
            $cmd.CommandText = $batch
            $cmd.CommandTimeout = 0
            [void]$cmd.ExecuteNonQuery()
            $cmd.Dispose()
        }
    }
    catch {
        Invoke-RollbackOpenTransaction -Connection $connObj
        throw
    }
    finally {
        $connObj.Dispose()
    }
}

# 發生執行錯誤時，主動回滾仍開啟的 SQL Transaction。
function Invoke-RollbackOpenTransaction {
    param([System.Data.SqlClient.SqlConnection]$Connection)

    try {
        $cmd = $Connection.CreateCommand()
        $cmd.CommandText = "IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;"
        [void]$cmd.ExecuteNonQuery()
        $cmd.Dispose()
    }
    catch {
        Write-Warning "Rollback check failed: $($_.Exception.Message)"
    }
}

# Resolve paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
$projectPath = Join-Path $projectRoot "WCMS.csproj"
$settingsPath = Join-Path $projectRoot "appsettings.Development.json"
$migrationsDir = Join-Path $projectRoot "Migrations"
$baselineScaffoldDir = Join-Path $migrationsDir "_BaselineScaffold"
$tempMigrationDir = Join-Path $baselineScaffoldDir "__TempMigrations"
$snapshotPath = Join-Path $migrationsDir "ApplicationDbContextModelSnapshot.cs"
$sqlDir = Join-Path $migrationsDir "Sql"
$diagnosticDir = Join-Path $projectRoot "obj\MigrationDiagnostics"

Set-Location $projectRoot

# Read settings
if (!(Test-Path $settingsPath)) { throw "appsettings.Development.json not found: $settingsPath" }

$settings = Get-Content $settingsPath -Raw -Encoding UTF8 | ConvertFrom-Json
$conn = $settings.ConnectionStrings.SqlConnection
$hasSpecCodeProperty = $settings.PSObject.Properties.Name -contains "SpecCode"
if (!$hasSpecCodeProperty) { throw "Missing SpecCode property in appsettings.Development.json. Use empty string for pure Feature version." }

$specCode = if ($null -eq $settings.SpecCode) { "" } else { $settings.SpecCode.ToString().Trim() }
if ([string]::IsNullOrWhiteSpace($conn)) { throw "Missing ConnectionStrings.SqlConnection in appsettings.Development.json." }
$sqlFileName = Get-UpgradeSqlFileName -ProjectRoot $projectRoot -SpecCode $specCode
$sqlPath = Join-Path $sqlDir $sqlFileName

Write-Host "SpecCode: $(Format-SpecCode $specCode)"
Write-Host "Configuration: $Configuration"
Write-Host "Project: $projectPath"
Write-Host "SQL Output: $sqlPath"

# Validate DB SpecCode before any destructive file operation or DB update
if ($SkipDbSpecCodeCheck) {
    Write-Host ""
    Write-Host "== Skip target database SpecCode validation =="
    Write-Host "Warning: this should only be used for the first migration that creates SysDbProfile."
}
else {
    Write-Host ""
    Write-Host "== Validate target database SpecCode =="
    Assert-DbSpecCode -ConnectionString $conn -ExpectedSpecCode $specCode
}

Write-Host ""
Write-Host "== Backup and clear Migrations =="
Backup-And-ClearMigrations -MigrationsDir $migrationsDir -ProjectRoot $projectRoot

Invoke-DotnetStep -Title "Build project with SpecCode" -Command {
    dotnet build $projectPath -c $Configuration /p:SpecCode=$specCode /p:UseSpecCodeCompile=true
}

Invoke-DotnetStep -Title "Add baseline migration" -Command {
    dotnet ef migrations add $BaselineName `
        --context ApplicationDbContext `
        --startup-project $projectPath `
        --project $projectPath `
        --configuration $Configuration `
        --no-build
}

$baselineFile = Get-ChildItem $migrationsDir -Filter "*_$BaselineName.cs" |
    Where-Object { $_.Name -notlike "*.Designer.cs" } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
if ($null -eq $baselineFile) { throw "Baseline migration file not found." }

Write-Host ""
Write-Host "== Clear Baseline Up/Down =="
$baselineText = Get-Content $baselineFile.FullName -Raw -Encoding UTF8
$baselineText = Set-CSharpMethodBody -Text $baselineText -MethodName "Up" -NewBody ""
$baselineText = Set-CSharpMethodBody -Text $baselineText -MethodName "Down" -NewBody ""
Set-Content $baselineFile.FullName $baselineText -Encoding UTF8

$snapshotFile = Find-ApplicationSnapshotFile -MigrationsDir $migrationsDir
if ($null -eq $snapshotFile) {
    $baselineDesignerFile = Get-ChildItem $migrationsDir -Filter "*_$BaselineName.Designer.cs" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($null -eq $baselineDesignerFile) { throw "Baseline Designer.cs not found. Cannot create ApplicationDbContextModelSnapshot.cs." }
    Create-ApplicationSnapshotFromDesigner -DesignerPath $baselineDesignerFile.FullName -SnapshotPath $snapshotPath
}
else {
    $snapshotPath = $snapshotFile.FullName
}

Invoke-DotnetStep -Title "Build after clearing baseline" -Command {
    dotnet build $projectPath -c $Configuration /p:SpecCode=$specCode /p:UseSpecCodeCompile=true
}

if (!$GenerateSqlOnly) {
    Invoke-DotnetStep -Title "Update database to baseline" -Command {
        dotnet ef database update `
            --context ApplicationDbContext `
            --startup-project $projectPath `
            --project $projectPath `
            --configuration $Configuration `
            --no-build
    }
}
else {
    Write-Host ""
    Write-Host "== GenerateSqlOnly: skip baseline database update =="
}

Invoke-DotnetStep -Title "Scaffold current database" -Command {
    dotnet ef dbcontext scaffold "$conn" Microsoft.EntityFrameworkCore.SqlServer `
        --context TempBaselineDbContext `
        --startup-project $projectPath `
        --project $projectPath `
        --configuration $Configuration `
        --output-dir "Migrations/_BaselineScaffold" `
        --use-database-names `
        --no-pluralize `
        --schema dbo `
        --force `
        --no-build
}

Invoke-DotnetStep -Title "Build after scaffold" -Command {
    dotnet build $projectPath -c $Configuration /p:SpecCode=$specCode /p:UseSpecCodeCompile=true
}

Invoke-DotnetStep -Title "Add temp snapshot migration" -Command {
    dotnet ef migrations add $TempSnapName `
        --context WCMS.Migrations._BaselineScaffold.TempBaselineDbContext `
        --startup-project $projectPath `
        --project $projectPath `
        --configuration $Configuration `
        --output-dir "Migrations/_BaselineScaffold/__TempMigrations" `
        --no-build
}

$tempDesignerFile = Get-ChildItem $tempMigrationDir -Filter "*_$TempSnapName.Designer.cs" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
if ($null -eq $tempDesignerFile) { throw "TempSnap Designer.cs not found." }
if (!(Test-Path $snapshotPath)) { throw "ApplicationDbContextModelSnapshot.cs not found after fallback creation: $snapshotPath" }

$backupPath = "$snapshotPath.bak_$(Get-Date -Format 'yyyyMMddHHmmss')"
Copy-Item $snapshotPath $backupPath -Force
Write-Host "Snapshot backup created: $backupPath"

$tempDesignerText = Get-Content $tempDesignerFile.FullName -Raw -Encoding UTF8
$snapshotText = Get-Content $snapshotPath -Raw -Encoding UTF8
$tempBuildTarget = Get-CSharpMethodBody -Text $tempDesignerText -MethodName "BuildTargetModel"
$targetBody = $tempBuildTarget.Body.Trim("`r", "`n")
$snapshotText = Set-CSharpMethodBody -Text $snapshotText -MethodName "BuildModel" -NewBody $targetBody
Set-Content $snapshotPath $snapshotText -Encoding UTF8

if (!(Test-Path $diagnosticDir)) { New-Item -ItemType Directory -Path $diagnosticDir | Out-Null }
$transplantedSnapshotPath = Join-Path $diagnosticDir "ApplicationDbContextModelSnapshot.Transplanted.txt"
Set-Content $transplantedSnapshotPath $snapshotText -Encoding UTF8

Invoke-DotnetStep -Title "Build after snapshot replacement" -Command {
    dotnet build $projectPath -c $Configuration /p:SpecCode=$specCode /p:UseSpecCodeCompile=true
}

Invoke-DotnetStep -Title "Add upgrade migration" -Command {
    dotnet ef migrations add $UpgradeName `
        --context ApplicationDbContext `
        --startup-project $projectPath `
        --project $projectPath `
        --configuration $Configuration `
        --no-build
}

Invoke-DotnetStep -Title "Build after upgrade migration" -Command {
    dotnet build $projectPath -c $Configuration /p:SpecCode=$specCode /p:UseSpecCodeCompile=true
}

if (!(Test-Path $sqlDir)) { New-Item -ItemType Directory -Path $sqlDir | Out-Null }
$fromMigration = if ($GenerateSqlOnly) { "0" } else { $BaselineName }

Invoke-DotnetStep -Title "Generate SQL script" -Command {
    dotnet ef migrations script $fromMigration $UpgradeName `
        --context ApplicationDbContext `
        --startup-project $projectPath `
        --project $projectPath `
        --configuration $Configuration `
        --no-build `
        -o $sqlPath
}

$sqlText = Get-Content $sqlPath -Raw -Encoding UTF8
$hardenedSql = Add-ForeignKeyGuardsToSql -ConnectionString $conn -SqlText $sqlText
Set-Content $sqlPath $hardenedSql -Encoding UTF8
Write-Host "Hardened SQL script generated: $sqlPath"

if ($GenerateSqlOnly) {
    Write-Host "GenerateSqlOnly completed. Target database schema was not updated."
}
else {
    Write-Host ""
    Write-Host "== Execute hardened SQL script =="
    Invoke-SqlScriptFile -ConnectionString $conn -SqlPath $sqlPath
    Write-Host "Database update completed with hardened SQL script."
}
