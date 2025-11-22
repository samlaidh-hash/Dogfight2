/**
 * BB vs BB Missile Effectiveness Model - Version 2
 * Event-driven simulation with proper simultaneous missile tracking
 *
 * Scenario: One BB fires all 100 missiles at another BB
 * Defender: Point Defense turrets + Flicker Shields (normal power)
 */

// ==================== CONFIGURATION ====================
const ATTACKER = {
    missiles: {
        total: 100,
        damage: 200,
        speed: 500,        // m/s
        range: 50000,      // 50km
        launchInterval: 2.0, // seconds
    }
};

const DEFENDER = {
    pointDefense: {
        turrets: 20,
        rateOfFire: 10,    // rounds/sec per turret
        accuracy: 0.85,
        damagePerHit: 100,
        range: 5000,       // 5km
    },
    shields: {
        faces: 6,
        maxHpPerFace: 100,
        damageReduction: 10,
        missilesPenetration: 0,
        rechargeRate: 0.25,
        rechargeDelay: 4.0,
    },
    armor: {
        blocks: 32,
        hpPerBlock: 7500,
        totalHp: 240000,
    },
};

// ==================== EVENT-DRIVEN SIMULATION ====================

class MissileSimulation {
    constructor() {
        this.missiles = [];
        this.events = [];
        this.currentTime = 0;

        // Stats
        this.stats = {
            launched: 0,
            destroyed: 0,
            hitShields: 0,
            hitArmor: 0,
            maxSimultaneous: 0,
            totalDamageToShields: 0,
            totalDamageToArmor: 0,
            totalDamageThroughArmor: 0,
        };

        // State
        this.shieldFaces = Array(6).fill(100);
        this.armorBlocks = Array(32).fill(7500);
        this.shieldRechargeTimers = Array(6).fill(0);
    }

    scheduleEvent(time, type, data) {
        this.events.push({ time, type, data });
        // Keep events sorted by time
        this.events.sort((a, b) => a.time - b.time);
    }

    launchMissile(id) {
        const launchTime = id * ATTACKER.missiles.launchInterval;
        const flightTime = ATTACKER.missiles.range / ATTACKER.missiles.speed;
        const pdEngagementTime = DEFENDER.pointDefense.range / ATTACKER.missiles.speed;
        const pdEntryTime = launchTime + flightTime - pdEngagementTime;
        const impactTime = launchTime + flightTime;

        const missile = {
            id,
            launchTime,
            pdEntryTime,
            impactTime,
            status: 'pending',
        };

        this.missiles.push(missile);
        this.stats.launched++;

        // Schedule events
        this.scheduleEvent(pdEntryTime, 'pd_entry', { missileId: id });
        this.scheduleEvent(impactTime, 'impact', { missileId: id });
    }

    getMissilesInPDRange(time) {
        return this.missiles.filter(m => {
            if (m.status !== 'inPD') return false;
            return m.pdEntryTime <= time && time < m.impactTime;
        }).length;
    }

    processPDEntry(missileId, debug = false) {
        const missile = this.missiles[missileId];
        if (missile.status !== 'pending') return;

        missile.status = 'inPD';

        // Count threats in range AFTER setting this missile to inPD
        const threatsInRange = this.getMissilesInPDRange(this.currentTime);
        this.stats.maxSimultaneous = Math.max(this.stats.maxSimultaneous, threatsInRange);

        if (debug && missileId < 10) {
            console.log(`[DEBUG] Missile ${missileId} entering PD at t=${this.currentTime.toFixed(1)}`);
            console.log(`  Threats in range: ${threatsInRange}`);
            const inPD = this.missiles.filter(m => m.status === 'inPD');
            console.log(`  Missiles in PD status: ${inPD.map(m => m.id).join(', ')}`);
        }

        // Calculate PD effectiveness
        const pdEngagementTime = (missile.impactTime - missile.pdEntryTime);
        const totalRoundsPerSecond = DEFENDER.pointDefense.turrets *
                                     DEFENDER.pointDefense.rateOfFire *
                                     DEFENDER.pointDefense.accuracy;

        // PD fire divided among all threats
        const roundsPerThreat = totalRoundsPerSecond / Math.max(1, threatsInRange);
        const allocatedRounds = roundsPerThreat * pdEngagementTime;

        // Probability of kill
        const destroyProbability = 1.0 - Math.exp(-allocatedRounds);

        // Mark missile as destroyed, but DON'T change status yet
        // Keep it as 'inPD' so it counts for subsequent missiles
        if (Math.random() < destroyProbability) {
            missile.destroyed = true; // Track destruction separately
            if (debug && missileId < 10) {
                console.log(`  Result: DESTROYED (p=${destroyProbability.toFixed(3)})`);
            }
        } else {
            missile.destroyed = false;
            if (debug && missileId < 10) {
                console.log(`  Result: SURVIVED (p=${destroyProbability.toFixed(3)})`);
            }
        }
    }

