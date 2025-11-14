# Ground Attack Weapons Implementation

## Overview
Full implementation of bombs and rockets for ground attack missions in Dogfight 2. This adds historically accurate ordinance capabilities to aircraft based on their real-world roles.

---

## Weapon Systems

### 1. **Bombs**
- **Type:** Free-fall ballistic weapons
- **Damage:** 80 base damage
- **Explosion Radius:** 50 meters
- **Physics:** Full gravity simulation with forward velocity inheritance
- **Damage Falloff:** Linear from center to edge of blast radius
- **Visual:** Orange fireball with yellow core and smoke effects
- **Duration:** 1 second explosion animation

**Usage:**
- Press **B** key to drop a bomb
- Works during ORDER phase (planning) or EXECUTION phase
- Best dropped from low altitude for accuracy
- Effective against clusters of ground targets

### 2. **Rockets**
- **Type:** Direct-fire guided projectiles
- **Damage:** 40 direct hit damage
- **Explosion Radius:** 20 meters (smaller than bombs)
- **Speed:** 200 m/s (very fast)
- **Max Range:** 1500 meters
- **Simple Homing:** Will aim at nearest ground target if available
- **Visual:** Gray rocket body with fins and orange exhaust trail
- **Duration:** 600ms explosion animation

**Usage:**
- Press **N** key to launch a rocket
- Automatically targets nearest ground target within 800m
- More accurate than bombs for precision strikes
- Better for single high-value targets
- Flies straight at high speed

---

## Aircraft Ground Attack Capabilities

### Fighter-Bombers (Full Capability)
| Aircraft | Bombs | Rockets | Role |
|----------|-------|---------|------|
| **P-47 Thunderbolt** | 2 | 8 | Primary fighter-bomber |
| **Fw-190 A-8** | 2 | 8 | Jabo (fighter-bomber) variant |
| **Typhoon Mk IB** | 2 | 8 | Ground attack specialist |
| **Tempest Mk V** | 2 | 8 | Fighter-bomber |
| **Bf-110 C-4** | 2 | 8 | Heavy fighter/ground attack |

### Fighters with Limited Ground Attack
| Aircraft | Bombs | Rockets | Notes |
|----------|-------|---------|-------|
| **Hurricane Mk IIB** | - | 8 | Mk IID "Tank Buster" variant |
| **P-40 Warhawk** | 2 | - | Limited ground attack capability |

### Dedicated Bombers
| Aircraft | Bombs | Rockets | Role |
|----------|-------|---------|------|
| **Ju 87 Stuka** | 4 | 8 | Dive bomber specialist |
| **Ju 88 A-4** | 6 | - | Medium bomber |
| **He 111 H-6** | 8 | - | Heavy medium bomber |

### Pure Fighters (No Ground Attack)
- Spitfire Mk Vb
- Me-109 G-6
- P-51D Mustang
- Me-262 Schwalbe
- A6M5 Zero

---

## New Aircraft Added

### 1. **Messerschmitt Bf 110 C-4** (Bf-110)
- **Nation:** German
- **Role:** Heavy Fighter/Ground Attack
- **Top Speed:** 170 m/s (~560 km/h)
- **Turn Rate:** 48° (poor - heavy twin-engine)
- **Armament:** 4× 7.92mm MG 17 + 2× 20mm MG FF/M cannons
- **Ordinance:** 2 bombs, 8 rockets
- **Characteristics:** Long range, heavy firepower, poor maneuverability

### 2. **Junkers Ju 87 D-5 Stuka** (Ju-87)
- **Nation:** German
- **Role:** Dive Bomber
- **Top Speed:** 135 m/s (~410 km/h) - Slow!
- **Dive Rate:** 60 m/s - EXCELLENT (purpose-built)
- **Armament:** 2× 7.92mm MG 17 (defensive)
- **Ordinance:** 4 bombs, 8 rockets
- **Characteristics:** Best dive performance, slow, vulnerable to fighters

### 3. **Junkers Ju 88 A-4** (Ju-88)
- **Nation:** German
- **Role:** Medium Bomber
- **Top Speed:** 150 m/s (~470 km/h)
- **Turn Rate:** 42° (poor - bomber)
- **Armament:** 3× 7.92mm MG 81 (defensive)
- **Ordinance:** 6 bombs
- **Characteristics:** Multi-role bomber, long range

