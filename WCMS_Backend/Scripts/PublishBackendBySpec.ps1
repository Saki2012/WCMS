param(
    [string]$Configuration = "Release",
    [string]$PublishProfile = "本機編譯"
)

$ErrorActionPreference = "Stop"

# 取得路徑
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir "..")
$projectPath = Join-Path $projectRoot "WCMS.csproj"
$settingsPath = Join-Path $projectRoot "appsettings.production.json"
$publishDir = Join-Path $projectRoot "Publish"

# 檢查 production 設定檔
if (!(Test-Path $settingsPath)) {
    throw "找不到 appsettings.production.json：$settingsPath"
}

# 讀取 production SpecCode
$settings = Get-Content $settingsPath -Raw -Encoding UTF8 | ConvertFrom-Json

$specCode = ""
if ($null -ne $settings.SpecCode) {
    $specCode = $settings.SpecCode.ToString().Trim()
}

if ([string]::IsNullOrWhiteSpace($specCode)) {
    throw "appsettings.production.json 缺少 SpecCode"
}

# 發佈前強制清空 Publish 資料夾
if (Test-Path $publishDir) {
    Write-Host "清空舊 Publish 資料夾：$publishDir"
    Remove-Item $publishDir -Recurse -Force
}

New-Item -ItemType Directory -Path $publishDir | Out-Null

Write-Host "開始發佈 WCMS Backend"
Write-Host "SpecCode：$specCode"
Write-Host "Configuration：$Configuration"
Write-Host "PublishProfile：$PublishProfile"
Write-Host "PublishDir：$publishDir"

# 用 SpecCode 條件編譯，並套用 pubxml
dotnet publish $projectPath `
    -c $Configuration `
    /p:PublishProfile=$PublishProfile `
    /p:SpecCode=$specCode `
    /p:UseSpecCodeCompile=true `
    /p:PublishDir="$publishDir\"

if ($LASTEXITCODE -ne 0) {
    throw "dotnet publish 失敗"
}

Write-Host "發佈完成：$publishDir"