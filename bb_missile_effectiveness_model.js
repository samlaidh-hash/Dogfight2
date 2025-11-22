/**
 * BB vs BB Missile Effectiveness Model
 *
 * Scenario: One BB fires all 100 missiles at another BB
 * Defender: Point Defense turrets + Flicker Shields (normal power)
 *
 * Based on Renegade Legion combat system from dogfight.html
 */

// ==================== ATTACKER CONFIGURATION ====================
const ATTACKER = {
    missiles: {
        total: 100,              // 2 arrays × 50 cells (line 5737, 5868)
        damage: 200,             // Damage per missile (line 5890)
        speed: 500,              // m/s (line 5889)
        range: 50000,            // 50km (line 5888)
        launchInterval: 2.0,     // seconds between launches (line 5887)
        flightTime: 100,         // 50km / 500 m/s = 100 seconds
    }
};

// ==================== DEFENDER CONFIGURATION ====================
const DEFENDER = {
    pointDefense: {
        turrets: 20,             // BB has 20 PD turrets (line 5738)
        rateOfFire: 10,          // rounds per second (0.1s interval, line 5903)
        accuracy: 0.85,          // 85% hit chance (line 5904)
        damagePerHit: 100,       // line 5905
        range: 5000,             // 5km (line 5901)
        engagementTime: 10,      // 5km / 500 m/s = 10 seconds per missile
    },
    shields: {
        faces: 6,                // BB has 6 shield faces (line 5997)
        maxHpPerFace: 100,       // percentage (line 6002)
        currentHpPerFace: 100,   // starts at full (line 6001)
        damageReduction: 10,     // shields divide damage by 10 (line 9656)
        missilesPenetration: 0,  // Missiles do 0% damage through shields (line 9688)
        rechargeRate: 0.25,      // % per second (line 6009)
        rechargeDelay: 4.0,      // seconds after hit (line 6009)
    },
    armor: {
        blocks: 32,              // Total armor blocks (line 5347)
        hpPerBlock: 7500,        // 240,000 total / 32 blocks (line 5355)
        totalHp: 240000,         // 30% of 800,000 HP
    },
    systems: {
        totalHp: 800000,         // BB total HP (line 5355)
        reactor: 120000,         // 15% (line 9752)
        weapons: 160000,         // 20% (line 9755)
        flight: 120000,          // 15% (line 9762)
        c3: 64000,               // 8% (line 9768)
        crew: 64000,             // 8% (line 9774)
        marines: 32000,          // 4% (line 9779)
        excessDamagePool: 40000, // 5% - ship dies if this reaches 0 (line 5987)
    }
};

// ==================== SIMULATION STATE ====================
let simulationState = {
    missilesLaunched: 0,
    missilesInFlight: [],        // Track missiles in flight {launchTime, status}
    missilesDestroyed: 0,
    missilesHitShields: 0,
    missilesHitArmor: 0,
    totalDamageToShields: 0,
    totalDamageToArmor: 0,
    totalDamageThroughArmor: 0,
    shieldFaces: Array(6).fill(100), // 6 faces at 100% each
    armorBlocks: Array(32).fill(7500), // 32 blocks at 7500 HP each
    shieldRechargeTimers: Array(6).fill(0),
    currentTime: 0,
    pdEngagementRange: 5000,     // 5km PD range
    missileSpeed: 500,           // 500 m/s
};

// ==================== SIMULATION FUNCTIONS ====================

/**
 * Calculate PD interception for a single missile
 * @param {number} engagementTime - How long missile is in PD range (seconds)
 * @param {number} threatsInRange - How many missiles are in PD range simultaneously
 * @returns {boolean} - True if missile was destroyed
 */
function pdInterception(engagementTime, threatsInRange) {
    const totalTurrets = DEFENDER.pointDefense.turrets;
    const rateOfFire = DEFENDER.pointDefense.rateOfFire;
    const accuracy = DEFENDER.pointDefense.accuracy;

    // Total effective rounds from all turrets
    const totalRoundsPerSecond = totalTurrets * rateOfFire * accuracy;

    // PD divides fire among all threats in range
    const roundsPerThreat = totalRoundsPerSecond / Math.max(1, threatsInRange);

    // Total rounds allocated to this missile during engagement
    const allocatedRounds = roundsPerThreat * engagementTime;

    // Probability of kill increases with allocated rounds
    // Each hit has 100 damage, missile destroyed at 1 hit
    // Model as: P(kill) = 1 - e^(-allocatedRounds)
    const destroyProbability = 1.0 - Math.exp(-allocatedRounds);

    return Math.random() < destroyProbability;
}

