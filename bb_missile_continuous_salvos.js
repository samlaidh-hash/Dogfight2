/**
 * BB vs BB Continuous Missile Salvos
 *
 * Scenario: 1,600 missiles in 50 salvos of 32 missiles each
 * Models sustained barrage with PD heat accumulation and shield/armor degradation
 */

// ==================== CONFIGURATION ====================
const ATTACKER = {
    missiles: {
        salvoSize: 32,
        totalSalvos: 50,        // 50 × 32 = 1,600 missiles
        totalMissiles: 1600,
        damage: 200,
        acceleration: 30 * 9.81,
        burnTime: 20,
        maxSpeed: 30 * 9.81 * 20, // 5,886 m/s
        salvoInterval: 1.0,      // 1 second between salvos
    }
};

const DEFENDER = {
    pointDefense: {
        totalTurrets: 32,
        activeTurrets: 16,
        rateOfFire: 100,
        accuracy: 0.15,
        damagePerHit: 100,
        range: 3000,

        // Heat model
        heatPerHundredRounds: 1,
        shutdownChancePerHeat: 0.001,
        cooldownRate: 3,
    },
    shields: {
        faces: 6,
        maxHpPerFace: 100,
        damageReduction: 10,
        rechargeRate: 0.25,
        rechargeDelay: 4.0,

        // Shield degradation under sustained fire
        degradationPerHit: 0.1,  // Max HP reduces by 0.1% per hit
        minEffectiveness: 0.10,  // Shields can't drop below 10% effectiveness
    },
    armor: {
        blocks: 32,
        hpPerBlock: 7500,
        totalHp: 240000,
    },
};

// ==================== MISSILE KINEMATICS ====================

function calculateMissileVelocityAtRange(range) {
    const a = ATTACKER.missiles.acceleration;
    const maxDistance = 0.5 * a * ATTACKER.missiles.burnTime ** 2;

    if (range >= maxDistance) {
        return ATTACKER.missiles.maxSpeed;
    } else {
        const timeToRange = Math.sqrt(2 * range / a);
        return a * timeToRange;
    }
}

// ==================== CONTINUOUS SALVO SIMULATION ====================

class ContinuousSalvoSimulation {
    constructor(engagementRange) {
        this.engagementRange = engagementRange;
        this.pdRange = DEFENDER.pointDefense.range;
        this.missileVelocity = calculateMissileVelocityAtRange(engagementRange);
        this.engagementWindow = this.pdRange / this.missileVelocity;

        // PD turret state (persistent across salvos)
        this.turrets = [];
        for (let i = 0; i < DEFENDER.pointDefense.activeTurrets; i++) {
            this.turrets.push({
                id: i,
                heat: 0,
                active: true,
                totalRoundsFired: 0,
                shutdowns: 0,
            });
        }

        // Ship state (degrades over time)
        this.shieldFaces = Array(6).fill(100);
        this.shieldMaxHp = Array(6).fill(100);  // Track degrading max HP
        this.armorBlocks = Array(32).fill(7500);
        this.shieldRechargeTimers = Array(6).fill(0);

        // Stats
        this.stats = {
            salvosProcessed: 0,
            totalMissilesLaunched: 0,
            totalMissilesDestroyed: 0,
            totalMissilesPenetrated: 0,
            totalRoundsFired: 0,
            totalHits: 0,
            totalShutdowns: 0,
            totalShieldDamage: 0,
            totalArmorDamage: 0,
            timeToFirstShieldCollapse: null,
            timeToAllShieldsDown: null,
            timeToShipDestroyed: null,
        };

        this.currentTime = 0;
        this.shipDestroyed = false;
    }

