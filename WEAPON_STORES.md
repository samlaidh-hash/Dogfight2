# Weapon Store System for Hardpoint Implementation

## Overview

This document describes the comprehensive weapon store type definitions for the hardpoint system in Dogfight 2. The `WeaponStore` class and database define all physical stores (weapons, tanks, pods) that can be mounted on aircraft hardpoints.

---

## File Location

`/home/user/Dogfight2/weapon-stores.js`

---

## WeaponStore Class

The `WeaponStore` class represents a physical store that can be mounted on a hardpoint. Each store has properties that affect gameplay, aircraft performance, and visual representation.

### Constructor Properties

```javascript
new WeaponStore({
    // Identification
    id: 'MK82',                    // Unique identifier
    type: 'bomb',                   // Store type
    name: 'Mk.82 500lb Bomb',      // Display name
    era: 'Modern',                  // WW2, Vietnam, or Modern

    // Physical properties
    weight: 241,                    // Weight in kg
    dragCoefficient: 0.12,          // Aerodynamic drag (0.0-1.0)

    // Visual representation
    visual: {
        shape: 'ellipse',           // ellipse, rectangle, or cylinder
        color: '#4a4a4a',           // Primary color
        width: 6,                   // Width in pixels
        height: 15,                 // Height in pixels
        detailColor: '#666666'      // Secondary color
    },

    // Type-specific properties
    capacity: 19,                   // For rocket_pod/gun_pod
    explosiveYield: 95,             // Damage potential
    explosionRadius: 55,            // Blast radius in meters
    guidanceType: 'heat-seeking',   // For missiles
    fuelCapacity: 1136,             // For fuel tanks (liters)
    jamEffectiveness: 0.65          // For ECM pods (0.0-1.0)
})
```

### Key Methods

- **`getCurrentWeight()`** - Returns current weight including remaining fuel/ammo
- **`getCurrentDrag()`** - Returns current drag coefficient
- **`use()`** - Consumes one unit (fire rocket, drop bomb, etc.)
- **`render(ctx, x, y, heading)`** - Renders the store on the aircraft

---

## Store Database

The `WEAPON_STORES` database contains **31 different stores** organized by type and era.

### Store Count by Type

| Type | Count | Description |
|------|-------|-------------|
| **Bombs** | 8 | Free-fall unguided munitions |
| **Missiles** | 6 | Guided air-to-air weapons |
| **Rocket Pods** | 6 | Unguided rockets in launch containers |
| **Fuel Tanks** | 5 | External drop tanks for extended range |
| **Gun Pods** | 3 | External cannon installations |
| **ECM Pods** | 3 | Electronic countermeasures |
| **TOTAL** | **31** | |

### Store Count by Era

| Era | Count |
|-----|-------|
| **WW2** | 9 |
| **Vietnam** | 4 |
| **Modern** | 18 |

---

## Store Categories

### 1. BOMBS (8 stores)

Free-fall ballistic weapons with gravity simulation.

#### WW2 Era (5 bombs)
- **AN-M64 500lb** - American 500lb general purpose bomb (227 kg)
- **GP 500lb** - British 500lb general purpose bomb (227 kg)
- **SC 500** - German 500kg bomb (500 kg, most powerful WW2 bomb)
- **AN-M30 100lb** - American 100lb bomb (45 kg, lightest)
- **SC 250** - German 250kg bomb (250 kg)

#### Modern Era (3 bombs)
- **Mk.82** - 500lb modern bomb (241 kg)
- **Mk.83** - 1000lb modern bomb (447 kg)
- **Mk.84** - 2000lb modern bomb (894 kg, heaviest bomb)

**Gameplay Properties:**
- Weight: 45 kg (AN-M30) to 894 kg (Mk.84)
- Drag: 0.12-0.18
- Explosion Radius: 30-90 meters
- Damage: 40-180

---

### 2. MISSILES (6 stores)

Guided weapons with heat-seeking or radar guidance.

#### Heat-Seeking Missiles (3 stores)
- **AIM-9 Sidewinder** - Classic infrared missile (85 kg)
- **AIM-9L Sidewinder** - All-aspect variant (85 kg)
- **R-60 Aphid (AA-8)** - Soviet IR missile (43 kg, lightest)

#### Radar-Guided Missiles (3 stores)
- **AIM-120 AMRAAM** - Modern active radar (152 kg)
- **R-27 Alamo (AA-10)** - Soviet radar missile (253 kg, heaviest)
- **AIM-7 Sparrow** - Semi-active beam-riding (230 kg, Vietnam era)

