@echo off
echo [1/2] Start WCMS FE service With CSR...
cd /d %~dp0

REM 啟動開發伺服器（背景執行）
start "" cmd /k "npm run dev:csr"

REM 等待幾秒鐘讓伺服器啟動（可視狀況調整秒數）
timeout /t 3 >nul

echo [2/2] Start chrome incognito...

REM 嘗試用 Chrome 無痕模式開啟指定網址
@REM start "" "chrome.exe" --incognito --ignore-certificate-errors https://localhost:5173/Server

REM 如果無法找到 chrome.exe，你可以指定完整路徑（取消下列註解再用）
:: start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --incognito http://localhost:5173

echo Complete ✅