/**
 * BB vs BB Broadside Laser Effectiveness Model
 *
 * Scenario: One BB fires all broadside lasers at another BB
 * Defender: Flicker shields only (no armor, no PD - pure shield test)
 *
 * Key Parameters from dogfight.html:
 * - 40 broadside laser banks (20 port + 20 starboard)
 * - 100 damage per bank at 1km
 * - 1 second rate of fire (1 volley/second)
 * - 0% shield penetration (line 9688: laser_bank does 0 damage when blocked)
 * - Shields: 6 faces, 100% each, recharge 0.25%/sec after 4sec delay
 */

// ==================== CONFIGURATION ====================
const ATTACKER = {
    lasers: {
        banks: 40,              // Total broadside banks
        portBanks: 20,          // Port side
        starboardBanks: 20,     // Starboard side
        baseDamage: 100,        // Damage per bank
        rateOfFire: 1.0,        // 1 second between volleys
        shieldPenetration: 0.0, // 0% penetration (line 9688)
        range: {
            min: 1000,          // 1km optimal
            max: 21000          // 21km (damage drops to 0)
        }
    }
};

const DEFENDER = {
    shields: {
        faces: 6,
        maxHpPerFace: 100,
        damageReduction: 10,      // Shields divide damage by 10
        rechargeRate: 0.25,       // %/sec
        rechargeDelay: 4.0,       // seconds after last hit
    },
    armor: {
        blocks: 32,
        hpPerBlock: 7500,
        totalHp: 240000,
    },
};

// ==================== SIMULATION ====================

class LaserVsShieldsSimulation {
    constructor(engagementRange = 5000) {
        this.engagementRange = engagementRange; // meters
        this.currentTime = 0;
        this.simulationDuration = 300; // 5 minutes max

        // Calculate damage based on range (linear falloff)
        const rangeRatio = Math.max(0, 1 - (engagementRange - ATTACKER.lasers.range.min) /
                                          (ATTACKER.lasers.range.max - ATTACKER.lasers.range.min));
        this.damagePerBank = ATTACKER.lasers.baseDamage * rangeRatio;

        // Stats
        this.stats = {
            volleys: 0,
            totalDamageDealt: 0,
            totalDamageToShields: 0,
            totalDamageToArmor: 0,
            shieldCollapses: 0,
            timeToFirstCollapse: null,
            timeToAllCollapsed: null,
        };

        // State
        this.shieldFaces = Array(6).fill(100);
        this.armorBlocks = Array(32).fill(7500);
        this.shieldRechargeTimers = Array(6).fill(0);
    }

    fireVolley() {
        this.stats.volleys++;

        // All 40 banks fire simultaneously
        const totalDamage = ATTACKER.lasers.banks * this.damagePerBank;
        this.stats.totalDamageDealt += totalDamage;

        // Distribute damage randomly across shield faces
        // In practice, would hit 1-2 faces based on angle, but let's model random distribution
        const hitsPerFace = new Array(6).fill(0);

        // Simulate each laser hitting a random face
        for (let i = 0; i < ATTACKER.lasers.banks; i++) {
            const faceIndex = Math.floor(Math.random() * 6);
            hitsPerFace[faceIndex]++;
        }

        // Apply damage to each face
        let totalPenetratingDamage = 0;

        for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
            if (hitsPerFace[faceIndex] === 0) continue;

            const damage = hitsPerFace[faceIndex] * this.damagePerBank;
            const penetratingDamage = this.applyShieldDamage(damage, faceIndex);
            totalPenetratingDamage += penetratingDamage;
        }

        // Apply penetrating damage to armor
        if (totalPenetratingDamage > 0) {
            this.applyArmorDamage(totalPenetratingDamage);
        }

