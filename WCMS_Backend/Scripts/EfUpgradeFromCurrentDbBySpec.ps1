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
        $next = [char]0
        if ($i + 1 -lt $Text.Length) {
            $next = $Text[$i + 1]
        }

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

        if ($inString) {
            if ($escape) {
                $escape = $false
                continue
            }

            if ($ch -eq "\") {
                $escape = $true
                continue
            }

            if ($ch -eq '"') {
                $inString = $false
            }

            continue
        }

        if ($inChar) {
            if ($escape) {
                $escape = $false
                continue
            }

            if ($ch -eq "\") {
                $escape = $true
                continue
            }

            if ($ch -eq "'") {
                $inChar = $false
            }

            continue
        }

        if ($ch -eq "/" -and $next -eq "/") {
            $inLineComment = $true
            $i++
            continue
        }

        if ($ch -eq "/" -and $next -eq "*") {
            $inBlockComment = $true
            $i++
            continue
        }

        if ($ch -eq '"') {
            $inString = $true
            continue
        }

        if ($ch -eq "'") {
            $inChar = $true
            continue
        }

        if ($ch -eq "{") {
            $depth++
        }
        elseif ($ch -eq "}") {
            $depth--

            if ($depth -eq 0) {
                return $i
            }
        }
    }

    throw "Matching brace not found."
}

function Get-LineIndent {
    param([string]$Text, [int]$Index)

    $lineStart = $Text.LastIndexOf("`n", $Index)
    if ($lineStart -lt 0) {
        $lineStart = 0
    }
    else {
        $lineStart++
    }

    $i = $lineStart
    while ($i -lt $Text.Length -and ($Text[$i] -eq " " -or $Text[$i] -eq "`t")) {
        $i++
    }

    return $Text.Substring($lineStart, $i - $lineStart)
}

