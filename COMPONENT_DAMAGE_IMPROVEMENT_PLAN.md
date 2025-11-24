# Component Damage System Improvement Plan

## Current System Analysis

### Purpose of Component Damage System
The component damage system adds **tactical depth** to combat by:
1. **Performance Degradation**: Different components affect different aircraft capabilities
   - Engine damage → reduced speed and acceleration
   - Wing damage → reduced turn rate
   - Tail damage → reduced climb rate
   - Cockpit damage → pilot wounding (reduces skill)
   - Fuel tank damage → fuel leaks

2. **Asymmetric Damage**: Left/right wing damage tracked separately, creating realistic handling issues

3. **Gameplay Variety**: Makes each hit meaningful rather than just "health bar goes down"

### Purpose of Critical Hit System
Currently, critical hits:
1. Use a **separate** `systemDamage` system (engine, controls, weapons)
2. Add bonus hull damage (8-15 points)
3. Create visual feedback (longer effect duration)
4. Are **randomly** selected from 3 systems

**Problem**: The critical hit system is redundant and confusing - it overlaps with component damage but uses different mechanics.

---

## Proposed Changes

### 1. Simplify Critical Hits
**Change**: Critical hits should just multiply damage by 2x (or configurable multiplier)

**Benefits**:
- Simpler to understand
- No redundant system damage tracking
- Still provides excitement when critical hits occur
- Easier to balance

**Implementation**:
- Remove `systemDamage` object from Aircraft class
- Remove `applyCriticalHit()` function's system damage logic
- Change critical hit to: `damage *= 2.0` (or use `criticalHitMultiplier` setting)
- Keep visual feedback (longer effect duration)

### 2. Realistic Component Hit Location

**Current Problem**: Component selection is completely random (1/7 chance for each component)

**Proposed Solution**: Weight component selection by:
1. **Surface Area Percentages** (base probability)
2. **Attack Angle Modifiers** (realistic hit distribution)

---

## Component Surface Area Percentages

Based on typical WW2 fighter aircraft geometry:

| Component | Surface Area % | Rationale |
|-----------|----------------|-----------|
| **Wings (combined)** | 40% | Largest surface area (left + right wings) |
| - Left Wing | 20% | Half of wing area |
| - Right Wing | 20% | Half of wing area |
| **Fuselage** | 25% | Main body (includes engine, cockpit, fuel tank) |
| - Engine | 8% | Front portion of fuselage |
| - Cockpit | 3% | Small canopy area |
| - Fuel Tank | 4% | Mid-fuselage area |
| - Fuselage Body | 10% | Rest of fuselage |
| **Tail** | 15% | Vertical and horizontal stabilizers |
| **Other** | 20% | Landing gear, external stores, etc. |

**Note**: For simplicity, we'll use these 7 components:
- `leftWing`: 20%
- `rightWing`: 20%
- `engine`: 8%
- `cockpit`: 3%
- `fuelTank`: 4%
- `tail`: 15%
- `wings` (generic): 30% (fallback if left/right not specified)

---

## Attack Angle Modifiers

Attack angle is the angle from the shooter to the target, relative to the target's heading.

