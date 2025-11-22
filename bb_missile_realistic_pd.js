/**
 * BB vs BB Missile - REALISTIC PD MODEL
 *
 * CORRECTIONS:
 * 1. Only 50% of PD turrets can engage from one attack vector
 * 2. PD turrets overheat with sustained fire
 * 3. 32 missiles/second launch rate (corrected)
 */

// ==================== CONFIGURATION ====================
const ATTACKER = {
    missiles: {
        arrays: 32,
        total: 1600,       // 32 arrays × 50 cells
        damage: 200,
        speed: 500,        // m/s
        range: 50000,      // 50km
        launchRate: 32,    // missiles/second
    }
};

const DEFENDER = {
    pointDefense: {
        totalTurrets: 20,
        activeTurrets: 10,     // Only 50% can engage from one vector
        rateOfFire: 10,        // rounds/sec per turret (initial)
        accuracy: 0.85,
        damagePerHit: 100,
        range: 5000,           // 5km
        engagementWindow: 1.5, // 1-2 seconds max (missiles move too fast!)

        // Heat model
        heatPerShot: 5,        // Heat generated per shot
        coolingRate: 2,        // Heat dissipated per second
        maxHeat: 100,          // Overheat threshold
        degradationStart: 50,  // Heat level where ROF starts degrading
    },
    shields: {
        faces: 6,
        maxHpPerFace: 100,
        damageReduction: 10,
        rechargeRate: 0.25,
        rechargeDelay: 4.0,
    },
    armor: {
        blocks: 32,
        hpPerBlock: 7500,
        totalHp: 240000,
    },
};

// ==================== SIMULATION ====================