/**
 * Calculate shield damage from missile hit
 * @param {number} damage - Raw missile damage
 * @param {number} faceIndex - Which shield face (0-5)
 * @returns {number} - Damage that penetrates to armor
 */
function applyShieldDamage(damage, faceIndex) {
    const face = simulationState.shieldFaces[faceIndex];

    // Missiles do 0% penetration through active shields (line 9688)
    if (face > 0) {
        // Damage to shield = raw damage / 10 (line 9656)
        const shieldDamage = damage / DEFENDER.shields.damageReduction;
        simulationState.shieldFaces[faceIndex] -= shieldDamage;
        simulationState.totalDamageToShields += shieldDamage;

        // Reset recharge timer for this face
        simulationState.shieldRechargeTimers[faceIndex] = DEFENDER.shields.rechargeDelay;

        if (simulationState.shieldFaces[faceIndex] > 0) {
            // Shield held - no penetration
            return 0;
        } else {
            // Shield collapsed - excess damage penetrates
            const excessDamage = Math.abs(simulationState.shieldFaces[faceIndex]) *
                                DEFENDER.shields.damageReduction;
            simulationState.shieldFaces[faceIndex] = 0; // Face is down
            return excessDamage;
        }
    } else {
        // Shield face already down - all damage penetrates
        return damage;
    }
}

/**
 * Apply damage to random armor block
 * @param {number} damage - Damage that penetrated shields
 * @returns {number} - Damage that penetrates through destroyed armor
 */
function applyArmorDamage(damage) {
    // Select random armor block (line 9703)
    const blockIndex = Math.floor(Math.random() * 32);
    const blockHp = simulationState.armorBlocks[blockIndex];

    simulationState.armorBlocks[blockIndex] -= damage;
    simulationState.totalDamageToArmor += damage;

    if (simulationState.armorBlocks[blockIndex] <= 0) {
        // Armor block destroyed - excess damage penetrates
        const excessDamage = Math.abs(simulationState.armorBlocks[blockIndex]);
        simulationState.armorBlocks[blockIndex] = 0;
        simulationState.totalDamageThroughArmor += excessDamage;
        return excessDamage;
    }

    return 0;
}

/**
 * Update shield recharge for all faces
 * @param {number} deltaTime - Time elapsed (seconds)
 */
function updateShieldRecharge(deltaTime) {
    for (let i = 0; i < 6; i++) {
        // Decrement recharge timer
        if (simulationState.shieldRechargeTimers[i] > 0) {
            simulationState.shieldRechargeTimers[i] -= deltaTime;
        }

        // Recharge if timer expired and not at max
        if (simulationState.shieldRechargeTimers[i] <= 0 &&
            simulationState.shieldFaces[i] < 100) {
            const recharge = DEFENDER.shields.rechargeRate * deltaTime;
            simulationState.shieldFaces[i] = Math.min(100,
                                              simulationState.shieldFaces[i] + recharge);
        }
    }
}

/**
 * Process a single missile impact
 */
function processMissileImpact() {
    const damage = ATTACKER.missiles.damage;

    // Randomly select shield face (line 9653)
    const faceIndex = Math.floor(Math.random() * 6);

    // Apply to shield first
    let penetratingDamage = applyShieldDamage(damage, faceIndex);

    if (penetratingDamage > 0) {
        // Shield collapsed or down - hit armor
        simulationState.missilesHitArmor++;
        const armorPenetration = applyArmorDamage(penetratingDamage);

        // In full simulation, armor penetration would damage internal systems
        // For this model, we track it separately
    } else {
        // Shield absorbed all damage
        simulationState.missilesHitShields++;
    }
}

// ==================== MAIN SIMULATION ====================

/**
 * Count missiles in PD range at a given time
 * @param {number} currentTime - Current simulation time
 * @returns {number} - Count of missiles in PD range
 */
function getMissilesInPDRange(currentTime) {
    const pdRange = DEFENDER.pointDefense.range;
    const missileSpeed = ATTACKER.missiles.speed;
    const flightTime = ATTACKER.missiles.flightTime;
    const range = ATTACKER.missiles.range;

    return simulationState.missilesInFlight.filter(missile => {
        if (missile.status !== 'inflight') return false;

        const timeInFlight = currentTime - missile.launchTime;

        // Skip if missile hasn't been launched yet
        if (timeInFlight < 0) return false;

        // Skip if missile already hit
        if (timeInFlight > flightTime) return false;

        // Calculate distance from target
        const distanceTraveled = timeInFlight * missileSpeed;
        const distanceFromTarget = range - distanceTraveled;

        // In PD range if within 5km but not yet at target
        return distanceFromTarget > 0 && distanceFromTarget <= pdRange;
    }).length;
}

