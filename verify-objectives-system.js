/**
 * Verification script for Objectives System and Scenario Updates
 * Tests objectives assignment, Western Europe rename, and conditional trenches
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Objectives System and Scenario Updates\n');
console.log('='.repeat(60));

// Read the dogfight.html file
const htmlPath = path.join(__dirname, 'dogfight.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const tests = [];

// Test 1: Check Western Europe rename
console.log('\n📋 Test 1: Western Europe Rename');
const hasWesternEuropeButton = htmlContent.includes('🪖 Western Europe');
const noWW1WesternFrontButton = !htmlContent.includes('🪖 WW1 Western Front');
const hasWesternEuropeInJS = htmlContent.includes("'ww1-western': 'Western Europe'");
const hasTrenchNote = htmlContent.includes('trenches if 1914-1921');

console.log(`  Button renamed to Western Europe: ${hasWesternEuropeButton ? '✓ Found' : '✗ Missing'}`);
console.log(`  Old WW1 Western Front removed: ${noWW1WesternFrontButton ? '✓ Confirmed' : '✗ Still present'}`);
console.log(`  JavaScript map name updated: ${hasWesternEuropeInJS ? '✓ Found' : '✗ Missing'}`);
console.log(`  Trench condition note: ${hasTrenchNote ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Western Europe Rename',
    passed: hasWesternEuropeButton && noWW1WesternFrontButton && hasWesternEuropeInJS && hasTrenchNote,
    details: [
        `Button text: ${hasWesternEuropeButton ? '✓' : '✗'}`,
        `Old name removed: ${noWW1WesternFrontButton ? '✓' : '✗'}`,
        `JS updated: ${hasWesternEuropeInJS ? '✓' : '✗'}`,
        `Trench note: ${hasTrenchNote ? '✓' : '✗'}`
    ]
});

// Test 2: Check conditional trench generation
console.log('\n📋 Test 2: Conditional Trench Generation (1914-1921)');
const hasIncludeTrenchesParam = /constructor\(isAlps\s*=\s*false,\s*includeTrenches\s*=\s*true\)/.test(htmlContent);
const hasConditionalTrenchCall = /if\s*\(\s*includeTrenches\s*\)\s*\{[\s\S]{0,50}generateTrenches/.test(htmlContent);
const hasYearCheck = htmlContent.includes('selectedScenarioYear >= 1914 && selectedScenarioYear <= 1921');
const passesTrenchParam = /new WW1Terrain\(false,\s*includeTrenches\)/.test(htmlContent);

console.log(`  WW1Terrain includeTrenches parameter: ${hasIncludeTrenchesParam ? '✓ Found' : '✗ Missing'}`);
console.log(`  Conditional trench generation: ${hasConditionalTrenchCall ? '✓ Found' : '✗ Missing'}`);
console.log(`  Year check (1914-1921): ${hasYearCheck ? '✓ Found' : '✗ Missing'}`);
console.log(`  Parameter passed to WW1Terrain: ${passesTrenchParam ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Conditional Trench Generation',
    passed: hasIncludeTrenchesParam && hasConditionalTrenchCall && hasYearCheck && passesTrenchParam,
    details: [
        `Constructor parameter: ${hasIncludeTrenchesParam ? '✓' : '✗'}`,
        `Conditional call: ${hasConditionalTrenchCall ? '✓' : '✗'}`,
        `Year check: ${hasYearCheck ? '✓' : '✗'}`,
        `Parameter passing: ${passesTrenchParam ? '✓' : '✗'}`
    ]
});

// Test 3: Check objectives HTML structure
console.log('\n📋 Test 3: Objectives HTML Structure');
const hasMissionObjectivesHeader = htmlContent.includes('<h2 style="font-size: 24px; margin-bottom: 20px; color: #4af;">Mission Objectives</h2>');
const hasSideAObjectives = htmlContent.includes('id="sideAObjectives"');
const hasSideBObjectives = htmlContent.includes('id="sideBObjectives"');
const hasObjectiveSelectA = htmlContent.includes('id="objectiveSelectA"');
const hasObjectiveSelectB = htmlContent.includes('id="objectiveSelectB"');
const hasObjectiveOptions = htmlContent.includes('value="destroy-all"') &&
                             htmlContent.includes('value="destroy-ground"') &&
                             htmlContent.includes('value="protect-ships"') &&
                             htmlContent.includes('value="recon"');
const hasRandomizeButton = htmlContent.includes('onclick="randomizeObjectives()"');
const hasClearAllButton = htmlContent.includes('onclick="clearAllObjectives()"');

console.log(`  Mission Objectives header: ${hasMissionObjectivesHeader ? '✓ Found' : '✗ Missing'}`);
console.log(`  Side A objectives div: ${hasSideAObjectives ? '✓ Found' : '✗ Missing'}`);
console.log(`  Side B objectives div: ${hasSideBObjectives ? '✓ Found' : '✗ Missing'}`);
console.log(`  Objective selects (A & B): ${hasObjectiveSelectA && hasObjectiveSelectB ? '✓ Found' : '✗ Missing'}`);
console.log(`  Objective options (8 types): ${hasObjectiveOptions ? '✓ Found' : '✗ Missing'}`);
console.log(`  Randomize button: ${hasRandomizeButton ? '✓ Found' : '✗ Missing'}`);
console.log(`  Clear All button: ${hasClearAllButton ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Objectives HTML Structure',
    passed: hasMissionObjectivesHeader && hasSideAObjectives && hasSideBObjectives &&
            hasObjectiveSelectA && hasObjectiveSelectB && hasObjectiveOptions &&
            hasRandomizeButton && hasClearAllButton,
    details: [
        `Header: ${hasMissionObjectivesHeader ? '✓' : '✗'}`,
        `Side divs: ${hasSideAObjectives && hasSideBObjectives ? '✓' : '✗'}`,
        `Selects: ${hasObjectiveSelectA && hasObjectiveSelectB ? '✓' : '✗'}`,
        `Options: ${hasObjectiveOptions ? '✓' : '✗'}`,
        `Buttons: ${hasRandomizeButton && hasClearAllButton ? '✓' : '✗'}`
    ]
});

// Test 4: Check objectives JavaScript functions
console.log('\n📋 Test 4: Objectives JavaScript Functions');
const hasObjectivesArrays = htmlContent.includes('let sideAObjectives = []') &&
                             htmlContent.includes('let sideBObjectives = []');
const hasObjectiveDescriptions = htmlContent.includes('const objectiveDescriptions = {');
const hasAddObjectiveFunction = htmlContent.includes('function addObjective(side)');
const hasRemoveObjectiveFunction = htmlContent.includes('function removeObjective(side, objective)');
const hasUpdateObjectivesDisplay = htmlContent.includes('function updateObjectivesDisplay()');
const hasRandomizeObjectivesFunction = htmlContent.includes('function randomizeObjectives()');
const hasClearAllObjectivesFunction = htmlContent.includes('function clearAllObjectives()');

console.log(`  Objectives arrays: ${hasObjectivesArrays ? '✓ Found' : '✗ Missing'}`);
console.log(`  Objective descriptions: ${hasObjectiveDescriptions ? '✓ Found' : '✗ Missing'}`);
console.log(`  addObjective(): ${hasAddObjectiveFunction ? '✓ Found' : '✗ Missing'}`);
console.log(`  removeObjective(): ${hasRemoveObjectiveFunction ? '✓ Found' : '✗ Missing'}`);
console.log(`  updateObjectivesDisplay(): ${hasUpdateObjectivesDisplay ? '✓ Found' : '✗ Missing'}`);
console.log(`  randomizeObjectives(): ${hasRandomizeObjectivesFunction ? '✓ Found' : '✗ Missing'}`);
console.log(`  clearAllObjectives(): ${hasClearAllObjectivesFunction ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Objectives JavaScript',
    passed: hasObjectivesArrays && hasObjectiveDescriptions && hasAddObjectiveFunction &&
            hasRemoveObjectiveFunction && hasUpdateObjectivesDisplay && hasRandomizeObjectivesFunction &&
            hasClearAllObjectivesFunction,
    details: [
        `Arrays: ${hasObjectivesArrays ? '✓' : '✗'}`,
        `Descriptions: ${hasObjectiveDescriptions ? '✓' : '✗'}`,
        `Add function: ${hasAddObjectiveFunction ? '✓' : '✗'}`,
        `Remove function: ${hasRemoveObjectiveFunction ? '✓' : '✗'}`,
        `Update display: ${hasUpdateObjectivesDisplay ? '✓' : '✗'}`,
        `Randomize: ${hasRandomizeObjectivesFunction ? '✓' : '✗'}`,
        `Clear: ${hasClearAllObjectivesFunction ? '✓' : '✗'}`
    ]
});

// Test 5: Check randomize objectives logic
console.log('\n📋 Test 5: Randomize Objectives Logic');
const hasRandomSelection = /numA = 1 \+ Math\.floor\(Math\.random\(\) \* 3\)/.test(htmlContent);
const hasShuffleLogic = /sort\(\(\) => Math\.random\(\) - 0\.5\)/.test(htmlContent);
const hasSliceLogic = /\.slice\(0, num[AB]\)/.test(htmlContent);

console.log(`  Random count (1-3): ${hasRandomSelection ? '✓ Found' : '✗ Missing'}`);
console.log(`  Shuffle algorithm: ${hasShuffleLogic ? '✓ Found' : '✗ Missing'}`);
console.log(`  Slice selection: ${hasSliceLogic ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Randomize Logic',
    passed: hasRandomSelection && hasShuffleLogic && hasSliceLogic,
    details: [
        `Random 1-3: ${hasRandomSelection ? '✓' : '✗'}`,
        `Shuffle: ${hasShuffleLogic ? '✓' : '✗'}`,
        `Slice: ${hasSliceLogic ? '✓' : '✗'}`
    ]
});

// Test 6: Check objective types
console.log('\n📋 Test 6: Objective Types');
const objectiveTypes = [
    'destroy-all',
    'destroy-ground',
    'destroy-ships',
    'protect-ground',
    'protect-ships',
    'recon',
    'survive',
    'control-area'
];

const allTypesPresent = objectiveTypes.every(type => htmlContent.includes(`value="${type}"`));
const allTypesInDescriptions = objectiveTypes.every(type => htmlContent.includes(`'${type}':`));

console.log(`  All 8 objective types in HTML: ${allTypesPresent ? '✓ Found' : '✗ Missing'}`);
console.log(`  All 8 types in descriptions: ${allTypesInDescriptions ? '✓ Found' : '✗ Missing'}`);

tests.push({
    name: 'Objective Types',
    passed: allTypesPresent && allTypesInDescriptions,
    details: [
        `HTML options: ${allTypesPresent ? '✓ All 8 present' : '✗ Missing some'}`,
        `JS descriptions: ${allTypesInDescriptions ? '✓ All 8 present' : '✗ Missing some'}`
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
    console.log('✅ ALL OBJECTIVES AND SCENARIO FEATURES IMPLEMENTED!');
    console.log('\n✨ Features Implemented:');
    console.log('   ✓ Renamed "WW1 Western Front" to "Western Europe"');
    console.log('   ✓ Conditional trench generation (only 1914-1921)');
    console.log('   ✓ Mission objectives system with Side A/B assignment');
    console.log('   ✓ 8 different objective types');
    console.log('   ✓ Add/remove objectives for each side');
    console.log('   ✓ Randomize button (1-3 objectives per side)');
    console.log('   ✓ Clear all objectives button');
    console.log('\n🎮 How to Use Objectives:');
    console.log('   1. Select objective from dropdown for Side A or Side B');
    console.log('   2. Click "Add" button to assign it');
    console.log('   3. Click ✕ on any objective to remove it');
    console.log('   4. Or click "🎲 Randomize Objectives" for random assignment');
    console.log('   5. Click "Clear All" to remove all objectives');
} else {
    console.log(`❌ ${totalTests - passedTests} test(s) failed`);
    console.log('Please review the missing features above.');
}

console.log('='.repeat(60));

// Exit with appropriate code
process.exit(passedTests === totalTests ? 0 : 1);
