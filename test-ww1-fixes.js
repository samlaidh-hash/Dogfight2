/**
 * Test script to verify WW1 game fixes
 * Tests:
 * 1. Terrain undefined error is fixed
 * 2. Aircraft control is working (both Allied and Central Powers)
 * 3. Hot-seat mode is properly reset
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying WW1 Game Fixes\n');
console.log('='.repeat(60));

// Read the dogfight.html file
const htmlPath = path.join(__dirname, 'dogfight.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const tests = [];

// Test 1: Check terrain guard in render function
console.log('\n📋 Test 1: Terrain Undefined Guard');
const hasTerrainGuard = /if\s*\(\s*terrain\s*&&\s*terrain\.getHeightAt\s*\)/.test(htmlContent);
const terrainGetHeightCalls = htmlContent.match(/terrain\.getHeightAt/g) || [];

console.log(`  Terrain guard check: ${hasTerrainGuard ? '✓ Found' : '✗ Missing'}`);
console.log(`  Total terrain.getHeightAt calls: ${terrainGetHeightCalls.length}`);

tests.push({
    name: 'Terrain Undefined Guard',
    passed: hasTerrainGuard,
    details: [
        `Guard in render function: ${hasTerrainGuard ? '✓' : '✗'}`,
        `Total terrain.getHeightAt calls: ${terrainGetHeightCalls.length}`
    ]
});

// Test 2: Check Central Powers aircraft use ac.isPlayer
console.log('\n📋 Test 2: Central Powers Aircraft Control');

// Look for the Central Powers aircraft creation
const centralPowersMatch = htmlContent.match(/\/\/ Add Central Powers aircraft[\s\S]{0,500}new Aircraft\([^)]*,\s*([^)]+)\);/);
const usesCentralIsPlayer = centralPowersMatch && centralPowersMatch[1].includes('ac.isPlayer');

// Check if there's a selectedAircraft assignment for Central Powers
const hasCentralSelectedAircraft = /\/\/ Add Central Powers aircraft[\s\S]{0,500}if\s*\(\s*ac\.isPlayer\s*\)\s*\{[\s\S]{0,100}selectedAircraft\s*=/.test(htmlContent);

console.log(`  Uses ac.isPlayer for Central Powers: ${usesCentralIsPlayer ? '✓ Found' : '✗ Missing'}`);
console.log(`  Sets selectedAircraft for Central Powers: ${hasCentralSelectedAircraft ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Central Powers Aircraft Control',
    passed: usesCentralIsPlayer && hasCentralSelectedAircraft,
    details: [
        `Uses ac.isPlayer: ${usesCentralIsPlayer ? '✓' : '✗'}`,
        `Sets selectedAircraft: ${hasCentralSelectedAircraft ? '✓' : '✗'}`
    ]
});

// Test 3: Check hot-seat mode reset in startWW1Battle
console.log('\n📋 Test 3: Hot-Seat Mode Reset in WW1 Battle');

// Find the startWW1Battle function
const startWW1Match = htmlContent.match(/function startWW1Battle\(\)\s*\{([\s\S]{0,3000})\}/);
if (startWW1Match) {
    const functionBody = startWW1Match[1];

    const resetsHotSeatMode = functionBody.includes('hotSeatMode = false');
    const resetsCurrentPlayer = functionBody.includes('currentPlayer = 1');
    const resetsPlayerArrays = functionBody.includes('player1Aircraft = []') &&
                                functionBody.includes('player2Aircraft = []');
    const resetsPlayerSwitch = functionBody.includes('awaitingPlayerSwitch = false');

    console.log(`  Resets hotSeatMode: ${resetsHotSeatMode ? '✓ Found' : '✗ Missing'}`);
    console.log(`  Resets currentPlayer: ${resetsCurrentPlayer ? '✓ Found' : '✗ Missing'}`);
    console.log(`  Resets player arrays: ${resetsPlayerArrays ? '✓ Found' : '✗ Missing'}`);
    console.log(`  Resets awaitingPlayerSwitch: ${resetsPlayerSwitch ? '✓ Found' : '✗ Missing'}`);

    const allResets = resetsHotSeatMode && resetsCurrentPlayer && resetsPlayerArrays && resetsPlayerSwitch;

    tests.push({
        name: 'Hot-Seat Mode Reset',
        passed: allResets,
        details: [
            `hotSeatMode = false: ${resetsHotSeatMode ? '✓' : '✗'}`,
            `currentPlayer = 1: ${resetsCurrentPlayer ? '✓' : '✗'}`,
            `Player arrays reset: ${resetsPlayerArrays ? '✓' : '✗'}`,
            `awaitingPlayerSwitch = false: ${resetsPlayerSwitch ? '✓' : '✗'}`
        ]
    });
} else {
    console.log('  ✗ Could not find startWW1Battle function');
    tests.push({
        name: 'Hot-Seat Mode Reset',
        passed: false,
        details: ['Could not find startWW1Battle function']
    });
}

// Test 4: Verify Allied aircraft still works correctly
console.log('\n📋 Test 4: Allied Aircraft Control');

const alliedPowersMatch = htmlContent.match(/\/\/ Add Allied aircraft[\s\S]{0,500}new Aircraft\([^)]*,\s*([^)]+)\);/);
const usesAlliedIsPlayer = alliedPowersMatch && alliedPowersMatch[1].includes('ac.isPlayer');

const hasAlliedSelectedAircraft = /\/\/ Add Allied aircraft[\s\S]{0,500}if\s*\(\s*ac\.isPlayer\s*\)\s*\{[\s\S]{0,100}selectedAircraft\s*=/.test(htmlContent);

console.log(`  Uses ac.isPlayer for Allied: ${usesAlliedIsPlayer ? '✓ Found' : '✗ Missing'}`);
console.log(`  Sets selectedAircraft for Allied: ${hasAlliedSelectedAircraft ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Allied Aircraft Control',
    passed: usesAlliedIsPlayer && hasAlliedSelectedAircraft,
    details: [
        `Uses ac.isPlayer: ${usesAlliedIsPlayer ? '✓' : '✗'}`,
        `Sets selectedAircraft: ${hasAlliedSelectedAircraft ? '✓' : '✗'}`
    ]
});

// Test 5: Check default isPlayer value for added aircraft
console.log('\n📋 Test 5: Default isPlayer Values');

const addAlliedMatch = htmlContent.match(/function addAlliedAircraft\(\)[\s\S]{0,500}ww1AlliedAircraft\.push\(\{[^}]*isPlayer:\s*([^,}]+)/);
const addCentralMatch = htmlContent.match(/function addCentralAircraft\(\)[\s\S]{0,500}ww1CentralAircraft\.push\(\{[^}]*isPlayer:\s*([^,}]+)/);

const alliedDefault = addAlliedMatch ? addAlliedMatch[1].trim() : 'NOT FOUND';
const centralDefault = addCentralMatch ? addCentralMatch[1].trim() : 'NOT FOUND';

console.log(`  Allied aircraft default isPlayer: ${alliedDefault}`);
console.log(`  Central aircraft default isPlayer: ${centralDefault}`);

const hasToggleFunction = htmlContent.includes('function toggleAircraftControl');
console.log(`  Toggle control function exists: ${hasToggleFunction ? '✓' : '✗'}`);

const alliedIsDefault = alliedDefault.startsWith('false');
const centralIsDefault = centralDefault.startsWith('false');

tests.push({
    name: 'Default isPlayer Values',
    passed: alliedIsDefault && centralIsDefault && hasToggleFunction,
    details: [
        `Allied default: ${alliedDefault}`,
        `Central default: ${centralDefault}`,
        `Toggle function: ${hasToggleFunction ? '✓' : '✗'}`
    ]
});

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
    console.log('✅ ALL WW1 FIXES IMPLEMENTED CORRECTLY!');
    console.log('\n✨ Fixed Issues:');
    console.log('   ✓ Terrain undefined error (added guard in render)');
    console.log('   ✓ Central Powers aircraft can be player-controlled');
    console.log('   ✓ Hot-seat mode properly reset in WW1 battles');
    console.log('   ✓ Allied aircraft control working correctly');
    console.log('   ✓ Default isPlayer values and toggle function in place');
} else {
    console.log(`❌ ${totalTests - passedTests} test(s) failed`);
    console.log('Please review the missing fixes above.');
}

console.log('='.repeat(60));

// Exit with appropriate code
process.exit(passedTests === totalTests ? 0 : 1);
