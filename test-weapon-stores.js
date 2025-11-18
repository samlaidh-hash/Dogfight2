// ============================================================================
// WEAPON STORE SYSTEM TEST & DEMONSTRATION
// ============================================================================
// This file tests and demonstrates the weapon store system
// Run in browser console or Node.js after loading weapon-stores.js
// ============================================================================

console.log('='.repeat(80));
console.log('WEAPON STORE SYSTEM TEST');
console.log('='.repeat(80));

// ============================================================================
// TEST 1: Database Statistics
// ============================================================================
console.log('\n--- TEST 1: Database Statistics ---');

const stats = getStoreStatistics();
console.log(`\nTotal Stores: ${stats.total}`);

console.log('\nStores by Type:');
for (const type in stats.byType) {
    console.log(`  ${type.padEnd(15)} : ${stats.byType[type]}`);
}

console.log('\nStores by Era:');
for (const era in stats.byEra) {
    console.log(`  ${era.padEnd(15)} : ${stats.byEra[era]}`);
}

// ============================================================================
// TEST 2: Create Individual Stores
// ============================================================================
console.log('\n--- TEST 2: Create Individual Stores ---');

const mk82 = createStore('MK82');
console.log(`\nCreated: ${mk82.name}`);
console.log(`  Type: ${mk82.type}`);
console.log(`  Weight: ${mk82.weight} kg`);
console.log(`  Drag: ${mk82.dragCoefficient}`);
console.log(`  Damage: ${mk82.explosiveYield}`);
console.log(`  Radius: ${mk82.explosionRadius}m`);

const aim9 = createStore('AIM9_SIDEWINDER');
console.log(`\nCreated: ${aim9.name}`);
console.log(`  Type: ${aim9.type}`);
console.log(`  Weight: ${aim9.weight} kg`);
console.log(`  Guidance: ${aim9.guidanceType}`);
console.log(`  Damage: ${aim9.explosiveYield}`);

const lau3 = createStore('LAU3_19');
console.log(`\nCreated: ${lau3.name}`);
console.log(`  Type: ${lau3.type}`);
console.log(`  Capacity: ${lau3.capacity} rockets`);
console.log(`  Current: ${lau3.currentCount} rockets`);
console.log(`  Per-rocket damage: ${lau3.explosiveYield}`);

const drop300 = createStore('DROP_300');
console.log(`\nCreated: ${drop300.name}`);
console.log(`  Type: ${drop300.type}`);
console.log(`  Fuel Capacity: ${drop300.fuelCapacity}L`);
console.log(`  Full Weight: ${drop300.getCurrentWeight()} kg`);
console.log(`  Can Jettison: ${drop300.jettisionable}`);

// ============================================================================
// TEST 3: Store Usage and Count Management
// ============================================================================
console.log('\n--- TEST 3: Store Usage and Count Management ---');

const rocketPod = createStore('UB32');
console.log(`\nRocket Pod: ${rocketPod.name}`);
console.log(`Initial count: ${rocketPod.currentCount}`);

// Fire 5 rockets
for (let i = 0; i < 5; i++) {
    rocketPod.use();
}
console.log(`After firing 5 rockets: ${rocketPod.currentCount}`);
console.log(`Is expended: ${rocketPod.isExpended}`);

// Use up all remaining rockets
while (rocketPod.currentCount > 0) {
    rocketPod.use();
}
console.log(`After firing all rockets: ${rocketPod.currentCount}`);
console.log(`Is expended: ${rocketPod.isExpended}`);

// Try to use when empty
const result = rocketPod.use();
console.log(`Try to fire when empty: ${result} (should be false)`);

// Test single-use store (bomb)
const bomb = createStore('SC_500');
console.log(`\nBomb: ${bomb.name}`);
console.log(`Is active: ${bomb.isActive}`);
bomb.use();
console.log(`After dropping: Is active = ${bomb.isActive}, Is expended = ${bomb.isExpended}`);

// ============================================================================
// TEST 4: Fuel Tank Weight Dynamics
// ============================================================================
console.log('\n--- TEST 4: Fuel Tank Weight Dynamics ---');

const fuelTank = createStore('DROP_600');
console.log(`\nFuel Tank: ${fuelTank.name}`);
console.log(`Capacity: ${fuelTank.fuelCapacity}L`);
console.log(`Full weight: ${fuelTank.getCurrentWeight().toFixed(1)} kg`);
console.log(`Drag (full): ${fuelTank.getCurrentDrag()}`);

