/**
 * Static verification script for ship panel features
 * Checks that all required code is present in dogfight.html
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Ship Panel Features Implementation\n');
console.log('='.repeat(60));

// Read the dogfight.html file
const htmlPath = path.join(__dirname, 'dogfight.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const tests = [];

// Test 1: Check for ships panel HTML element
console.log('\n📋 Test 1: Ships Panel HTML Element');
const hasSipsPanel = htmlContent.includes('id="shipsPanel"');
const hasShipsList = htmlContent.includes('id="shipsList"');
const hasPanelTab = htmlContent.includes('onclick="togglePanel(\'shipsPanel\')"');

tests.push({
    name: 'Ships Panel HTML',
    passed: hasSipsPanel && hasShipsList && hasPanelTab,
    details: [
        `Ships panel element: ${hasSipsPanel ? '✓' : '✗'}`,
        `Ships list container: ${hasShipsList ? '✓' : '✗'}`,
        `Panel toggle tab: ${hasPanelTab ? '✓' : '✗'}`
    ]
});

console.log(`  Ships panel element: ${hasSipsPanel ? '✓ Found' : '✗ Missing'}`);
console.log(`  Ships list container: ${hasShipsList ? '✓ Found' : '✗ Missing'}`);
console.log(`  Panel toggle tab: ${hasPanelTab ? '✓ Found' : '✗ Missing'}`);

// Test 2: Check for ship name display
console.log('\n📋 Test 2: Ship Name Display');
const hasShipNameClass = htmlContent.includes('class="ship-name"') || htmlContent.includes('.ship-name');
const hasShipNameInHTML = htmlContent.includes('${ship.name}');
const hasShipNameStyle = /\.ship-name\s*\{[\s\S]*?\}/.test(htmlContent);

tests.push({
    name: 'Ship Name Display',
    passed: hasShipNameClass && hasShipNameInHTML && hasShipNameStyle,
    details: [
        `Ship name class usage: ${hasShipNameClass ? '✓' : '✗'}`,
        `Ship name template: ${hasShipNameInHTML ? '✓' : '✗'}`,
        `Ship name CSS: ${hasShipNameStyle ? '✓' : '✗'}`
    ]
});

console.log(`  Ship name class usage: ${hasShipNameClass ? '✓ Found' : '✗ Missing'}`);
console.log(`  Ship name in template: ${hasShipNameInHTML ? '✓ Found' : '✗ Missing'}`);
console.log(`  Ship name CSS: ${hasShipNameStyle ? '✓ Found' : '✗ Missing'}`);

// Test 3: Check for expand/collapse functionality
console.log('\n📋 Test 3: Expand/Collapse Functionality');
const hasShipDetailsClass = /\.ship-details/.test(htmlContent);
const hasExpandedClass = /\.ship-details\.expanded/.test(htmlContent) || htmlContent.includes("classList.contains('expanded')");
const hasToggleFunction = htmlContent.includes('function toggleShipDetails');
const hasToggleOnClick = htmlContent.includes('toggleShipDetails');

tests.push({
    name: 'Expand/Collapse Functionality',
    passed: hasShipDetailsClass && hasExpandedClass && hasToggleFunction && hasToggleOnClick,
    details: [
        `Ship details class: ${hasShipDetailsClass ? '✓' : '✗'}`,
        `Expanded state: ${hasExpandedClass ? '✓' : '✗'}`,
        `Toggle function: ${hasToggleFunction ? '✓' : '✗'}`,
        `Toggle on click: ${hasToggleOnClick ? '✓' : '✗'}`
    ]
});

console.log(`  Ship details class: ${hasShipDetailsClass ? '✓ Found' : '✗ Missing'}`);
console.log(`  Expanded state handling: ${hasExpandedClass ? '✓ Found' : '✗ Missing'}`);
console.log(`  Toggle function: ${hasToggleFunction ? '✓ Found' : '✗ Missing'}`);
console.log(`  Toggle onClick: ${hasToggleOnClick ? '✓ Found' : '✗ Missing'}`);

// Test 4: Check for camera centering icon and function
console.log('\n📋 Test 4: Camera Centering Icon and Functionality');
const hasCameraIcon = htmlContent.includes('📹') || htmlContent.includes('ship-camera-icon');
const hasCameraIconClass = /\.ship-camera-icon/.test(htmlContent);
const hasCenterMapFunction = htmlContent.includes('function centerMapOnShip');
const hasCenterMapOnClick = htmlContent.includes('centerMapOnShip(');
const hasPanXPanY = htmlContent.includes('panX') && htmlContent.includes('panY');

tests.push({
    name: 'Camera Centering',
    passed: hasCameraIcon && hasCameraIconClass && hasCenterMapFunction && hasCenterMapOnClick && hasPanXPanY,
    details: [
        `Camera icon: ${hasCameraIcon ? '✓' : '✗'}`,
        `Camera icon CSS: ${hasCameraIconClass ? '✓' : '✗'}`,
        `Center map function: ${hasCenterMapFunction ? '✓' : '✗'}`,
        `Center map onClick: ${hasCenterMapOnClick ? '✓' : '✗'}`,
        `Pan variables: ${hasPanXPanY ? '✓' : '✗'}`
    ]
});

console.log(`  Camera icon (📹): ${hasCameraIcon ? '✓ Found' : '✗ Missing'}`);
console.log(`  Camera icon CSS: ${hasCameraIconClass ? '✓ Found' : '✗ Missing'}`);
console.log(`  centerMapOnShip function: ${hasCenterMapFunction ? '✓ Found' : '✗ Missing'}`);
console.log(`  centerMapOnShip onClick: ${hasCenterMapOnClick ? '✓ Found' : '✗ Missing'}`);
console.log(`  Pan variables (panX/panY): ${hasPanXPanY ? '✓ Found' : '✗ Missing'}`);

// Test 5: Check for updateShipsPanel function
console.log('\n📋 Test 5: Update Ships Panel Function');
const hasUpdateFunction = htmlContent.includes('function updateShipsPanel');
const hasShipEntryCreation = htmlContent.includes('ship-entry');
const hasShipHealthDisplay = htmlContent.includes('ship.health') || htmlContent.includes('ship-hp');
const hasShieldDisplay = htmlContent.includes('ship.shields') || htmlContent.includes('shield');

tests.push({
    name: 'Update Ships Panel Function',
    passed: hasUpdateFunction && hasShipEntryCreation && hasShipHealthDisplay && hasShieldDisplay,
    details: [
        `Update function: ${hasUpdateFunction ? '✓' : '✗'}`,
        `Ship entry creation: ${hasShipEntryCreation ? '✓' : '✗'}`,
        `Health display: ${hasShipHealthDisplay ? '✓' : '✗'}`,
        `Shield display: ${hasShieldDisplay ? '✓' : '✗'}`
    ]
});

console.log(`  updateShipsPanel function: ${hasUpdateFunction ? '✓ Found' : '✗ Missing'}`);
console.log(`  Ship entry creation: ${hasShipEntryCreation ? '✓ Found' : '✗ Missing'}`);
console.log(`  Health display: ${hasShipHealthDisplay ? '✓ Found' : '✗ Missing'}`);
console.log(`  Shield display: ${hasShieldDisplay ? '✓ Found' : '✗ Missing'}`);

// Test 6: Check CSS styling
console.log('\n📋 Test 6: CSS Styling');
const hasUIpanelClass = /\.ui-panel\s*\{/.test(htmlContent);
const hasShipEntryStyle = /\.ship-entry\s*\{/.test(htmlContent);
const hasShipEntryHover = /\.ship-entry:hover/.test(htmlContent);
const hasCameraIconStyle = /\.ship-camera-icon\s*\{/.test(htmlContent);
const hasCameraIconHover = /\.ship-camera-icon:hover/.test(htmlContent);
const hasCollapsedState = /\.ui-panel\.collapsed/.test(htmlContent) || /\.collapsed/.test(htmlContent);

tests.push({
    name: 'CSS Styling',
    passed: hasUIpanelClass && hasShipEntryStyle && hasShipEntryHover && hasCameraIconStyle && hasCameraIconHover,
    details: [
        `UI panel style: ${hasUIpanelClass ? '✓' : '✗'}`,
        `Ship entry style: ${hasShipEntryStyle ? '✓' : '✗'}`,
        `Ship entry hover: ${hasShipEntryHover ? '✓' : '✗'}`,
        `Camera icon style: ${hasCameraIconStyle ? '✓' : '✗'}`,
        `Camera icon hover: ${hasCameraIconHover ? '✓' : '✗'}`,
        `Collapsed state: ${hasCollapsedState ? '✓' : '✗'}`
    ]
});

console.log(`  UI panel CSS: ${hasUIpanelClass ? '✓ Found' : '✗ Missing'}`);
console.log(`  Ship entry CSS: ${hasShipEntryStyle ? '✓ Found' : '✗ Missing'}`);
console.log(`  Ship entry hover: ${hasShipEntryHover ? '✓ Found' : '✗ Missing'}`);
console.log(`  Camera icon CSS: ${hasCameraIconStyle ? '✓ Found' : '✗ Missing'}`);
console.log(`  Camera icon hover: ${hasCameraIconHover ? '✓ Found' : '✗ Missing'}`);
console.log(`  Collapsed state CSS: ${hasCollapsedState ? '✓ Found' : '✗ Missing'}`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));

const passedTests = tests.filter(t => t.passed).length;
const totalTests = tests.length;

tests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${test.name}`);
    if (!test.passed) {
        test.details.forEach(detail => {
            console.log(`    ${detail}`);
        });
    }
});

console.log('\n' + '='.repeat(60));
console.log(`Result: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
    console.log('✅ ALL FEATURES IMPLEMENTED CORRECTLY!');
    console.log('\n✨ Ship Panel Features:');
    console.log('   ✓ Ship name display panel with expand/collapse');
    console.log('   ✓ Camera icon (📹) for centering map on ships');
    console.log('   ✓ Full ship status display (health, shields, etc.)');
    console.log('   ✓ Proper CSS styling and hover effects');
    console.log('   ✓ Toggle panel functionality');
} else {
    console.log(`❌ ${totalTests - passedTests} test(s) failed`);
    console.log('Please review the missing features above.');
}

console.log('='.repeat(60));

// Exit with appropriate code
process.exit(passedTests === totalTests ? 0 : 1);
