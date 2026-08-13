param(
    [string]$Configuration = "Release",
    [string]$PublishProfile = "本機編譯"
)

$ErrorActionPreference = "Stop"

#region Private
# 從版本來源文字取得必要欄位。
function Get-RequiredRegexValue {
    param(
        [string]$Text,
        [string]$Pattern,
        [string]$FieldName
    )

    $matched = [regex]::Match($Text, $Pattern)
    if (!$matched.Success) {
        throw "無法取得 Feature 發布版本欄位：$FieldName"
    }
    return $matched.Groups["value"].Value
}

# 讀取公版版本資訊並建立純 Feature ZIP 名稱。
function Get-FeatureZipFileName {
    param([string]$ProjectRoot)

    # 從目前 SysCore 自動尋找公版 SystemVersion，避免依賴舊資料夾路徑。
    $versionPath = Get-ChildItem `
        -Path (Join-Path $ProjectRoot "SysCore") `
        -Recurse `
        -File `
        -Filter "*.cs" |
        Where-Object {
            $source = Get-Content $_.FullName -Raw -Encoding UTF8
            $source -match "class\s+SystemVersion\b" -and
            $source -match "GetBackendVersion\s*\("
        } |
        Select-Object -ExpandProperty FullName -First 1

    if ([string]::IsNullOrWhiteSpace($versionPath)) {
        throw "找不到公版 SystemVersion 版本來源：$(Join-Path $ProjectRoot 'SysCore')"
    }

    $versionText = Get-Content $versionPath -Raw -Encoding UTF8
    $major = Get-RequiredRegexValue $versionText 'version\s*=\s*\$@?"(?<value>\d+)\.' "Major"
    $feat = Get-RequiredRegexValue $versionText 'FeatVersion\s*=\s*(?<value>\d+)' "FeatVersion"
    $model = Get-RequiredRegexValue $versionText 'ModelVersion\s*=\s*(?<value>\d+)' "ModelVersion"
    $patch = Get-RequiredRegexValue $versionText 'Patch\s*=\s*(?<value>\d+)' "Patch"
    return "(Feature) BE_$major.$feat.$model.$patch.zip"
}

# 將純 Feature Publish 內容壓縮成部署 ZIP。
function New-FeaturePublishZip {
    param(
        [string]$ProjectRoot,
        [string]$PublishDir
    )

    $zipFileName = Get-FeatureZipFileName $ProjectRoot
    $tempDir = Join-Path $ProjectRoot "obj\publish-feature-zip"
    $tempZipPath = Join-Path $tempDir $zipFileName
    $finalZipPath = Join-Path $PublishDir $zipFileName

    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    Get-ChildItem $PublishDir -Filter "(Feature) BE_*.zip" -File -ErrorAction SilentlyContinue | Remove-Item -Force

    try {
        Compress-Archive -Path (Join-Path $PublishDir "*") -DestinationPath $tempZipPath -CompressionLevel Optimal -Force
        Move-Item $tempZipPath $finalZipPath -Force
        Write-Host "Feature 部署 ZIP 已建立：$finalZipPath"
    }
    finally {
        if (Test-Path $tempDir) {
            Remove-Item $tempDir -Recurse -Force
        }
    }
}

# 使用既有 Publish Profile 發布指定 Spec。
function Invoke-SpecPublish {
    param(
        [string]$ProjectPath,
        [string]$PublishDir,
        [string]$Configuration,
        [string]$PublishProfile,
        [string]$SpecCode
    )

    dotnet publish $ProjectPath `
        -c $Configuration `
        /p:PublishProfile=$PublishProfile `
        /p:SpecCode=$SpecCode `
        /p:UseSpecCodeCompile=true `
        /p:PublishDir="$PublishDir\"
}

# 不載入任何 SpecFeatures，發布純 Feature 後端。
function Invoke-FeaturePublish {
    param(
        [string]$ProjectPath,
        [string]$PublishDir,
        [string]$Configuration
    )

    dotnet publish $ProjectPath `
        -c $Configuration `
        "/p:SpecCode=" `
        /p:UseSpecCodeCompile=false `
        /p:PublishDir="$PublishDir\"
}

# 確認 dotnet publish 是否成功完成。
function Assert-PublishSucceeded {
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet publish 失敗"
    }
}
#endregion

# 取得路徑
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
$projectPath = Join-Path $projectRoot "WCMS.csproj"
$settingsPath = Join-Path $projectRoot "appsettings.production.json"
$publishDir = Join-Path $projectRoot "Publish"

# 檢查 production 設定檔
if (!(Test-Path $settingsPath)) {
    throw "找不到 appsettings.production.json：$settingsPath"
}

# 讀取 production SpecCode；空白代表純 Feature 模式
$settings = Get-Content $settingsPath -Raw -Encoding UTF8 | ConvertFrom-Json
$specCode = ""
if ($null -ne $settings.SpecCode) {
    $specCode = $settings.SpecCode.ToString().Trim()
}
$isFeatureMode = [string]::IsNullOrWhiteSpace($specCode)
$publishMode = if ($isFeatureMode) { "Feature" } else { $specCode }

# 發布前強制清空 Publish 資料夾
if (Test-Path $publishDir) {
    Write-Host "清空舊 Publish 資料夾：$publishDir"
    Remove-Item $publishDir -Recurse -Force
}
New-Item -ItemType Directory -Path $publishDir | Out-Null

Write-Host "開始發布 WCMS Backend"
Write-Host "PublishMode：$publishMode"
Write-Host "Configuration：$Configuration"
Write-Host "PublishProfile：$(if ($isFeatureMode) { '(Feature 模式不套用 Spec Profile)' } else { $PublishProfile })"
Write-Host "PublishDir：$publishDir"

# 依 SpecCode 是否空白選擇發布流程
if ($isFeatureMode) {
    Invoke-FeaturePublish $projectPath $publishDir $Configuration
    Assert-PublishSucceeded
    New-FeaturePublishZip $projectRoot $publishDir
}
else {
    Invoke-SpecPublish $projectPath $publishDir $Configuration $PublishProfile $specCode
    Assert-PublishSucceeded
}

Write-Host "發布完成：$publishDir"
