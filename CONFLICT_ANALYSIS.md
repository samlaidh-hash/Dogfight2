# Conflict Analysis: Component Damage & Critical Hit System Changes

## Summary of Conflicts Found

This document identifies all potential conflicts when implementing the component damage and critical hit system improvements.

---

## 1. CRITICAL: systemDamage Dependencies

### 1.1 Aircraft Constructor (Line 13139)
**Conflict**: `systemDamage` object is initialized in Aircraft constructor
```javascript
this.systemDamage = {
    engine: 0,    // 0-1, reduces speed and climb rate
    controls: 0,  // 0-1, reduces turn rate
    weapons: 0    // 0-1, reduces accuracy and fire rate
};
```
**Action Required**: Remove this initialization entirely

---

### 1.2 Aircraft Update Method - Control Penalty (Line 14027)
**Conflict**: `systemDamage.controls` is used to reduce turn rate
```javascript
const controlPenalty = 1 - (this.systemDamage.controls * 0.5); // Up to 50% turn rate loss
maxTurnRatePerSec = maxTurnRatePerSec * controlPenalty;
```

**Current State**: 
- Wing damage (leftWing/rightWing) **already** reduces `maxTurnRate` by 5% per hit (lines 19474, 19477)
- Tail damage currently only affects climb rate, not turn rate (line 19482)
- `systemDamage.controls` is **redundant** - we have two systems affecting turn rate

**Action Required**: 
- **Remove** `systemDamage.controls` penalty entirely
- **Enhance** component damage to handle control penalties:
  - Wing damage already reduces turn rate ✅ (keep this)
  - Add tail damage → turn rate reduction (tail has rudder for yaw control)
  - Calculate control penalty based on wing + tail component damage

**Recommended Implementation**:
```javascript
// In Aircraft update() method, replace systemDamage.controls with:
const wingDamagePercent = (this.componentDamage.leftWing + this.componentDamage.rightWing) / 2;
const tailDamagePercent = this.componentDamage.tail;
const controlDamagePercent = Math.max(wingDamagePercent, tailDamagePercent * 0.7); // Tail less critical than wings
const controlPenalty = 1 - (controlDamagePercent / 100 * 0.5); // Up to 50% turn rate loss
maxTurnRatePerSec = maxTurnRatePerSec * controlPenalty;
```

**Decision**: ✅ **RESOLVED** - Use component damage (wings + tail) for control penalties, remove systemDamage.controls

---

### 1.3 Aircraft Update Method - Engine Penalty (Line 14122)
**Conflict**: `systemDamage.engine` is used to reduce speed
```javascript
const enginePenalty = 1 - (this.systemDamage.engine * 0.4); // Up to 40% speed loss
newSpeed = newSpeed * enginePenalty;
```
**Action Required**: 
- Remove this penalty (component damage already handles engine damage)
- The component damage system already reduces `maxSpeed` and `maxAcceleration` when engine is hit

**Note**: This is redundant - component damage already handles engine damage. Safe to remove.

---

### 1.4 UI Display - System Damage (Lines 15204-15228)
**Conflict**: UI displays `systemDamage` values
```javascript
const engineDamageDisplay = this.systemDamage.engine > 0 ?
    `<div class="stat-line" style="color: #ff4444;">🔧 Engine: ${Math.round(this.systemDamage.engine * 100)}%</div>` : '';
const controlDamageDisplay = this.systemDamage.controls > 0 ?
    `<div class="stat-line" style="color: #ff4444;">⚙ Controls: ${Math.round(this.systemDamage.controls * 100)}%</div>` : '';
const weaponDamageDisplay = this.systemDamage.weapons > 0 ?
    `<div class="stat-line" style="color: #ff4444;">🎯 Weapons: ${Math.round(this.systemDamage.weapons * 100)}%</div>` : '';
```
**Action Required**: 
- Remove these UI elements entirely
- Component damage is already displayed via `componentInfo` (line 15158)

**Note**: Component damage display already exists and shows engine/wings/cockpit damage. This is redundant.

---

### 1.5 Critical Hit Chance Calculation (Lines 15263, 15268)
**Conflict**: `calculateCriticalHitChance()` uses `systemDamage` to modify crit chance
```javascript
// Weapon system damage reduces crit chance
if (shooter.systemDamage.weapons > 0) {
    critChance -= shooter.systemDamage.weapons * 0.15;
}

// Target's control damage increases vulnerability
if (target.systemDamage.controls > 0.3) {
    critChance += 0.10; // +10% against damaged aircraft
}
```
**Action Required**: 
- Remove these modifiers OR replace with component damage checks
- Could use `target.componentDamage` instead (e.g., if wings damaged > 30%, increase crit chance)