/**
 * Run complete simulation of BB missile barrage
 */
function runSimulation() {
    console.log("=".repeat(70));
    console.log("BB vs BB MISSILE EFFECTIVENESS SIMULATION");
    console.log("=".repeat(70));
    console.log("");

    const totalMissiles = ATTACKER.missiles.total;
    const launchInterval = ATTACKER.missiles.launchInterval;
    const flightTime = ATTACKER.missiles.flightTime;
    const pdEngagementTime = DEFENDER.pointDefense.engagementTime;

    // Track max missiles in PD range simultaneously
    let maxSimultaneousMissiles = 0;

    // Launch missiles over time
    for (let i = 0; i < totalMissiles; i++) {
        const launchTime = i * launchInterval;
        const impactTime = launchTime + flightTime;
        const pdEntryTime = impactTime - pdEngagementTime; // 10 seconds before impact

        // Add missile to tracking
        const missile = {
            id: i,
            launchTime: launchTime,
            impactTime: impactTime,
            pdEntryTime: pdEntryTime,
            status: 'inflight'
        };
        simulationState.missilesInFlight.push(missile);

        // Advance simulation time to PD entry
        while (simulationState.currentTime < pdEntryTime) {
            const deltaTime = Math.min(0.1, pdEntryTime - simulationState.currentTime);
            updateShieldRecharge(deltaTime);
            simulationState.currentTime += deltaTime;
        }

        simulationState.missilesLaunched++;

        // Count threats in PD range when this missile enters
        const threatsInRange = getMissilesInPDRange(pdEntryTime);
        maxSimultaneousMissiles = Math.max(maxSimultaneousMissiles, threatsInRange);

        // PD interception check during engagement window
        const destroyed = pdInterception(pdEngagementTime, threatsInRange);

        if (destroyed) {
            simulationState.missilesDestroyed++;
            missile.status = 'destroyed';
        } else {
            // Missile survived PD - advance to impact
            while (simulationState.currentTime < impactTime) {
                const deltaTime = Math.min(0.1, impactTime - simulationState.currentTime);
                updateShieldRecharge(deltaTime);
                simulationState.currentTime += deltaTime;
            }

            // Missile hit target
            missile.status = 'hit';
            processMissileImpact();
        }
    }

    // Store for reporting
    simulationState.maxSimultaneousMissiles = maxSimultaneousMissiles;

    // ==================== RESULTS ====================

    console.log("PHASE 1: MISSILE LAUNCH");
    console.log("-".repeat(70));
    console.log(`Total Missiles Launched: ${simulationState.missilesLaunched}`);
    console.log(`Launch Duration: ${totalMissiles * launchInterval} seconds`);
    console.log(`Missile Flight Time: ${flightTime} seconds`);
    console.log("");

    console.log("PHASE 2: POINT DEFENSE ENGAGEMENT");
    console.log("-".repeat(70));
    console.log(`PD Configuration: ${DEFENDER.pointDefense.turrets} turrets, ${DEFENDER.pointDefense.rateOfFire} rounds/sec each`);
    console.log(`Total PD Output: ${DEFENDER.pointDefense.turrets * DEFENDER.pointDefense.rateOfFire} rounds/second`);
    console.log(`PD Accuracy: ${(DEFENDER.pointDefense.accuracy * 100).toFixed(0)}%`);
    console.log(`Effective Hits/Second: ${(DEFENDER.pointDefense.turrets * DEFENDER.pointDefense.rateOfFire * DEFENDER.pointDefense.accuracy).toFixed(0)}`);
    console.log(`Max Simultaneous Missiles in PD Range: ${simulationState.maxSimultaneousMissiles}`);
    console.log("");
    console.log(`Missiles Destroyed by PD: ${simulationState.missilesDestroyed} (${(simulationState.missilesDestroyed / totalMissiles * 100).toFixed(1)}%)`);
    console.log(`Missiles Penetrating PD: ${simulationState.missilesLaunched - simulationState.missilesDestroyed}`);
    console.log("");

    console.log("PHASE 3: SHIELD IMPACT");
    console.log("-".repeat(70));
    console.log(`Missiles Absorbed by Shields: ${simulationState.missilesHitShields}`);
    console.log(`Missiles Penetrating Shields: ${simulationState.missilesHitArmor}`);
    console.log(`Total Shield Damage: ${simulationState.totalDamageToShields.toFixed(1)}% (across all faces)`);
    console.log("");
    console.log("Shield Face Status:");
    simulationState.shieldFaces.forEach((hp, i) => {
        const status = hp > 0 ? "ACTIVE" : "COLLAPSED";
        console.log(`  Face ${i + 1}: ${hp.toFixed(1)}% [${status}]`);
    });
    console.log("");

    console.log("PHASE 4: ARMOR IMPACT");
    console.log("-".repeat(70));
    console.log(`Total Armor Damage: ${simulationState.totalDamageToArmor.toFixed(0)} HP`);
    console.log(`Armor Integrity: ${((DEFENDER.armor.totalHp - simulationState.totalDamageToArmor) / DEFENDER.armor.totalHp * 100).toFixed(1)}%`);

    const blocksDestroyed = simulationState.armorBlocks.filter(hp => hp <= 0).length;
    const blocksDamaged = simulationState.armorBlocks.filter(hp => hp > 0 && hp < 7500).length;
    const blocksIntact = simulationState.armorBlocks.filter(hp => hp === 7500).length;

    console.log(`Armor Blocks Destroyed: ${blocksDestroyed} / 32`);
    console.log(`Armor Blocks Damaged: ${blocksDamaged} / 32`);
    console.log(`Armor Blocks Intact: ${blocksIntact} / 32`);
    console.log(`Damage Penetrating Armor: ${simulationState.totalDamageThroughArmor.toFixed(0)} HP`);
    console.log("");

    console.log("PHASE 5: INTERNAL SYSTEMS");
    console.log("-".repeat(70));
    if (simulationState.totalDamageThroughArmor > 0) {
        console.log(`Damage to Internal Systems: ${simulationState.totalDamageThroughArmor.toFixed(0)} HP`);
        console.log(`Critical Systems at Risk: ${simulationState.totalDamageThroughArmor > 50000 ? "YES" : "NO"}`);
    } else {
        console.log("No penetration to internal systems - all damage absorbed by shields/armor");
    }
    console.log("");

    console.log("=".repeat(70));
    console.log("FINAL ASSESSMENT");
    console.log("=".repeat(70));

    const totalDamage = simulationState.totalDamageToArmor +
                       (simulationState.totalDamageToShields * DEFENDER.shields.damageReduction);
    const percentageOfShipHp = (totalDamage / DEFENDER.systems.totalHp * 100).toFixed(2);

    console.log(`Total Effective Damage: ${totalDamage.toFixed(0)} HP (${percentageOfShipHp}% of ship HP)`);
    console.log(`Defender Ship Status: ${blocksDestroyed > 16 ? "HEAVILY DAMAGED" : blocksDestroyed > 5 ? "DAMAGED" : "OPERATIONAL"}`);
    console.log("");

    // Kill probability estimation
    const excessDamagePoolRemaining = DEFENDER.systems.excessDamagePool - simulationState.totalDamageThroughArmor;
    if (excessDamagePoolRemaining <= 0) {
        console.log("RESULT: DEFENDER DESTROYED");
    } else {
        console.log(`RESULT: DEFENDER SURVIVES`);
        console.log(`Excess Damage Pool: ${excessDamagePoolRemaining.toFixed(0)} / ${DEFENDER.systems.excessDamagePool} HP`);
    }
    console.log("");

    // Tactical analysis
    console.log("TACTICAL ANALYSIS");
    console.log("-".repeat(70));

    const pdEfficiency = simulationState.missilesDestroyed / totalMissiles * 100;
    const shieldEfficiency = simulationState.missilesHitShields /
                            (simulationState.missilesHitShields + simulationState.missilesHitArmor) * 100;

    console.log(`Point Defense Efficiency: ${pdEfficiency.toFixed(1)}%`);
    console.log(`Shield Efficiency: ${shieldEfficiency.toFixed(1)}% (of missiles that penetrated PD)`);
    console.log("");

    if (pdEfficiency > 90) {
        console.log("⚠ Point Defense is EXTREMELY effective against this attack");
        console.log("  Recommendation: Attacker should use ECM, saturation attacks, or torpedoes");
    } else if (pdEfficiency > 70) {
        console.log("⚠ Point Defense is effective against this attack");
        console.log("  Recommendation: Attacker needs better tactics or heavier weapons");
    }

    if (shieldEfficiency > 80) {
        console.log("⚠ Shields are highly effective against penetrating missiles");
        console.log("  Recommendation: Attacker should use shield-penetrating weapons");
    }

    console.log("");
    console.log("=".repeat(70));
}

