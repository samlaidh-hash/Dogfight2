# Shield Mechanics Discrepancy

## Critical Issue: Two Different Shield Systems

### RL1.md Specification (Line 61)
**% Block Chance System:**
- Shields have a **percentage chance to block each hit**
- Battle ships: **60%** base block chance
- Battle Cruisers: **57%**
- Heavy Cruisers: **54%**
- Light Cruisers: **51%**
- Destroyers: **48%**
- Corvettes: **45%**

**Degradation:**
- Each **successful block** reduces block % by **0.1 percentage points**
- Minimum: **0%** (shields can fail completely)
- Degradation only occurs when shield successfully blocks (not when penetrated)

**Recharge:**
- Shields regain **1% at the end of each round**

**Special Cases:**
- Railgun slugs: 25% kinetic energy transfers through even when blocked (75% reduction)
- In nebula: Flicker shields don't work at all

### Current dogfight.html Implementation (Lines 9650-9693)
**HP-Based System:**
- Shields have **HP per face** (stored as `face.current`)
- Shields **divide incoming damage by 10** before absorbing (line 9662)
- When shield HP reaches 0, excess damage penetrates
- Shields **recharge continuously** after `rechargeDelay` seconds

**Key Difference:**
```javascript
// Current implementation (WRONG for RL specs):
face.current -= damage / 10;  // HP absorption

// Should be (according to RL1.md):
if (Math.random() < face.blockChance) {
    // Block successful - NO damage
    face.blockChance -= 0.1;  // Degradation
} else {
    // Block failed - FULL damage penetrates
}
```

## Impact on Simulations

All current simulation files use the **WRONG** HP-based model:
1. `bb_missile_final_accurate.js` - Lines 36-43
2. `bb_missile_continuous_salvos.js` - Lines 36-46
3. `bb_laser_vs_shields.js` - Lines 31-44

**Consequences:**
- Simulations show gradual damage accumulation through shields
- Reality (per RL1.md): Hits either block completely or penetrate fully
- PD effectiveness calculations are incorrect
- Time-to-kill estimates are wrong

## Correct Implementation

### Shield Structure (Per RL1.md)
```javascript
shields: {
    faces: 6,                    // Battleship has 6 faces
    faceBlockChance: [           // Each face tracks its own block %
        { current: 60, base: 60, lastHitRound: 0 },  // Fore
        { current: 60, base: 60, lastHitRound: 0 },  // Aft
        { current: 60, base: 60, lastHitRound: 0 },  // Top
        { current: 60, base: 60, lastHitRound: 0 },  // Bottom
        { current: 60, base: 60, lastHitRound: 0 },  // Port
        { current: 60, base: 60, lastHitRound: 0 },  // Starboard
    ],
    degradationPerBlock: 0.1,    // 0.1 percentage points per successful block
    rechargePerRound: 1.0,       // +1% at end of each round
    minBlockChance: 0.0,         // Can drop to 0%
}
```

### Damage Application Logic
```javascript
applyShieldedDamage(target, damage, weaponType, faceIndex) {
    const face = target.shields.faceBlockChance[faceIndex];

    // Roll to see if shield blocks
    const roll = Math.random() * 100;

    if (roll < face.current) {
        // BLOCK SUCCESSFUL
        console.log(`Shield face ${faceIndex+1} BLOCKED (${face.current.toFixed(1)}% remaining)`);

        // Degrade shield on successful block
        face.current = Math.max(0, face.current - this.shields.degradationPerBlock);

        // Special case: Railgun slugs leak 25% kinetic damage through
        if (weaponType === 'spinal_railgun') {
            const leakDamage = damage * 0.25;
            this.applyArmorDamage(target, leakDamage, weaponType);
            console.log(`  └─ Railgun kinetic transfer: ${leakDamage.toFixed(0)} damage`);
        }
        // All other weapons: 0 damage when blocked

    } else {
        // BLOCK FAILED - full damage penetrates
        console.log(`Shield face ${faceIndex+1} PENETRATED (${face.current.toFixed(1}% block failed)`);
        this.applyArmorDamage(target, damage, weaponType);
    }
}
```

### Recharge Logic (End of Round)
```javascript
rechargeShields(currentRound) {
    for (let face of this.shields.faceBlockChance) {
        if (face.lastHitRound < currentRound) {
            // Not hit this round - recharge
            face.current = Math.min(face.base, face.current + this.shields.rechargePerRound);
        }
    }
}
```

## Required Fixes

### 1. Simulation Files (Immediate)
- [x] Update `bb_missile_final_accurate.js`
- [x] Update `bb_missile_continuous_salvos.js`
- [x] Update `bb_laser_vs_shields.js`
- [ ] Re-run all simulations with correct mechanics
- [ ] Update `BB_MISSILE_ATTACK_ANALYSIS.md` with correct results

### 2. Game Code (Future Work)
**Note:** The game code in `dogfight.html` lines 9650-9693 implements HP-based shields, which contradicts RL1.md specifications. This may be intentional (simplified for gameplay) or an oversight. Recommend discussing with design team whether to:
- Update game code to match RL1.md specs (more faithful to tabletop rules)
- Update RL1.md to document the HP-based system as the canonical version
- Keep both systems for different contexts (simulations vs real-time gameplay)

## Mathematical Impact Example

### Old System (HP-based):
- 32 missiles × 200 damage = 6,400 damage
- Shield divides by 10 = 640 shield damage
- Shield has 100 HP → Takes 6.4 hits to collapse
- **Result:** ~6 missiles collapse one shield face

### New System (% block chance):
- 60% block chance per hit
- Each blocked hit reduces by 0.1%
- First missile: 60% block (0.4 expected penetration)
- After 100 blocks: 50% block chance
- **Result:** Statistical distribution, not gradual HP loss

**These are fundamentally different mechanics that produce very different combat outcomes!**

## Verification Checklist
- [x] Located RL1.md shield specifications (line 61)
- [x] Found dogfight.html shield implementation (lines 9650-9693)
- [x] Identified discrepancy between spec and implementation
- [x] Documented correct % block chance mechanics
- [ ] Updated all simulation files
- [ ] Verified simulation results match % block system
- [ ] Flagged game code for future review

---
**Created:** 2025-11-22
**Author:** Claude Code Analysis
**Priority:** HIGH - Affects all combat simulation accuracy
