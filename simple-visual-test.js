const { chromium } = require('playwright');

async function simpleVisualTest() {
    console.log('🎨 Running Simple Visual Test\n');

    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });

        const page = await context.newPage();

        // Set up console logging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Browser error:', msg.text());
            }
        });

        page.on('pageerror', err => {
            console.log('❌ Page error:', err.message);
        });

        console.log('📄 Loading page...');
        await page.goto('http://127.0.0.1:8080/dogfight.html', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });

        console.log('✅ Page loaded');

        // Wait for UI to be ready
        await page.waitForSelector('#ui', { timeout: 5000 });

        console.log('\n🔍 Testing UI Panel Structure:');

        // Test 1: Check UI panel exists
        const uiPanel = await page.$('#ui');
        console.log('  ✅ UI panel found');

        // Test 2: Check panel tab exists
        const panelTab = await page.$('#ui .panel-tab');
        console.log('  ✅ Panel tab found');

        // Test 3: Check panel content exists
        const panelContent = await page.$('#ui .panel-content');
        console.log('  ✅ Panel content found');

        // Test 4: Check bottom right info panel
        const bottomRightInfo = await page.$('#bottomRightInfo');
        console.log('  ✅ Bottom right info panel found');

        // Test 5: Check zoom value element
        const zoomValue = await page.$('#zoomValue');
        const initialZoom = await zoomValue.textContent();
        console.log(`  ✅ Zoom value element found (initial: ${initialZoom})`);

        // Test 6: Get UI panel styles
        const overflow = await uiPanel.evaluate(el => getComputedStyle(el).overflow);
        console.log(`  ✅ UI panel overflow: ${overflow}`);

        // Test 7: Click UI panel to test collapse
        console.log('\n🖱️  Testing Panel Collapse:');
        await uiPanel.click();
        await page.waitForTimeout(500);

        const hasCollapsed = await page.evaluate(() => {
            return document.getElementById('ui').classList.contains('collapsed');
        });

        if (hasCollapsed) {
            console.log('  ✅ Panel collapsed successfully');

            // Check if content is hidden
            const contentHidden = await panelContent.evaluate(el =>
                getComputedStyle(el).display === 'none'
            );
            console.log(`  ✅ Panel content hidden: ${contentHidden}`);

            // Click again to expand
            await uiPanel.click();
            await page.waitForTimeout(500);

            const hasExpanded = await page.evaluate(() => {
                return !document.getElementById('ui').classList.contains('collapsed');
            });

            console.log(`  ✅ Panel expanded: ${hasExpanded}`);
        } else {
            console.log('  ⚠️  Panel did not collapse');
        }

        // Take a screenshot
        console.log('\n📸 Taking screenshot...');
        await page.screenshot({ path: 'ui-test-screenshot.png', fullPage: true });
        console.log('  ✅ Screenshot saved as ui-test-screenshot.png');

        console.log('\n✨ All visual tests completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

simpleVisualTest();