    simulateSalvo(salvoNumber) {
        const salvoTime = salvoNumber * ATTACKER.missiles.salvoInterval;

        // Update shield recharge between salvos
        if (salvoNumber > 0) {
            const deltaTime = ATTACKER.missiles.salvoInterval;
            this.updateShieldRecharge(deltaTime);
            this.coolTurrets(deltaTime);
        }

        this.currentTime = salvoTime;

        // Track missiles in this salvo
        const missiles = [];
        for (let i = 0; i < ATTACKER.missiles.salvoSize; i++) {
            missiles.push({
                id: i,
                alive: true,
                hitsReceived: 0,
            });
        }

        // Simulate PD engagement in time steps
        const timeStep = 0.1;
        const steps = Math.ceil(this.engagementWindow / timeStep);

        for (let step = 0; step < steps; step++) {
            const deltaTime = Math.min(timeStep, this.engagementWindow - step * timeStep);

            // Update each turret
            for (const turret of this.turrets) {
                if (turret.active) {
                    // Fire at assigned missiles
                    const roundsThisStep = DEFENDER.pointDefense.rateOfFire * deltaTime;
                    turret.totalRoundsFired += roundsThisStep;
                    this.stats.totalRoundsFired += roundsThisStep;

                    // Update heat
                    turret.heat += roundsThisStep / 100 * DEFENDER.pointDefense.heatPerHundredRounds;

                    // Check for shutdown
                    const shutdownChance = turret.heat * DEFENDER.pointDefense.shutdownChancePerHeat * deltaTime;
                    if (Math.random() < shutdownChance) {
                        turret.active = false;
                        turret.shutdowns++;
                        this.stats.totalShutdowns++;
                    }

                    // Distribute fire to alive missiles
                    const aliveMissiles = missiles.filter(m => m.alive);
                    if (aliveMissiles.length > 0) {
                        const missilesPerTurret = Math.ceil(aliveMissiles.length / DEFENDER.pointDefense.activeTurrets);
                        const startIdx = turret.id * missilesPerTurret;
                        const myMissiles = aliveMissiles.slice(startIdx, startIdx + missilesPerTurret);

                        for (const missile of myMissiles) {
                            const roundsPerMissile = roundsThisStep / myMissiles.length;
                            const hits = roundsPerMissile * DEFENDER.pointDefense.accuracy;
                            missile.hitsReceived += hits;
                            this.stats.totalHits += hits;

                            if (missile.hitsReceived >= 1.0 && missile.alive) {
                                missile.alive = false;
                                this.stats.totalMissilesDestroyed++;
                            }
                        }
                    }
                }
            }
        }

        // Apply damage from surviving missiles
        const survivors = missiles.filter(m => m.alive).length;
        this.stats.totalMissilesPenetrated += survivors;

        for (let i = 0; i < survivors; i++) {
            this.applyMissileDamage();
        }

        this.stats.salvosProcessed++;
        this.stats.totalMissilesLaunched += ATTACKER.missiles.salvoSize;

        // Check if ship destroyed
        const blocksRemaining = this.armorBlocks.filter(hp => hp > 0).length;
        if (blocksRemaining === 0 && !this.shipDestroyed) {
            this.shipDestroyed = true;
            this.stats.timeToShipDestroyed = this.currentTime;
        }
    }

    applyMissileDamage() {
        const damage = ATTACKER.missiles.damage;
        const faceIndex = Math.floor(Math.random() * 6);

        // Degrade shield max HP (sustained fire weakens shields)
        this.shieldMaxHp[faceIndex] -= DEFENDER.shields.degradationPerHit;
        this.shieldMaxHp[faceIndex] = Math.max(
            DEFENDER.shields.minEffectiveness * 100,
            this.shieldMaxHp[faceIndex]
        );

        if (this.shieldFaces[faceIndex] > 0) {
            const shieldDamage = damage / DEFENDER.shields.damageReduction;
            this.shieldFaces[faceIndex] -= shieldDamage;
            this.stats.totalShieldDamage += shieldDamage;
            this.shieldRechargeTimers[faceIndex] = DEFENDER.shields.rechargeDelay;

            if (this.shieldFaces[faceIndex] <= 0) {
                // Shield collapsed
                if (this.stats.timeToFirstShieldCollapse === null) {
                    this.stats.timeToFirstShieldCollapse = this.currentTime;
                }

                const excess = Math.abs(this.shieldFaces[faceIndex]) * DEFENDER.shields.damageReduction;
                this.shieldFaces[faceIndex] = 0;

                // Apply excess to armor
                const blockIndex = Math.floor(Math.random() * 32);
                this.armorBlocks[blockIndex] -= excess;
                this.stats.totalArmorDamage += excess;

                // Check if all shields down
                if (this.shieldFaces.every(hp => hp <= 0) && this.stats.timeToAllShieldsDown === null) {
                    this.stats.timeToAllShieldsDown = this.currentTime;
                }
            }
        } else {
            // Shield down - direct armor hit
            const blockIndex = Math.floor(Math.random() * 32);
            this.armorBlocks[blockIndex] -= damage;
            this.stats.totalArmorDamage += damage;
        }
    }