        // Check if all shields collapsed
        const collapsedCount = this.shieldFaces.filter(hp => hp <= 0).length;
        if (collapsedCount === 6 && this.stats.timeToAllCollapsed === null) {
            this.stats.timeToAllCollapsed = this.currentTime;
        }
    }

    applyShieldDamage(damage, faceIndex) {
        const face = this.shieldFaces[faceIndex];

        if (face > 0) {
            // Shields divide damage by 10 (line 9656)
            const shieldDamage = damage / DEFENDER.shields.damageReduction;
            this.shieldFaces[faceIndex] -= shieldDamage;
            this.stats.totalDamageToShields += shieldDamage;

            // Reset recharge timer
            this.shieldRechargeTimers[faceIndex] = DEFENDER.shields.rechargeDelay;

            if (this.shieldFaces[faceIndex] <= 0) {
                // Shield face collapsed
                if (this.stats.timeToFirstCollapse === null) {
                    this.stats.timeToFirstCollapse = this.currentTime;
                }
                this.stats.shieldCollapses++;

                // Calculate excess damage that penetrates
                const excessDamage = Math.abs(this.shieldFaces[faceIndex]) *
                                    DEFENDER.shields.damageReduction;
                this.shieldFaces[faceIndex] = 0;
                return excessDamage;
            }

            // Shield held - 0% penetration for laser_bank weapons (line 9688)
            return 0;
        } else {
            // Shield already down - all damage penetrates
            return damage;
        }
    }

    applyArmorDamage(damage) {
        // Randomly distribute damage across armor blocks
        const damagePerBlock = damage / DEFENDER.armor.blocks;

        for (let i = 0; i < DEFENDER.armor.blocks; i++) {
            this.armorBlocks[i] -= damagePerBlock;
            this.stats.totalDamageToArmor += damagePerBlock;
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

    run() {
        const volleyInterval = ATTACKER.lasers.rateOfFire;

        while (this.currentTime < this.simulationDuration) {
            // Fire volley
            this.fireVolley();

            // Advance time
            const deltaTime = volleyInterval;
            this.updateShieldRecharge(deltaTime);
            this.currentTime += deltaTime;

            // Check termination conditions
            const allShieldsDown = this.shieldFaces.every(hp => hp <= 0);
            const allArmorDestroyed = this.armorBlocks.every(hp => hp <= 0);

            if (allArmorDestroyed) {
                break; // Ship destroyed
            }

            // Stop if shields are stable (can recharge faster than damage)
            if (this.currentTime > 60 && !allShieldsDown) {
                // Check if shields have stabilized
                const avgShield = this.shieldFaces.reduce((a, b) => a + b, 0) / 6;
                if (avgShield > 50) {
                    // Shields holding steady
                    break;
                }
            }
        }
    }

    report() {
        console.log("=".repeat(70));
        console.log("BB BROADSIDE LASER vs FLICKER SHIELDS");
        console.log("=".repeat(70));
        console.log("");

        console.log("ENGAGEMENT PARAMETERS");
        console.log("-".repeat(70));
        console.log(`Range: ${this.engagementRange}m (${(this.engagementRange / 1000).toFixed(1)}km)`);
        console.log(`Damage per Bank: ${this.damagePerBank.toFixed(1)} HP`);
        console.log(`Total Damage per Volley: ${(ATTACKER.lasers.banks * this.damagePerBank).toFixed(0)} HP`);
        console.log(`Volleys per Second: ${(1 / ATTACKER.lasers.rateOfFire).toFixed(1)}`);
        console.log(`DPS (Damage per Second): ${(ATTACKER.lasers.banks * this.damagePerBank / ATTACKER.lasers.rateOfFire).toFixed(0)} HP/sec`);
        console.log(`Shield Penetration: ${(ATTACKER.lasers.shieldPenetration * 100).toFixed(0)}%`);
        console.log("");

        console.log("SIMULATION RESULTS");
        console.log("-".repeat(70));
        console.log(`Simulation Duration: ${this.currentTime.toFixed(1)} seconds`);
        console.log(`Total Volleys Fired: ${this.stats.volleys}`);
        console.log(`Total Damage Output: ${this.stats.totalDamageDealt.toFixed(0)} HP`);
        console.log("");

        console.log("SHIELD PERFORMANCE");
        console.log("-".repeat(70));
        console.log(`Total Shield Damage: ${this.stats.totalDamageToShields.toFixed(1)}%`);
        console.log(`Shield Faces Collapsed: ${this.stats.shieldCollapses}`);
        if (this.stats.timeToFirstCollapse !== null) {
            console.log(`Time to First Collapse: ${this.stats.timeToFirstCollapse.toFixed(1)} seconds`);
        }
        if (this.stats.timeToAllCollapsed !== null) {
            console.log(`Time to All Collapsed: ${this.stats.timeToAllCollapsed.toFixed(1)} seconds`);
        }
        console.log("");

        console.log("Current Shield Status:");
        this.shieldFaces.forEach((hp, i) => {
            const status = hp > 0 ? `ACTIVE (${hp.toFixed(1)}%)` : "COLLAPSED";
            console.log(`  Face ${i + 1}: ${status}`);
        });
        console.log("");

        console.log("ARMOR IMPACT");
        console.log("-".repeat(70));
        console.log(`Total Armor Damage: ${this.stats.totalDamageToArmor.toFixed(0)} HP`);
        console.log(`Armor Integrity: ${((DEFENDER.armor.totalHp - this.stats.totalDamageToArmor) / DEFENDER.armor.totalHp * 100).toFixed(1)}%`);

        const blocksDestroyed = this.armorBlocks.filter(hp => hp <= 0).length;
        console.log(`Armor Blocks Destroyed: ${blocksDestroyed} / 32`);
        console.log("");

        console.log("=".repeat(70));
        console.log("ASSESSMENT");
        console.log("=".repeat(70));

        const shieldEffectiveness = (this.stats.totalDamageToShields * 10) / this.stats.totalDamageDealt * 100;
        console.log(`Shield Absorption Rate: ${shieldEffectiveness.toFixed(1)}%`);

        const allShieldsDown = this.shieldFaces.every(hp => hp <= 0);

        if (allShieldsDown) {
            console.log(`Status: ALL SHIELDS COLLAPSED at t=${this.stats.timeToAllCollapsed?.toFixed(1)}s`);
            console.log(`Result: Defender exposed to direct armor damage`);
        } else {
            console.log(`Status: SHIELDS HOLDING`);
            console.log(`Result: Defender shields absorbing sustained fire`);
        }

        // Calculate equilibrium
        const damagePerSecond = ATTACKER.lasers.banks * this.damagePerBank / ATTACKER.lasers.rateOfFire;
        const shieldDamagePerSecond = damagePerSecond / DEFENDER.shields.damageReduction;
        const shieldRechargePerSecond = DEFENDER.shields.rechargeRate;

        console.log("");
        console.log("EQUILIBRIUM ANALYSIS");
        console.log("-".repeat(70));
        console.log(`Incoming Damage per Second: ${shieldDamagePerSecond.toFixed(2)}% shield/sec`);
        console.log(`Shield Recharge Rate: ${shieldRechargePerSecond.toFixed(2)}% shield/sec`);
        console.log(`Net Drain per Second: ${(shieldDamagePerSecond - shieldRechargePerSecond).toFixed(2)}% shield/sec`);

        if (shieldDamagePerSecond < shieldRechargePerSecond) {
            console.log(`Conclusion: Shields can RECHARGE faster than damage (impossible with 4s delay)`);
        } else {
            const timeToDepleteFace = 100 / shieldDamagePerSecond;
            console.log(`Conclusion: Shields CANNOT sustain indefinitely`);
            console.log(`Time to deplete 1 face: ${timeToDepleteFace.toFixed(1)} seconds (if focused)`);
        }

        console.log("");
        console.log("=".repeat(70));

        return this.stats;
    }
}

// ==================== RUN SIMULATIONS AT DIFFERENT RANGES ====================

console.log("\n" + "=".repeat(70));
console.log("BROADSIDE LASER EFFECTIVENESS vs FLICKER SHIELDS");
console.log("Testing at different engagement ranges");
console.log("=".repeat(70) + "\n");

const ranges = [
    { range: 1000, label: "1km (Point Blank - Maximum Damage)" },
    { range: 5000, label: "5km (Typical Broadside Range)" },
    { range: 10000, label: "10km (Medium Range)" },
    { range: 15000, label: "15km (Long Range)" },
    { range: 20000, label: "20km (Extreme Range - Low Damage)" },
];

const rangeResults = [];

for (const { range, label } of ranges) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`ENGAGEMENT AT ${label}`);
    console.log("=".repeat(70) + "\n");

    const sim = new LaserVsShieldsSimulation(range);
    sim.run();
    const stats = sim.report();

    rangeResults.push({
        range,
        label,
        timeToCollapse: stats.timeToAllCollapsed,
        totalDamage: stats.totalDamageToArmor,
    });
}

// Summary comparison
console.log("\n\n" + "=".repeat(70));
console.log("RANGE EFFECTIVENESS SUMMARY");
console.log("=".repeat(70));
console.log("");

console.log("Range | Time to Collapse All Shields | Armor Damage");
console.log("-".repeat(70));

for (const result of rangeResults) {
    const timeStr = result.timeToCollapse ? `${result.timeToCollapse.toFixed(1)}s` : "N/A (shields held)";
    const dmgStr = result.totalDamage > 0 ? `${result.totalDamage.toFixed(0)} HP` : "0 HP (shields held)";
    console.log(`${result.label.padEnd(40)} | ${timeStr.padEnd(23)} | ${dmgStr}`);
}

console.log("");
console.log("=".repeat(70));
console.log("KEY FINDINGS");
console.log("=".repeat(70));
console.log("");
console.log("1. Broadside lasers do 0% damage through intact shields (line 9688)");
console.log("2. Shields divide incoming damage by 10 before absorbing");
console.log("3. Shields cannot recharge during sustained fire (4-second delay)");
console.log("4. Closer range = higher damage = faster shield collapse");
console.log("5. Once shields collapse, armor takes full damage directly");
console.log("");
console.log("=".repeat(70));