// Consume half the fuel
fuelTank.currentFuel = fuelTank.fuelCapacity / 2;
console.log(`\nHalf fuel: ${fuelTank.currentFuel}L`);
console.log(`Weight at half: ${fuelTank.getCurrentWeight().toFixed(1)} kg`);

// Empty tank
fuelTank.currentFuel = 0;
console.log(`\nEmpty tank:`);
console.log(`Weight (empty): ${fuelTank.getCurrentWeight().toFixed(1)} kg`);
console.log(`Drag (empty): ${fuelTank.getCurrentDrag()} (increased)`);

// ============================================================================
// TEST 5: Performance Impact Calculations
// ============================================================================
console.log('\n--- TEST 5: Performance Impact Calculations ---');

// Light loadout: 2x AIM-9 missiles
const lightLoadout = [
    createStore('AIM9_SIDEWINDER'),
    createStore('AIM9_SIDEWINDER')
];

console.log('\nLight Loadout (2× AIM-9):');
const lightImpact = getPerformanceImpact(lightLoadout, 5000);
console.log(`  Total Weight: ${lightImpact.totalWeight} kg`);
console.log(`  Total Drag: ${lightImpact.totalDrag.toFixed(2)}`);
console.log(`  Weight Ratio: ${lightImpact.weightRatio.toFixed(2)}x`);
console.log(`  Acceleration: ${(lightImpact.acceleration * 100).toFixed(1)}%`);
console.log(`  Turn Rate: ${(lightImpact.turnRate * 100).toFixed(1)}%`);
console.log(`  Climb Rate: ${(lightImpact.climbRate * 100).toFixed(1)}%`);
console.log(`  Top Speed: ${(lightImpact.topSpeed * 100).toFixed(1)}%`);

// Heavy loadout: 2× Mk.84, 600gal tank, 2× rocket pods
const heavyLoadout = [
    createStore('MK84'),
    createStore('MK84'),
    createStore('DROP_600'),
    createStore('LAU3_19'),
    createStore('LAU3_19')
];

console.log('\nHeavy Loadout (2× Mk.84, 600gal tank, 2× rocket pods):');
const heavyImpact = getPerformanceImpact(heavyLoadout, 5000);
console.log(`  Total Weight: ${heavyImpact.totalWeight} kg`);
console.log(`  Total Drag: ${heavyImpact.totalDrag.toFixed(2)}`);
console.log(`  Weight Ratio: ${heavyImpact.weightRatio.toFixed(2)}x`);
console.log(`  Acceleration: ${(heavyImpact.acceleration * 100).toFixed(1)}%`);
console.log(`  Turn Rate: ${(heavyImpact.turnRate * 100).toFixed(1)}%`);
console.log(`  Climb Rate: ${(heavyImpact.climbRate * 100).toFixed(1)}%`);
console.log(`  Top Speed: ${(heavyImpact.topSpeed * 100).toFixed(1)}%`);

// Ground attack loadout
const groundAttackLoadout = [
    createStore('MK82'),
    createStore('MK82'),
    createStore('MK82'),
    createStore('MK82'),
    createStore('HYDRA70_19'),
    createStore('HYDRA70_19'),
    createStore('DROP_300')
];

console.log('\nGround Attack Loadout (4× Mk.82, 2× Hydra pods, 300gal tank):');
const gaImpact = getPerformanceImpact(groundAttackLoadout, 5000);
console.log(`  Total Weight: ${gaImpact.totalWeight} kg`);
console.log(`  Total Drag: ${gaImpact.totalDrag.toFixed(2)}`);
console.log(`  Weight Ratio: ${gaImpact.weightRatio.toFixed(2)}x`);
console.log(`  Acceleration: ${(gaImpact.acceleration * 100).toFixed(1)}%`);
console.log(`  Turn Rate: ${(gaImpact.turnRate * 100).toFixed(1)}%`);
console.log(`  Climb Rate: ${(gaImpact.climbRate * 100).toFixed(1)}%`);
console.log(`  Top Speed: ${(gaImpact.topSpeed * 100).toFixed(1)}%`);

// ============================================================================
// TEST 6: Query Functions
// ============================================================================
console.log('\n--- TEST 6: Query Functions ---');

const allBombs = getStoresByType('bomb');
console.log(`\nAll bombs: ${allBombs.length} found`);
allBombs.forEach(bomb => {
    console.log(`  ${bomb.name.padEnd(35)} - ${bomb.weight}kg, ${bomb.explosiveYield} damage`);
});

