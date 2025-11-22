/**
 * BB vs BB Missile - FINAL ACCURATE MODEL
 *
 * Based on user specifications:
 * - 32 missiles fired simultaneously, arrive together
 * - 32 PD turrets total, 16 can bear on incoming missiles
 * - Heat: +1 heat per 100 rounds, heat×0.1% shutdown chance/sec, -3 heat/sec cooldown
 * - Missiles: 30G for 20s, coast after burnout, engaging at 10-40km
 */

// ==================== CONFIGURATION ====================
const ATTACKER = {
    missiles: {
        count: 32,              // 32 missiles in salvo
        damage: 200,
        acceleration: 30 * 9.81, // 30G = 294.3 m/s²
        burnTime: 20,            // seconds
        maxSpeed: 30 * 9.81 * 20, // 5,886 m/s
    }
};

const DEFENDER = {
    pointDefense: {
        totalTurrets: 32,
        activeTurrets: 16,      // Only 50% can bear on one attack vector
        rateOfFire: 100,        // rounds/sec per turret
        accuracy: 0.15,         // 15% per round (based on Phalanx/Goalkeeper)
        damagePerHit: 100,      // Missile destroyed in 1 hit
        range: 3000,            // 3km effective range

        // Heat model (CORRECTED)
        heatPerHundredRounds: 1,    // +1 heat per 100 rounds
        shutdownChancePerHeat: 0.001, // heat × 0.1% per second
        cooldownRate: 3,             // -3 heat/sec when shut down
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

// ==================== MISSILE KINEMATICS ====================

function calculateMissileVelocityAtRange(range) {
    // Using kinematic equations: d = 0.5 * a * t²
    // Solve for t: t = sqrt(2d/a)
    const a = ATTACKER.missiles.acceleration;
    const maxDistance = 0.5 * a * ATTACKER.missiles.burnTime ** 2; // 58,860m

    if (range >= maxDistance) {
        // Missile has finished burning, coasting at max speed
        return ATTACKER.missiles.maxSpeed;
    } else {
        // Missile still accelerating
        const timeToRange = Math.sqrt(2 * range / a);
        return a * timeToRange;
    }
}

// ==================== SIMULATION ====================

class AccurateMissileSimulation {
    constructor(engagementRange) {
        this.engagementRange = engagementRange;
        this.pdRange = DEFENDER.pointDefense.range;

        // Calculate missile velocity at this range
        this.missileVelocity = calculateMissileVelocityAtRange(engagementRange);

        // Calculate PD engagement window
        this.engagementWindow = this.pdRange / this.missileVelocity;

        // PD turret state
        this.turrets = [];
        for (let i = 0; i < DEFENDER.pointDefense.activeTurrets; i++) {
            this.turrets.push({
                id: i,
                heat: 0,
                active: true,
                roundsFired: 0,
            });
        }

        // Missile state
        this.missiles = [];
        for (let i = 0; i < ATTACKER.missiles.count; i++) {
            this.missiles.push({
                id: i,
                alive: true,
                hitsReceived: 0,
            });
        }

        // Stats
        this.stats = {
            totalRoundsFired: 0,
            totalHits: 0,
            missilesDestroyed: 0,
            missilesPenetrated: 0,
            turretShutdowns: 0,
            totalShieldDamage: 0,
            totalArmorDamage: 0,
        };

        // Shield/armor state
        this.shieldFaces = Array(6).fill(100);
        this.armorBlocks = Array(32).fill(7500);
    }

    simulatePDEngagement() {
        // Simulate engagement in 0.1 second time steps
        const timeStep = 0.1;
        const steps = Math.ceil(this.engagementWindow / timeStep);

        for (let step = 0; step < steps; step++) {
            const deltaTime = Math.min(timeStep, this.engagementWindow - step * timeStep);

            // Update each turret
            for (const turret of this.turrets) {
                if (turret.active) {
                    // Fire at assigned missiles
                    const roundsThisStep = DEFENDER.pointDefense.rateOfFire * deltaTime;
                    turret.roundsFired += roundsThisStep;
                    this.stats.totalRoundsFired += roundsThisStep;

                    // Update heat
                    turret.heat += roundsThisStep / 100 * DEFENDER.pointDefense.heatPerHundredRounds;

                    // Check for shutdown
                    const shutdownChance = turret.heat * DEFENDER.pointDefense.shutdownChancePerHeat * deltaTime;
                    if (Math.random() < shutdownChance) {
                        turret.active = false;
                        this.stats.turretShutdowns++;
                    }

                    // Distribute fire to missiles
                    const aliveMissiles = this.missiles.filter(m => m.alive);
                    if (aliveMissiles.length > 0) {
                        // Each turret engages ~2 missiles (32 missiles / 16 turrets)
                        const missilesPerTurret = Math.ceil(aliveMissiles.length / DEFENDER.pointDefense.activeTurrets);
                        const startIdx = turret.id * missilesPerTurret;
                        const myMissiles = aliveMissiles.slice(startIdx, startIdx + missilesPerTurret);

                        for (const missile of myMissiles) {
                            const roundsPerMissile = roundsThisStep / myMissiles.length;
                            const hits = roundsPerMissile * DEFENDER.pointDefense.accuracy;
                            missile.hitsReceived += hits;
                            this.stats.totalHits += hits;

                            // Check if missile destroyed (1 hit = kill)
                            if (missile.hitsReceived >= 1.0 && missile.alive) {
                                missile.alive = false;
                                this.stats.missilesDestroyed++;
                            }
                        }
                    }
                } else {
                    // Turret shut down - cooling
                    turret.heat -= DEFENDER.pointDefense.cooldownRate * deltaTime;
                    if (turret.heat <= 0) {
                        turret.heat = 0;
                        turret.active = true; // Restart firing
                    }
                }
            }
        }

        // Count survivors
        this.stats.missilesPenetrated = this.missiles.filter(m => m.alive).length;
    }

    applyMissileDamage() {
        const survivors = this.missiles.filter(m => m.alive).length;

        for (let i = 0; i < survivors; i++) {
            const damage = ATTACKER.missiles.damage;
            const faceIndex = Math.floor(Math.random() * 6);

            if (this.shieldFaces[faceIndex] > 0) {
                const shieldDamage = damage / DEFENDER.shields.damageReduction;
                this.shieldFaces[faceIndex] -= shieldDamage;
                this.stats.totalShieldDamage += shieldDamage;

                if (this.shieldFaces[faceIndex] <= 0) {
                    // Shield collapsed - excess penetrates
                    const excess = Math.abs(this.shieldFaces[faceIndex]) * DEFENDER.shields.damageReduction;
                    this.shieldFaces[faceIndex] = 0;

                    // Apply to armor
                    const blockIndex = Math.floor(Math.random() * 32);
                    this.armorBlocks[blockIndex] -= excess;
                    this.stats.totalArmorDamage += excess;
                }
            } else {
                // Shield down - direct armor hit
                const blockIndex = Math.floor(Math.random() * 32);
                this.armorBlocks[blockIndex] -= damage;
                this.stats.totalArmorDamage += damage;
            }
        }
    }

    run() {
        this.simulatePDEngagement();
        this.applyMissileDamage();
    }

    report() {
        console.log("=".repeat(70));
        console.log(`BB vs BB MISSILE SALVO - FINAL ACCURATE MODEL`);
        console.log(`Engagement Range: ${(this.engagementRange / 1000).toFixed(1)}km`);
        console.log("=".repeat(70));
        console.log("");

        console.log("MISSILE PARAMETERS");
        console.log("-".repeat(70));
        console.log(`Salvo Size: ${ATTACKER.missiles.count} missiles (simultaneous arrival)`);
        console.log(`Missile Velocity at ${(this.engagementRange/1000).toFixed(1)}km: ${this.missileVelocity.toFixed(0)} m/s`);
        console.log(`Missile Damage: ${ATTACKER.missiles.damage} HP each`);
        console.log("");

        console.log("POINT DEFENSE ENGAGEMENT");
        console.log("-".repeat(70));
        console.log(`Active PD Turrets: ${DEFENDER.pointDefense.activeTurrets} / ${DEFENDER.pointDefense.totalTurrets} (50% coverage)`);
        console.log(`PD Range: ${this.pdRange}m (${(this.pdRange/1000).toFixed(1)}km)`);
        console.log(`Engagement Window: ${this.engagementWindow.toFixed(2)} seconds`);
        console.log(`ROF per Turret: ${DEFENDER.pointDefense.rateOfFire} rounds/sec`);
        console.log(`Accuracy: ${(DEFENDER.pointDefense.accuracy * 100).toFixed(0)}%`);
        console.log("");
        console.log(`Missiles per Turret: ${(ATTACKER.missiles.count / DEFENDER.pointDefense.activeTurrets).toFixed(1)}`);
        console.log(`Theoretical Rounds per Missile: ${(DEFENDER.pointDefense.activeTurrets * DEFENDER.pointDefense.rateOfFire * this.engagementWindow / ATTACKER.missiles.count).toFixed(1)}`);
        console.log(`Expected Hits per Missile: ${(DEFENDER.pointDefense.activeTurrets * DEFENDER.pointDefense.rateOfFire * this.engagementWindow * DEFENDER.pointDefense.accuracy / ATTACKER.missiles.count).toFixed(2)}`);
        console.log("");

        console.log("RESULTS");
        console.log("-".repeat(70));
        console.log(`Total Rounds Fired: ${this.stats.totalRoundsFired.toFixed(0)}`);
        console.log(`Total Hits: ${this.stats.totalHits.toFixed(1)}`);
        console.log(`Turret Shutdowns: ${this.stats.turretShutdowns}`);
        console.log("");
        console.log(`Missiles Destroyed: ${this.stats.missilesDestroyed} / ${ATTACKER.missiles.count} (${(this.stats.missilesDestroyed / ATTACKER.missiles.count * 100).toFixed(1)}%)`);
        console.log(`Missiles Penetrated: ${this.stats.missilesPenetrated} / ${ATTACKER.missiles.count} (${(this.stats.missilesPenetrated / ATTACKER.missiles.count * 100).toFixed(1)}%)`);
        console.log("");

        console.log("DAMAGE ASSESSMENT");
        console.log("-".repeat(70));
        console.log(`Shield Damage: ${this.stats.totalShieldDamage.toFixed(1)}%`);

        const collapsedFaces = this.shieldFaces.filter(hp => hp <= 0).length;
        console.log(`Shield Faces Collapsed: ${collapsedFaces} / 6`);

        console.log(`Armor Damage: ${this.stats.totalArmorDamage.toFixed(0)} HP`);
        const blocksDestroyed = this.armorBlocks.filter(hp => hp <= 0).length;
        console.log(`Armor Blocks Destroyed: ${blocksDestroyed} / 32`);

        const totalDamage = this.stats.totalArmorDamage + (this.stats.totalShieldDamage * 10);
        console.log(`Total Effective Damage: ${totalDamage.toFixed(0)} HP (${(totalDamage / 800000 * 100).toFixed(2)}% of ship)`);
        console.log("");

        let status;
        if (blocksDestroyed > 25) status = "CRITICALLY DAMAGED";
        else if (blocksDestroyed > 16) status = "HEAVILY DAMAGED";
        else if (blocksDestroyed > 5) status = "DAMAGED";
        else status = "OPERATIONAL";

        console.log(`Ship Status: ${status}`);
        console.log("");
        console.log("=".repeat(70));

        return this.stats;
    }
}

// ==================== RUN SIMULATIONS ====================

console.log("\n" + "=".repeat(70));
console.log("BB MISSILE SALVO EFFECTIVENESS AT DIFFERENT RANGES");
console.log("=".repeat(70) + "\n");

const ranges = [10000, 15000, 20000, 30000, 40000]; // 10km to 40km

for (const range of ranges) {
    const sim = new AccurateMissileSimulation(range);
    sim.run();
    sim.report();
    console.log("\n");
}

// Monte Carlo at typical range (20km)
console.log("=".repeat(70));
console.log("MONTE CARLO ANALYSIS: 20km Engagement (100 trials)");
console.log("=".repeat(70) + "\n");

const results = {
    destroyed: [],
    penetrated: [],
    shutdowns: [],
    damage: [],
};

for (let trial = 0; trial < 100; trial++) {
    const sim = new AccurateMissileSimulation(20000);
    sim.run();

    results.destroyed.push(sim.stats.missilesDestroyed);
    results.penetrated.push(sim.stats.missilesPenetrated);
    results.shutdowns.push(sim.stats.turretShutdowns);
    const totalDmg = sim.stats.totalArmorDamage + (sim.stats.totalShieldDamage * 10);
    results.damage.push(totalDmg);
}

const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
const stdDev = arr => {
    const mean = avg(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
};

console.log(`Average Missiles Destroyed: ${avg(results.destroyed).toFixed(1)} ± ${stdDev(results.destroyed).toFixed(1)}`);
console.log(`Average Missiles Penetrated: ${avg(results.penetrated).toFixed(1)} ± ${stdDev(results.penetrated).toFixed(1)}`);
console.log(`Average Turret Shutdowns: ${avg(results.shutdowns).toFixed(1)} ± ${stdDev(results.shutdowns).toFixed(1)}`);
console.log(`Average Total Damage: ${avg(results.damage).toFixed(0)} HP (${(avg(results.damage) / 800000 * 100).toFixed(2)}%)`);
console.log("");

const avgPenetration = avg(results.penetrated);
const penetrationPercent = avgPenetration / ATTACKER.missiles.count * 100;

console.log("TACTICAL SUMMARY");
console.log("-".repeat(70));
console.log(`PD Effectiveness: ${(100 - penetrationPercent).toFixed(1)}% kill rate`);
console.log(`Expected Penetration: ${avgPenetration.toFixed(1)} missiles per 32-missile salvo`);
console.log(`Expected Damage: ${avg(results.damage).toFixed(0)} HP per salvo`);
console.log("");

if (penetrationPercent > 50) {
    console.log("⚠ WARNING: Majority of missiles penetrate PD");
    console.log("  Defender requires multiple salvos to be destroyed");
} else if (penetrationPercent > 25) {
    console.log("⚠ CAUTION: Significant missile penetration");
    console.log("  3-5 salvos likely to destroy defender");
} else if (penetrationPercent > 10) {
    console.log("✓ PD is effective but not impenetrable");
    console.log("  5-10 salvos to destroy defender");
} else {
    console.log("✓ PD is highly effective");
    console.log("  10+ salvos required to destroy defender");
}

console.log("");
console.log("=".repeat(70));
