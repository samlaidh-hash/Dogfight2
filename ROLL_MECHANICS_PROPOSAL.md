# Roll Mechanics Implementation Proposal
## Dogfight 2 - Enhancement Plan

---

## Executive Summary

This proposal outlines a phased approach to add roll/bank angle mechanics to Dogfight 2 while preserving all existing functionality. The implementation follows a defensive strategy with incremental changes, testing gates, and rollback points.

---

## Current State Analysis

### What Works Now (DO NOT BREAK)
1. **Turn-based gameplay** - Order → Execution → Review phases
2. **Flight physics validation** - Speed, G-force, climb/dive rate checks
3. **Ghost preview system** - Visual feedback with valid/stressful/illegal states
4. **Terrain collision** - Altitude vs terrain height checking
5. **Combat system** - Firing arcs, accuracy, ammunition, damage
6. **AI opponent** - Basic tactical positioning
7. **Smooth interpolation** - Aircraft movement during execution phase
8. **UI/Controls** - Mouse positioning, wheel rotation, W/S altitude, A/D fire threshold

### Current Flight Model Variables
- `x, y` - Position (canvas coordinates)
- `altitude` - Height in meters
- `heading` - Direction in degrees (0-360°)
- `speed` - Velocity in m/s

### Critical Code Paths
- `Aircraft.calculateManeuverValidation()` - Lines 396-471 (validation logic)
- `Aircraft.executeOrders()` - Lines 502-519 (interpolation logic)
- `Aircraft.renderSVG()` - Lines 309-387 (visual rendering)
- `Aircraft.lockOrders()` - Lines 473-492 (order setting)

### ⚠️ IMPORTANT DISCOVERY: Existing Turn Rate Issue

**Current code has the same problem!** Line 276 in dogfight.html:
```javascript
this.maxTurnRate = 20; // degrees per turn
```

This should also be **degrees per second** for the same reasons as roll rate. The current implementation works because turns happen to complete in a fixed time (4 seconds), but this is fragile.

**Recommendation**: Fix both turn rate AND roll rate to use degrees/second in Phase 1. This ensures consistency and prepares for potential variable-length execution phases in the future.

**Impact**:
- Current: `maxTurnRate = 20` degrees/turn ÷ 4 seconds = **5°/s** (very slow!)
- Realistic WWII fighters: **15-25°/s** turn rate
- Suggested values:
  - Spitfire: `maxTurnRate = 20` → 20°/s (realistic)
  - Me-109: `maxTurnRate = 18` → 18°/s (realistic)

---

## Proposed Roll Mechanics Design

### New Aircraft Properties
```javascript
this.roll = 0;              // Current bank angle (-180 to +180, 0 = wings level)
this.targetRoll = 0;        // Desired bank angle
this.startRoll = 0;         // Starting bank angle for interpolation
this.maxRollRate = 90;      // Max degrees per SECOND (Spitfire)
```

### Roll Timing Specification
Given current `EXECUTION_TIME = 4000ms` (4 seconds):

- **Half Roll (180°)**: Completes at **50%** of execution phase (2 seconds)
  - Spitfire @ 90°/s: 180° in 2.0s ✓
  - Me-109 @ 110°/s: 180° in 1.64s ✓

- **Full Roll (360°)**: Completes at **100%** of execution phase (4 seconds)
  - Spitfire @ 90°/s: 360° in 4.0s ✓
  - Me-109 @ 110°/s: 360° in 3.27s ✓

- **Partial Rolls**: Time-based interpolation
  - 90° @ 90°/s → 1.0s (25% of execution)
  - 270° @ 90°/s → 3.0s (75% of execution)

### Roll Rate Limits (Per Aircraft Type - Degrees per Second)
- **Spitfire**: 90°/s max roll rate (realistic for Spitfire Mk V)
- **Me-109**: 110°/s max roll rate (slightly better roll performance, historically accurate)
- **Future aircraft**:
  - FW-190: 150°/s (famously excellent roll rate)
  - P-51 Mustang: 100°/s
  - Zero: 60°/s (poor at high speed)

### Physics Integration

#### 1. Roll affects turn performance
- **Banked turns**: Roll angle increases effective turn rate
- **Formula**: `effectiveTurnRate = baseTurnRate * (1 + abs(roll) / 180 * 0.3)`
- **Max bonus**: +30% turn rate at 90° bank