    processImpact(missileId) {
        const missile = this.missiles[missileId];
        if (missile.status !== 'inPD') return;

        // Check if missile was destroyed by PD
        if (missile.destroyed) {
            missile.status = 'destroyed';
            this.stats.destroyed++;
            return;
        }

        missile.status = 'hit';

        // Apply damage to shields
        const faceIndex = Math.floor(Math.random() * 6);
        const damage = ATTACKER.missiles.damage;
        const penetratingDamage = this.applyShieldDamage(damage, faceIndex);

        if (penetratingDamage > 0) {
            this.stats.hitArmor++;
            this.applyArmorDamage(penetratingDamage);
        } else {
            this.stats.hitShields++;
        }
    }

    applyShieldDamage(damage, faceIndex) {
        const face = this.shieldFaces[faceIndex];

        if (face > 0) {
            const shieldDamage = damage / DEFENDER.shields.damageReduction;
            this.shieldFaces[faceIndex] -= shieldDamage;
            this.stats.totalDamageToShields += shieldDamage;
            this.shieldRechargeTimers[faceIndex] = DEFENDER.shields.rechargeDelay;

            if (this.shieldFaces[faceIndex] > 0) {
                return 0; // Shield held
            } else {
                // Shield collapsed
                const excessDamage = Math.abs(this.shieldFaces[faceIndex]) *
                                    DEFENDER.shields.damageReduction;
                this.shieldFaces[faceIndex] = 0;
                return excessDamage;
            }
        }

        return damage; // Shield already down
    }

    applyArmorDamage(damage) {
        const blockIndex = Math.floor(Math.random() * 32);
        this.armorBlocks[blockIndex] -= damage;
        this.stats.totalDamageToArmor += damage;

        if (this.armorBlocks[blockIndex] <= 0) {
            const excessDamage = Math.abs(this.armorBlocks[blockIndex]);
            this.armorBlocks[blockIndex] = 0;
            this.stats.totalDamageThroughArmor += excessDamage;
        }
    }

    updateShieldRecharge(deltaTime) {
        for (let i = 0; i < 6; i++) {
            if (this.shieldRechargeTimers[i] > 0) {
                this.shieldRechargeTimers[i] -= deltaTime;
            }

            if (this.shieldRechargeTimers[i] <= 0 && this.shieldFaces[i] < 100) {
                const recharge = DEFENDER.shields.rechargeRate * deltaTime;
                this.shieldFaces[i] = Math.min(100, this.shieldFaces[i] + recharge);
            }
        }
    }

    run(debug = false) {
        // Launch all missiles
        for (let i = 0; i < ATTACKER.missiles.total; i++) {
            this.launchMissile(i);
        }

        // Process events in chronological order
        while (this.events.length > 0) {
            const event = this.events.shift();
            const deltaTime = event.time - this.currentTime;

            if (deltaTime > 0) {
                this.updateShieldRecharge(deltaTime);
                this.currentTime = event.time;
            }

            if (event.type === 'pd_entry') {
                this.processPDEntry(event.data.missileId, debug);
            } else if (event.type === 'impact') {
                this.processImpact(event.data.missileId);
            }
        }
    }

