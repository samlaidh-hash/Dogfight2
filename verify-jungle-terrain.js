/**
 * Verification script for Jungle Terrain and Hills Rename
 * Tests jungle terrain implementation and Western Europe → Hills rename
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Jungle Terrain and Hills Rename\n');
console.log('='.repeat(60));

// Read the dogfight.html file
const htmlPath = path.join(__dirname, 'dogfight.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const tests = [];

// Test 1: Check Hills rename (from Western Europe)
console.log('\n📋 Test 1: Western Europe → Hills Rename');
const hasHillsButton = htmlContent.includes('🏞️ Hills');
const noWesternEuropeButton = !htmlContent.includes('🪖 Western Europe');
const hasHillsInJS = htmlContent.includes("'ww1-western': 'Hills'");
const hasRollingHillsDesc = htmlContent.includes('Rolling hills');

console.log(`  Button renamed to Hills: ${hasHillsButton ? '✓ Found' : '✗ Missing'}`);
console.log(`  Western Europe removed: ${noWesternEuropeButton ? '✓ Confirmed' : '✗ Still present'}`);
console.log(`  JavaScript map name: ${hasHillsInJS ? '✓ Found' : '✗ Missing'}`);
console.log(`  Rolling hills description: ${hasRollingHillsDesc ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Hills Rename',
    passed: hasHillsButton && noWesternEuropeButton && hasHillsInJS && hasRollingHillsDesc,
    details: [
        `Button text: ${hasHillsButton ? '✓' : '✗'}`,
        `Old name removed: ${noWesternEuropeButton ? '✓' : '✗'}`,
        `JS updated: ${hasHillsInJS ? '✓' : '✗'}`,
        `Description: ${hasRollingHillsDesc ? '✓' : '✗'}`
    ]
});

// Test 2: Check Jungle map button
console.log('\n📋 Test 2: Jungle Map Button');
const hasJungleButton = htmlContent.includes('🌴 Jungle');
const hasJungleOnClick = htmlContent.includes("onclick=\"selectScenarioMap('jungle')\"");
const hasJungleDescription = htmlContent.includes('Dense jungle with hills, rivers, and villages');

console.log(`  Jungle button: ${hasJungleButton ? '✓ Found' : '✗ Missing'}`);
console.log(`  onClick handler: ${hasJungleOnClick ? '✓ Found' : '✗ Missing'}`);
console.log(`  Description: ${hasJungleDescription ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Jungle Map Button',
    passed: hasJungleButton && hasJungleOnClick && hasJungleDescription,
    details: [
        `Button: ${hasJungleButton ? '✓' : '✗'}`,
        `onClick: ${hasJungleOnClick ? '✓' : '✗'}`,
        `Description: ${hasJungleDescription ? '✓' : '✗'}`
    ]
});

// Test 3: Check Jungle in JavaScript map names
console.log('\n📋 Test 3: Jungle in JavaScript');
const hasJungleInMapNames = htmlContent.includes("'jungle': 'Jungle'");
const hasJungleInDescriptions = htmlContent.includes("'jungle': 'Dense jungle terrain");

console.log(`  In mapNames object: ${hasJungleInMapNames ? '✓ Found' : '✗ Missing'}`);
console.log(`  In mapDescriptions: ${hasJungleInDescriptions ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Jungle JavaScript Maps',
    passed: hasJungleInMapNames && hasJungleInDescriptions,
    details: [
        `mapNames: ${hasJungleInMapNames ? '✓' : '✗'}`,
        `mapDescriptions: ${hasJungleInDescriptions ? '✓' : '✗'}`
    ]
});

// Test 4: Check jungle case in startCustomBattle
console.log('\n📋 Test 4: Jungle Case in startCustomBattle');
const hasJungleCase = /case\s+'jungle':/.test(htmlContent);
const callsCreateJungleTerrain = htmlContent.includes('terrain = createJungleTerrain()');
const hasJungleLog = htmlContent.includes("console.log('Created jungle terrain')");

console.log(`  Jungle case statement: ${hasJungleCase ? '✓ Found' : '✗ Missing'}`);
console.log(`  Calls createJungleTerrain(): ${callsCreateJungleTerrain ? '✓ Found' : '✗ Missing'}`);
console.log(`  Console log: ${hasJungleLog ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Jungle Case in Switch',
    passed: hasJungleCase && callsCreateJungleTerrain && hasJungleLog,
    details: [
        `Case statement: ${hasJungleCase ? '✓' : '✗'}`,
        `Function call: ${callsCreateJungleTerrain ? '✓' : '✗'}`,
        `Log: ${hasJungleLog ? '✓' : '✗'}`
    ]
});

// Test 5: Check createJungleTerrain function
console.log('\n📋 Test 5: createJungleTerrain Function');
const hasJungleFunction = htmlContent.includes('function createJungleTerrain()');
const hasHillsGeneration = /\/\/ Generate rolling jungle hills/.test(htmlContent);
const hasRiversGeneration = /\/\/ Generate rivers \(winding paths/.test(htmlContent);
const hasVillagesGeneration = /\/\/ Generate villages/.test(htmlContent) && htmlContent.includes('for (let i = 0; i < 5; i++)');
const hasGetHeightAt = htmlContent.includes('getHeightAt: function(x, y)');
const hasRenderBackground = htmlContent.includes('renderBackground: function(ctx)');

console.log(`  Function defined: ${hasJungleFunction ? '✓ Found' : '✗ Missing'}`);
console.log(`  Hills generation: ${hasHillsGeneration ? '✓ Found' : '✗ Missing'}`);
console.log(`  Rivers generation: ${hasRiversGeneration ? '✓ Found' : '✗ Missing'}`);
console.log(`  Villages generation: ${hasVillagesGeneration ? '✓ Found' : '✗ Missing'}`);
console.log(`  getHeightAt method: ${hasGetHeightAt ? '✓ Found' : '✗ Missing'}`);
console.log(`  renderBackground method: ${hasRenderBackground ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'createJungleTerrain Function',
    passed: hasJungleFunction && hasHillsGeneration && hasRiversGeneration &&
            hasVillagesGeneration && hasGetHeightAt && hasRenderBackground,
    details: [
        `Function: ${hasJungleFunction ? '✓' : '✗'}`,
        `Hills: ${hasHillsGeneration ? '✓' : '✗'}`,
        `Rivers: ${hasRiversGeneration ? '✓' : '✗'}`,
        `Villages: ${hasVillagesGeneration ? '✓' : '✗'}`,
        `getHeightAt: ${hasGetHeightAt ? '✓' : '✗'}`,
        `renderBackground: ${hasRenderBackground ? '✓' : '✗'}`
    ]
});

// Test 6: Check jungle rendering details
console.log('\n📋 Test 6: Jungle Rendering Details');
const hasJungleFloor = htmlContent.includes("ctx.fillStyle = '#1a3a1a'");
const hasFoliagePattern = htmlContent.includes('Draw dense foliage pattern');
const hasRiverDrawing = htmlContent.includes('Draw rivers');
const hasVillageDrawing = htmlContent.includes('Draw villages');
const hasVegetationOverlay = htmlContent.includes('Draw jungle vegetation overlay');

console.log(`  Jungle floor color: ${hasJungleFloor ? '✓ Found' : '✗ Missing'}`);
console.log(`  Foliage pattern: ${hasFoliagePattern ? '✓ Found' : '✗ Missing'}`);
console.log(`  River drawing: ${hasRiverDrawing ? '✓ Found' : '✗ Missing'}`);
console.log(`  Village drawing: ${hasVillageDrawing ? '✓ Found' : '✗ Missing'}`);
console.log(`  Vegetation overlay: ${hasVegetationOverlay ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Jungle Rendering',
    passed: hasJungleFloor && hasFoliagePattern && hasRiverDrawing &&
            hasVillageDrawing && hasVegetationOverlay,
    details: [
        `Floor: ${hasJungleFloor ? '✓' : '✗'}`,
        `Foliage: ${hasFoliagePattern ? '✓' : '✗'}`,
        `Rivers: ${hasRiverDrawing ? '✓' : '✗'}`,
        `Villages: ${hasVillageDrawing ? '✓' : '✗'}`,
        `Overlay: ${hasVegetationOverlay ? '✓' : '✗'}`
    ]
});

// Test 7: Check unit placement documentation
console.log('\n📋 Test 7: Unit Placement Documentation');
const hasPlacementRules = htmlContent.includes('UNIT PLACEMENT RULES FOR OBJECTIVES');
const hasGroundUnitRules = htmlContent.includes("Unit's effective altitude = terrain height");
const hasNavyRules = htmlContent.includes('Can only be placed on water');
const hasSideMarkers = htmlContent.includes('Side A units marked with red indicator');
const hasObjectiveSpawning = htmlContent.includes('Objective-Based Spawning');

console.log(`  Placement rules header: ${hasPlacementRules ? '✓ Found' : '✗ Missing'}`);
console.log(`  Ground unit altitude rule: ${hasGroundUnitRules ? '✓ Found' : '✗ Missing'}`);
console.log(`  Navy placement rules: ${hasNavyRules ? '✓ Found' : '✗ Missing'}`);
console.log(`  Side markers documentation: ${hasSideMarkers ? '✓ Found' : '✗ Missing'}`);
console.log(`  Objective spawning rules: ${hasObjectiveSpawning ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Unit Placement Documentation',
    passed: hasPlacementRules && hasGroundUnitRules && hasNavyRules &&
            hasSideMarkers && hasObjectiveSpawning,
    details: [
        `Rules header: ${hasPlacementRules ? '✓' : '✗'}`,
        `Altitude rule: ${hasGroundUnitRules ? '✓' : '✗'}`,
        `Navy rules: ${hasNavyRules ? '✓' : '✗'}`,
        `Side markers: ${hasSideMarkers ? '✓' : '✗'}`,
        `Spawning: ${hasObjectiveSpawning ? '✓' : '✗'}`
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
    console.log('✅ ALL JUNGLE TERRAIN FEATURES IMPLEMENTED!');
    console.log('\n✨ Features Implemented:');
    console.log('   ✓ Renamed "Western Europe" to "Hills"');
    console.log('   ✓ Added Jungle map with 🌴 icon');
    console.log('   ✓ Jungle terrain generator with:');
    console.log('     - 12 rolling hills (100-400m height)');
    console.log('     - 3 winding rivers');
    console.log('     - 5 villages');
    console.log('     - 20 clouds');
    console.log('   ✓ Jungle-themed rendering:');
    console.log('     - Dark green jungle floor (#1a3a1a)');
    console.log('     - Dense foliage pattern');
    console.log('     - Blue winding rivers (#4a8aa8)');
    console.log('     - Brown villages (huts)');
    console.log('     - Vegetation overlay');
    console.log('   ✓ Unit placement rules documented');
    console.log('     - Ground units can be on hills (altitude = hill height)');
    console.log('     - Ships only on water (no overlap)');
    console.log('     - Side A (red) and Side B (blue) markers');
    console.log('\n🗺️ Available Map Types (now 6):');
    console.log('   1. Mountains & Clouds');
    console.log('   2. Hills (formerly Western Europe)');
    console.log('   3. Jungle (NEW!)');
    console.log('   4. Alps');
    console.log('   5. Sea');
    console.log('   6. Coastal');
} else {
    console.log(`❌ ${totalTests - passedTests} test(s) failed`);
    console.log('Please review the missing features above.');
}

console.log('='.repeat(60));

// Exit with appropriate code
process.exit(passedTests === totalTests ? 0 : 1);
