# Game Diagnostics - Setup Instructions

## Quick Diagnostic (No Installation Required)

Run this anytime to check code structure:
```bash
node quick-diagnose.js
```

## Full Browser Diagnostic (Requires Browser Installation)

### Step 1: Install Playwright Browsers

**Option A: Using npx (Recommended)**
```bash
npx playwright install chromium
```

**Option B: Using node directly**
```bash
node node_modules\playwright\cli.js install chromium
```

**Option C: Using the batch file (Windows)**
```bash
install-playwright-browsers.bat
```

⚠️ **Important:** Make sure to run the install command as a **single command**, not multiple arguments.

❌ **Wrong:** `npx playwright install chromium node diagnose-game.js`  
✅ **Correct:** `npx playwright install chromium`

### Step 2: Run the Full Diagnostic

After browsers are installed:
```bash
node diagnose-game.js
```

This will:
- Launch the game in a browser window
- Test all UI interactions
- Capture screenshots
- Report any errors
- Generate diagnostic-report.json

## Troubleshooting

### Error: "Invalid installation targets"
- Make sure you're running the install command separately from other commands
- Use: `npx playwright install chromium` (just chromium, nothing else)

### Error: "Executable doesn't exist"
- Browsers aren't installed yet
- Run the install command from Step 1

### PowerShell Execution Policy Error
- Use the `.bat` file instead, or
- Run: `node node_modules\playwright\cli.js install chromium`

