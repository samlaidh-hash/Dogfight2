const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying UI Changes in dogfight.html\n');
console.log('=' .repeat(60));

const htmlPath = path.join(__dirname, 'dogfight.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

let passed = 0;
let failed = 0;

// Test 1: Check for panel-tab element
console.log('\n📋 Test 1: Panel tab structure');
if (htmlContent.includes('class="panel-tab"') && htmlContent.includes('INFO')) {
    console.log('✅ PASS: Panel tab with "INFO" text found');
    passed++;
} else {
    console.log('❌ FAIL: Panel tab structure not found');
    failed++;
}

// Test 2: Check for panel-content wrapper
console.log('\n📋 Test 2: Panel content wrapper');
if (htmlContent.includes('class="panel-content"')) {
    console.log('✅ PASS: Panel content wrapper found');
    passed++;
} else {
    console.log('❌ FAIL: Panel content wrapper not found');
    failed++;
}

// Test 3: Check for bottomRightInfo panel
console.log('\n📋 Test 3: Bottom right info panel');
if (htmlContent.includes('id="bottomRightInfo"') &&
    htmlContent.includes('id="scaleValue"') &&
    htmlContent.includes('id="zoomValue"')) {
    console.log('✅ PASS: Bottom right info panel with scale and zoom elements found');
    passed++;
} else {
    console.log('❌ FAIL: Bottom right info panel structure incomplete');
    failed++;
}

// Test 4: Check CSS for collapsed state
console.log('\n📋 Test 4: CSS collapsed state');
if (htmlContent.includes('#ui.collapsed') &&
    htmlContent.includes('display: none') &&
    htmlContent.match(/#ui\.collapsed\s+\.panel-content/)) {
    console.log('✅ PASS: Collapsed state CSS found');
    passed++;
} else {
    console.log('❌ FAIL: Collapsed state CSS not complete');
    failed++;
}

// Test 5: Check CSS for overflow: hidden
console.log('\n📋 Test 5: UI panel overflow hidden');
if (htmlContent.match(/#ui\s*\{[^}]*overflow:\s*hidden/s)) {
    console.log('✅ PASS: UI panel has overflow: hidden');
    passed++;
} else {
    console.log('❌ FAIL: UI panel overflow: hidden not found');
    failed++;
}

// Test 6: Check for UI panel click handler
console.log('\n📋 Test 6: UI panel click event handler');
if (htmlContent.includes('uiPanel.addEventListener') &&
    htmlContent.includes('classList.toggle') &&
    htmlContent.includes('collapsed')) {
    console.log('✅ PASS: UI panel click handler for collapse/expand found');
    passed++;
} else {
    console.log('❌ FAIL: UI panel click handler not found');
    failed++;
}

// Test 7: Check for zoom value update
console.log('\n📋 Test 7: Zoom value update in wheel event');
if (htmlContent.includes('zoomValue') &&
    htmlContent.includes("addEventListener('wheel'")) {
    // Find the wheel event handler section
    const wheelIndex = htmlContent.indexOf("addEventListener('wheel'");
    const afterWheel = htmlContent.substring(wheelIndex, wheelIndex + 1000);
    if (afterWheel.includes('zoomValue')) {
        console.log('✅ PASS: Zoom value update in wheel event handler found');
        passed++;
    } else {
        console.log('❌ FAIL: Zoom value update not in wheel handler');
        failed++;
    }
} else {
    console.log('❌ FAIL: Zoom-related code not found');
    failed++;
}

// Test 8: Check for mousemove event forwarding from UI panel
console.log('\n📋 Test 8: Mouse event forwarding from UI panel');
if (htmlContent.includes('uiPanel.addEventListener') &&
    htmlContent.match(/uiPanel\.addEventListener\(['"]mousemove/)) {
    console.log('✅ PASS: Mousemove event handler on UI panel found');
    passed++;
} else {
    console.log('❌ FAIL: Mousemove event forwarding not found');
    failed++;
}

// Test 9: Check for pointer-events in CSS
console.log('\n📋 Test 9: Pointer events CSS');
if (htmlContent.includes('pointer-events: auto') ||
    htmlContent.includes('pointer-events: none')) {
    console.log('✅ PASS: Pointer events CSS properties found');
    passed++;
} else {
    console.log('❌ FAIL: Pointer events CSS not found');
    failed++;
}

// Test 10: Check bottom right info panel CSS
console.log('\n📋 Test 10: Bottom right info panel CSS positioning');
const bottomRightCSS = htmlContent.match(/#bottomRightInfo\s*\{[^}]*\}/s);
if (bottomRightCSS &&
    bottomRightCSS[0].includes('bottom:') &&
    bottomRightCSS[0].includes('right:')) {
    console.log('✅ PASS: Bottom right info panel CSS positioning correct');
    passed++;
} else {
    console.log('❌ FAIL: Bottom right info panel CSS positioning incorrect');
    failed++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total:  ${passed + failed}`);
console.log(`🎯 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
console.log('='.repeat(60) + '\n');

if (failed === 0) {
    console.log('🎉 All verification checks passed!');
} else {
    console.log(`⚠️  ${failed} check(s) failed. Review the output above.`);
}

process.exit(failed > 0 ? 1 : 0);
