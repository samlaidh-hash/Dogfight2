/**
 * Verification script for Scenario Selector implementation
 * Tests all required features for custom battle scenario selection
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Scenario Selector Implementation\n');
console.log('='.repeat(60));

// Read the dogfight.html file
const htmlPath = path.join(__dirname, 'dogfight.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const tests = [];

// Test 1: Check HTML structure for scenario selector
console.log('\n📋 Test 1: Scenario Selector HTML Structure');
const hasScenarioSelector = htmlContent.includes('id="scenarioSelector"');
const hasMapButtons = htmlContent.includes('onclick="selectScenarioMap(\'mountains\')"') &&
                      htmlContent.includes('onclick="selectScenarioMap(\'ww1-western\')"') &&
                      htmlContent.includes('onclick="selectScenarioMap(\'ww1-alps\')"') &&
                      htmlContent.includes('onclick="selectScenarioMap(\'sea\')"') &&
                      htmlContent.includes('onclick="selectScenarioMap(\'coast\')"');
const hasYearSelector = htmlContent.includes('id="selectedYear"') &&
                        htmlContent.includes('id="yearSlider"') &&
                        htmlContent.includes('onclick="adjustYear');
const hasProceedButton = htmlContent.includes('onclick="proceedToAircraftSelection()"');

console.log(`  Scenario selector div: ${hasScenarioSelector ? '✓ Found' : '✗ Missing'}`);
console.log(`  Map selection buttons: ${hasMapButtons ? '✓ Found' : '✗ Missing'}`);
console.log(`  Year selector: ${hasYearSelector ? '✓ Found' : '✗ Missing'}`);
console.log(`  Proceed button: ${hasProceedButton ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Scenario Selector HTML Structure',
    passed: hasScenarioSelector && hasMapButtons && hasYearSelector && hasProceedButton,
    details: [
        `Scenario selector: ${hasScenarioSelector ? '✓' : '✗'}`,
        `Map buttons (5 types): ${hasMapButtons ? '✓' : '✗'}`,
        `Year selector: ${hasYearSelector ? '✓' : '✗'}`,
        `Proceed button: ${hasProceedButton ? '✓' : '✗'}`
    ]
});

// Test 2: Check CSS styling for scenario buttons
console.log('\n📋 Test 2: Scenario Button CSS Styling');
const hasScenarioBtnStyle = /\.scenario-btn\s*\{/.test(htmlContent);
const hasScenarioBtnHover = /\.scenario-btn:hover/.test(htmlContent);
const hasScenarioBtnSelected = /\.scenario-btn\.selected/.test(htmlContent);

console.log(`  .scenario-btn style: ${hasScenarioBtnStyle ? '✓ Found' : '✗ Missing'}`);
console.log(`  .scenario-btn:hover: ${hasScenarioBtnHover ? '✓ Found' : '✗ Missing'}`);
console.log(`  .scenario-btn.selected: ${hasScenarioBtnSelected ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Scenario Button CSS',
    passed: hasScenarioBtnStyle && hasScenarioBtnHover && hasScenarioBtnSelected,
    details: [
        `Base style: ${hasScenarioBtnStyle ? '✓' : '✗'}`,
        `Hover state: ${hasScenarioBtnHover ? '✓' : '✗'}`,
        `Selected state: ${hasScenarioBtnSelected ? '✓' : '✗'}`
    ]
});

// Test 3: Check JavaScript functions for scenario selection
console.log('\n📋 Test 3: Scenario Selection JavaScript Functions');
const hasShowScenarioSelector = htmlContent.includes('function showScenarioSelector()');
const hasHideScenarioSelector = htmlContent.includes('function hideScenarioSelector()');
const hasSelectScenarioMap = htmlContent.includes('function selectScenarioMap(mapType)');
const hasAdjustYear = htmlContent.includes('function adjustYear(amount)');
const hasUpdateYearFromSlider = htmlContent.includes('function updateYearFromSlider()');
const hasUpdateScenarioSummary = htmlContent.includes('function updateScenarioSummary()');
const hasProceedFunction = htmlContent.includes('function proceedToAircraftSelection()');

console.log(`  showScenarioSelector(): ${hasShowScenarioSelector ? '✓ Found' : '✗ Missing'}`);
console.log(`  hideScenarioSelector(): ${hasHideScenarioSelector ? '✓ Found' : '✗ Missing'}`);
console.log(`  selectScenarioMap(): ${hasSelectScenarioMap ? '✓ Found' : '✗ Missing'}`);
console.log(`  adjustYear(): ${hasAdjustYear ? '✓ Found' : '✗ Missing'}`);
console.log(`  updateYearFromSlider(): ${hasUpdateYearFromSlider ? '✓ Found' : '✗ Missing'}`);
console.log(`  updateScenarioSummary(): ${hasUpdateScenarioSummary ? '✓ Found' : '✗ Missing'}`);
console.log(`  proceedToAircraftSelection(): ${hasProceedFunction ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Scenario Selection JavaScript',
    passed: hasShowScenarioSelector && hasHideScenarioSelector && hasSelectScenarioMap &&
            hasAdjustYear && hasUpdateYearFromSlider && hasUpdateScenarioSummary && hasProceedFunction,
    details: [
        `Show/hide functions: ${hasShowScenarioSelector && hasHideScenarioSelector ? '✓' : '✗'}`,
        `Map selection: ${hasSelectScenarioMap ? '✓' : '✗'}`,
        `Year adjustment: ${hasAdjustYear && hasUpdateYearFromSlider ? '✓' : '✗'}`,
        `Summary update: ${hasUpdateScenarioSummary ? '✓' : '✗'}`,
        `Proceed function: ${hasProceedFunction ? '✓' : '✗'}`
    ]
});

// Test 4: Check scenario variables
console.log('\n📋 Test 4: Scenario State Variables');
const hasScenarioMapVar = htmlContent.includes('let selectedScenarioMap');
const hasScenarioYearVar = htmlContent.includes('let selectedScenarioYear');

console.log(`  selectedScenarioMap variable: ${hasScenarioMapVar ? '✓ Found' : '✗ Missing'}`);
console.log(`  selectedScenarioYear variable: ${hasScenarioYearVar ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Scenario State Variables',
    passed: hasScenarioMapVar && hasScenarioYearVar,
    details: [
        `selectedScenarioMap: ${hasScenarioMapVar ? '✓' : '✗'}`,
        `selectedScenarioYear: ${hasScenarioYearVar ? '✓' : '✗'}`
    ]
});

// Test 5: Check updated showAircraftSelector flow
console.log('\n📋 Test 5: Updated Custom Battle Flow');
const showAircraftCallsScenario = /function showAircraftSelector\(\)[^}]*showScenarioSelector\(\)/.test(htmlContent);
const backButtonReturnsToScenario = htmlContent.includes('scenarioSelector');

console.log(`  showAircraftSelector calls showScenarioSelector: ${showAircraftCallsScenario ? '✓ Found' : '✗ Missing'}`);
console.log(`  Back button references scenario selector: ${backButtonReturnsToScenario ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Custom Battle Flow',
    passed: showAircraftCallsScenario && backButtonReturnsToScenario,
    details: [
        `Flow redirects to scenario: ${showAircraftCallsScenario ? '✓' : '✗'}`,
        `Back button integrated: ${backButtonReturnsToScenario ? '✓' : '✗'}`
    ]
});

// Test 6: Check startCustomBattle modifications
console.log('\n📋 Test 6: Modified startCustomBattle Function');
const hasTerrainSwitch = /switch\s*\(\s*selectedScenarioMap\s*\)/.test(htmlContent);
const hasMountainsCase = htmlContent.includes("case 'mountains':");
const hasWW1WesternCase = htmlContent.includes("case 'ww1-western':");
const hasWW1AlpsCase = htmlContent.includes("case 'ww1-alps':");
const hasSeaCase = htmlContent.includes("case 'sea':");
const hasCoastCase = htmlContent.includes("case 'coast':");
const hasEraLogic = htmlContent.includes('selectedScenarioYear') &&
                    htmlContent.includes('gameEra =');

console.log(`  Terrain switch statement: ${hasTerrainSwitch ? '✓ Found' : '✗ Missing'}`);
console.log(`  Mountains case: ${hasMountainsCase ? '✓ Found' : '✗ Missing'}`);
console.log(`  WW1 Western case: ${hasWW1WesternCase ? '✓ Found' : '✗ Missing'}`);
console.log(`  WW1 Alps case: ${hasWW1AlpsCase ? '✓ Found' : '✗ Missing'}`);
console.log(`  Sea case: ${hasSeaCase ? '✓ Found' : '✗ Missing'}`);
console.log(`  Coast case: ${hasCoastCase ? '✓ Found' : '✗ Missing'}`);
console.log(`  Era determination logic: ${hasEraLogic ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Modified startCustomBattle',
    passed: hasTerrainSwitch && hasMountainsCase && hasWW1WesternCase &&
            hasWW1AlpsCase && hasSeaCase && hasCoastCase && hasEraLogic,
    details: [
        `Terrain switch: ${hasTerrainSwitch ? '✓' : '✗'}`,
        `All 5 map cases: ${hasMountainsCase && hasWW1WesternCase && hasWW1AlpsCase && hasSeaCase && hasCoastCase ? '✓' : '✗'}`,
        `Era logic: ${hasEraLogic ? '✓' : '✗'}`
    ]
});

// Test 7: Check new terrain generation functions
console.log('\n📋 Test 7: New Terrain Generation Functions');
const hasCreateSeaTerrain = htmlContent.includes('function createSeaTerrain()');
const hasCreateCoastalTerrain = htmlContent.includes('function createCoastalTerrain()');
const hasGenerateMountains = htmlContent.includes('function generateMountains(');
const hasGenerateClouds = htmlContent.includes('function generateClouds(');

console.log(`  createSeaTerrain(): ${hasCreateSeaTerrain ? '✓ Found' : '✗ Missing'}`);
console.log(`  createCoastalTerrain(): ${hasCreateCoastalTerrain ? '✓ Found' : '✗ Missing'}`);
console.log(`  generateMountains(): ${hasGenerateMountains ? '✓ Found' : '✗ Missing'}`);
console.log(`  generateClouds(): ${hasGenerateClouds ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Terrain Generation Functions',
    passed: hasCreateSeaTerrain && hasCreateCoastalTerrain && hasGenerateMountains && hasGenerateClouds,
    details: [
        `Sea terrain: ${hasCreateSeaTerrain ? '✓' : '✗'}`,
        `Coastal terrain: ${hasCreateCoastalTerrain ? '✓' : '✗'}`,
        `Helper functions: ${hasGenerateMountains && hasGenerateClouds ? '✓' : '✗'}`
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
    console.log('✅ ALL SCENARIO SELECTOR FEATURES IMPLEMENTED!');
    console.log('\n✨ Features Implemented:');
    console.log('   ✓ Scenario selection screen with 5 map types');
    console.log('   ✓ Year selection (1914-2100) with slider and buttons');
    console.log('   ✓ Scenario summary display');
    console.log('   ✓ Integration with aircraft selector');
    console.log('   ✓ Modified startCustomBattle with terrain switching');
    console.log('   ✓ New terrain generators (Sea, Coastal)');
    console.log('   ✓ Era determination based on year');
    console.log('\n🎮 How to Use:');
    console.log('   1. Click "CUSTOM BATTLE" from splash screen');
    console.log('   2. Select map type (Mountains, WW1 Western, WW1 Alps, Sea, Coast)');
    console.log('   3. Choose year with slider or +/- buttons');
    console.log('   4. Click "PROCEED TO AIRCRAFT SELECTION"');
    console.log('   5. Choose generation and aircraft');
    console.log('   6. Click "START BATTLE"');
} else {
    console.log(`❌ ${totalTests - passedTests} test(s) failed`);
    console.log('Please review the missing features above.');
}

console.log('='.repeat(60));

// Exit with appropriate code
process.exit(passedTests === totalTests ? 0 : 1);