#### 2. Roll affects lift/drag
- **Inverted flight** (roll ~180°): Reduced climb performance, must pitch nose down to maintain altitude
- **Knife-edge** (roll ~90°): Increased drag, speed reduction

#### 3. G-force modification
- **Coordinated banked turns**: Reduced G-force compared to flat turns
- **Uncoordinated**: Increased G-force (slip/skid)

---

## Implementation Plan - 4 Phases

### **PHASE 1: Foundation (Non-Breaking)**
**Goal**: Add roll variables AND fix existing turn rate units without changing behavior

**Changes**:
1. **Fix existing turn rate units**:
   - Change `maxTurnRate` comments from "degrees per turn" to "degrees per second"
   - Update values: Spitfire 20→20°/s, Me-109 18→18°/s (same numbers, correct units)
   - Update turn validation to use time-based calculation
   - **Note**: This doesn't change behavior since execution time is currently fixed at 4s

2. **Add roll properties** to `Aircraft` constructor:
   ```javascript
   this.roll = 0;
   this.targetRoll = 0;
   this.startRoll = 0;
   this.maxRollRate = 90;  // Spitfire: 90°/s, Me-109: 110°/s
   ```

3. Initialize to 0 (wings level)
4. Add to interpolation in `executeOrders()` but don't use yet
5. Add to UI display (show current roll angle)

**Testing**:
- ✓ All existing maneuvers work identically (turn rate change is cosmetic)
- ✓ No visual changes
- ✓ No physics changes
- ✓ UI displays "Roll: 0°" for all aircraft
- ✓ Turn validation still works correctly

**Rollback**: Simply remove new properties and revert comments if issues occur

**Risk**: VERY LOW - Turn rate change is unit clarification only; roll is additive only, no behavior changes

---

### **PHASE 2: Visual Roll (Non-Breaking)**
**Goal**: Show aircraft banking visually without affecting gameplay

**Changes**:
1. Modify `renderSVG()` to apply roll transformation
2. Add 3D-like visual effect (squash wings on bank)
3. Update ghost preview to show target roll angle

