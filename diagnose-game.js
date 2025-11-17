const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('🔍 Starting game diagnostics...\n');
    
    // Check if browsers are installed, if not, provide instructions
    try {
        const browser = await chromium.launch({ 
            headless: false, // Show browser for debugging
            slowMo: 500 // Slow down actions for visibility
        });
        await browser.close();
    } catch (error) {
        if (error.message.includes('Executable doesn\'t exist')) {
            console.error('❌ Playwright browsers not installed.\n');
            console.error('📦 To install browsers, run this command:');
            console.error('   npx playwright install chromium\n');
            console.error('   OR if that doesn\'t work:');
            console.error('   node node_modules/playwright/cli.js install chromium\n');
            console.error('   Make sure to run it as a SINGLE command, not multiple arguments.\n');
            process.exit(1);
        } else {
            throw error;
        }
    }
    
    const browser = await chromium.launch({ 
        headless: false, // Show browser for debugging
        slowMo: 500 // Slow down actions for visibility
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // Collect console messages and errors
    const consoleMessages = [];
    const errors = [];
    const warnings = [];
    
    page.on('console', msg => {
        const text = msg.text();
        const type = msg.type();
        consoleMessages.push({ type, text, timestamp: new Date().toISOString() });
        
        if (type === 'error') {
            errors.push(text);
            console.error(`❌ Console Error: ${text}`);
        } else if (type === 'warning') {
            warnings.push(text);
            console.warn(`⚠️  Console Warning: ${text}`);
        } else {
            console.log(`📝 Console ${type}: ${text}`);
        }
    });
    
    page.on('pageerror', error => {
        errors.push(error.message);
        console.error(`❌ Page Error: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
    });
    
    // Try to load the game - use absolute path for file://
    const htmlFile = path.resolve(__dirname, 'dogfight.html');
    const fileUrl = `file:///${htmlFile.replace(/\\/g, '/')}`;
    
    console.log(`📂 Loading game from: ${fileUrl}\n`);
    
    try {
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log('✅ Page loaded successfully\n');
    } catch (error) {
        console.error(`❌ Failed to load page: ${error.message}\n`);
        console.error(`   Trying alternative method...\n`);
        
        // Try with local server approach
        try {
            const http = require('http');
            const fs = require('fs');
            const server = http.createServer((req, res) => {
                if (req.url === '/dogfight.html' || req.url === '/') {
                    const content = fs.readFileSync(htmlFile, 'utf8');
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content);
                } else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            });
            
            await new Promise((resolve) => {
                server.listen(8081, () => {
                    console.log('🌐 Started local server on port 8081\n');
                    resolve();
                });
            });
            
            await page.goto('http://localhost:8081/dogfight.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('✅ Page loaded via local server\n');
        } catch (error2) {
            console.error(`❌ Failed with local server: ${error2.message}\n`);
            await browser.close();
            process.exit(1);
        }
    }
    
    // Wait for page to be ready
    await page.waitForTimeout(2000);
    
    // Check if splash screen is visible
    const splashScreen = await page.locator('#splashScreen').isVisible();
    console.log(`🎮 Splash screen visible: ${splashScreen}`);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'diagnostic-01-initial.png', fullPage: true });
    console.log('📸 Screenshot saved: diagnostic-01-initial.png');
    
    // Test clicking WW1 Battle button
    console.log('\n🧪 Testing WW1 Battle button...');
    try {
        const ww1Button = page.locator('button:has-text("WW1 BATTLE")');
        if (await ww1Button.isVisible()) {
            await ww1Button.click();
            await page.waitForTimeout(2000);
            console.log('✅ WW1 Battle button clicked');
            
            // Check if selector panel appeared
            const selectorVisible = await page.locator('#ww1BattleSelector').isVisible();
            console.log(`📋 WW1 Battle Selector visible: ${selectorVisible}`);
            
            await page.screenshot({ path: 'diagnostic-02-ww1-selector.png', fullPage: true });
            console.log('📸 Screenshot saved: diagnostic-02-ww1-selector.png');
            
            // Try to add an aircraft
            console.log('\n🧪 Testing aircraft selection...');
            const alliedSelect = page.locator('#alliedAircraftSelect');
            if (await alliedSelect.isVisible()) {
                await alliedSelect.selectOption({ label: 'Sopwith Camel' });
                await page.waitForTimeout(500);
                
                const addButton = page.locator('button:has-text("ADD AIRCRAFT")').first();
                if (await addButton.isVisible()) {
                    await addButton.click();
                    await page.waitForTimeout(1000);
                    console.log('✅ Added Allied aircraft');
                }
            }
            
            // Add Central aircraft
            const centralSelect = page.locator('#centralAircraftSelect');
            if (await centralSelect.isVisible()) {
                await centralSelect.selectOption({ label: 'Fokker Dr.II' });
                await page.waitForTimeout(500);
                
                const addCentralButton = page.locator('button:has-text("ADD AIRCRAFT")').last();
                if (await addCentralButton.isVisible()) {
                    await addCentralButton.click();
                    await page.waitForTimeout(1000);
                    console.log('✅ Added Central aircraft');
                }
            }
            
            await page.screenshot({ path: 'diagnostic-03-aircraft-added.png', fullPage: true });
            console.log('📸 Screenshot saved: diagnostic-03-aircraft-added.png');
            
            // Try to start the battle
            console.log('\n🧪 Testing START WW1 BATTLE button...');
            const startButton = page.locator('button:has-text("START WW1 BATTLE")');
            if (await startButton.isVisible()) {
                await startButton.click();
                await page.waitForTimeout(3000);
                console.log('✅ START WW1 BATTLE button clicked');
                
                // Check if game container is visible
                const gameContainer = await page.locator('#gameContainer').isVisible();
                console.log(`🎮 Game container visible: ${gameContainer}`);
                
                // Check if canvas exists
                const canvas = await page.locator('#gameCanvas').isVisible();
                console.log(`🖼️  Canvas visible: ${canvas}`);
                
                await page.screenshot({ path: 'diagnostic-04-game-started.png', fullPage: true });
                console.log('📸 Screenshot saved: diagnostic-04-game-started.png');
                
                // Check canvas content
                const canvasElement = await page.locator('#gameCanvas');
                if (await canvasElement.isVisible()) {
                    const canvasImage = await canvasElement.screenshot();
                    fs.writeFileSync('diagnostic-05-canvas-content.png', canvasImage);
                    console.log('📸 Canvas screenshot saved: diagnostic-05-canvas-content.png');
                }
            }
        }
    } catch (error) {
        console.error(`❌ Error during WW1 Battle test: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
    }
    
    // Test Scenario selector
    console.log('\n🧪 Testing Scenario selector...');
    try {
        // Go back to splash if needed
        const backButton = page.locator('button:has-text("BACK")');
        if (await backButton.isVisible()) {
            await backButton.click();
            await page.waitForTimeout(1000);
        }
        
        const scenarioButton = page.locator('button:has-text("SCENARIOS")');
        if (await scenarioButton.isVisible()) {
            await scenarioButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ Scenario button clicked');
            
            const scenarioSelector = await page.locator('#scenarioSelector').isVisible();
            console.log(`📋 Scenario Selector visible: ${scenarioSelector}`);
            
            await page.screenshot({ path: 'diagnostic-06-scenario-selector.png', fullPage: true });
            console.log('📸 Screenshot saved: diagnostic-06-scenario-selector.png');
        }
    } catch (error) {
        console.error(`❌ Error during Scenario test: ${error.message}`);
    }
    
    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(2000);
    
    // Generate diagnostic report
    console.log('\n📊 Generating diagnostic report...\n');
    
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalConsoleMessages: consoleMessages.length,
            errors: errors.length,
            warnings: warnings.length
        },
        errors: errors,
        warnings: warnings,
        consoleMessages: consoleMessages.slice(-50) // Last 50 messages
    };
    
    fs.writeFileSync('diagnostic-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Diagnostic report saved: diagnostic-report.json');
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors found: ${errors.length}`);
    console.log(`Warnings found: ${warnings.length}`);
    
    if (errors.length > 0) {
        console.log('\n❌ ERRORS:');
        errors.forEach((error, i) => {
            console.log(`  ${i + 1}. ${error}`);
        });
    }
    
    if (warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        warnings.forEach((warning, i) => {
            console.log(`  ${i + 1}. ${warning}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    
    await browser.close();
    
    // Exit with error code if errors found
    process.exit(errors.length > 0 ? 1 : 0);
})();

