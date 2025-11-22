/**
 * BB vs BB Missile Effectiveness Model - CORRECTED VERSION
 *
 * CORRECTED PARAMETERS:
 * - 32 missile arrays (not 2)
 * - 32 missiles/second launch rate (not 0.5/sec)
 * - 1,600 total missiles (32 arrays × 50 cells)
 *
 * This changes EVERYTHING about saturation dynamics!
 */

// ==================== CONFIGURATION ====================
const ATTACKER = {
    missiles: {
        arrays: 32,
        cellsPerArray: 50,
        total: 32 * 50,    // 1,600 missiles
        damage: 200,
        speed: 500,        // m/s
        range: 50000,      // 50km
        launchRate: 32,    // 32 missiles/second (1 per array)
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
        missilesPenetration: 0,  // 0% through intact shields
        rechargeRate: 0.25,      // %/sec
        rechargeDelay: 4.0,      // seconds
    },
    armor: {
        blocks: 32,
        hpPerBlock: 7500,
        totalHp: 240000,
    },
};

// ==================== EVENT-DRIVEN SIMULATION ====================

class MissileSaturationSimulation {
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
            maxSimultaneousInPD: 0,
            maxSimultaneousImpacting: 0,
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
        this.events.sort((a, b) => a.time - b.time);
    }

    launchMissile(id, launchTime) {
        const flightTime = ATTACKER.missiles.range / ATTACKER.missiles.speed; // 100 sec
        const pdEngagementTime = DEFENDER.pointDefense.range / ATTACKER.missiles.speed; // 10 sec
        const pdEntryTime = launchTime + flightTime - pdEngagementTime;
        const impactTime = launchTime + flightTime;

        const missile = {
            id,
            launchTime,
            pdEntryTime,
            impactTime,
            status: 'pending',
            destroyed: false,
        };

        this.missiles.push(missile);
        this.stats.launched++;

        this.scheduleEvent(pdEntryTime, 'pd_entry', { missileId: id });
        this.scheduleEvent(impactTime, 'impact', { missileId: id });
    }

    getMissilesInPDRange(time) {
        return this.missiles.filter(m => {
            if (m.status !== 'inPD') return false;
            return m.pdEntryTime <= time && time < m.impactTime;
        }).length;
    }

    processPDEntry(missileId) {
        const missile = this.missiles[missileId];
        if (missile.status !== 'pending') return;

        missile.status = 'inPD';

        const threatsInRange = this.getMissilesInPDRange(this.currentTime);
        this.stats.maxSimultaneousInPD = Math.max(this.stats.maxSimultaneousInPD, threatsInRange);

        // Calculate PD effectiveness
        const pdEngagementTime = missile.impactTime - missile.pdEntryTime;
        const totalRoundsPerSecond = DEFENDER.pointDefense.turrets *
                                     DEFENDER.pointDefense.rateOfFire *
                                     DEFENDER.pointDefense.accuracy;

        // PD fire divided among all threats
        const roundsPerThreat = totalRoundsPerSecond / Math.max(1, threatsInRange);
        const allocatedRounds = roundsPerThreat * pdEngagementTime;

        // Probability of kill: P = 1 - e^(-allocatedRounds)
        const destroyProbability = 1.0 - Math.exp(-allocatedRounds);

        if (Math.random() < destroyProbability) {
            missile.destroyed = true;
        }
    }

    processImpact(missileId) {
        const missile = this.missiles[missileId];
        if (missile.status !== 'inPD') return;

        if (missile.destroyed) {
            missile.status = 'destroyed';
            this.stats.destroyed++;
            return;
        }

        missile.status = 'hit';

        // Apply damage to random shield face
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

    run(maxMissiles = ATTACKER.missiles.total) {
        // Launch missiles at 32/second
        const launchInterval = 1.0 / ATTACKER.missiles.launchRate; // 0.03125 sec between launches

        for (let i = 0; i < Math.min(maxMissiles, ATTACKER.missiles.total); i++) {
            const launchTime = i * launchInterval;
            this.launchMissile(i, launchTime);
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
                this.processPDEntry(event.data.missileId);
            } else if (event.type === 'impact') {
                this.processImpact(event.data.missileId);
            }
        }
    }

    report() {
        console.log("=".repeat(70));
        console.log("BB vs BB MISSILE SATURATION ATTACK - CORRECTED MODEL");
        console.log("=".repeat(70));
        console.log("");

        const flightTime = ATTACKER.missiles.range / ATTACKER.missiles.speed;
        const pdEngagementTime = DEFENDER.pointDefense.range / ATTACKER.missiles.speed;
        const totalLaunchTime = this.stats.launched / ATTACKER.missiles.launchRate;

        console.log("PHASE 1: MISSILE LAUNCH");
        console.log("-".repeat(70));
        console.log(`Total Missiles Launched: ${this.stats.launched} / ${ATTACKER.missiles.total}`);
        console.log(`Launch Rate: ${ATTACKER.missiles.launchRate} missiles/second`);
        console.log(`Launch Duration: ${totalLaunchTime.toFixed(1)} seconds`);
        console.log(`Missile Flight Time: ${flightTime} seconds`);
        console.log("");

        console.log("PHASE 2: POINT DEFENSE ENGAGEMENT");
        console.log("-".repeat(70));
        console.log(`PD Configuration: ${DEFENDER.pointDefense.turrets} turrets, ${DEFENDER.pointDefense.rateOfFire} rounds/sec each`);
        console.log(`Total PD Output: ${DEFENDER.pointDefense.turrets * DEFENDER.pointDefense.rateOfFire} rounds/second`);
        console.log(`PD Accuracy: ${(DEFENDER.pointDefense.accuracy * 100).toFixed(0)}%`);
        console.log(`Effective PD Firepower: ${(DEFENDER.pointDefense.turrets * DEFENDER.pointDefense.rateOfFire * DEFENDER.pointDefense.accuracy).toFixed(0)} hits/second`);
        console.log(`PD Engagement Time: ${pdEngagementTime} seconds per missile`);
        console.log("");
        console.log(`Max Simultaneous Missiles in PD Range: ${this.stats.maxSimultaneousInPD}`);
        console.log(`PD Fire per Missile (at max saturation): ${(170 / this.stats.maxSimultaneousInPD).toFixed(1)} effective rounds/second`);
        console.log("");
        console.log(`Missiles Destroyed by PD: ${this.stats.destroyed} (${(this.stats.destroyed / this.stats.launched * 100).toFixed(1)}%)`);
        console.log(`Missiles Penetrating PD: ${this.stats.launched - this.stats.destroyed} (${((this.stats.launched - this.stats.destroyed) / this.stats.launched * 100).toFixed(1)}%)`);
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
            const excessDamagePoolRemaining = 40000 - this.stats.totalDamageThroughArmor;
            console.log(`Excess Damage Pool: ${excessDamagePoolRemaining.toFixed(0)} / 40000 HP`);
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

        let status;
        if (blocksDestroyed > 25) status = "CRITICALLY DAMAGED";
        else if (blocksDestroyed > 16) status = "HEAVILY DAMAGED";
        else if (blocksDestroyed > 5) status = "DAMAGED";
        else status = "OPERATIONAL";
        console.log(`Defender Ship Status: ${status}`);
        console.log("");

        const excessDamagePoolRemaining = 40000 - this.stats.totalDamageThroughArmor;
        if (excessDamagePoolRemaining <= 0) {
            console.log("RESULT: DEFENDER DESTROYED");
        } else {
            console.log(`RESULT: DEFENDER SURVIVES`);
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
        console.log(`Penetration Rate: ${((this.stats.launched - this.stats.destroyed) / this.stats.launched * 100).toFixed(1)}%`);
        console.log("");

        console.log("=".repeat(70));

        return this.stats;
    }
}

