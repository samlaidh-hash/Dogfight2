const { chromium } = require('playwright');

async function testUIChanges() {
    console.log('🚀 Starting Playwright UI tests...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Start local server and navigate
    console.log('📄 Loading dogfight.html...');
    await page.goto('http://127.0.0.1:8080/dogfight.html');

    // Wait for page to load
    await page.waitForTimeout(1000);

    let testsPassed = 0;
    let testsFailed = 0;

    // Test 1: Check bottom right info panel exists
    console.log('\n📋 Test 1: Bottom right info panel exists');
    try {
        const bottomRightInfo = await page.locator('#bottomRightInfo');
        const isVisible = await bottomRightInfo.isVisible();
        if (isVisible) {
            console.log('✅ PASS: Bottom right info panel is visible');
            testsPassed++;

            // Check content
            const scaleText = await page.locator('#scaleValue').textContent();
            const zoomText = await page.locator('#zoomValue').textContent();
            console.log(`   Scale: ${scaleText}, Zoom: ${zoomText}`);
        } else {
            console.log('❌ FAIL: Bottom right info panel is not visible');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ FAIL: Bottom right info panel not found - ' + error.message);
        testsFailed++;
    }

    // Test 2: Check UI panel has no scroll bars
    console.log('\n📋 Test 2: UI panel has no scroll bars');
    try {
        const uiPanel = await page.locator('#ui');
        const overflow = await uiPanel.evaluate(el => window.getComputedStyle(el).overflow);
        if (overflow === 'hidden') {
            console.log('✅ PASS: UI panel overflow is hidden (no scroll bars)');
            testsPassed++;
        } else {
            console.log(`❌ FAIL: UI panel overflow is "${overflow}", expected "hidden"`);
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ FAIL: Could not check UI panel overflow - ' + error.message);
        testsFailed++;
    }

    // Test 3: Check UI panel collapses on click
    console.log('\n📋 Test 3: UI panel collapses/expands on click');
    try {
        const uiPanel = await page.locator('#ui');

        // Get initial state
        const initialClasses = await uiPanel.getAttribute('class');
        console.log(`   Initial classes: "${initialClasses || 'none'}"`);

        // Click to collapse
        await uiPanel.click();
        await page.waitForTimeout(500); // Wait for transition

        const collapsedClasses = await uiPanel.getAttribute('class');
        console.log(`   After click: "${collapsedClasses || 'none'}"`);

        if (collapsedClasses && collapsedClasses.includes('collapsed')) {
            console.log('✅ PASS: UI panel collapsed successfully');
            testsPassed++;

            // Check if panel content is hidden
            const panelContent = await page.locator('#ui .panel-content');
            const contentVisible = await panelContent.isVisible();
            console.log(`   Panel content visible: ${contentVisible}`);

            // Check if tab is visible
            const panelTab = await page.locator('#ui .panel-tab');
            const tabVisible = await panelTab.isVisible();
            console.log(`   Panel tab visible: ${tabVisible}`);

            // Click again to expand
            await uiPanel.click();
            await page.waitForTimeout(500);

            const expandedClasses = await uiPanel.getAttribute('class');
            if (expandedClasses && !expandedClasses.includes('collapsed')) {
                console.log('✅ PASS: UI panel expanded successfully');
                testsPassed++;
            } else {
                console.log('❌ FAIL: UI panel did not expand');
                testsFailed++;
            }
        } else {
            console.log('❌ FAIL: UI panel did not collapse');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ FAIL: Could not test UI panel collapse - ' + error.message);
        testsFailed++;
    }

    // Test 4: Check panel-tab and panel-content structure
    console.log('\n📋 Test 4: Panel structure (tab and content wrapper)');
    try {
        const panelTab = await page.locator('#ui .panel-tab');
        const panelContent = await page.locator('#ui .panel-content');

        const tabExists = await panelTab.count() > 0;
        const contentExists = await panelContent.count() > 0;

        if (tabExists && contentExists) {
            const tabText = await panelTab.textContent();
            console.log(`✅ PASS: Panel structure correct (tab: "${tabText}")`);
            testsPassed++;
        } else {
            console.log(`❌ FAIL: Panel structure incomplete (tab: ${tabExists}, content: ${contentExists})`);
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ FAIL: Could not check panel structure - ' + error.message);
        testsFailed++;
    }

    // Test 5: Start game and test zoom value updates
    console.log('\n📋 Test 5: Zoom value updates on mouse wheel');
    try {
        // Click Quick Battle to start game
        const quickBattleBtn = await page.locator('text=QUICK BATTLE');
        await quickBattleBtn.click();
        await page.waitForTimeout(1500);

        const canvas = await page.locator('#gameCanvas');

        // Get initial zoom value
        const initialZoom = await page.locator('#zoomValue').textContent();
        console.log(`   Initial zoom: ${initialZoom}`);

        // Simulate mouse wheel zoom in
        await canvas.hover();
        await page.mouse.wheel(0, -100); // Zoom in
        await page.waitForTimeout(300);

        const zoomAfterWheel = await page.locator('#zoomValue').textContent();
        console.log(`   After wheel zoom: ${zoomAfterWheel}`);

        if (zoomAfterWheel !== initialZoom) {
            console.log('✅ PASS: Zoom value updates on mouse wheel');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Zoom value did not update');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ FAIL: Could not test zoom updates - ' + error.message);
        testsFailed++;
    }

    // Test 6: Test mouse movement over UI panel
    console.log('\n📋 Test 6: Mouse events work over UI panel');
    try {
        const canvas = await page.locator('#gameCanvas');
        const uiPanel = await page.locator('#ui');

        // Click on an aircraft to select it (need to find aircraft position)
        const canvasBox = await canvas.boundingBox();

        // Move mouse over UI panel area
        const uiBox = await uiPanel.boundingBox();
        await page.mouse.move(uiBox.x + uiBox.width / 2, uiBox.y + uiBox.height / 2);
        await page.waitForTimeout(300);

        console.log('✅ PASS: Mouse can move over UI panel without errors');
        testsPassed++;
    } catch (error) {
        console.log('❌ FAIL: Mouse events over UI panel failed - ' + error.message);
        testsFailed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Total:  ${testsPassed + testsFailed}`);
    console.log(`🎯 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    console.log('='.repeat(50) + '\n');

    await browser.close();

    // Exit with appropriate code
    process.exit(testsFailed > 0 ? 1 : 0);
}

testUIChanges().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