**Gameplay Properties:**
- Weight: 43 kg (R-60) to 253 kg (R-27)
- Drag: 0.06-0.09 (lowest drag of all stores)
- Explosion Radius: 20-35 meters
- Damage: 50-85
- Guidance: heat-seeking, radar-guided, or beam-riding

**Note:** Missile class needs to be implemented to fully utilize these stores.

---

### 3. ROCKET PODS (6 stores)

Containers holding multiple unguided rockets.

#### WW2 Era (2 pods)
- **RP-3 Rail** - British 8× 60lb rockets (85 kg)
- **M8 Launcher** - American 6× 4.5" rockets (65 kg)

#### Vietnam Era (1 pod)
- **LAU-3/A** - 19× 2.75" rockets (95 kg)

#### Modern Era (3 pods)
- **UB-32** - Soviet 32× S-5 rockets (115 kg, most rockets)
- **LAU-68** - 7× Hydra 70 rockets (58 kg)
- **LAU-61** - 19× Hydra 70 rockets (102 kg)

**Gameplay Properties:**
- Weight: 58 kg (LAU-68) to 115 kg (UB-32)
- Drag: 0.22-0.35 (highest drag due to shape)
- Capacity: 6-32 rockets per pod
- Per-Rocket Damage: 35-55
- Per-Rocket Radius: 18-25 meters

---

### 4. FUEL TANKS (5 stores)

External drop tanks that extend aircraft range.

- **150 Gallon Drop Tank** - WW2 small tank (455 kg, 568L)
- **300 Gallon Drop Tank** - WW2 standard tank (910 kg, 1136L)
- **370 Gallon Centerline** - Vietnam centerline tank (1122 kg, 1401L)
- **600 Gallon Drop Tank** - Modern large tank (1820 kg, 2271L, heaviest store)
- **1000 Liter Drop Tank** - Modern metric tank (800 kg, 1000L)

**Gameplay Properties:**
- Weight: 455 kg (150 gal) to 1820 kg (600 gal)
- Drag: 0.16-0.20
- Fuel Capacity: 568L to 2271L
- All jettisionable
- Weight decreases as fuel is consumed
- Empty tanks create more drag

**Special Features:**
- Dynamic weight calculation based on remaining fuel
- Can be jettisoned to reduce weight/drag
- Fuel weight: ~0.8 kg per liter
- Empty tank is ~15% of full weight

---

### 5. GUN PODS (3 stores)

External cannon/gun installations.

- **SUU-23/A** - 20mm gun pod, 1200 rounds (286 kg, Vietnam)
- **GPU-5/A** - 30mm GAU-8 pod, 353 rounds (860 kg, Modern, heaviest gun pod)
- **ADEN Pod** - 30mm cannon pod, 150 rounds (320 kg, Modern)

**Gameplay Properties:**
- Weight: 286 kg (SUU-23) to 860 kg (GPU-5/A)
- Drag: 0.21-0.24
- Ammunition: 150-1200 rounds
- Caliber: 20mm or 30mm
- Rate of Fire: 22-100 rounds/second

**Note:** Gun pods provide additional firepower but add significant weight and drag.

---

### 6. ECM PODS (3 stores)

Electronic countermeasures for defensive capabilities.

- **ALQ-131** - Standard ECM pod (195 kg, 65% effectiveness)
- **ALQ-184** - Advanced ECM pod (160 kg, 70% effectiveness, lightest)
- **SPS-141** - Soviet ECM pod (170 kg, 60% effectiveness)