**Decision Needed**: Should we keep this mechanic but use component damage instead?

---

### 1.6 Emergency Maneuver Cancellation (Line 18563)
**Conflict**: High G-forces can cause control damage
```javascript
if (plane.currentGForce > 4) {
    plane.systemDamage.controls = Math.min(1.0, plane.systemDamage.controls + 0.1);
}
```
**Action Required**: 
- Remove this OR change to component damage (e.g., damage wings or tail)
- Could add to `componentDamage.wings` or `componentDamage.tail` instead

**Decision Needed**: Should high G-forces cause component damage instead?

---

## 2. CRITICAL: applyCriticalHit() Function Changes

### 2.1 Function Signature (Line 15276)
**Current**: `function applyCriticalHit(target, weapon)`
**Proposed**: Should return multiplier instead of applying damage directly

**Action Required**: 
- Change function to return `2.0` (or configurable multiplier)
- Remove all `systemDamage` modifications
- Keep visual feedback
- Keep `criticalHitsTaken++` counter

---

### 2.2 Function Calls (Lines 15996, 16073)
**Current**: 
```javascript
applyCriticalHit(target, weaponType);
shooter.criticalHitsDealt++;
```
**Proposed**:
```javascript
const critMultiplier = applyCriticalHit(target, weaponType);
damageAmount *= critMultiplier;
shooter.criticalHitsDealt++;
```

**Action Required**: Update both call sites to use returned multiplier

---

## 3. MEDIUM: applyComponentDamage() Function Changes

### 3.1 Function Signature (Line 19455)
**Current**: `function applyComponentDamage(aircraft, damage)`
**Proposed**: `function applyComponentDamage(aircraft, damage, attackAngle = null, attackerHeading = null)`

**Action Required**: Add optional parameters, maintain backward compatibility

---

### 3.2 Function Calls - Need Angle Information

#### ✅ Has Angle Information Available:
1. **Line 16001** - Main combat loop (has `angleDiff` calculated)
2. **Line 16078** - Legacy single weapon combat (has `angleDiff` calculated)