    updateShieldRecharge(deltaTime) {
        for (let i = 0; i < 6; i++) {
            if (this.shieldRechargeTimers[i] > 0) {
                this.shieldRechargeTimers[i] -= deltaTime;
            }

            // Recharge up to degraded max HP (not original 100)
            if (this.shieldRechargeTimers[i] <= 0 && this.shieldFaces[i] < this.shieldMaxHp[i]) {
                const recharge = DEFENDER.shields.rechargeRate * deltaTime;
                this.shieldFaces[i] = Math.min(this.shieldMaxHp[i], this.shieldFaces[i] + recharge);
            }
        }
    }

    coolTurrets(deltaTime) {
        for (const turret of this.turrets) {
            if (!turret.active) {
                turret.heat -= DEFENDER.pointDefense.cooldownRate * deltaTime;
                if (turret.heat <= 0) {
                    turret.heat = 0;
                    turret.active = true;
                }
            }
        }
    }

    run() {
        console.log("=".repeat(70));
        console.log("BB CONTINUOUS MISSILE BARRAGE");
        console.log(`Range: ${(this.engagementRange / 1000).toFixed(1)}km, Missile Speed: ${this.missileVelocity.toFixed(0)} m/s`);
        console.log("=".repeat(70));
        console.log("");

        for (let salvoNum = 0; salvoNum < ATTACKER.missiles.totalSalvos; salvoNum++) {
            this.simulateSalvo(salvoNum);

            // Progress update every 10 salvos
            if ((salvoNum + 1) % 10 === 0) {
                const penetrationRate = this.stats.totalMissilesPenetrated / this.stats.totalMissilesLaunched * 100;
                const blocksDestroyed = this.armorBlocks.filter(hp => hp <= 0).length;
                console.log(`Salvo ${salvoNum + 1}/50: ${this.stats.totalMissilesPenetrated} missiles penetrated (${penetrationRate.toFixed(1)}%), ${blocksDestroyed}/32 armor blocks destroyed`);
            }

            if (this.shipDestroyed) {
                console.log(`\n⚠ DEFENDER DESTROYED at salvo ${salvoNum + 1} (t=${this.currentTime.toFixed(1)}s)`);
                break;
            }
        }

        console.log("");
        this.report();
    }

    report() {
        console.log("=".repeat(70));
        console.log("FINAL RESULTS");
        console.log("=".repeat(70));
        console.log("");

        console.log("MISSILES");
        console.log("-".repeat(70));
        console.log(`Total Salvos: ${this.stats.salvosProcessed} / ${ATTACKER.missiles.totalSalvos}`);
        console.log(`Total Missiles: ${this.stats.totalMissilesLaunched}`);
        console.log(`Destroyed by PD: ${this.stats.totalMissilesDestroyed} (${(this.stats.totalMissilesDestroyed / this.stats.totalMissilesLaunched * 100).toFixed(1)}%)`);
        console.log(`Penetrated PD: ${this.stats.totalMissilesPenetrated} (${(this.stats.totalMissilesPenetrated / this.stats.totalMissilesLaunched * 100).toFixed(1)}%)`);
        console.log("");

        console.log("POINT DEFENSE");
        console.log("-".repeat(70));
        console.log(`Total Rounds Fired: ${this.stats.totalRoundsFired.toFixed(0)}`);
        console.log(`Total Hits: ${this.stats.totalHits.toFixed(0)}`);
        console.log(`Hit Rate: ${(this.stats.totalHits / this.stats.totalRoundsFired * 100).toFixed(1)}%`);
        console.log(`Turret Shutdowns: ${this.stats.totalShutdowns}`);
        console.log("");
        console.log("Turret Heat Status:");
        this.turrets.forEach(t => {
            console.log(`  Turret ${t.id}: ${t.heat.toFixed(1)} heat, ${t.shutdowns} shutdowns, ${t.totalRoundsFired.toFixed(0)} rounds fired`);
        });
        console.log("");

        console.log("SHIELDS");
        console.log("-".repeat(70));
        console.log(`Total Shield Damage: ${this.stats.totalShieldDamage.toFixed(1)}%`);
        if (this.stats.timeToFirstShieldCollapse) {
            console.log(`First Shield Collapse: t=${this.stats.timeToFirstShieldCollapse.toFixed(1)}s`);
        }
        if (this.stats.timeToAllShieldsDown) {
            console.log(`All Shields Down: t=${this.stats.timeToAllShieldsDown.toFixed(1)}s`);
        }
        console.log("");
        console.log("Shield Status:");
        this.shieldFaces.forEach((hp, i) => {
            console.log(`  Face ${i + 1}: ${hp.toFixed(1)}% / ${this.shieldMaxHp[i].toFixed(1)}% max (${((this.shieldMaxHp[i]/100)*100).toFixed(0)}% effectiveness)`);
        });
        console.log("");

        console.log("ARMOR");
        console.log("-".repeat(70));
        console.log(`Total Armor Damage: ${this.stats.totalArmorDamage.toFixed(0)} HP`);
        console.log(`Armor Integrity: ${((DEFENDER.armor.totalHp - this.stats.totalArmorDamage) / DEFENDER.armor.totalHp * 100).toFixed(1)}%`);

        const blocksDestroyed = this.armorBlocks.filter(hp => hp <= 0).length;
        const blocksDamaged = this.armorBlocks.filter(hp => hp > 0 && hp < 7500).length;
        const blocksIntact = this.armorBlocks.filter(hp => hp === 7500).length;

        console.log(`Blocks Destroyed: ${blocksDestroyed} / 32`);
        console.log(`Blocks Damaged: ${blocksDamaged} / 32`);
        console.log(`Blocks Intact: ${blocksIntact} / 32`);
        console.log("");

        const totalDamage = this.stats.totalArmorDamage + (this.stats.totalShieldDamage * 10);
        console.log(`Total Effective Damage: ${totalDamage.toFixed(0)} HP (${(totalDamage / 800000 * 100).toFixed(1)}% of ship)`);
        console.log("");

        if (this.shipDestroyed) {
            console.log(`RESULT: DEFENDER DESTROYED at t=${this.stats.timeToShipDestroyed.toFixed(1)}s`);
        } else if (blocksDestroyed > 25) {
            console.log("RESULT: DEFENDER CRITICALLY DAMAGED");
        } else if (blocksDestroyed > 16) {
            console.log("RESULT: DEFENDER HEAVILY DAMAGED");
        } else if (blocksDestroyed > 5) {
            console.log("RESULT: DEFENDER DAMAGED");
        } else {
            console.log("RESULT: DEFENDER OPERATIONAL");
        }

        console.log("");
        console.log("=".repeat(70));
    }
}