    report() {
        console.log("=".repeat(70));
        console.log("BB vs BB MISSILE EFFECTIVENESS SIMULATION - V2");
        console.log("=".repeat(70));
        console.log("");

        const flightTime = ATTACKER.missiles.range / ATTACKER.missiles.speed;
        const pdEngagementTime = DEFENDER.pointDefense.range / ATTACKER.missiles.speed;

        console.log("PHASE 1: MISSILE LAUNCH");
        console.log("-".repeat(70));
        console.log(`Total Missiles Launched: ${this.stats.launched}`);
        console.log(`Launch Duration: ${ATTACKER.missiles.total * ATTACKER.missiles.launchInterval} seconds`);
        console.log(`Missile Flight Time: ${flightTime} seconds`);
        console.log("");

        console.log("PHASE 2: POINT DEFENSE ENGAGEMENT");
        console.log("-".repeat(70));
        console.log(`PD Configuration: ${DEFENDER.pointDefense.turrets} turrets, ${DEFENDER.pointDefense.rateOfFire} rounds/sec each`);
        console.log(`Total PD Output: ${DEFENDER.pointDefense.turrets * DEFENDER.pointDefense.rateOfFire} rounds/second`);
        console.log(`PD Accuracy: ${(DEFENDER.pointDefense.accuracy * 100).toFixed(0)}%`);
        console.log(`Effective Hits/Second: ${(DEFENDER.pointDefense.turrets * DEFENDER.pointDefense.rateOfFire * DEFENDER.pointDefense.accuracy).toFixed(0)}`);
        console.log(`PD Engagement Time: ${pdEngagementTime} seconds per missile`);
        console.log(`Max Simultaneous Missiles in PD Range: ${this.stats.maxSimultaneous}`);
        console.log("");
        console.log(`Missiles Destroyed by PD: ${this.stats.destroyed} (${(this.stats.destroyed / this.stats.launched * 100).toFixed(1)}%)`);
        console.log(`Missiles Penetrating PD: ${this.stats.launched - this.stats.destroyed}`);
        console.log("");

        console.log("PHASE 3: SHIELD IMPACT");
        console.log("-".repeat(70));
        console.log(`Missiles Absorbed by Shields: ${this.stats.hitShields}`);
        console.log(`Missiles Penetrating Shields: ${this.stats.hitArmor}`);
        console.log(`Total Shield Damage: ${this.stats.totalDamageToShields.toFixed(1)}% (across all faces)`);
        console.log("");
        console.log("Shield Face Status:");
        this.shieldFaces.forEach((hp, i) => {
            const status = hp > 0 ? "ACTIVE" : "COLLAPSED";
            console.log(`  Face ${i + 1}: ${hp.toFixed(1)}% [${status}]`);
        });
        console.log("");

        console.log("PHASE 4: ARMOR IMPACT");
        console.log("-".repeat(70));
        console.log(`Total Armor Damage: ${this.stats.totalDamageToArmor.toFixed(0)} HP`);
        console.log(`Armor Integrity: ${((DEFENDER.armor.totalHp - this.stats.totalDamageToArmor) / DEFENDER.armor.totalHp * 100).toFixed(1)}%`);

        const blocksDestroyed = this.armorBlocks.filter(hp => hp <= 0).length;
        const blocksDamaged = this.armorBlocks.filter(hp => hp > 0 && hp < 7500).length;
        const blocksIntact = this.armorBlocks.filter(hp => hp === 7500).length;

        console.log(`Armor Blocks Destroyed: ${blocksDestroyed} / 32`);
        console.log(`Armor Blocks Damaged: ${blocksDamaged} / 32`);
        console.log(`Armor Blocks Intact: ${blocksIntact} / 32`);
        console.log(`Damage Penetrating Armor: ${this.stats.totalDamageThroughArmor.toFixed(0)} HP`);
        console.log("");

        console.log("PHASE 5: INTERNAL SYSTEMS");
        console.log("-".repeat(70));
        if (this.stats.totalDamageThroughArmor > 0) {
            console.log(`Damage to Internal Systems: ${this.stats.totalDamageThroughArmor.toFixed(0)} HP`);
            console.log(`Critical Systems at Risk: ${this.stats.totalDamageThroughArmor > 50000 ? "YES" : "NO"}`);
        } else {
            console.log("No penetration to internal systems - all damage absorbed by shields/armor");
        }
        console.log("");

        console.log("=".repeat(70));
        console.log("FINAL ASSESSMENT");
        console.log("=".repeat(70));

        const totalDamage = this.stats.totalDamageToArmor +
                           (this.stats.totalDamageToShields * DEFENDER.shields.damageReduction);
        const percentageOfShipHp = (totalDamage / 800000 * 100).toFixed(2);

        console.log(`Total Effective Damage: ${totalDamage.toFixed(0)} HP (${percentageOfShipHp}% of ship HP)`);
        console.log(`Defender Ship Status: ${blocksDestroyed > 16 ? "HEAVILY DAMAGED" : blocksDestroyed > 5 ? "DAMAGED" : "OPERATIONAL"}`);
        console.log("");

        const excessDamagePoolRemaining = 40000 - this.stats.totalDamageThroughArmor;
        if (excessDamagePoolRemaining <= 0) {
            console.log("RESULT: DEFENDER DESTROYED");
        } else {
            console.log(`RESULT: DEFENDER SURVIVES`);
            console.log(`Excess Damage Pool: ${excessDamagePoolRemaining.toFixed(0)} / 40000 HP`);
        }
        console.log("");

        console.log("TACTICAL ANALYSIS");
        console.log("-".repeat(70));

        const pdEfficiency = this.stats.destroyed / this.stats.launched * 100;
        const shieldEfficiency = this.stats.hitShields /
            (this.stats.hitShields + this.stats.hitArmor) * 100;

        console.log(`Point Defense Efficiency: ${pdEfficiency.toFixed(1)}%`);
        if (!isNaN(shieldEfficiency)) {
            console.log(`Shield Efficiency: ${shieldEfficiency.toFixed(1)}% (of missiles that penetrated PD)`);
        }
        console.log("");

        if (pdEfficiency > 90) {
            console.log("⚠ Point Defense is EXTREMELY effective against this attack");
            console.log("  Recommendation: Attacker should use ECM, saturation attacks, or torpedoes");
        } else if (pdEfficiency > 70) {
            console.log("⚠ Point Defense is effective against this attack");
            console.log("  Recommendation: Attacker needs better tactics or heavier weapons");
        }

        if (!isNaN(shieldEfficiency) && shieldEfficiency > 80) {
            console.log("⚠ Shields are highly effective against penetrating missiles");
            console.log("  Recommendation: Attacker should use shield-penetrating weapons");
        }

        console.log("");
        console.log("=".repeat(70));

        return this.stats;
    }
}