**Testing**:
- ✓ Aircraft visually banks during existing turns
- ✓ Physics validation still works
- ✓ Ghost preview shows roll correctly
- ✓ No gameplay changes (roll doesn't affect anything yet)

**Rollback**: Revert `renderSVG()` changes only

**Risk**: LOW - Visual only, physics unchanged

---

### **PHASE 3: Roll Controls (Potential Breaking)**
**Goal**: Allow player to input roll commands

**Changes**:
1. Add roll control (Q/E keys for left/right roll)
2. Update ghost aircraft to show target roll
3. Add roll rate validation in `calculateManeuverValidation()`
4. Implement 50%/100% timing in `executeOrders()`

**New Validation Rules**:
```javascript
// In calculateManeuverValidation()
const rollChange = Math.abs(targetRoll - this.roll);
const normalizedRoll = rollChange > 180 ? 360 - rollChange : rollChange;

// Calculate time required for this roll (in seconds)
const executionTimeSeconds = EXECUTION_TIME / 1000; // 4.0 seconds
const rollTimeRequired = normalizedRoll / this.maxRollRate; // degrees / (degrees/second) = seconds

if (rollTimeRequired > executionTimeSeconds) {
    state = 'illegal';
    warnings.push('ROLL RATE EXCEEDED');
}

// Calculate when roll will complete (as fraction of execution phase)
const rollCompletionFactor = rollTimeRequired / executionTimeSeconds;
// Examples with Spitfire (90°/s):
// - Half roll (180°): 180/90 = 2.0s → 2.0/4.0 = 0.5 (50% completion) ✓
// - Full roll (360°): 360/90 = 4.0s → 4.0/4.0 = 1.0 (100% completion) ✓
// - Quarter roll (90°): 90/90 = 1.0s → 1.0/4.0 = 0.25 (25% completion) ✓
```

**Roll Interpolation**:
```javascript
// In executeOrders(progress)
// progress goes from 0 to 1 over EXECUTION_TIME (4 seconds)

const rollChange = Math.abs(this.targetRoll - this.startRoll);
const normalizedRoll = rollChange > 180 ? 360 - rollChange : rollChange;

// Time-based roll completion
const executionTimeSeconds = EXECUTION_TIME / 1000; // 4.0 seconds
const currentTimeSeconds = progress * executionTimeSeconds; // 0 to 4.0 seconds

// How much can we roll in the current elapsed time?
const maxRollPossible = this.maxRollRate * currentTimeSeconds;

// Calculate roll progress (clamped to 1.0 when complete)
const rollProgress = Math.min(1, maxRollPossible / normalizedRoll);

// Apply the roll
let rollDiff = this.targetRoll - this.startRoll;
if (Math.abs(rollDiff) > 180) {
    // Take shorter path
    rollDiff = rollDiff > 0 ? rollDiff - 360 : rollDiff + 360;
}
this.roll = this.startRoll + rollDiff * rollProgress;

// Normalize to -180 to +180
if (this.roll < -180) this.roll += 360;
if (this.roll > 180) this.roll -= 360;
```

**Example with Spitfire (90°/s) doing half roll**:
- At progress = 0.25 (1.0s elapsed): maxRollPossible = 90°, rollProgress = 90/180 = 0.5 → 50% rolled
- At progress = 0.50 (2.0s elapsed): maxRollPossible = 180°, rollProgress = 180/180 = 1.0 → **100% rolled** ✓
- At progress = 0.75 (3.0s elapsed): rollProgress still 1.0 → stays at target roll
- At progress = 1.00 (4.0s elapsed): rollProgress still 1.0 → stays at target roll

**Testing**:
- ✓ Q/E keys change ghost roll angle
- ✓ Excessive roll rates turn ghost red
- ✓ Half rolls complete by 50% of execution
- ✓ Full rolls complete by 100%
- ✓ Existing non-rolling maneuvers still work
- ✓ AI doesn't break (continues not using roll)

**Rollback**: Disable Q/E controls, set all rolls to 0

**Risk**: MEDIUM - Adds new input dimension, but physics still separate

---

### **PHASE 4: Physics Integration (High Risk)**
**Goal**: Make roll affect turn performance and advanced maneuvers

**Changes**:
1. Modify turn rate calculation based on bank angle
2. Add coordinated turn mechanics (reduce G-force when banked)
3. Add inverted flight effects
4. Implement advanced maneuvers:
   - **Barrel Roll**: Full 360° roll while maintaining heading
   - **Aileron Roll**: Pure roll without turn
   - **Split-S**: Half roll + dive (inverted to level, 180° heading change)
   - **Immelmann**: Climb + half roll (level to inverted, 180° heading change)

**Turn Rate Modification**:
```javascript
// In calculateManeuverValidation()
const bankBonus = Math.abs(targetRoll) / 180 * 0.3; // Up to 30% bonus
const effectiveMaxTurnRate = this.maxTurnRate * (1 + bankBonus);

// If properly banked for turn direction:
if (isCoordinated(turnDirection, rollDirection)) {
    // Reduce G-force
    gForce *= 0.8;
} else {
    // Increase G-force (slip/skid)
    gForce *= 1.2;
    if (state !== 'illegal') state = 'stressful';
    warnings.push('Uncoordinated Turn');
}
```

**Inverted Flight**:
```javascript
// In calculateManeuverValidation()
if (Math.abs(targetRoll - 180) < 20) { // Nearly inverted
    // Negative lift - must pitch down or lose altitude
    warnings.push('INVERTED - Negative Lift');
    if (altitudeChange > 0) {
        // Trying to climb while inverted
        state = 'illegal';
        warnings.push('Cannot Climb Inverted');
    }
}
```

**Testing**:
- ✓ Banked turns have tighter turn radius
- ✓ Inverted flight loses altitude if not pitched down
- ✓ Coordinated turns have lower G-force
- ✓ Uncoordinated turns get yellow ghost + warning
- ✓ Barrel rolls maintain position/heading
- ✓ Advanced maneuvers (Split-S, Immelmann) work correctly
- ✓ AI can still function (either adapt to roll or continue simple tactics)
- ✓ All Phase 1-3 functionality still works

**Rollback**: Revert physics modifications, keep visual roll

**Risk**: HIGH - Significant physics changes, may affect balance

---

## Testing Strategy

### Test Suite for Each Phase

#### Baseline Test Cases (Run After Each Phase)
1. **Basic forward movement** - No turn, no altitude change
2. **Simple turn** - 90° heading change, level flight
3. **Climb** - Straight ahead, +200m altitude
4. **Dive** - Straight ahead, -200m altitude
5. **Tight turn** - Max turn rate, should stay valid or stressful
6. **Illegal turn** - Exceed max turn rate, should turn red
7. **Terrain collision** - Low altitude into mountain, should warn
8. **Combat** - Fire at opponent, check hit detection
9. **AI behavior** - AI generates valid orders and doesn't crash
10. **Full execution cycle** - Order → Execute → Review → Next Phase

#### Phase-Specific Tests

**Phase 1**:
- Roll variables exist and default to 0
- No behavior changes from baseline

**Phase 2**:
- Aircraft visually banks during turns
- Ghost shows correct visual roll
- No physics/gameplay changes

**Phase 3**:
- Q/E keys modify ghost roll
- Excessive roll makes ghost red
- Half roll completes at 50% execution time
- Full roll completes at 100% execution time
- Baseline tests still pass

**Phase 4**:
- Banked turn has tighter radius than flat turn
- Inverted flight behaves differently
- Advanced maneuvers work as specified
- Baseline tests adapted for new physics

### Regression Testing Checklist
After each phase, verify:
- [ ] Order phase accepts input correctly
- [ ] Ghost preview shows valid/stressful/illegal correctly
- [ ] Execute button appears when all aircraft have orders
- [ ] Execution phase animates smoothly
- [ ] Combat system fires when appropriate
- [ ] Review phase offers Replay/Next Phase
- [ ] No JavaScript console errors
- [ ] UI updates correctly
- [ ] Performance is acceptable (60fps during execution)

---

## Risk Mitigation

### Safety Measures

1. **Feature Flags**: Use a global constant to enable/disable roll mechanics
   ```javascript
   const ENABLE_ROLL_MECHANICS = true; // Easy toggle
   ```

2. **Separate Branch**: Implement in a new branch `feature/roll-mechanics`

3. **Commits per Phase**: One commit per phase with clear description

4. **Backup Points**: Tag each phase completion for easy rollback
   ```bash
   git tag phase-1-foundation
   git tag phase-2-visual
   git tag phase-3-controls
   git tag phase-4-physics
   ```

5. **Validation Bypass**: Keep old validation as fallback
   ```javascript
   if (ENABLE_ROLL_MECHANICS) {
       // New validation with roll
   } else {
       // Original validation (preserved)
   }
   ```

### Rollback Procedures

**Phase 1 Rollback**:
```bash
git revert <phase-1-commit>
# Removes roll variables, fully reverts to original
```

**Phase 2 Rollback**:
```bash
# Option 1: Full rollback
git revert <phase-2-commit>

# Option 2: Keep Phase 1, disable visual
ENABLE_ROLL_VISUAL = false;
```

**Phase 3 Rollback**:
```bash
# Keep visual, disable controls
ENABLE_ROLL_CONTROLS = false;
# Or revert commits
git revert <phase-3-commit>
```

**Phase 4 Rollback**:
```bash
# Keep controls, disable physics integration
ENABLE_ROLL_PHYSICS = false;
# Or revert
git revert <phase-4-commit>
```

---

## Advanced Maneuvers Specification

### 1. Barrel Roll
**Input**: Full 360° roll while maintaining heading
**Effect**:
- Evasive maneuver
- Maintains direction and approximately same position
- Small altitude loss (realism)
- Difficult to track for opponent

**Implementation**:
```javascript
// targetRoll = 360°, targetHeading = currentHeading
// Slight altitude loss: targetAltitude = currentAltitude - 50
```

### 2. Aileron Roll
**Input**: Pure 360° roll, no turn
**Effect**:
- Show-off maneuver / orientation reset
- Maintains heading and altitude
- No tactical benefit

### 3. Split-S
**Input**: Half roll (180°) + dive + 180° heading change
**Effect**:
- Quick altitude loss, gain speed
- Reverse direction
- Escape maneuver

**Sequence**:
1. Roll inverted (0-50% of execution)
2. Pull through dive while rolling out (50-100%)
3. End: 180° heading change, -500m altitude, +speed

### 4. Immelmann Turn
**Input**: Climb + half roll at top
**Effect**:
- Gain altitude, reverse direction
- Lose speed
- Defensive maneuver

**Sequence**:
1. Climb (0-50% of execution)
2. Half roll at apex (50-75%)
3. Roll out level (75-100%)
4. End: 180° heading change, +altitude, -speed

---

## UI Enhancements

### New UI Elements

1. **Roll Indicator** (in aircraft stats):
   ```
   Alt: 500m
   Speed: 200 m/s
   Hdg: 90°
   Roll: 45° ← NEW
   ```

2. **Ghost Panel Addition**:
   ```
   Target Speed: 220 m/s
   G-Force: 4.2G
   Roll Angle: 90° ← NEW
   Roll Complete: 50% ← NEW (shows when roll will finish)
   ```

3. **Advanced Maneuver Hints**:
   When ghost shows specific patterns, display hint:
   - "Barrel Roll Detected"
   - "Split-S Maneuver"
   - "Immelmann Turn"

4. **Controls Update** (in UI sidebar):
   ```
   Controls:
   • Click aircraft to order
   • Move mouse to position
   • Mouse wheel: rotate
   • W/S: altitude up/down
   • Q/E: roll left/right ← NEW
   • A/D: fire threshold
   • Click again to lock
   ```

---

## Performance Considerations

### Potential Issues
1. **Rendering complexity**: Additional rotation transform
2. **Physics calculations**: More validation checks
3. **Interpolation**: More variables to smooth

### Optimizations
1. Only calculate roll physics when roll != 0
2. Cache trigonometric calculations
3. Use lookup tables for bank angle bonuses
4. Limit UI updates to 30fps (while keeping game at 60fps)

---

## Timeline Estimate

**Phase 1**: 1-2 hours
- Low complexity, mostly additive

**Phase 2**: 2-3 hours
- Visual changes, need to test rendering carefully

**Phase 3**: 3-4 hours
- New controls, validation logic, timing implementation
- Most complex phase in terms of getting feel right

**Phase 4**: 4-6 hours
- Physics integration requires careful tuning
- Advanced maneuvers need playtesting
- AI may need updates

**Total**: 10-15 hours of development + testing

---

## Success Criteria

### Must Have (All Phases)
- [ ] All baseline test cases pass
- [ ] No JavaScript errors in console
- [ ] Smooth 60fps during execution
- [ ] Ghost preview accurately shows result
- [ ] Roll timing matches specification (50%/100%)

### Should Have (Phase 3+)
- [ ] Controls feel responsive
- [ ] Roll rates feel realistic for aircraft type
- [ ] Validation warnings are clear and helpful

### Nice to Have (Phase 4)
- [ ] Advanced maneuvers feel satisfying to execute
- [ ] AI can handle rolled opponents
- [ ] Physics feel realistic to players familiar with flight sims

---

## Decision Points

Before starting each phase, evaluate:

1. **Did previous phase work?** If no → rollback and reassess
2. **Are there unexpected issues?** If yes → fix before proceeding
3. **Is performance acceptable?** If no → optimize before proceeding
4. **Do existing features still work?** If no → STOP and fix

---

## Conclusion

This proposal provides a safe, incremental path to add roll mechanics to Dogfight 2. By breaking the work into four distinct phases with clear testing and rollback procedures, we minimize the risk of breaking existing functionality while adding significant depth to the flight model.

**Recommendation**: Proceed with Phase 1, evaluate results, then decide whether to continue.

---

## Appendix: Code Locations

### Files to Modify
- `dogfight.html` - Single file contains all game logic

### Key Functions to Touch
- `Aircraft` constructor (line ~249) - Add roll properties
- `calculateManeuverValidation()` (line ~396) - Add roll validation
- `executeOrders()` (line ~502) - Add roll interpolation with timing
- `renderSVG()` (line ~309) - Add roll visual transform
- `lockOrders()` (line ~473) - Store roll target
- Event listeners (line ~774+) - Add Q/E key handlers

### Key Variables
- `this.heading` - Current direction in degrees (already exists)
- `this.roll` - NEW: Current bank angle in degrees (-180 to +180)
- `this.targetRoll` - NEW: Desired bank angle in degrees
- `this.maxRollRate` - NEW: Aircraft-specific limit in **degrees per second**

---

**Questions? Concerns? Ready to proceed?**
