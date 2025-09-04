@echo off
echo [1/2] Start WCMS FE service With SSR...
cd /d %~dp0

REM 啟動開發伺服器（背景執行）
start "" cmd /k "npm run dev:csr"

dotnet dev-certs https --check
IF %ERRORLEVEL% NEQ 0 (
    echo Installing and trusting dev cert...
    dotnet dev-certs https --trust
)

REM 等待幾秒鐘讓伺服器啟動（可視狀況調整秒數）
timeout /t 3 >nul

echo [2/2] Start chrome incognito...

REM 嘗試用 Chrome 無痕模式開啟指定網址
@REM start "" "chrome.exe" --incognito http://localhost:5174

REM 如果無法找到 chrome.exe，你可以指定完整路徑（取消下列註解再用）
:: start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --incognito http://localhost:5174

echo Complete ✅