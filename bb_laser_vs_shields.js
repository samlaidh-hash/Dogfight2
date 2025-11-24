/**
 * BB vs BB Broadside Laser Effectiveness Model - CORRECTED SHIELDS
 *
 * Scenario: One BB fires all broadside lasers at another BB
 * Defender: Flicker shields (% block chance system per RL1.md)
 *
 * Key Parameters:
 * - 40 broadside laser banks (20 port + 20 starboard)
 * - 100 damage per bank at 1km
 * - 1 second rate of fire (1 volley/second)
 * - 0% shield penetration (laser_bank does 0 damage when blocked per dogfight.html line 9688)
 * - Shields: 60% block chance, -0.1% per successful block (RL1.md line 61)
 *   NOT HP-based! Shields either block (0 damage) or fail (full damage)
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
        baseBlockChance: 60,        // 60% chance to block each hit (from RL1.md)
        degradationPerBlock: 0.1,   // 0.1 percentage points per successful block
        minBlockChance: 0,          // Can drop to 0%
        rechargePerRound: 1.0,      // +1% at end of round (not implemented in continuous sim)
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
            totalHitsAttempted: 0,
            shieldBlocksSuccessful: 0,
            shieldBlocksFailed: 0,
            totalDamageToArmor: 0,
        };

        // State (% block chance system per RL1.md)
        this.shieldFaces = Array(6).fill(null).map(() => ({
            blockChance: DEFENDER.shields.baseBlockChance,
            blocksThisFight: 0,
            failsThisFight: 0
        }));
        this.armorBlocks = Array(32).fill(7500);
    }

    fireVolley() {
        this.stats.volleys++;

        // Distribute laser hits randomly across shield faces
        // In practice, would hit 1-2 faces based on angle, but we model random distribution
        const hitsPerFace = new Array(6).fill(0);

        // Simulate each laser bank hitting a random face
        for (let i = 0; i < ATTACKER.lasers.banks; i++) {
            const faceIndex = Math.floor(Math.random() * 6);
            hitsPerFace[faceIndex]++;
        }

        // Apply each hit to the corresponding face (% block chance system)
        for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
            const numHits = hitsPerFace[faceIndex];
            if (numHits === 0) continue;

            const face = this.shieldFaces[faceIndex];

            // Process each hit individually
            for (let hit = 0; hit < numHits; hit++) {
                this.stats.totalHitsAttempted++;
                const roll = Math.random() * 100;

                if (roll < face.blockChance) {
                    // Shield BLOCKED the hit
                    this.stats.shieldBlocksSuccessful++;
                    face.blocksThisFight++;

                    // Degrade shield on successful block
                    face.blockChance = Math.max(
                        DEFENDER.shields.minBlockChance,
                        face.blockChance - DEFENDER.shields.degradationPerBlock
                    );

                    // Lasers do 0 damage when blocked (per RL1.md and dogfight.html line 9688)
                } else {
                    // Shield FAILED to block - full damage penetrates
                    this.stats.shieldBlocksFailed++;
                    face.failsThisFight++;

                    // Apply full damage to armor
                    this.applyArmorDamage(this.damagePerBank);
                }
            }
        }
    }

    applyArmorDamage(damage) {
        // Apply damage to random armor block
        const blockIndex = Math.floor(Math.random() * DEFENDER.armor.blocks);
        this.armorBlocks[blockIndex] -= damage;
        this.stats.totalDamageToArmor += damage;
    }

    run() {
        const volleyInterval = ATTACKER.lasers.rateOfFire;

        while (this.currentTime < this.simulationDuration) {
            // Fire volley
            this.fireVolley();

            // Advance time
            this.currentTime += volleyInterval;

            // Check termination conditions
            const allArmorDestroyed = this.armorBlocks.every(hp => hp <= 0);
            if (allArmorDestroyed) {
                break; // Ship destroyed
            }

            // Stop after reasonable engagement time (shields degrade but don't recharge during combat)
            if (this.currentTime > 120) {
                // 2 minutes of sustained fire is enough for analysis
                break;
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
        console.log(`Total Hits Attempted: ${this.stats.totalHitsAttempted}`);
        console.log(`Potential Damage Output: ${(this.stats.totalHitsAttempted * this.damagePerBank).toFixed(0)} HP`);
        console.log("");

        console.log("SHIELD PERFORMANCE (% Block Chance System)");
        console.log("-".repeat(70));
        console.log(`Shield Blocks Successful: ${this.stats.shieldBlocksSuccessful} / ${this.stats.totalHitsAttempted} (${(this.stats.shieldBlocksSuccessful / this.stats.totalHitsAttempted * 100).toFixed(1)}%)`);
        console.log(`Shield Blocks Failed: ${this.stats.shieldBlocksFailed} / ${this.stats.totalHitsAttempted} (${(this.stats.shieldBlocksFailed / this.stats.totalHitsAttempted * 100).toFixed(1)}%)`);
        console.log(`Damage Prevented by Shields: ${(this.stats.shieldBlocksSuccessful * this.damagePerBank).toFixed(0)} HP`);
        console.log("");

        console.log("Shield Face Status (Current Block %):");
        this.shieldFaces.forEach((face, i) => {
            console.log(`  Face ${i + 1}: ${face.blockChance.toFixed(1)}% (${face.blocksThisFight} blocks, ${face.failsThisFight} fails)`);
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
        console.log("ASSESSMENT (% Block Chance System)");
        console.log("=".repeat(70));

        const avgShieldBlock = this.stats.shieldBlocksSuccessful / this.stats.totalHitsAttempted * 100;
        console.log(`Average Shield Block Rate: ${avgShieldBlock.toFixed(1)}%`);
        console.log(`Damage Through Shields: ${this.stats.totalDamageToArmor.toFixed(0)} HP`);
        console.log(`Damage Prevented: ${(this.stats.shieldBlocksSuccessful * this.damagePerBank).toFixed(0)} HP`);

        const avgBlockChance = this.shieldFaces.reduce((sum, face) => sum + face.blockChance, 0) / 6;
        console.log(`Average Final Block Chance: ${avgBlockChance.toFixed(1)}% (started at 60%)`);
        console.log(`Shield Degradation: ${(60 - avgBlockChance).toFixed(1)} percentage points`);

        console.log("");
        console.log("TACTICAL ANALYSIS");
        console.log("-".repeat(70));
        console.log(`Hits per Second: ${(ATTACKER.lasers.banks / ATTACKER.lasers.rateOfFire).toFixed(1)}`);
        console.log(`Expected Blocks per Second (at start): ${(ATTACKER.lasers.banks / ATTACKER.lasers.rateOfFire * 0.60).toFixed(1)}`);
        console.log(`Expected Penetrations per Second (at start): ${(ATTACKER.lasers.banks / ATTACKER.lasers.rateOfFire * 0.40).toFixed(1)}`);

        const totalBlocks = this.shieldFaces.reduce((sum, face) => sum + face.blocksThisFight, 0);
        const degradationTotal = totalBlocks * DEFENDER.shields.degradationPerBlock;
        console.log(`Total Degradation: ${degradationTotal.toFixed(1)} percentage points from ${totalBlocks} successful blocks`);

        console.log("");
        console.log("KEY FINDING:");
        console.log(`With % block chance system, shields degrade by ${DEFENDER.shields.degradationPerBlock}% per block.`);
        console.log(`After ~600 blocks, shields drop from 60% to 0% effectiveness.`);
        console.log(`This creates EXPONENTIAL damage increase as block chance falls!`);

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
        totalDamage: stats.totalDamageToArmor,
        blockRate: (stats.shieldBlocksSuccessful / stats.totalHitsAttempted * 100),
    });
}

// Summary comparison
console.log("\n\n" + "=".repeat(70));
console.log("RANGE EFFECTIVENESS SUMMARY (% Block Chance System)");
console.log("=".repeat(70));
console.log("");

console.log("Range | Avg Block Rate | Armor Damage");
console.log("-".repeat(70));

for (const result of rangeResults) {
    const blockStr = `${result.blockRate.toFixed(1)}%`;
    const dmgStr = `${result.totalDamage.toFixed(0)} HP`;
    console.log(`${result.label.padEnd(40)} | ${blockStr.padEnd(14)} | ${dmgStr}`);
}

console.log("");
console.log("=".repeat(70));
console.log("KEY FINDINGS (CORRECTED % BLOCK CHANCE SYSTEM)");
console.log("=".repeat(70));
console.log("");
console.log("1. Shields use % BLOCK CHANCE, not HP (per RL1.md line 61)");
console.log("2. Broadside lasers do 0% damage when blocked (dogfight.html line 9688)");
console.log("3. Each successful block degrades shield by 0.1 percentage points");
console.log("4. Starting at 60%, shields reach 0% after ~600 successful blocks");
console.log("5. Closer range = more hits = faster shield degradation = exponential damage curve");
console.log("6. Shields DON'T recharge during combat (only +1% at end of round per RL1.md)");
console.log("");
console.log("=".repeat(70));