// ==================== RUN SIMULATION ====================

// Run multiple simulations for statistical average
console.log("\n");
console.log("Running Monte Carlo simulation with 100 trials...");
console.log("");

const trials = 100;
const results = {
    pdKills: [],
    shieldHits: [],
    armorHits: [],
    blocksDestroyed: [],
};

for (let trial = 0; trial < trials; trial++) {
    // Reset state
    simulationState = {
        missilesLaunched: 0,
        missilesInFlight: [],
        missilesDestroyed: 0,
        missilesHitShields: 0,
        missilesHitArmor: 0,
        totalDamageToShields: 0,
        totalDamageToArmor: 0,
        totalDamageThroughArmor: 0,
        shieldFaces: Array(6).fill(100),
        armorBlocks: Array(32).fill(7500),
        shieldRechargeTimers: Array(6).fill(0),
        currentTime: 0,
        pdEngagementRange: 5000,
        missileSpeed: 500,
    };

    // Run silent simulation
    const totalMissiles = ATTACKER.missiles.total;
    const launchInterval = ATTACKER.missiles.launchInterval;
    const flightTime = ATTACKER.missiles.flightTime;
    const pdEngagementTime = DEFENDER.pointDefense.engagementTime;

    for (let i = 0; i < totalMissiles; i++) {
        const launchTime = i * launchInterval;
        const impactTime = launchTime + flightTime;
        const pdEntryTime = impactTime - pdEngagementTime;

        const missile = {
            id: i,
            launchTime: launchTime,
            impactTime: impactTime,
            pdEntryTime: pdEntryTime,
            status: 'inflight'
        };
        simulationState.missilesInFlight.push(missile);

        while (simulationState.currentTime < pdEntryTime) {
            const deltaTime = Math.min(0.1, pdEntryTime - simulationState.currentTime);
            updateShieldRecharge(deltaTime);
            simulationState.currentTime += deltaTime;
        }

        simulationState.missilesLaunched++;

        const threatsInRange = getMissilesInPDRange(pdEntryTime);
        const destroyed = pdInterception(pdEngagementTime, threatsInRange);

        if (destroyed) {
            simulationState.missilesDestroyed++;
            missile.status = 'destroyed';
        } else {
            while (simulationState.currentTime < impactTime) {
                const deltaTime = Math.min(0.1, impactTime - simulationState.currentTime);
                updateShieldRecharge(deltaTime);
                simulationState.currentTime += deltaTime;
            }
            missile.status = 'hit';
            processMissileImpact();
        }
    }

    // Record results
    results.pdKills.push(simulationState.missilesDestroyed);
    results.shieldHits.push(simulationState.missilesHitShields);
    results.armorHits.push(simulationState.missilesHitArmor);
    results.blocksDestroyed.push(simulationState.armorBlocks.filter(hp => hp <= 0).length);
}