// ==================== RUN MONTE CARLO SIMULATION ====================

console.log("\n=== DEBUG RUN (first 10 missiles) ===\n");
const debugSim = new MissileSimulation();
debugSim.run(true);
console.log("\n=== END DEBUG ===\n");

console.log("\nRunning Monte Carlo simulation with 100 trials...\n");

const results = {
    pdKills: [],
    shieldHits: [],
    armorHits: [],
    blocksDestroyed: [],
    maxSimultaneous: [],
};

for (let trial = 0; trial < 100; trial++) {
    const sim = new MissileSimulation();
    sim.run();

    results.pdKills.push(sim.stats.destroyed);
    results.shieldHits.push(sim.stats.hitShields);
    results.armorHits.push(sim.stats.hitArmor);
    results.blocksDestroyed.push(sim.armorBlocks.filter(hp => hp <= 0).length);
    results.maxSimultaneous.push(sim.stats.maxSimultaneous);
}

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
console.log(`Average Max Simultaneous: ${avg(results.maxSimultaneous).toFixed(1)} ± ${stdDev(results.maxSimultaneous).toFixed(1)}`);
console.log("");

// Run one detailed simulation
console.log("DETAILED SIMULATION EXAMPLE:");
console.log("");

const detailedSim = new MissileSimulation();
detailedSim.run();
detailedSim.report();
