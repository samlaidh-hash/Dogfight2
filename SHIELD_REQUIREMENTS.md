# Flicker Shield Mechanics - Requirements

## Overview
Flicker shields use a **% block chance system** (NOT HP-based). Each hit is either completely blocked or fully penetrates based on a percentage roll.

## Core Requirements

### Requirement 1: % Block Chance System
- Each shield face has a **block chance percentage** (not HP)
- When hit, roll random(0-100) vs block chance:
  - **Roll < blockChance**: Hit is BLOCKED → 0 damage (except railguns)
  - **Roll ≥ blockChance**: Hit PENETRATES → full damage applies
- Base block chance by ship class (RL1.md line 62-67):
  - Battle ships: **60%**
  - Battle Cruisers: **57%**
  - Heavy Cruisers: **54%**
  - Light Cruisers: **51%**
  - Destroyers: **48%**
  - Corvettes: **45%**

### Requirement 2: Shield Degradation
- Each **successful block** reduces block chance by **0.1 percentage points**
- Degradation is per-face (each face degrades independently)
- Minimum block chance: **0%** (shields can fail completely)
- **Failed blocks do NOT cause degradation** (only successful blocks)
- Example: 60% → blocks hit → now 59.9% → blocks hit → now 59.8%

### Requirement 3: Shield Recharge Delay ⚡
**CRITICAL CLARIFICATION:**

**Shield recharge only begins after 4 seconds of the shield face not BLOCKING a hit**

**IMPORTANT:** The recharge timer is ONLY reset when a shield successfully BLOCKS a hit, NOT when a hit penetrates!

Implementation details:
1. Each shield face tracks `lastHitTime` (timestamp of last successful block)
2. When a face BLOCKS a hit: set `face.lastHitTime = Date.now()` (resets timer)
3. When a face FAILS to block (penetration): do NOT update `lastHitTime` (timer continues)
4. In update loop, calculate `timeSinceHit = currentTime - face.lastHitTime`
5. **Only begin recharge if `timeSinceHit >= 4000ms`** (4 seconds)
6. Once recharge begins: +1% block chance per second (continuous)
7. Recharge stops when face returns to base block chance
8. Only successful blocks **reset the 4-second timer** for that face

**Combat Implication:** A degraded shield (e.g., 10% block chance) can begin recharging even while under fire, since most hits penetrate and don't reset the timer. Only the occasional successful block will reset it.

**Code Reference:**
- Update loop (dogfight.html lines 7038-7046):
```javascript
const timeSinceHit = currentTime - face.lastHitTime;

// Recharge ONLY after 4 seconds of not BLOCKING a hit
if (timeSinceHit >= this.shields.rechargeDelay && face.blockChance < this.shields.baseBlockChance) {
    face.recharging = true;
    face.blockChance = Math.min(this.shields.baseBlockChance, face.blockChance + this.shields.rechargeRate * dt);
} else if (timeSinceHit < this.shields.rechargeDelay) {
    face.recharging = false;
}
```

- Shield hit logic (dogfight.html lines 9662-9689):
```javascript
if (roll < face.blockChance) {
    // BLOCK SUCCESSFUL
    face.blockChance -= 0.1;
    face.lastHitTime = Date.now(); // ← Reset timer ONLY on successful block
} else {
    // BLOCK FAILED (penetrates)
    this.applyArmorDamage(target, damage, weaponType);
    // NOTE: lastHitTime NOT updated - penetrations don't stop recharge!
}
```

**Parameters:**
- `rechargeDelay: 4000` (milliseconds) - delay before recharge begins
- `rechargeRate: 1.0` (% per second) - recharge speed once started

### Requirement 4: Shield Face Coverage
- **Battle ships**: 6 faces (fore, aft, top, bottom, port, starboard)
- **Cruisers**: 4 faces (each covers one side + respective top/bottom)
- **Destroyers**: 2 faces (port, starboard)
- **Corvettes**: 1 face (entire ship)

### Requirement 5: Special Cases

#### Railgun Slugs
- Railguns have 25% kinetic penetration even when blocked
- Successful block: reduces damage by 75% (25% still penetrates)
- Failed block: 100% damage penetrates (normal)

#### Nebula Environment
- Flicker shields **do not function** inside nebulae
- All hits penetrate (0% block chance regardless of shield status)

## Key Differences from HP-Based Shields

### ❌ OLD SYSTEM (HP-based - INCORRECT):
- Shields have HP per face
- Damage is divided by 10 before applying to shields
- Shields gradually absorb damage until HP reaches 0
- Partial damage through shields

### ✅ NEW SYSTEM (% block chance - CORRECT):
- Shields have block chance % per face
- Each hit either blocks completely (0 damage) or penetrates fully
- No partial damage - binary outcome per hit
- Degradation occurs on successful blocks
- 4-second delay before recharge begins

## Combat Implications

### Time-to-Kill Changes
1. **Sustained Fire Advantage**: Continuous bombardment prevents recharge (4-second timer keeps resetting)
2. **Focus Fire**: Hitting the same face repeatedly degrades it faster
3. **Statistical Distribution**: Damage is more "spiky" (lucky/unlucky streaks possible)
4. **No Gradual Wear**: Shields either work or they don't - no "almost broken" state

### Tactical Considerations
1. **Pause in Fire**: If attacker stops firing for >4 seconds, defender's shields begin recovering
2. **Multi-Vector Attack**: Hitting different faces spreads degradation but allows recharge
3. **Shield Management**: Unlike HP shields, can't "save" shield strength - use it or lose it
4. **Degradation Recovery**: A heavily degraded shield (low block %) can recover while under fire, since most hits penetrate and don't reset the recharge timer
5. **Focus Fire vs Spread**: Focusing on one face degrades it quickly, but other faces can recharge. Spreading fire keeps more faces active but allows partial recovery.

## Implementation Status

### ✅ Completed
- [x] dogfight.html shield system (lines 5995-6024, 7035-7048, 9650-9691)
- [x] RL1.md specification update (line 61)
- [x] SHIELD_MECHANICS_DISCREPANCY.md documentation

### ⚠️ Needs Update
- [ ] bb_missile_continuous_salvos.js - still uses 4-second delay but HP-based shields
- [ ] bb_missile_effectiveness_v2.js - still uses HP-based shields
- [ ] bb_missile_realistic_pd.js - still uses HP-based shields
- [ ] Other simulation files may need updates

## Testing Checklist

To verify correct implementation:

1. **Block Chance**: Hit shield with 60% block → should block ~60% of hits (statistical)
2. **Degradation**: Each successful block reduces % by 0.1
3. **Recharge Delay**:
   - Stop hitting shield → wait 3 seconds → NO recharge
   - Wait 4+ seconds → recharge begins (+1%/sec)
   - Hit shield during recharge → recharge stops, timer resets
4. **Per-Face Independence**: Hit Face 1 → Face 2 can still recharge if not hit for 4 sec
5. **Railgun Special Case**: Railgun hit blocked → 25% damage still penetrates
6. **Nebula**: Inside nebula → shields always fail (0% block regardless of stat)

---
**Document Version**: 1.0
**Last Updated**: 2025-11-22
**Status**: CLARIFIED - Requirement 3 now explicitly states 4-second recharge delay