// ==================== RUN SIMULATIONS ====================

console.log("\n" + "=".repeat(70));
console.log("CONTINUOUS SALVO EFFECTIVENESS AT DIFFERENT RANGES");
console.log("=".repeat(70) + "\n");

const ranges = [10000, 20000, 30000];

for (const range of ranges) {
    const sim = new ContinuousSalvoSimulation(range);
    sim.run();
    console.log("\n\n");
}

// Monte Carlo at 20km
console.log("=".repeat(70));
console.log("MONTE CARLO: 20km Engagement (20 trials)");
console.log("=".repeat(70) + "\n");

const results = {
    salvosToDestroy: [],
    missilesRequired: [],
    penetrationRate: [],
    shieldCollapseTime: [],
    shipDestroyTime: [],
};

for (let trial = 0; trial < 20; trial++) {
    const sim = new ContinuousSalvoSimulation(20000);

    for (let salvoNum = 0; salvoNum < ATTACKER.missiles.totalSalvos; salvoNum++) {
        sim.simulateSalvo(salvoNum);
        if (sim.shipDestroyed) break;
    }

    if (sim.shipDestroyed) {
        results.salvosToDestroy.push(sim.stats.salvosProcessed);
        results.missilesRequired.push(sim.stats.totalMissilesLaunched);
    }
    results.penetrationRate.push(sim.stats.totalMissilesPenetrated / sim.stats.totalMissilesLaunched * 100);
    if (sim.stats.timeToFirstShieldCollapse) {
        results.shieldCollapseTime.push(sim.stats.timeToFirstShieldCollapse);
    }
    if (sim.stats.timeToShipDestroyed) {
        results.shipDestroyTime.push(sim.stats.timeToShipDestroyed);
    }
}

const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

console.log(`Ships Destroyed: ${results.salvosToDestroy.length} / 20 trials`);
if (results.salvosToDestroy.length > 0) {
    console.log(`Average Salvos to Destroy: ${avg(results.salvosToDestroy).toFixed(1)}`);
    console.log(`Average Missiles to Destroy: ${avg(results.missilesRequired).toFixed(0)}`);
    console.log(`Average Time to Destroy: ${avg(results.shipDestroyTime).toFixed(1)}s`);
}
console.log(`Average Penetration Rate: ${avg(results.penetrationRate).toFixed(1)}%`);
if (results.shieldCollapseTime.length > 0) {
    console.log(`Average Time to First Shield Collapse: ${avg(results.shieldCollapseTime).toFixed(1)}s`);
}
console.log("");
console.log("=".repeat(70));
