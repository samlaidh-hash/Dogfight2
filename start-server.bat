@echo off
echo Starting local server for Dogfight2...
echo.
echo The game will be available at: http://localhost:8000/dogfight.html
echo.
echo Press Ctrl+C to stop the server when done.
echo.

REM Try Python 3 first
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python 3...
    start http://localhost:8000/dogfight.html
    python -m http.server 8000
    goto :eof
)

REM Try Python 2
python -m SimpleHTTPServer 8000 >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python 2...
    start http://localhost:8000/dogfight.html
    python -m SimpleHTTPServer 8000
    goto :eof
)

REM No Python found
echo ERROR: Python not found!
echo.
echo Please install Python from https://www.python.org/downloads/
echo Or use another method to run a local server.
echo.
pause