#### ⚠️ Partial Angle Information:
3. **Line 16163** - Defensive turret fire (has angle to attacker, but from defender's perspective)
   - Can calculate: angle from turret to attacker
   - Need: angle from attacker to defender (for component selection on attacker)

#### ❌ No Angle Information Available:
4. **Line 4946** - AA Gun fire (ground-based, no meaningful attack angle)
5. **Line 9801** - Bomb/Rocket explosion (area effect, no specific angle)
6. **Line 10136** - Rocket explosion (area effect, no specific angle)
7. **Line 16401** - Aerial unit defensive weapons (balloon/blimp guns)
8. **Line 16438** - Capital ship AA batteries (returns hit objects, no angle)
9. **Line 16451** - Capital ship CIWS (returns hit objects, no angle)
10. **Line 18990, 18993, 18997** - Missile hits (has missile trajectory, could calculate angle)

**Action Required**: 
- For cases with angle info: Pass angle to function
- For cases without angle: Use fallback random selection (backward compatible)
- For area effects: Random selection is appropriate (explosions hit from all angles)

---

## 4. LOW: UI and Display Changes

### 4.1 Critical Hit Counter Display (Lines 15198-15201, 15224-15225)
**Status**: ✅ Safe - These just display counters, no dependency on systemDamage
**Action Required**: None - counters will still work

### 4.2 Tooltip Text (Lines 15226-15228)
**Conflict**: Tooltips mention "system damage from critical hits"
**Action Required**: Update tooltip text to reflect new system (critical hits = 2x damage)

---

## 5. POTENTIAL ISSUES

### 5.1 Save/Load System
**Status**: ⚠️ Unknown - Need to check if game saves aircraft state
**Action Required**: 
- Search for save/load functionality
- If exists, ensure `systemDamage` is not saved/loaded
- If `systemDamage` is in save data, add migration or ignore it

### 5.2 Replay System
**Status**: ⚠️ Unknown - Replay might record damage states
**Action Required**: 
- Check if replay system records `systemDamage`
- If yes, ensure backward compatibility or migration

### 5.3 Campaign/Mission System
**Status**: ⚠️ Unknown - Missions might check systemDamage
**Action Required**: 
- Search for mission objectives that check systemDamage
- Update or remove if found

---

## 6. IMPLEMENTATION PRIORITY

### Phase 1: Remove systemDamage (High Priority)
1. Remove `systemDamage` initialization (line 13139)
2. Replace control penalty (line 14027) - **✅ RESOLVED**: Use wing + tail component damage instead
3. Remove engine penalty (line 14122) - **SAFE**: Redundant with component damage
4. Remove UI display (lines 15204-15228) - **SAFE**: Redundant with component damage display
5. Update critical hit chance calculation (lines 15263, 15268) - **DECISION NEEDED**: Use component damage instead?
6. Update emergency maneuver damage (line 18563) - **DECISION NEEDED**: Use component damage instead?

### Phase 2: Simplify Critical Hits (High Priority)
1. Update `applyCriticalHit()` to return multiplier (line 15276)
2. Update call sites to use multiplier (lines 15996, 16073)
3. Update tooltip text (lines 15226-15228)

### Phase 3: Add Angle-Based Component Selection (Medium Priority)
1. Add `selectComponentByAngle()` function
2. Update `applyComponentDamage()` signature
3. Update call sites with angle info (lines 16001, 16078)
4. Keep fallback for call sites without angle info

---

## 7. DECISIONS NEEDED

### Decision 1: Control Damage Penalty ✅ RESOLVED
**Question**: Should control damage (reduces turn rate) be kept, but use component damage instead?
**Answer**: **YES** - Wing damage already affects turn rate, and tail damage should too (rudder control)
**Implementation**: 
- Remove `systemDamage.controls` entirely
- Use combined wing + tail component damage to calculate control penalty
- Wing damage: Already reduces turn rate (keep existing)
- Tail damage: Add turn rate reduction (tail has rudder for yaw control)

### Decision 2: Critical Hit Chance Modifiers
**Question**: Should we keep the crit chance modifiers (weapon damage reduces crit chance, control damage increases vulnerability)?
**Options**:
- A) Remove entirely (simpler)
- B) Keep but use component damage instead (e.g., `componentDamage.wings > 30%` increases vulnerability)
- **Recommendation**: Option B - Adds tactical depth

### Decision 3: High G-Force Damage
**Question**: Should high G-forces cause component damage?
**Options**:
- A) Remove entirely
- B) Cause wing damage (realistic - wings stressed under high G)
- **Recommendation**: Option B - Use `componentDamage.wings` or `componentDamage.tail`

### Decision 4: Angle Information for All Sources
**Question**: Should we calculate angles for sources that don't have them?
**Options**:
- A) Only use angle for aircraft vs aircraft (most important)
- B) Calculate angles for all sources (more work, more realistic)
- **Recommendation**: Option A for Phase 3, Option B as enhancement later

---

## 8. TESTING CHECKLIST

After implementation, test:
- [ ] Critical hits do 2x damage (not system damage)
- [ ] Component damage still works correctly
- [ ] UI no longer shows systemDamage
- [ ] Turn rate penalties removed (or migrated to component damage)
- [ ] Speed penalties removed (redundant with component damage)
- [ ] Angle-based component selection works for aircraft vs aircraft
- [ ] Fallback random selection works for sources without angle
- [ ] No console errors
- [ ] Game doesn't crash
- [ ] Save/load still works (if exists)
- [ ] Replay still works (if exists)

---

## 9. BACKWARD COMPATIBILITY

**Maintained By**:
- `applyComponentDamage()` accepts optional angle parameters (defaults to null)
- When angle is null, uses random selection (current behavior)
- All existing call sites continue to work without modification
- Only new call sites with angle info get improved behavior

**Breaking Changes**:
- `systemDamage` object removed (but not used by external code)
- `applyCriticalHit()` now returns value instead of void (call sites must be updated)

---

## 10. RISK ASSESSMENT

**Low Risk**:
- Removing `systemDamage` UI display (redundant)
- Removing engine penalty (redundant with component damage)
- Simplifying critical hits (just multiplier)

**Medium Risk**:
- Removing control penalty (might affect gameplay balance)
- Updating critical hit call sites (2 locations, straightforward)

**High Risk**:
- None identified - all changes are localized and well-understood

