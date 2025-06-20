@echo off
echo [1/2] 啟動 Vite 開發伺服器...
cd /d %~dp0

REM 啟動開發伺服器（背景執行）
start "" cmd /k "npm run dev"

REM 等待幾秒鐘讓伺服器啟動（可視狀況調整秒數）
timeout /t 3 >nul

echo [2/2] 開啟 Chrome 無痕視窗...

REM 嘗試用 Chrome 無痕模式開啟指定網址
start "" "chrome.exe" --incognito http://localhost:5173

REM 如果無法找到 chrome.exe，你可以指定完整路徑（取消下列註解再用）
:: start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --incognito http://localhost:5173

echo 完成 ✅
pause