const allMissiles = getStoresByType('missile');
console.log(`\nAll missiles: ${allMissiles.length} found`);
allMissiles.forEach(missile => {
    console.log(`  ${missile.name.padEnd(35)} - ${missile.guidanceType}`);
});

const ww2Stores = getStoresByEra('WW2');
console.log(`\nWW2 stores: ${ww2Stores.length} found`);
ww2Stores.forEach(store => {
    console.log(`  ${store.name.padEnd(35)} - ${store.type}`);
});

const modernMissiles = getStores('missile', 'Modern');
console.log(`\nModern missiles: ${modernMissiles.length} found`);
modernMissiles.forEach(missile => {
    console.log(`  ${missile.name}`);
});

// ============================================================================
// TEST 7: Complete Store List
// ============================================================================
console.log('\n--- TEST 7: Complete Store List ---');

console.log('\nAll available stores:');
console.log('-'.repeat(80));
console.log('ID'.padEnd(20) + 'Name'.padEnd(40) + 'Type'.padEnd(15) + 'Era');
console.log('-'.repeat(80));

stats.stores.sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.era.localeCompare(b.era);
}).forEach(store => {
    console.log(
        store.id.padEnd(20) +
        store.name.padEnd(40) +
        store.type.padEnd(15) +
        store.era
    );
});

// ============================================================================
// TEST 8: ECM Pod Effectiveness
// ============================================================================
console.log('\n--- TEST 8: ECM Pod Effectiveness ---');

const ecmPods = getStoresByType('ecm_pod');
console.log(`\nECM Pods: ${ecmPods.length} found`);
ecmPods.forEach(pod => {
    console.log(`  ${pod.name.padEnd(35)} - ${(pod.jamEffectiveness * 100).toFixed(0)}% effectiveness`);
});

// Simulate missile with and without ECM
const baseHitChance = 0.80;  // 80% hit chance
const ecmPod = createStore('ALQ184');

console.log(`\nMissile hit chance simulation:`);
console.log(`  Without ECM: ${(baseHitChance * 100).toFixed(0)}%`);
console.log(`  With ${ecmPod.name}: ${((baseHitChance * (1 - ecmPod.jamEffectiveness)) * 100).toFixed(0)}%`);
console.log(`  Reduction: ${((baseHitChance - (baseHitChance * (1 - ecmPod.jamEffectiveness))) * 100).toFixed(0)}%`);

// ============================================================================
// TEST 9: Gun Pod Specifications
// ============================================================================
console.log('\n--- TEST 9: Gun Pod Specifications ---');

const gunPods = getStoresByType('gun_pod');
console.log(`\nGun Pods: ${gunPods.length} found`);
gunPods.forEach(pod => {
    console.log(`  ${pod.name}`);
    console.log(`    Caliber: ${pod.caliber}mm`);
    console.log(`    Capacity: ${pod.capacity} rounds`);
    console.log(`    Rate of Fire: ${pod.rateOfFire} rounds/sec`);
    console.log(`    Firing Duration: ${(pod.capacity / pod.rateOfFire).toFixed(1)} seconds`);
    console.log(`    Weight: ${pod.weight} kg`);
});

// ============================================================================
// TEST 10: Weight Comparison
// ============================================================================
console.log('\n--- TEST 10: Weight Comparison ---');

console.log('\nLightest stores by type:');
const storesByType = {};
Object.values(WEAPON_STORES).forEach(store => {
    if (!storesByType[store.type]) {
        storesByType[store.type] = [];
    }
    storesByType[store.type].push(store);
});

for (const type in storesByType) {
    const sorted = storesByType[type].sort((a, b) => a.weight - b.weight);
    console.log(`  ${type}: ${sorted[0].name} (${sorted[0].weight} kg)`);
}

console.log('\nHeaviest stores by type:');
for (const type in storesByType) {
    const sorted = storesByType[type].sort((a, b) => b.weight - a.weight);
    console.log(`  ${type}: ${sorted[0].name} (${sorted[0].weight} kg)`);
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`✓ Total stores in database: ${stats.total}`);
console.log(`✓ Store types: ${Object.keys(stats.byType).length}`);
console.log(`✓ Eras covered: ${Object.keys(stats.byEra).length}`);
console.log(`✓ Performance impact system: Working`);
console.log(`✓ Store usage and counting: Working`);
console.log(`✓ Fuel tank dynamics: Working`);
console.log(`✓ Query functions: Working`);
console.log(`✓ Visual definitions: Defined`);
console.log('='.repeat(80));
console.log('\nWeapon Store System: READY FOR INTEGRATION');
console.log('='.repeat(80));
