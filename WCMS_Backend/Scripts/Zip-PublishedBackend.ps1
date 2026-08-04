# Scripts/Zip-PublishedBackend.ps1
# 目標：Visual Studio 發布完成後，將 Publish 內容打包成 zip

param(
    [string]$ProjectDir = ".",
    [string]$PublishDir = "Publish",
    [Parameter(Mandatory = $true)]
    [string]$CompileSpecCode
)

$ErrorActionPreference = "Stop"

function Test-PathExists {
    param([string]$Path)

    # 檢查路徑是否存在
    return [System.IO.File]::Exists($Path) -or [System.IO.Directory]::Exists($Path)
}

function Remove-PathIfExists {
    param([string]$Path)

    # 存在才刪除
    if (Test-PathExists $Path) {
        Remove-Item -Path $Path -Recurse -Force
    }
}

function New-DirectoryIfMissing {
    param([string]$Path)

    # 不存在才建立資料夾
    if (-not [System.IO.Directory]::Exists($Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Resolve-AbsolutePath {
    param([string]$BaseDir, [string]$TargetPath)

    # 將相對路徑轉成絕對路徑
    if ([System.IO.Path]::IsPathRooted($TargetPath)) {
        return [System.IO.Path]::GetFullPath($TargetPath)
    }

    return [System.IO.Path]::GetFullPath((Join-Path $BaseDir $TargetPath))
}

function Get-SafeToken {
    param([string]$Value)

    # 將字串轉成安全檔名前綴
    if ([string]::IsNullOrWhiteSpace($Value)) {
        return "default"
    }

    $safe = $Value.Trim() -replace '[\\/:*?"<>|]', '_'

    if ([string]::IsNullOrWhiteSpace($safe)) {
        return "default"
    }

    return $safe
}

function Get-RequiredRegexValue {
    param(
        [string]$Text,
        [string]$Pattern,
        [string]$FieldName
    )

    # 從版本原始碼取得必要欄位
    $matched = [regex]::Match($Text, $Pattern)

    if (-not $matched.Success) {
        throw "[Zip-PublishedBackend] Cannot resolve $FieldName."
    }

    return $matched.Groups["value"].Value
}

function Get-BackendVersionInfo {
    param(
        [string]$ProjectRoot,
        [string]$CurrentSpecCode
    )

    # 讀取公版與目前 Spec 的版本來源
	$basePath = Join-Path $ProjectRoot "SysCore\Configuration\SystemVersion.cs"
    $specPath = Join-Path $ProjectRoot "SpecFeatures\$CurrentSpecCode\SYS\SystemVersion\SystemVersion_Biz.cs"

    if (-not [System.IO.File]::Exists($basePath)) {
        throw "[Zip-PublishedBackend] Base version file not found: $basePath"
    }

    if (-not [System.IO.File]::Exists($specPath)) {
        throw "[Zip-PublishedBackend] Spec version file not found: $specPath"
    }

    $baseText = Get-Content -Path $basePath -Raw -Encoding UTF8
    $specText = Get-Content -Path $specPath -Raw -Encoding UTF8

    return New-BackendVersionInfo $baseText $specText
}

function New-BackendVersionInfo {
    param(
        [string]$BaseText,
        [string]$SpecText
    )

    # 將版本原始碼轉成 ZIP 命名資料
    return [PSCustomObject]@{
        Major = Get-RequiredRegexValue $BaseText 'version\s*=\s*\$@?"(?<value>\d+)\.' "Major"
        Feat = Get-RequiredRegexValue $BaseText 'FeatVersion\s*=\s*(?<value>\d+)' "FeatVersion"
        Model = Get-RequiredRegexValue $BaseText 'ModelVersion\s*=\s*(?<value>\d+)' "ModelVersion"
        Patch = Get-RequiredRegexValue $BaseText 'Patch\s*=\s*(?<value>\d+)' "Patch"
        SpecCode = Get-RequiredRegexValue $SpecText 'SpecCode\s*=\s*"(?<value>[^"]+)"' "SpecCode"
        SpecFeat = Get-RequiredRegexValue $SpecText 'SpecFeatVersion\s*=\s*(?<value>\d+)' "SpecFeatVersion"
        SpecModel = Get-RequiredRegexValue $SpecText 'SpecModelVersion\s*=\s*(?<value>\d+)' "SpecModelVersion"
    }
}

function Get-BackendZipFileName {
    param([object]$VersionInfo)

    # 依公版與 Spec 版本建立部署 ZIP 名稱
    $specCode = Get-SpecDisplayCode $VersionInfo.SpecCode
    $baseVersion = "$($VersionInfo.Major).$($VersionInfo.Feat).$($VersionInfo.Model).$($VersionInfo.Patch)"
    $specVersion = "R$($VersionInfo.SpecFeat).$($VersionInfo.SpecModel)"

    return "(Spec$specCode) BE_$baseVersion-$specVersion.zip"
}

function Get-SpecDisplayCode {
    param([string]$SpecCode)

    # 移除既有 Spec 前綴，統一由 ZIP 格式補上
    return ($SpecCode.Trim() -replace '^(?i)Spec', '')
}

function Get-SevenZipPath {
    # 優先尋找 7-Zip
    $fromPath = Get-Command "7z.exe" -ErrorAction SilentlyContinue

    if ($fromPath) {
        return $fromPath.Source
    }

    $candidates = @(
        "$env:ProgramFiles\7-Zip\7z.exe",
        "${env:ProgramFiles(x86)}\7-Zip\7z.exe"
    )

    foreach ($candidate in $candidates) {
        if ([System.IO.File]::Exists($candidate)) {
            return $candidate
        }
    }

    return ""
}

function Remove-OldZipFiles {
    param([string]$PublishRoot)

    # 刪除舊的後端自動部署 ZIP
    Get-ChildItem -Path $PublishRoot -Filter "*.zip" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^\(Spec[^)]+\) BE_.+\.zip$' } |
        Remove-Item -Force
}

function Compress-BySevenZip {
    param([string]$SevenZipPath, [string]$SourceDir, [string]$ZipPath)

    # 使用 7-Zip 最高壓縮率
    Push-Location $SourceDir

    try {
        & $SevenZipPath "a" "-tzip" "-mx=9" "-mmt=on" $ZipPath "."
        $exitCode = $LASTEXITCODE

        if ($exitCode -ne 0) {
            throw "[Zip-PublishedBackend] 7-Zip failed. ExitCode=$exitCode"
        }
    }
    finally {
        Pop-Location
    }
}

function Compress-ByPowerShell {
    param([string]$SourceDir, [string]$ZipPath)

    # 沒有 7-Zip 或 7-Zip 失敗時，使用 PowerShell 內建最佳壓縮
    Compress-Archive `
        -Path (Join-Path $SourceDir "*") `
        -DestinationPath $ZipPath `
        -CompressionLevel Optimal `
        -Force
}

function Compress-PublishFolder {
    param([string]$PublishRoot, [string]$TempZipPath)

    # 優先 7-Zip；失敗則退回 PowerShell
    $sevenZipPath = Get-SevenZipPath

    if (-not [string]::IsNullOrWhiteSpace($sevenZipPath)) {
        try {
            Write-Host "[Zip-PublishedBackend] Use 7-Zip: $sevenZipPath"
            Compress-BySevenZip $sevenZipPath $PublishRoot $TempZipPath
            return
        }
        catch {
            Write-Host "[Zip-PublishedBackend] 7-Zip failed. Fallback to Compress-Archive."
            Write-Host $_.Exception.Message
            Remove-PathIfExists $TempZipPath
        }
    }

    Write-Host "[Zip-PublishedBackend] Use PowerShell Compress-Archive."
    Compress-ByPowerShell $PublishRoot $TempZipPath
}

function New-PublishZip {
    param([string]$ProjectRoot, [string]$PublishRoot, [string]$ZipFileName)

    # 壓縮 Publish 內容，最後放回 Publish
    $tempDir = Join-Path $ProjectRoot "obj\publish-zip-temp"
    $tempZipPath = Join-Path $tempDir $ZipFileName
    $finalZipPath = Join-Path $PublishRoot $ZipFileName

    Remove-OldZipFiles $PublishRoot
    Remove-PathIfExists $tempDir
    New-DirectoryIfMissing $tempDir
    Remove-PathIfExists $tempZipPath
    Remove-PathIfExists $finalZipPath

    try {
        Compress-PublishFolder $PublishRoot $tempZipPath

        if (-not [System.IO.File]::Exists($tempZipPath)) {
            throw "[Zip-PublishedBackend] Zip file was not created: $tempZipPath"
        }

        Move-Item -Path $tempZipPath -Destination $finalZipPath -Force
        Write-Host "[Zip-PublishedBackend] zip created: $finalZipPath"
    }
    finally {
        Remove-PathIfExists $tempDir
    }
}

function Invoke-Main {
    # 主流程：整理路徑、確認 Publish 後打包
    $projectRoot = Resolve-AbsolutePath (Get-Location).Path $ProjectDir
    $publishRoot = Resolve-AbsolutePath $projectRoot $PublishDir
    $logPath = Join-Path $projectRoot "obj\publish-zip.log"

    New-DirectoryIfMissing (Join-Path $projectRoot "obj")

    Start-Transcript -Path $logPath -Force | Out-Null

    try {
        Write-Host "[Zip-PublishedBackend] ProjectRoot: $projectRoot"
        Write-Host "[Zip-PublishedBackend] PublishRoot: $publishRoot"
        Write-Host "[Zip-PublishedBackend] LogPath: $logPath"

        if (-not [System.IO.Directory]::Exists($publishRoot)) {
            throw "[Zip-PublishedBackend] PublishDir not found: $publishRoot"
        }

        $versionInfo = Get-BackendVersionInfo $projectRoot $CompileSpecCode
		$zipFileName = Get-BackendZipFileName $versionInfo

        Write-Host "[Zip-PublishedBackend] CompileSpecCode: $CompileSpecCode"
		Write-Host "[Zip-PublishedBackend] VersionSpecCode: $($versionInfo.SpecCode)"
		Write-Host "[Zip-PublishedBackend] ZipFileName: $zipFileName"

        New-PublishZip $projectRoot $publishRoot $zipFileName
    }
    catch {
        Write-Host "[Zip-PublishedBackend] ERROR:"
        Write-Host $_.Exception.Message
        throw
    }
    finally {
        Stop-Transcript | Out-Null
    }
}

Invoke-Main