**Gameplay Properties:**
- Weight: 160 kg (ALQ-184) to 195 kg (ALQ-131)
- Drag: 0.14-0.16 (low drag, streamlined)
- Jam Effectiveness: 60%-70%
- Not expendable (can't be used up)
- Provides continuous defensive bonus

**Special Features:**
- Reduces enemy radar-guided missile effectiveness
- Passive benefit while mounted
- Minimal drag penalty for defensive capability

---

## Performance Impact System

The weapon store system includes comprehensive performance calculations:

### Weight Impact

```javascript
const impact = getPerformanceImpact(stores, baseWeight);
// Returns:
{
    acceleration: 0.85,      // 15% slower acceleration
    turnRate: 0.92,          // 8% worse turn rate
    climbRate: 0.78,         // 22% worse climb rate
    topSpeed: 0.88,          // 12% lower top speed
    totalWeight: 450,        // Total store weight in kg
    totalDrag: 0.45,         // Total drag coefficient
    weightRatio: 1.15        // (aircraft + stores) / aircraft
}
```

### Effects on Aircraft

1. **Acceleration** - Inversely proportional to weight ratio
   - Heavier loads = slower acceleration
   - Formula: `1.0 / weightRatio`

2. **Turn Rate** - Inversely proportional to sqrt of weight ratio
   - Heavier loads = wider turns
   - Formula: `1.0 / sqrt(weightRatio)`

3. **Climb Rate** - Most affected by weight
   - Heavier loads = poor climb
   - Formula: `1.0 / (weightRatio × 1.2)`

4. **Top Speed** - Affected by drag
   - More drag = lower top speed
   - Each 1.0 drag coefficient reduces speed by 15%
   - Minimum: 50% of base speed

5. **Asymmetric Loading** - Affects handling
   - Left wing heavy = pulls left in turns
   - Right wing heavy = pulls right in turns
   - Framework in place for implementation

---

## Integration with Existing Weapon Classes

The weapon store system integrates seamlessly with existing game classes:

### Bomb Integration

```javascript
// Create a bomb from a store
const bombStore = createStore('MK82');
const bomb = createBombFromStore(
    bombStore,
    aircraft.x,
    aircraft.y,
    aircraft.altitude,
    aircraft.speed,
    aircraft.heading
);
// Uses existing Bomb class, inherits store properties
```

### Rocket Integration

```javascript
// Create a rocket from a rocket pod
const rocketPod = createStore('LAU3_19');
const rocket = createRocketFromStore(
    rocketPod,
    aircraft.x,
    aircraft.y,
    aircraft.altitude,
    aircraft.heading,
    target
);
// Uses existing Rocket class, decrements pod count
```

### Missile Integration

```javascript
// Create a missile from a store (Missile class TBD)
const missileStore = createStore('AIM9_SIDEWINDER');
const missile = createMissileFromStore(
    missileStore,
    aircraft.x,
    aircraft.y,
    aircraft.altitude,
    aircraft.heading,
    target
);
// Will use Missile class when implemented
```

---

## Utility Functions

### Store Creation and Query

```javascript
// Create a store instance from database
const store = createStore('MK82');

// Get all bombs
const bombs = getStoresByType('bomb');

// Get all WW2 stores
const ww2Stores = getStoresByEra('WW2');

// Get WW2 bombs specifically
const ww2Bombs = getStores('bomb', 'WW2');
```

### Performance Calculations

```javascript
// Calculate total weight
const totalWeight = calculateTotalWeight([store1, store2, store3]);

// Calculate total drag
const totalDrag = calculateTotalDrag([store1, store2, store3]);

// Get complete performance impact
const impact = getPerformanceImpact(stores, aircraftWeight);
```

### Statistics

```javascript
// Get complete database statistics
const stats = getStoreStatistics();
console.log(`Total stores: ${stats.total}`);
console.log(`Bombs: ${stats.byType.bomb}`);
console.log(`WW2 era: ${stats.byEra.WW2}`);
```

---

## Visual Rendering

Each store has a visual definition that determines how it appears when mounted:

### Shape Types

1. **Ellipse** - Bombs and missiles
   - Aerodynamic teardrop shape
   - Fins rendered for missiles

2. **Rectangle** - Rocket pods
   - Boxy container shape
   - Detail lines for tube array

3. **Cylinder** - Fuel tanks, gun pods, ECM pods
   - Cylindrical body with end caps
   - Streamlined appearance

### Color Coding by Type

- **Bombs:** Dark gray (#3d3d3d - #4a4a4a)
- **Missiles:** Light gray/silver (#c0c0c0 - #e8e8e8)
- **Rocket Pods:** Medium gray/olive (#555555 - #4a4a3a)
- **Fuel Tanks:** Metal gray (#656565 - #707070)
- **Gun Pods:** Dark gray/black (#3a3a3a - #454545)
- **ECM Pods:** Medium gray (#555555 - #606060)

---

## Usage Example

```javascript
// 1. Create stores
const leftWingBomb = createStore('MK82');
const rightWingBomb = createStore('MK82');
const centerlineTank = createStore('DROP_300');
const leftPylon = createStore('AIM9_SIDEWINDER');
const rightPylon = createStore('AIM9_SIDEWINDER');

// 2. Calculate performance impact
const allStores = [leftWingBomb, rightWingBomb, centerlineTank, leftPylon, rightPylon];
const impact = getPerformanceImpact(allStores, 5000); // 5000kg aircraft

console.log(`Aircraft is ${impact.weightRatio.toFixed(2)}x heavier`);
console.log(`Top speed reduced to ${(impact.topSpeed * 100).toFixed(0)}%`);
console.log(`Turn rate reduced to ${(impact.turnRate * 100).toFixed(0)}%`);

// 3. Drop a bomb
if (dropBombKeyPressed) {
    const bomb = createBombFromStore(
        leftWingBomb,
        aircraft.x,
        aircraft.y,
        aircraft.altitude,
        aircraft.speed,
        aircraft.heading
    );
    bombs.push(bomb); // Add to game's bomb array
}

// 4. Fire a rocket
if (fireRocketKeyPressed) {
    const rocketPod = allStores.find(s => s.type === 'rocket_pod');
    if (rocketPod && rocketPod.currentCount > 0) {
        const rocket = createRocketFromStore(
            rocketPod,
            aircraft.x,
            aircraft.y,
            aircraft.altitude,
            aircraft.heading,
            groundTarget
        );
        rockets.push(rocket);
        console.log(`Rockets remaining: ${rocketPod.currentCount}`);
    }
}

// 5. Jettison fuel tank
if (jettisonKeyPressed) {
    const fuelTank = allStores.find(s => s.type === 'fuel_tank');
    if (fuelTank && fuelTank.jettisionable) {
        fuelTank.isActive = false; // Remove from aircraft
        console.log('Fuel tank jettisoned!');
    }
}

// 6. Render stores on aircraft
allStores.forEach(store => {
    if (store.isActive) {
        store.render(ctx, hardpoint.x, hardpoint.y, aircraft.heading);
    }
});
```

---

## Implementation Notes

### For Hardpoint Class (Other Agent)

The Hardpoint class should:

1. **Store Management**
   - Hold reference to mounted WeaponStore
   - Track mount position (left wing, right wing, centerline, etc.)
   - Handle mounting/unmounting stores
   - Pass store data to aircraft performance calculations

2. **Performance Integration**
   - Call `getPerformanceImpact()` when stores change
   - Apply multipliers to aircraft stats
   - Detect asymmetric loading (left vs right weight difference)

3. **Visual Integration**
   - Call store's `render()` method at hardpoint position
   - Offset stores appropriately from aircraft center
   - Hide stores when expended or jettisoned

### For Performance Calculations (Other Agent)

The performance system should:

1. **Use Impact Data**
   - Get impact object from `getPerformanceImpact()`
   - Apply multipliers to base aircraft stats
   - Recalculate when stores are expended

2. **Asymmetric Handling**
   - Compare left wing weight vs right wing weight
   - Apply turning penalties/bonuses based on imbalance
   - Heavy side: turns slower toward that side
   - Light side: turns faster toward that side

3. **Dynamic Updates**
   - Recalculate when rockets are fired (weight decreases)
   - Recalculate when fuel is consumed (weight decreases)
   - Recalculate when stores are jettisoned

---

## Future Enhancements

### Potential Additions

1. **More Store Types**
   - Reconnaissance pods
   - Targeting pods
   - Chaff/flare dispensers
   - Buddy refueling pods
   - Nuclear weapons (if going that direction)

2. **Advanced Missile Types**
   - Anti-radiation missiles (ARM)
   - Anti-ship missiles
   - Cruise missiles
   - TV/laser-guided bombs

3. **Historical Variants**
   - Napalm canisters
   - Cluster munitions
   - Mines
   - Torpedoes (for naval scenarios)

4. **Visual Improvements**
   - More detailed store rendering
   - Store-specific exhaust effects
   - Damage states (charred, scratched)
   - National markings

---

## Summary

The weapon store system provides:

✅ **31 comprehensive stores** across 6 categories
✅ **3 historical eras** (WW2, Vietnam, Modern)
✅ **Full performance impact** calculations
✅ **Visual rendering** system
✅ **Integration** with existing weapon classes
✅ **Utility functions** for easy implementation
✅ **Flexible architecture** for future expansion

### Store Breakdown

- **8 Bombs** - WW2 to Modern era (45-894 kg)
- **6 Missiles** - Heat-seeking and radar-guided (43-253 kg)
- **6 Rocket Pods** - WW2 to Modern, 6-32 rockets (58-115 kg)
- **5 Fuel Tanks** - 150-600 gallon capacity (455-1820 kg)
- **3 Gun Pods** - 20mm to 30mm cannon (286-860 kg)
- **3 ECM Pods** - 60-70% jamming effectiveness (160-195 kg)

All stores include historically accurate specifications, visual definitions, and gameplay properties that affect aircraft performance in realistic ways.

---

## Files

- **weapon-stores.js** - Complete implementation (/home/user/Dogfight2/weapon-stores.js)
- **WEAPON_STORES.md** - This documentation (/home/user/Dogfight2/WEAPON_STORES.md)

---

*Ready for integration with Hardpoint class and performance calculations.*