// Calculate statistics
const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
const stdDev = arr => {
    const mean = avg(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
};

console.log("MONTE CARLO RESULTS (100 trials)");
console.log("=".repeat(70));
console.log(`Average PD Kills: ${avg(results.pdKills).toFixed(1)} ± ${stdDev(results.pdKills).toFixed(1)}`);
console.log(`Average Shield Hits: ${avg(results.shieldHits).toFixed(1)} ± ${stdDev(results.shieldHits).toFixed(1)}`);
console.log(`Average Armor Hits: ${avg(results.armorHits).toFixed(1)} ± ${stdDev(results.armorHits).toFixed(1)}`);
console.log(`Average Blocks Destroyed: ${avg(results.blocksDestroyed).toFixed(1)} ± ${stdDev(results.blocksDestroyed).toFixed(1)}`);
console.log("");

// Run one detailed simulation for display
console.log("DETAILED SIMULATION EXAMPLE:");
console.log("");

simulationState = {
    missilesLaunched: 0,
    missilesInFlight: [],
    missilesDestroyed: 0,
    missilesHitShields: 0,
    missilesHitArmor: 0,
    totalDamageToShields: 0,
    totalDamageToArmor: 0,
    totalDamageThroughArmor: 0,
    shieldFaces: Array(6).fill(100),
    armorBlocks: Array(32).fill(7500),
    shieldRechargeTimers: Array(6).fill(0),
    currentTime: 0,
    pdEngagementRange: 5000,
    missileSpeed: 500,
};

runSimulation();
