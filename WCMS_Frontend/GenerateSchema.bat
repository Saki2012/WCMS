@echo off
chcp 65001 >nul
setlocal

pushd "%~dp0"

set "SWAGGER_URL=http://localhost:5098/swagger/v1/swagger.json"

if not "%~1"=="" set "SWAGGER_URL=%~1"

set "NODE_TLS_REJECT_UNAUTHORIZED=0"

echo.
echo [WCMS] Generate OpenAPI schema
echo Swagger: %SWAGGER_URL%
echo.

call npx openapi-typescript "%SWAGGER_URL%" -o src/types/api.d.ts
if errorlevel 1 goto Error

call npx tsx ./src/types/generate-fields.ts
if errorlevel 1 goto Error

echo.
echo [WCMS] Schema generated successfully.
echo.

popd
endlocal
exit /b 0

:Error
echo.
echo [WCMS] Schema generation failed. ErrorLevel=%errorlevel%
echo.

popd
endlocal
exit /b 1