**Angle Ranges** (relative to target's heading):
- **0° (Dead Ahead)**: Shooter directly in front of target
- **90° (Side)**: Shooter to the side of target
- **180° (Dead Behind)**: Shooter directly behind target
- **-90° (Other Side)**: Shooter on opposite side

### Component Hit Probability by Attack Angle

| Component | Dead Ahead (0°) | Side (90°) | Dead Behind (180°) | Front Quarter (45°) | Rear Quarter (135°) |
|-----------|----------------|------------|-------------------|-------------------|-------------------|
| **Engine** | +200% | +50% | -50% | +150% | -25% |
| **Cockpit** | +100% | +25% | -75% | +75% | -50% |
| **Wings** | -25% | +150% | -25% | +50% | +25% |
| **Tail** | -75% | -25% | +200% | -50% | +150% |
| **Fuel Tank** | +25% | +50% | +25% | +25% | +25% |

**Formula**: 
```
Final Probability = Base Surface Area % × (1 + Angle Modifier)
```

**Example**:
- Attacking from behind (180°):
  - Tail: 15% × (1 + 2.0) = 45% chance
  - Engine: 8% × (1 - 0.5) = 4% chance
  - Wings: 40% × (1 - 0.25) = 30% chance

---

## Implementation Plan

### Phase 1: Simplify Critical Hits

**File**: `index.html`
**Location**: Line ~15276 (`applyCriticalHit` function)

**Changes**:
1. Remove `systemDamage` initialization from Aircraft constructor (line ~13139)
2. Remove `systemDamage` usage in Aircraft update methods (lines ~14027, ~14122)
3. Simplify `applyCriticalHit()`:
   ```javascript
   function applyCriticalHit(target, weapon) {
       target.criticalHitsTaken++;
       
       // Just multiply damage by 2x (or use configurable multiplier)
       const criticalMultiplier = 2.0; // Could be in gameSettings
       
       // Visual feedback
       target.hitEffects.push({
           x: target.x,
           y: target.y,
           type: 'critical',
           time: Date.now(),
           duration: 1500
       });
       
       // Return multiplier to be applied to damage
       return criticalMultiplier;
   }
   ```
4. Update critical hit calls to apply multiplier:
   ```javascript
   // In processCombat(), when critical hit occurs:
   if (Math.random() < critChance) {
       const critMultiplier = applyCriticalHit(target, weaponType);
       damageAmount *= critMultiplier; // Apply 2x damage
   }
   ```

### Phase 2: Realistic Component Selection

**File**: `index.html`
**Location**: Line ~19455 (`applyComponentDamage` function)

**New Function**: `selectComponentByAngle(attackAngle, targetHeading)`

```javascript
function selectComponentByAngle(attackAngle, targetHeading) {
    // Calculate relative angle (0° = dead ahead, 180° = dead behind)
    let relativeAngle = attackAngle - targetHeading;
    if (relativeAngle > 180) relativeAngle -= 360;
    if (relativeAngle < -180) relativeAngle += 360;
    const absAngle = Math.abs(relativeAngle);
    
    // Base surface area percentages
    const baseProbabilities = {
        leftWing: 0.20,
        rightWing: 0.20,
        engine: 0.08,
        cockpit: 0.03,
        fuelTank: 0.04,
        tail: 0.15,
        wings: 0.30  // Generic wings (if left/right not used)
    };
    
    // Angle modifiers (multipliers)
    let angleModifiers = {};
    
    // Determine angle category
    if (absAngle < 30) {
        // Dead ahead (0° ± 30°)
        angleModifiers = {
            engine: 2.0,      // +200%
            cockpit: 1.0,     // +100%
            leftWing: -0.25,  // -25%
            rightWing: -0.25,
            tail: -0.75,     // -75%
            fuelTank: 0.25   // +25%
        };
    } else if (absAngle < 60) {
        // Front quarter (30° - 60°)
        angleModifiers = {
            engine: 1.5,
            cockpit: 0.75,
            leftWing: 0.5,
            rightWing: 0.5,
            tail: -0.5,
            fuelTank: 0.25
        };
    } else if (absAngle < 120) {
        // Side (60° - 120°)
        angleModifiers = {
            engine: 0.5,
            cockpit: 0.25,
            leftWing: 1.5,   // +150% (wings are largest target from side)
            rightWing: 1.5,
            tail: -0.25,
            fuelTank: 0.5
        };
    } else if (absAngle < 150) {
        // Rear quarter (120° - 150°)
        angleModifiers = {
            engine: -0.25,
            cockpit: -0.5,
            leftWing: 0.25,
            rightWing: 0.25,
            tail: 1.5,       // +150%
            fuelTank: 0.25
        };
    } else {
        // Dead behind (150° - 180°)
        angleModifiers = {
            engine: -0.5,
            cockpit: -0.75,
            leftWing: -0.25,
            rightWing: -0.25,
            tail: 2.0,       // +200%
            fuelTank: 0.25
        };
    }
    
    // Account for left vs right side
    if (relativeAngle < 0) {
        // Attacking from left side - left wing more likely
        angleModifiers.leftWing = (angleModifiers.leftWing || 0) + 0.3;
        angleModifiers.rightWing = (angleModifiers.rightWing || 0) - 0.2;
    } else if (relativeAngle > 0) {
        // Attacking from right side - right wing more likely
        angleModifiers.rightWing = (angleModifiers.rightWing || 0) + 0.3;
        angleModifiers.leftWing = (angleModifiers.leftWing || 0) - 0.2;
    }
    
    // Calculate final probabilities
    const finalProbabilities = {};
    let totalProbability = 0;
    
    for (let component in baseProbabilities) {
        const modifier = angleModifiers[component] || 0;
        finalProbabilities[component] = baseProbabilities[component] * (1 + modifier);
        totalProbability += finalProbabilities[component];
    }
    
    // Normalize to 100%
    for (let component in finalProbabilities) {
        finalProbabilities[component] /= totalProbability;
    }
    
    // Select component using weighted random
    const rand = Math.random();
    let cumulative = 0;
    for (let component in finalProbabilities) {
        cumulative += finalProbabilities[component];
        if (rand <= cumulative) {
            return component;
        }
    }
    
    // Fallback (shouldn't happen)
    return 'wings';
}
```

**Weapon Mount Locations**:
- **`mount: 'front'`**: Nose-mounted/synchronized guns (fire through propeller center)
  - Affected by: Engine damage, Cockpit damage, Fuselage hits
  - Examples: Me-109 synchronized MG, Spitfire nose guns
- **`mount: 'left'`**: Left wing-mounted guns
  - Affected by: Left wing damage
- **`mount: 'right'`**: Right wing-mounted guns
  - Affected by: Right wing damage
- **`mount: 'rear'`**: Rear-mounted weapons (defensive turrets)
  - Affected by: Tail damage
- **`mount: 'turret'`**: Turret-mounted weapons
  - Affected by: Cockpit/fuselage damage

**Weapon Damage Logic**:
- When a component is hit, check if any weapons are mounted in that location
- Apply damage chance based on component type:
  - Engine hit → 25% chance to destroy front-mounted guns
  - Cockpit hit → 15% chance to destroy front-mounted guns
  - Wing hit → 30% chance to destroy wing-mounted guns on that side
  - Tail hit → 20% chance to destroy rear-mounted weapons
- Destroyed weapons: Set `isDestroyed = true` and `count = 0`

**Updated `applyComponentDamage` function**:

```javascript
function applyComponentDamage(aircraft, damage, attackAngle = null, attackerHeading = null) {
    if (!gameSettings.enableComponentDamage) {
        aircraft.damage += damage;
        return;
    }

    // Select component based on attack angle if provided
    let component;
    if (attackAngle !== null && attackerHeading !== null) {
        component = selectComponentByAngle(attackAngle, aircraft.heading);
    } else {
        // Fallback to random selection (backward compatibility)
        component = ['engine', 'wings', 'tail', 'cockpit', 'fuelTank', 'leftWing', 'rightWing'][Math.floor(Math.random() * 7)];
    }
    
    aircraft.componentDamage[component] += damage;

    // Engine damage reduces max speed and acceleration
    if (component === 'engine') {
        aircraft.maxSpeed *= 0.95;
        aircraft.maxAcceleration *= 0.9;
    }

    // Wing damage affects turn rate
    if (component === 'leftWing') {
        aircraft.asymmetricDamage.left += damage;
        aircraft.maxTurnRate *= 0.95;
    } else if (component === 'rightWing') {
        aircraft.asymmetricDamage.right += damage;
        aircraft.maxTurnRate *= 0.95;
    } else if (component === 'wings') {
        // Generic wings damage - split between left and right
        aircraft.asymmetricDamage.left += damage * 0.5;
        aircraft.asymmetricDamage.right += damage * 0.5;
        aircraft.maxTurnRate *= 0.95;
    }

    // Tail damage affects stability and control
    if (component === 'tail') {
        aircraft.maxClimbRate *= 0.9;
        aircraft.maxTurnRate *= 0.95; // Tail has rudder - affects yaw control
        
        // Damage rear-mounted weapons (if any)
        if (aircraft.weaponGroups) {
            for (let weaponGroup of aircraft.weaponGroups) {
                if (weaponGroup.mount === 'rear' && !weaponGroup.isDestroyed && Math.random() < 0.2) {
                    weaponGroup.isDestroyed = true;
                    weaponGroup.count = 0; // Disable weapon
                    console.log(`${aircraft.name}: ${weaponGroup.name} destroyed (tail damage)`);
                }
            }
        }
    }

    // Cockpit damage can wound pilot
    if (component === 'cockpit' && Math.random() < 0.3) {
        aircraft.pilotWounded = true;
        aircraft.pilotSkill *= 0.7;
        aircraft.gunnerySkill *= 0.7;
    }
    
    // Fuselage/cockpit damage can affect nose-mounted/synchronized guns
    if ((component === 'cockpit' || component === 'engine') && aircraft.weaponGroups) {
        // Nose-mounted guns (synchronized, firing through prop) are in fuselage
        for (let weaponGroup of aircraft.weaponGroups) {
            if (weaponGroup.mount === 'front' && !weaponGroup.isDestroyed) {
                // Higher chance for engine hits (guns are often near engine)
                const damageChance = component === 'engine' ? 0.25 : 0.15;
                if (Math.random() < damageChance) {
                    weaponGroup.isDestroyed = true;
                    weaponGroup.count = 0; // Disable weapon
                    console.log(`${aircraft.name}: ${weaponGroup.name} destroyed (${component} damage)`);
                }
            }
        }
    }

    // Wing damage can destroy wing-mounted weapons
    if ((component === 'leftWing' || component === 'rightWing' || component === 'wings') && aircraft.weaponGroups) {
        const wingSide = component === 'leftWing' ? 'left' : component === 'rightWing' ? 'right' : null;
        
        for (let weaponGroup of aircraft.weaponGroups) {
            // Match wing side to weapon mount
            if (wingSide && weaponGroup.mount === wingSide) {
                if (!weaponGroup.isDestroyed && Math.random() < 0.3) {
                    weaponGroup.isDestroyed = true;
                    weaponGroup.count = 0; // Disable weapon
                    console.log(`${aircraft.name}: ${weaponGroup.name} destroyed (${component} damage)`);
                }
            } else if (!wingSide && (weaponGroup.mount === 'left' || weaponGroup.mount === 'right')) {
                // Generic "wings" damage - can affect either side
                if (!weaponGroup.isDestroyed && Math.random() < 0.15) {
                    weaponGroup.isDestroyed = true;
                    weaponGroup.count = 0;
                    console.log(`${aircraft.name}: ${weaponGroup.name} destroyed (wing damage)`);
                }
            }
        }
    }

    // Fuel tank damage creates leak
    if (component === 'fuelTank') {
        aircraft.fuelLeak = true;
    }

    // Update overall damage
    aircraft.damage = Math.max(
        aircraft.componentDamage.engine,
        aircraft.componentDamage.wings,
        aircraft.componentDamage.tail,
        aircraft.componentDamage.cockpit,
        aircraft.componentDamage.fuelTank,
        aircraft.componentDamage.leftWing + aircraft.componentDamage.rightWing
    );
}
```

### Phase 3: Add Weapon HP Tracking

**File**: `index.html`
**Location**: Aircraft constructor (line ~13077) and `applyComponentDamage` function

**Changes**:
1. Initialize weapon destruction state in Aircraft constructor:
```javascript
// In Aircraft constructor, after weaponGroups initialization:
if (this.weaponGroups) {
    for (let weaponGroup of this.weaponGroups) {
        weaponGroup.isDestroyed = false; // Track if weapon is destroyed
    }
}
```

2. Update weapon firing logic to check `isDestroyed`:
```javascript
// In processCombat(), when checking if weapon can fire (line ~15772):
// Add isDestroyed check:
if (weaponGroup.isDestroyed) continue; // Skip destroyed weapons
if (weaponGroup.type !== 'laser' && weaponGroup.type !== 'particle_beam') {
    if (weaponGroup.ammunition <= 0) continue;
}
```

**Locations to update**:
- Line ~15772: Main mixed armament combat loop
- Line ~16232: Legacy single weapon combat (if applicable)
- Any other weapon firing checks

3. Add weapon damage logic to `applyComponentDamage()` (see updated function above)

### Phase 4: Update Combat Calls

**File**: `index.html`
**Location**: Lines ~16000, ~16078, ~16163 (combat processing)

**Changes**: Update all `applyComponentDamage()` calls to pass attack angle:

```javascript
// Calculate attack angle (angle from shooter to target)
const dx = target.x - shooter.x;
const dy = target.y - shooter.y;
const attackAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;

// Apply component damage with angle information
applyComponentDamage(target, damageAmount, attackAngle, shooter.heading);
```

---

## Testing Plan

1. **Critical Hit Testing**:
   - Verify critical hits now do 2x damage
   - Verify no system damage is tracked
   - Verify visual feedback still works

2. **Component Selection Testing**:
   - Attack from behind → tail should be hit most often (~45%)
   - Attack from front → engine/cockpit should be hit most often
   - Attack from side → wings should be hit most often
   - Verify probabilities match expected distributions

3. **Backward Compatibility**:
   - Verify old code paths still work (when angle not provided)
   - Verify game doesn't break if `systemDamage` references are removed

---

## Benefits of This Approach

1. **More Realistic**: Component hits match real-world attack angles
2. **Tactical Depth**: Players can position for better component hits
3. **Simpler**: Critical hits are just 2x damage (easier to understand)
4. **No Redundancy**: Removes confusing dual damage systems
5. **Better Gameplay**: Attacking from behind hits tail (reduces climb), from front hits engine (reduces speed)

---

## Configuration Options

Add to `gameSettings`:
```javascript
gameSettings = {
    // ... existing settings
    criticalHitMultiplier: 2.0,  // Damage multiplier for critical hits
    useAngleBasedComponentDamage: true  // Enable realistic component selection
}
```

---

## Implementation Order

1. ✅ Remove `systemDamage` tracking
2. ✅ Simplify `applyCriticalHit()` to return multiplier
3. ✅ Update critical hit calls to apply multiplier
4. ✅ Create `selectComponentByAngle()` function
5. ✅ Update `applyComponentDamage()` to accept angle parameters
6. ✅ Update all combat calls to pass angle information
7. ✅ Test and balance probabilities
8. ✅ Add configuration options

---

## Notes

- Surface area percentages are estimates based on typical fighter geometry
- Angle modifiers can be tuned for gameplay balance
- Left/right wing selection based on attack side adds realism
- Fallback to random selection maintains backward compatibility

