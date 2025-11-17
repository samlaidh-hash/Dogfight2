@echo off
echo Installing Playwright browsers...
echo.
node node_modules\playwright\cli.js install chromium
echo.
echo Done! You can now run: node diagnose-game.js
pause