class RealisticPDSimulation {
    constructor() {
        this.missiles = [];
        this.events = [];
        this.currentTime = 0;

        // PD turret heat tracking
        this.turretHeat = Array(DEFENDER.pointDefense.activeTurrets).fill(0);

        // Stats
        this.stats = {
            launched: 0,
            destroyed: 0,
            hitShields: 0,
            hitArmor: 0,
            maxSimultaneousInPD: 0,
            totalDamageToShields: 0,
            totalDamageToArmor: 0,
            totalDamageThroughArmor: 0,
            totalPDRoundsFired: 0,
            overheatedTurrets: 0,
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
        const flightTime = ATTACKER.missiles.range / ATTACKER.missiles.speed;
        const pdEngagementTime = DEFENDER.pointDefense.engagementWindow; // CORRECTED: 1.5 seconds
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

    getEffectivePDFirepower() {
        // Calculate effective firepower considering heat degradation
        let totalRoundsPerSecond = 0;

        for (let i = 0; i < DEFENDER.pointDefense.activeTurrets; i++) {
            const heat = this.turretHeat[i];
            let effectiveROF = DEFENDER.pointDefense.rateOfFire;

            if (heat >= DEFENDER.pointDefense.maxHeat) {
                // Overheated - can't fire
                effectiveROF = 0;
                this.stats.overheatedTurrets++;
            } else if (heat > DEFENDER.pointDefense.degradationStart) {
                // Degraded performance
                const degradation = (heat - DEFENDER.pointDefense.degradationStart) /
                                   (DEFENDER.pointDefense.maxHeat - DEFENDER.pointDefense.degradationStart);
                effectiveROF *= (1 - degradation * 0.5); // Up to 50% degradation
            }

            totalRoundsPerSecond += effectiveROF * DEFENDER.pointDefense.accuracy;
        }

        return totalRoundsPerSecond;
    }

    updateTurretHeat(deltaTime, firing = false) {
        for (let i = 0; i < DEFENDER.pointDefense.activeTurrets; i++) {
            if (firing) {
                // Add heat from firing
                const roundsFired = DEFENDER.pointDefense.rateOfFire * deltaTime;
                this.turretHeat[i] += roundsFired * DEFENDER.pointDefense.heatPerShot;
                this.stats.totalPDRoundsFired += roundsFired;
            }

            // Cool down
            this.turretHeat[i] -= DEFENDER.pointDefense.coolingRate * deltaTime;
            this.turretHeat[i] = Math.max(0, this.turretHeat[i]);
        }
    }

    processPDEntry(missileId) {
        const missile = this.missiles[missileId];
        if (missile.status !== 'pending') return;

        missile.status = 'inPD';

        const threatsInRange = this.getMissilesInPDRange(this.currentTime);
        this.stats.maxSimultaneousInPD = Math.max(this.stats.maxSimultaneousInPD, threatsInRange);

        // Calculate PD effectiveness with heat model
        const pdEngagementTime = missile.impactTime - missile.pdEntryTime;

        // Simulate engagement in small time steps to model heat accurately
        let allocatedRounds = 0;
        const timeSteps = 10;
        const dtStep = pdEngagementTime / timeSteps;

        for (let step = 0; step < timeSteps; step++) {
            const effectiveFirepower = this.getEffectivePDFirepower();
            const roundsPerThreat = effectiveFirepower / Math.max(1, threatsInRange);
            allocatedRounds += roundsPerThreat * dtStep;

            // Update turret heat from firing
            this.updateTurretHeat(dtStep, true);
        }

        // Probability of kill
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
                return 0;
            } else {
                const excessDamage = Math.abs(this.shieldFaces[faceIndex]) *
                                    DEFENDER.shields.damageReduction;
                this.shieldFaces[faceIndex] = 0;
                return excessDamage;
            }
        }

        return damage;
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
        const launchInterval = 1.0 / ATTACKER.missiles.launchRate;

        for (let i = 0; i < Math.min(maxMissiles, ATTACKER.missiles.total); i++) {
            const launchTime = i * launchInterval;
            this.launchMissile(i, launchTime);
        }

        let lastTime = 0;
        while (this.events.length > 0) {
            const event = this.events.shift();
            const deltaTime = event.time - this.currentTime;

            if (deltaTime > 0) {
                this.updateShieldRecharge(deltaTime);

                // Cool turrets when not actively engaging
                const missilesInRange = this.getMissilesInPDRange(this.currentTime);
                if (missilesInRange === 0) {
                    this.updateTurretHeat(deltaTime, false);
                }

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
        console.log("BB vs BB MISSILE - REALISTIC PD MODEL");
        console.log("=".repeat(70));
        console.log("");

        const flightTime = ATTACKER.missiles.range / ATTACKER.missiles.speed;
        const pdEngagementTime = DEFENDER.pointDefense.engagementWindow; // CORRECTED
        const totalLaunchTime = this.stats.launched / ATTACKER.missiles.launchRate;

        console.log("PHASE 1: MISSILE LAUNCH");
        console.log("-".repeat(70));
        console.log(`Total Missiles Launched: ${this.stats.launched}`);
        console.log(`Launch Rate: ${ATTACKER.missiles.launchRate} missiles/second`);
        console.log(`Launch Duration: ${totalLaunchTime.toFixed(1)} seconds`);
        console.log(`Missile Flight Time: ${flightTime} seconds`);
        console.log("");

        console.log("PHASE 2: POINT DEFENSE ENGAGEMENT (REALISTIC)");
        console.log("-".repeat(70));
        console.log(`Total PD Turrets: ${DEFENDER.pointDefense.totalTurrets}`);
        console.log(`Active Turrets (50% coverage): ${DEFENDER.pointDefense.activeTurrets}`);
        console.log(`Engagement Window: ${pdEngagementTime} seconds (CORRECTED)`);
        console.log(`Nominal ROF: ${DEFENDER.pointDefense.rateOfFire} rounds/sec per turret`);
        console.log(`Nominal Accuracy: ${(DEFENDER.pointDefense.accuracy * 100).toFixed(0)}%`);
        console.log(`Heat Model: ${DEFENDER.pointDefense.heatPerShot} heat/shot, ${DEFENDER.pointDefense.coolingRate} cooling/sec`);
        console.log(`Degradation starts at: ${DEFENDER.pointDefense.degradationStart} heat`);
        console.log(`Overheat threshold: ${DEFENDER.pointDefense.maxHeat} heat`);
        console.log("");
        console.log(`Max Simultaneous Missiles in PD Range: ${this.stats.maxSimultaneousInPD}`);
        console.log(`Total PD Rounds Fired: ${this.stats.totalPDRoundsFired.toFixed(0)}`);
        console.log(`Turret Overheat Events: ${this.stats.overheatedTurrets}`);
        console.log("");
        console.log(`Missiles Destroyed by PD: ${this.stats.destroyed} (${(this.stats.destroyed / this.stats.launched * 100).toFixed(1)}%)`);
        console.log(`Missiles Penetrating PD: ${this.stats.launched - this.stats.destroyed} (${((this.stats.launched - this.stats.destroyed) / this.stats.launched * 100).toFixed(1)}%)`);
        console.log("");

        console.log("PHASE 3: SHIELD IMPACT");
        console.log("-".repeat(70));
        console.log(`Missiles Absorbed by Shields: ${this.stats.hitShields}`);
        console.log(`Missiles Penetrating Shields: ${this.stats.hitArmor}`);
        console.log(`Total Shield Damage: ${this.stats.totalDamageToShields.toFixed(1)}%`);
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

        console.log(`Armor Blocks Destroyed: ${blocksDestroyed} / 32`);
        console.log(`Armor Blocks Damaged: ${blocksDamaged} / 32`);
        console.log("");

        console.log("=".repeat(70));
        console.log("FINAL ASSESSMENT");
        console.log("=".repeat(70));

        const totalDamage = this.stats.totalDamageToArmor +
                           (this.stats.totalDamageToShields * DEFENDER.shields.damageReduction);

        console.log(`Total Effective Damage: ${totalDamage.toFixed(0)} HP (${(totalDamage / 800000 * 100).toFixed(2)}% of ship)`);

        let status;
        if (blocksDestroyed > 25) status = "CRITICALLY DAMAGED";
        else if (blocksDestroyed > 16) status = "HEAVILY DAMAGED";
        else if (blocksDestroyed > 5) status = "DAMAGED";
        else status = "OPERATIONAL";

        console.log(`Defender Status: ${status}`);

        const excessDamagePoolRemaining = 40000 - this.stats.totalDamageThroughArmor;
        if (excessDamagePoolRemaining <= 0) {
            console.log("RESULT: DEFENDER DESTROYED");
        } else {
            console.log(`RESULT: DEFENDER SURVIVES`);
        }

        console.log("");
        console.log("=".repeat(70));

        return this.stats;
    }
}

// ==================== RUN SIMULATION ====================

console.log("\n" + "=".repeat(70));
console.log("REALISTIC PD MODEL: Accounting for Angular Coverage & Heat");
console.log("=".repeat(70) + "\n");

console.log("Running Monte Carlo simulation with 20 trials...\n");

const results = {
    pdKills: [],
    penetration: [],
    shieldHits: [],
    armorHits: [],
    blocksDestroyed: [],
    maxSimultaneous: [],
    totalDamage: [],
};

for (let trial = 0; trial < 20; trial++) {
    const sim = new RealisticPDSimulation();
    sim.run();

    results.pdKills.push(sim.stats.destroyed);
    results.penetration.push(sim.stats.launched - sim.stats.destroyed);
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
console.log(`Average Penetration: ${avg(results.penetration).toFixed(1)} ± ${stdDev(results.penetration).toFixed(1)} missiles`);
console.log(`Average Shield Hits: ${avg(results.shieldHits).toFixed(1)} ± ${stdDev(results.shieldHits).toFixed(1)}`);
console.log(`Average Armor Hits: ${avg(results.armorHits).toFixed(1)} ± ${stdDev(results.armorHits).toFixed(1)}`);
console.log(`Average Blocks Destroyed: ${avg(results.blocksDestroyed).toFixed(1)} ± ${stdDev(results.blocksDestroyed).toFixed(1)}`);
console.log(`Average Max Simultaneous: ${avg(results.maxSimultaneous).toFixed(1)}`);
console.log(`Average Total Damage: ${avg(results.totalDamage).toFixed(0)} HP (${(avg(results.totalDamage) / 800000 * 100).toFixed(2)}% of ship)`);
console.log("");

// Run one detailed example
console.log("\nDETAILED SIMULATION EXAMPLE:\n");
const detailedSim = new RealisticPDSimulation();
detailedSim.run();
detailedSim.report();