// ==================== RUN SIMULATIONS ====================

console.log("\n" + "=".repeat(70));
console.log("TESTING DIFFERENT SALVO SIZES");
console.log("=".repeat(70) + "\n");

// Test different salvo sizes
const salvoSizes = [100, 200, 500, 1000, 1600];

for (const salvoSize of salvoSizes) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`SALVO TEST: ${salvoSize} missiles`);
    console.log("=".repeat(70) + "\n");

    const sim = new MissileSaturationSimulation();
    sim.run(salvoSize);
    sim.report();
}

// Run Monte Carlo on full salvo
console.log("\n\n" + "=".repeat(70));
console.log("MONTE CARLO ANALYSIS: Full Salvo (1,600 missiles)");
console.log("=".repeat(70) + "\n");

console.log("Running 20 trials...\n");

const results = {
    pdKills: [],
    shieldHits: [],
    armorHits: [],
    blocksDestroyed: [],
    maxSimultaneous: [],
    totalDamage: [],
};

for (let trial = 0; trial < 20; trial++) {
    const sim = new MissileSaturationSimulation();
    sim.run();

    results.pdKills.push(sim.stats.destroyed);
    results.shieldHits.push(sim.stats.hitShields);
    results.armorHits.push(sim.stats.hitArmor);
    results.blocksDestroyed.push(sim.armorBlocks.filter(hp => hp <= 0).length);
    results.maxSimultaneous.push(sim.stats.maxSimultaneousInPD);
    const totalDmg = sim.stats.totalDamageToArmor + (sim.stats.totalDamageToShields * 10);
    results.totalDamage.push(totalDmg);
}

const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
const stdDev = arr => {
    const mean = avg(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
};

console.log("MONTE CARLO RESULTS (20 trials)");
console.log("=".repeat(70));
console.log(`Average PD Kills: ${avg(results.pdKills).toFixed(1)} ± ${stdDev(results.pdKills).toFixed(1)}`);
console.log(`Average Penetration: ${(1600 - avg(results.pdKills)).toFixed(1)} missiles`);
console.log(`Average Shield Hits: ${avg(results.shieldHits).toFixed(1)} ± ${stdDev(results.shieldHits).toFixed(1)}`);
console.log(`Average Armor Hits: ${avg(results.armorHits).toFixed(1)} ± ${stdDev(results.armorHits).toFixed(1)}`);
console.log(`Average Blocks Destroyed: ${avg(results.blocksDestroyed).toFixed(1)} ± ${stdDev(results.blocksDestroyed).toFixed(1)}`);
console.log(`Average Max Simultaneous: ${avg(results.maxSimultaneous).toFixed(1)} ± ${stdDev(results.maxSimultaneous).toFixed(1)}`);
console.log(`Average Total Damage: ${avg(results.totalDamage).toFixed(0)} HP (${(avg(results.totalDamage) / 800000 * 100).toFixed(1)}% of ship)`);
console.log("");
