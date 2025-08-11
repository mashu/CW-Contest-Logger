@echo off
REM CW Logger - Quick Start Script for Windows

echo CW Logger - Starting...
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if dist directory exists
if not exist "dist\" (
    echo Building application...
    call npm run build
    if errorlevel 1 (
        echo Failed to build application
        pause
        exit /b 1
    )
)

echo Launching CW Logger...
call npm start