function Get-CSharpMethodBody {
    param([string]$Text, [string]$MethodName)

    $methodMarker = "protected override void $MethodName"
    $methodIndex = $Text.IndexOf($methodMarker, [System.StringComparison]::Ordinal)

    if ($methodIndex -lt 0) {
        throw "Method not found: $MethodName"
    }

    $openBraceIndex = $Text.IndexOf("{", $methodIndex)
    if ($openBraceIndex -lt 0) {
        throw "Open brace not found for method: $MethodName"
    }

    $closeBraceIndex = Get-MatchingBraceIndex -Text $Text -OpenBraceIndex $openBraceIndex
    $bodyStart = $openBraceIndex + 1
    $bodyLength = $closeBraceIndex - $bodyStart

    return @{
        OpenBraceIndex = $openBraceIndex
        CloseBraceIndex = $closeBraceIndex
        Body = $Text.Substring($bodyStart, $bodyLength)
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

    if ($LASTEXITCODE -ne 0) {
        throw "$Title failed."
    }
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

    Write-Host "Backing up Migrations to: $backupDir"
    Copy-Item -Path (Join-Path $MigrationsDir "*") -Destination $backupDir -Recurse -Force

    Write-Host "Clearing Migrations folder: $MigrationsDir"
    Get-ChildItem $MigrationsDir -Force | Remove-Item -Recurse -Force
}

function Find-ApplicationSnapshotFile {
    param([string]$MigrationsDir)

    $snapshotFile = Get-ChildItem $MigrationsDir -Recurse -File -Filter "ApplicationDbContextModelSnapshot.cs" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    return $snapshotFile
}

function Get-CSharpNamespace {
    param([string]$Text)

    $match = [regex]::Match($Text, "namespace\s+([A-Za-z0-9_.]+)")
    if ($match.Success) {
        return $match.Groups[1].Value
    }

    return "WCMS.Migrations"
}

function Create-ApplicationSnapshotFromDesigner {
    param(
        [string]$DesignerPath,
        [string]$SnapshotPath
    )

    $designerText = Get-Content $DesignerPath -Raw -Encoding UTF8
    $designerNamespace = Get-CSharpNamespace -Text $designerText
    $target = Get-CSharpMethodBody -Text $designerText -MethodName "BuildTargetModel"
    $targetBody = $target.Body.Trim("`r", "`n")

    $snapshotText = @"
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using WCMS.SysCore;

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

    if ([string]::IsNullOrWhiteSpace($SpecCode)) {
        return "(empty)"
    }

    return $SpecCode
}

function Invoke-SqlScalar {
    param(
        [string]$ConnectionString,
        [string]$Sql
    )

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

function Assert-DbSpecCode {
    param(
        [string]$ConnectionString,
        [string]$ExpectedSpecCode
    )

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
$sqlPath = Join-Path $sqlDir "$UpgradeName.sql"
$diagnosticDir = Join-Path $projectRoot "obj\MigrationDiagnostics"

Set-Location $projectRoot

# Read settings
if (!(Test-Path $settingsPath)) {
    throw "appsettings.Development.json not found: $settingsPath"
}

$settings = Get-Content $settingsPath -Raw -Encoding UTF8 | ConvertFrom-Json
$conn = $settings.ConnectionStrings.SqlConnection

$hasSpecCodeProperty = $settings.PSObject.Properties.Name -contains "SpecCode"
if (!$hasSpecCodeProperty) {
    throw "Missing SpecCode property in appsettings.Development.json. Use empty string for pure Feature version."
}

$specCode = ""
if ($null -ne $settings.SpecCode) {
    $specCode = $settings.SpecCode.ToString().Trim()
}

if ([string]::IsNullOrWhiteSpace($conn)) {
    throw "Missing ConnectionStrings.SqlConnection in appsettings.Development.json."
}

Write-Host "SpecCode: $(Format-SpecCode $specCode)"
Write-Host "Configuration: $Configuration"
Write-Host "Project: $projectPath"

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

# Always clear Migrations before generating new migration files
Write-Host ""
Write-Host "== Backup and clear Migrations =="
Backup-And-ClearMigrations -MigrationsDir $migrationsDir -ProjectRoot $projectRoot

# Build before EF commands
Invoke-DotnetStep -Title "Build project with SpecCode" -Command {
    dotnet build $projectPath -c $Configuration /p:SpecCode=$specCode /p:UseSpecCodeCompile=true
}

# Add Baseline migration
Invoke-DotnetStep -Title "Add baseline migration" -Command {
    dotnet ef migrations add $BaselineName `
        --context ApplicationDbContext `
        --startup-project $projectPath `
        --project $projectPath `
        --configuration $Configuration `
        --no-build
}

# Find Baseline migration file
$baselineFile = Get-ChildItem $migrationsDir -Filter "*_$BaselineName.cs" |
    Where-Object { $_.Name -notlike "*.Designer.cs" } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if ($null -eq $baselineFile) {
    throw "Baseline migration file not found."
}

# Clear Baseline Up / Down by brace matching
Write-Host ""
Write-Host "== Clear Baseline Up/Down =="
Write-Host "Baseline file: $($baselineFile.FullName)"

$baselineText = Get-Content $baselineFile.FullName -Raw -Encoding UTF8
$baselineText = Set-CSharpMethodBody -Text $baselineText -MethodName "Up" -NewBody ""
$baselineText = Set-CSharpMethodBody -Text $baselineText -MethodName "Down" -NewBody ""
Set-Content $baselineFile.FullName $baselineText -Encoding UTF8

# Ensure snapshot exists
$snapshotFile = Find-ApplicationSnapshotFile -MigrationsDir $migrationsDir
if ($null -eq $snapshotFile) {
    Write-Host "ApplicationDbContextModelSnapshot.cs was not generated. Creating it from Baseline Designer."

    $baselineDesignerFile = Get-ChildItem $migrationsDir -Filter "*_$BaselineName.Designer.cs" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if ($null -eq $baselineDesignerFile) {
        throw "Baseline Designer.cs not found. Cannot create ApplicationDbContextModelSnapshot.cs."
    }

    Create-ApplicationSnapshotFromDesigner -DesignerPath $baselineDesignerFile.FullName -SnapshotPath $snapshotPath
}
else {
    $snapshotPath = $snapshotFile.FullName
    Write-Host "Snapshot found: $snapshotPath"
}

# Build again after Baseline file is generated and cleared
Invoke-DotnetStep -Title "Build after clearing baseline" -Command {
    dotnet build $projectPath -c $Configuration /p:SpecCode=$specCode /p:UseSpecCodeCompile=true
}

# Update database to Baseline
Invoke-DotnetStep -Title "Update database to baseline" -Command {
    dotnet ef database update `
        --context ApplicationDbContext `
        --startup-project $projectPath `
        --project $projectPath `
        --configuration $Configuration `
        --no-build
}

# Scaffold current DB
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

# Build after scaffold, so TempBaselineDbContext is included
Invoke-DotnetStep -Title "Build after scaffold" -Command {
    dotnet build $projectPath -c $Configuration /p:SpecCode=$specCode /p:UseSpecCodeCompile=true
}

# Add TempSnap migration
Invoke-DotnetStep -Title "Add temp snapshot migration" -Command {
    dotnet ef migrations add $TempSnapName `
        --context WCMS.Migrations._BaselineScaffold.TempBaselineDbContext `
        --startup-project $projectPath `
        --project $projectPath `
        --configuration $Configuration `
        --output-dir "Migrations/_BaselineScaffold/__TempMigrations" `
        --no-build
}

# Find TempSnap Designer
$tempDesignerFile = Get-ChildItem $tempMigrationDir -Filter "*_$TempSnapName.Designer.cs" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if ($null -eq $tempDesignerFile) {
    throw "TempSnap Designer.cs not found."
}

if (!(Test-Path $snapshotPath)) {
    throw "ApplicationDbContextModelSnapshot.cs not found after fallback creation: $snapshotPath"
}

# Backup snapshot before replacement
$backupPath = "$snapshotPath.bak_$(Get-Date -Format 'yyyyMMddHHmmss')"
Copy-Item $snapshotPath $backupPath -Force
Write-Host ""
Write-Host "Snapshot backup created: $backupPath"

# Replace ApplicationDbContextModelSnapshot BuildModel with TempSnap BuildTargetModel body
Write-Host ""
Write-Host "== Replace ApplicationDbContextModelSnapshot BuildModel =="
Write-Host "Temp designer: $($tempDesignerFile.FullName)"
Write-Host "Snapshot: $snapshotPath"

$tempDesignerText = Get-Content $tempDesignerFile.FullName -Raw -Encoding UTF8
$snapshotText = Get-Content $snapshotPath -Raw -Encoding UTF8

$tempBuildTarget = Get-CSharpMethodBody -Text $tempDesignerText -MethodName "BuildTargetModel"
$targetBody = $tempBuildTarget.Body.Trim("`r", "`n")

$snapshotText = Set-CSharpMethodBody -Text $snapshotText -MethodName "BuildModel" -NewBody $targetBody
Set-Content $snapshotPath $snapshotText -Encoding UTF8

# Export transplanted snapshot for checking, but do not put it under Migrations as .cs
if (!(Test-Path $diagnosticDir)) {
    New-Item -ItemType Directory -Path $diagnosticDir | Out-Null
}

$transplantedSnapshotPath = Join-Path $diagnosticDir "ApplicationDbContextModelSnapshot.Transplanted.txt"
Set-Content $transplantedSnapshotPath $snapshotText -Encoding UTF8
Write-Host "Transplanted snapshot exported: $transplantedSnapshotPath"

# Build again after snapshot replacement
Invoke-DotnetStep -Title "Build after snapshot replacement" -Command {
    dotnet build $projectPath -c $Configuration /p:SpecCode=$specCode /p:UseSpecCodeCompile=true
}

# Add Upgrade migration
Invoke-DotnetStep -Title "Add upgrade migration" -Command {
    dotnet ef migrations add $UpgradeName `
        --context ApplicationDbContext `
        --startup-project $projectPath `
        --project $projectPath `
        --configuration $Configuration `
        --no-build
}

# Build again after Upgrade migration is generated
Invoke-DotnetStep -Title "Build after upgrade migration" -Command {
    dotnet build $projectPath -c $Configuration /p:SpecCode=$specCode /p:UseSpecCodeCompile=true
}

if ($GenerateSqlOnly) {
    if (!(Test-Path $sqlDir)) {
        New-Item -ItemType Directory -Path $sqlDir | Out-Null
    }

    Invoke-DotnetStep -Title "Generate SQL script" -Command {
        dotnet ef migrations script $BaselineName $UpgradeName `
            --context ApplicationDbContext `
            --startup-project $projectPath `
            --project $projectPath `
            --configuration $Configuration `
            --no-build `
            -o $sqlPath
    }

    Write-Host ""
    Write-Host "SQL script generated: $sqlPath"
}
else {
    Invoke-DotnetStep -Title "Update database to latest migration" -Command {
        dotnet ef database update `
            --context ApplicationDbContext `
            --startup-project $projectPath `
            --project $projectPath `
            --configuration $Configuration `
            --no-build
    }

    Write-Host ""
    Write-Host "Database update completed."
}