### 4. **Heinkel He 111 H-6** (He-111)
- **Nation:** German
- **Role:** Medium Bomber
- **Top Speed:** 140 m/s (~440 km/h)
- **Turn Rate:** 38° (very poor)
- **Armament:** 5× 7.92mm MG 15/17 (defensive)
- **Ordinance:** 8 bombs
- **Characteristics:** Heavy bomber, very long range, slow

### 5. **Hawker Typhoon Mk IB** (Typhoon)
- **Nation:** British
- **Role:** Fighter-Bomber/Ground Attack
- **Top Speed:** 178 m/s (~652 km/h)
- **Turn Rate:** 55° (heavy, poor turn)
- **Armament:** 4× 20mm Hispano Mk II cannons
- **Ordinance:** 2 bombs, 8 rockets
- **Characteristics:** Famous for rocket attacks, excellent dive

### 6. **Hawker Tempest Mk V** (Tempest)
- **Nation:** British
- **Role:** Fighter-Bomber
- **Top Speed:** 190 m/s (~700 km/h) - Very fast!
- **Turn Rate:** 62°
- **Armament:** 4× 20mm Hispano Mk V cannons
- **Ordinance:** 2 bombs, 8 rockets
- **Characteristics:** Fast, excellent climb, good all-around performance

---

## Controls

### Ground Attack Controls
| Key | Action |
|-----|--------|
| **B** | Drop Bomb |
| **N** | Launch Rocket |

### When to Use
- **Bombs:** Best during planning phase or early in execution
- **Rockets:** Can be used anytime, automatically targets nearest ground target
- Both work in ORDER and EXECUTION phases

---

## Technical Implementation

### Bomb Class
```javascript
- Gravity simulation (9.8 m/s²)
- Inherits aircraft velocity (x, y components)
- Collision detection with terrain
- Area damage to ground targets
- Explosion animation with fireball/smoke
```

### Rocket Class
```javascript
- Fixed velocity (200 m/s)
- Optional target homing
- Max range (1500m)
- Collision detection with ground and targets
- Smaller explosion than bombs
```

### Physics Integration
- Updates at 60 FPS during EXECUTION phase
- Independent of aircraft movement
- Proper cleanup after explosions
- Terrain collision detection

### Aircraft Integration
- `bombCapacity` and `rocketCapacity` properties in aircraft database
- `dropBomb()` and `launchRocket()` methods
- UI display shows remaining ordinance
- Bombs and rockets decremented on use

---

## Ground Target Interaction

### Damage Application
- **Bombs:** Area damage with falloff
  - Full damage at center
  - Linear falloff to explosion radius edge

- **Rockets:** Precise damage
  - 50-100% damage based on distance from impact
  - Smaller blast radius requires more accuracy

### Ground Target Types
1. **Trucks** - Soft targets (health: 100)
2. **AA Guns** - Can fire back (health: 100)
3. **Fuel Depots** - High value (health: 100)
4. **Bridges** - Strategic targets (health: 100, large)

---

## Mission Integration

### Ground Attack Missions
Existing missions can use aircraft with ground attack capabilities:

**Mission 4: "Ground Assault"**
- Aircraft: P-47 Thunderbolt
- Targets: 4 ground targets
- Perfect for testing bombs and rockets

**Mission 7: "Bridge Buster"**
- Aircraft: P-47 Thunderbolt
- Target: 1 bridge
- Requires multiple bombing runs

### Creating Custom Ground Attack Missions
```javascript
{
    id: X,
    name: "Mission Name",
    type: "ground_attack",
    playerAircraft: "Typhoon", // or other bomber
    enemyAircraft: [],
    groundTargets: 5,
    groundTargetTypes: ["truck", "aa_gun", "fuel_depot"],
    weather: "clear",
    timeOfDay: "noon"
}
```

---

## Historical Accuracy

### Loadouts
All aircraft ordinance capabilities are based on historical loadouts:

- **P-47:** Could carry up to 2,500 lbs of bombs + 10 rockets historically
- **Typhoon:** Famous for devastating rocket attacks in WWII
- **Stuka:** Iconic dive bomber, siren-equipped
- **Fw-190:** Jabo variants were effective fighter-bombers
- **Bf 110:** Heavy fighter used for ground attack missions

