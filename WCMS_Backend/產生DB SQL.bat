@chcp 65001 >nul
@echo off
setlocal enabledelayedexpansion

:: 請輸入 migration 名稱
set /p MIGRATION_NAME=請輸入 Migration 名稱：

:: 取得時間字串 (例如 20250724_102530)
for /f %%a in ('powershell -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set NOW=%%a

:: 建立 SQL 檔案名稱
set SQL_FILENAME=Migrations\%NOW%_%MIGRATION_NAME%.sql

:: 執行 migration
echo.
echo ✅ 建立 Migration: %MIGRATION_NAME%
dotnet ef migrations add %MIGRATION_NAME%
if errorlevel 1 goto error

:: 產生 SQL script
echo.
echo ✅ 產生 SQL Script: %SQL_FILENAME%
dotnet ef migrations script -o %SQL_FILENAME%
if errorlevel 1 goto error

echo.
echo 🎉 已完成！
echo 🔹 Migration：%MIGRATION_NAME%
echo 🔹 SQL Script：%SQL_FILENAME%
goto end

:error
echo ❌ 發生錯誤，請檢查錯誤訊息。
pause

:end