### Weapon Characteristics
- Bomb ballistics simulate unguided munitions
- Rocket speed approximates WWII rocket performance
- Damage values balanced for gameplay while respecting historical impact

---

## Performance Characteristics

### New Aircraft Strengths & Weaknesses

**Best Dive Bomber:** Ju 87 Stuka (60 m/s dive rate)
**Fastest:** Tempest (190 m/s)
**Heaviest Bomb Load:** He 111 (8 bombs)
**Best Fighter-Bomber:** Typhoon (speed + ordinance)
**Most Vulnerable:** Stuka (slow, poor turn)
**Longest Range:** He 111 (2400L fuel capacity)

---

## Usage Tips

### Bombing Tactics
1. **Altitude:** Drop from 200-400m for best accuracy
2. **Speed:** Faster speed = more forward travel
3. **Lead Target:** Account for bomb travel time
4. **Dive Bombing:** Use Stuka for precision vertical drops
5. **Area Denial:** Bombs excellent vs. clustered targets

### Rocket Tactics
1. **Range:** Launch within 800m for auto-targeting
2. **Precision:** Better for single high-value targets
3. **Speed:** Fast delivery, less vulnerable to AA
4. **Volume:** Use multiple rockets on hard targets (bridges)
5. **Conservation:** Save for critical targets

### Aircraft Selection
- **AA Heavy Areas:** Use fast aircraft (Tempest, Typhoon)
- **Precision Strikes:** Use Stuka dive bombing
- **Maximum Destruction:** Use He 111 or Ju 88 bomber load
- **Fighter Threat:** Use fighter-bombers (P-47, Fw-190) for self-defense

---

## Files Modified

1. **dogfight.html**
   - Added `Bomb` class (lines 1314-1406)
   - Added `Rocket` class (lines 1408-1549)
   - Added 6 new aircraft to database (lines 1084-1270)
   - Updated aircraft with ground attack flags
   - Added `dropBomb()` and `launchRocket()` methods to Aircraft
   - Added bomb/rocket update logic in game loop
   - Added bomb/rocket rendering
   - Added B and N key bindings

---

## Testing

### Test Scenarios

1. **Basic Bombing**
   - Load Mission 4 with P-47
   - Drop bombs on trucks
   - Verify explosion effects and damage

2. **Rocket Strikes**
   - Launch rockets at ground targets
   - Verify homing behavior
   - Check precision vs bombs

3. **Dive Bombing**
   - Use Ju 87 Stuka
   - Perform steep dive
   - Drop bomb at low altitude
   - Test accuracy improvement

4. **Heavy Bomber**
   - Use He 111 or Ju 88
   - Attack multiple targets
   - Verify high bomb capacity

5. **AA Evasion**
   - Attack AA gun positions
   - Test aircraft vulnerability
   - Verify AA fire-back mechanics

---

## Future Enhancements

### Potential Additions
1. **Smart Bombs:** Guided munitions for late-war aircraft
2. **Torpedo Bombers:** For naval targets
3. **Cluster Bombs:** Multiple submunitions
4. **Incendiary Bombs:** Persistent fire effects
5. **HVAR Rockets:** Larger rockets for heavy fighters
6. **Rocket Salvo Mode:** Fire multiple rockets at once
7. **Bomb Sight:** Dedicated bombing view with lead indicators
8. **Skip Bombing:** Low-level water skip attacks

### Balance Adjustments
- Fine-tune damage values based on playtesting
- Adjust explosion radii if needed
- Add difficulty modifiers for ordinance accuracy
- Implement wind effects on bomb trajectories

---

## Summary

This implementation adds **full ground attack capability** to Dogfight 2 with:
- ✅ 2 weapon types (bombs & rockets)
- ✅ 11 aircraft with ground attack (5 fighter-bombers, 3 bombers, 3 limited)
- ✅ 6 completely new aircraft added
- ✅ Full physics simulation
- ✅ Historical accuracy
- ✅ Complete integration with existing missions
- ✅ Visual effects and feedback
- ✅ Simple controls (B for bombs, N for rockets)

All aircraft with images now have complete database entries and proper ground attack weapons assigned based on historical roles!
