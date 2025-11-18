# Capital Ship Expansion Design Document

## Executive Summary

This document details an expanded damage and combat system for the CapitalShip class in dogfight.html. The design adds hit location tracking, critical HP pools, anti-ship weapons, realistic maneuvers, and armor penetration mechanics while maintaining backward compatibility with the existing implementation.

---

## 1. CURRENT IMPLEMENTATION ANALYSIS

### 1.1 Current Damage Model

**Location:** Lines 2444-2986 (CapitalShip class)

**Current System:**
- Single health pool (`this.health` / `this.maxHealth`)
- Ship-type based health values:
  - Battleship: 2000 HP
  - Carrier: 1500 HP  
  - Cruiser: 1000 HP
  - Destroyer: 500 HP

**Zone-based Armor:**
```javascript
armor: {
    bow: <value>,         // Front section
    midship: <value>,     // Middle section (strongest)
    stern: <value>,       // Rear section
    superstructure: <value> // Above-deck structures
}
```

**Armor Values by Ship Type:**
- Battleship: bow(100), midship(150), stern(80), superstructure(50)
- Carrier: bow(60), midship(80), stern(60), superstructure(40)
- Cruiser: bow(60), midship(80), stern(50), superstructure(35)
- Destroyer: bow(30), midship(40), stern(30), superstructure(20)

**Damage Calculation (Lines 2915-2940):**
```javascript
// Determine hit zone based on position
const rotatedY = relativeY * Math.cos(-heading) - relativeX * Math.sin(-heading);
let zone = /* bow, stern, midship, or superstructure */;

// Apply armor damage reduction
const armorValue = this.armor[zone];
const damageMultiplier = Math.max(0.1, 1 - armorValue / 200);
const actualDamage = amount * damageMultiplier;
```

**System Destruction Mechanics:**
- 15% chance per hit to destroy an AA battery
- 12% chance per hit to destroy a SAM launcher
- 10% chance per hit to destroy a CIWS system
- Random selection from active systems

### 1.2 Current Weapon Systems

**AA Batteries (Lines 2464-2570):**
- Light: 400m range, 8 rounds/sec, 25% accuracy, 12 base damage
- Medium: 500-600m range, 10 rounds/sec, 20-22% accuracy, 18 base damage
- Heavy: 700-800m range, 12-15 rounds/sec, 18-20% accuracy, 25 base damage
- Fire at aircraft with range/altitude/speed modifiers to hit chance
- Create visual flak burst effects

**SAM Launchers (Lines 2472-2562):**
- RIM-7 Sea Sparrow: 15km range, 1km min range, 16 missiles, 30s reload
- RIM-66 Standard: 75km range, 2km min range, 40 missiles, 45s reload
- RIM-174 ERAM: 240km range, 3km min range, 24 missiles, 50s reload
- Require target tracking time (1.5s lock-on)
- Track closest threat in range

**CIWS Systems (Lines 2476-2568):**
- Phalanx: 1500m range, 0.015s between shots, 35 damage, 85% accuracy
- Goalkeeper: 1500m range, 0.014s between shots, 38 damage, 87% accuracy
- Type 730: 2500m range, 0.010s between shots, 40 damage, 88% accuracy
- Fire in 1.5s bursts of 15 rounds
- Point defense against close threats

**Weapon Positioning:**
- Each weapon has relative x,y coordinates on ship
- Transformed to world space using ship heading
- Allows for weapon arc/coverage modeling

### 1.3 Current Compartment/Flooding Mechanics

**Compartment System (Lines 2614-2668):**
```javascript
this.compartments = /* 6-12 based on ship type */;
this.floodedCompartments = 0;
this.listing = 0;        // Tilt angle (0-15 degrees)
this.isSinking = false;
this.sinkProgress = 0;   // 0 to 1
```

**Flooding Calculation:**
```javascript
const damageRatio = 1 - (this.health / this.maxHealth);
this.floodedCompartments = Math.floor(damageRatio * this.compartments);
this.listing = this.floodedCompartments * (15 / this.compartments);
```

**Sinking Mechanics:**
- Ship starts sinking when:
  - 70% of compartments flooded, OR
  - Health reaches 0
- Sinking takes 10 seconds (sinkProgress += dt * 0.1)
- Ship destroyed when sinkProgress >= 1

**Visual Effects:**
- Fires appear when health < 50%
- Listing creates skew transform for visual tilt
- Sink offset moves ship lower in water
- Wake effects at stern when moving

### 1.4 Current Movement and Positioning

**Movement Model (Lines 2620-2638):**
```javascript
// Simple velocity-based movement
this.heading = 90;       // degrees (0=north, 90=east)
this.speed = /* m/s based on ship type */;
this.velocityX = 0;
this.velocityY = 0;

// Update position
const headingRad = this.heading * Math.PI / 180;
this.velocityX = this.speed * Math.sin(headingRad);
this.velocityY = -this.speed * Math.cos(headingRad);
this.x += this.velocityX * dt;
this.y += this.velocityY * dt;
```

**Ship Speeds:**
- Battleship: 15 m/s (~30 knots)
- Carrier: 12 m/s (~24 knots)
- Cruiser: 16 m/s (~32 knots)
- Destroyer: 18 m/s (~35 knots)

**Limitations:**
- No turning mechanics (heading is static)
- No acceleration/deceleration
- No speed control system
- No turn radius calculations
- Ships move in perfect straight lines

---

## 2. EXPANDED HIT LOCATION SYSTEM

### 2.1 Hit Location Architecture

**New Data Structure:**
```javascript
this.hitLocations = {
    propulsion: {
        hp: <baseHP>,
        maxHp: <baseHP>,
        armor: <value>,
        isDestroyed: false,
        efficiency: 1.0,      // 0.0 to 1.0
        systems: ['engines', 'screws', 'steering']
    },
    flightDeck: {           // Carriers only
        hp: <baseHP>,
        maxHp: <baseHP>,
        armor: <value>,
        isDestroyed: false,
        efficiency: 1.0,
        launchCapability: true
    },
    hangar: {               // Carriers only
        hp: <baseHP>,
        maxHp: <baseHP>,
        armor: <value>,
        isDestroyed: false,
        storedAircraft: <count>
    },
    commandControl: {
        hp: <baseHP>,
        maxHp: <baseHP>,
        armor: <value>,
        isDestroyed: false,
        efficiency: 1.0,
        systems: ['bridge', 'CIC', 'communications']
    },
    sensors: {
        hp: <baseHP>,
        maxHp: <baseHP>,
        armor: <value>,
        isDestroyed: false,
        efficiency: 1.0,
        radarRange: 1.0,      // Multiplier
        fireControlAccuracy: 1.0
    },
    weapons: [
        {
            id: 'aaGun_0',
            type: 'aaBattery',
            hp: <baseHP>,
            maxHp: <baseHP>,
            armor: <value>,
            isDestroyed: false,
            reference: /* pointer to actual weapon object */
        },
        // ... one entry per weapon system
    ],
    hull: {
        bow: { hp: <baseHP>, maxHp: <baseHP>, armor: <value> },
        midship: { hp: <baseHP>, maxHp: <baseHP>, armor: <value> },
        stern: { hp: <baseHP>, maxHp: <baseHP>, armor: <value> }
    }
};
```

### 2.2 HP Pool Allocation

**Base HP by Ship Type:**
```javascript
const hpAllocation = {
    battleship: {
        total: 2000,
        propulsion: 300,
        commandControl: 250,
        sensors: 200,
        weapons: 50,         // per weapon system
        hull: {
            bow: 400,
            midship: 600,
            stern: 350
        },
        criticalHP: 500      // 25% of total
    },
    carrier: {
        total: 1500,
        propulsion: 250,
        flightDeck: 300,
        hangar: 250,
        commandControl: 200,
        sensors: 150,
        weapons: 40,
        hull: {
            bow: 300,
            midship: 450,
            stern: 250
        },
        criticalHP: 375      // 25% of total
    },
    cruiser: {
        total: 1000,
        propulsion: 180,
        commandControl: 150,
        sensors: 120,
        weapons: 45,
        hull: {
            bow: 250,
            midship: 350,
            stern: 200
        },
        criticalHP: 250
    },
    destroyer: {
        total: 500,
        propulsion: 100,
        commandControl: 80,
        sensors: 60,
        weapons: 35,
        hull: {
            bow: 120,
            midship: 180,
            stern: 100
        },
        criticalHP: 125
    }
};
```

### 2.3 Hit Location Determination

**Method: `determineHitLocation(hitX, hitY)`**
```javascript
determineHitLocation(hitX, hitY) {
    // Transform to ship-local coordinates
    const dx = hitX - this.x;
    const dy = hitY - this.y;
    const headingRad = -this.heading * Math.PI / 180;
    const localX = dx * Math.cos(headingRad) - dy * Math.sin(headingRad);
    const localY = dx * Math.sin(headingRad) + dy * Math.cos(headingRad);
    
    // Normalize to ship dimensions
    const normalizedX = localX / (this.beam / 2);    // -1 to 1
    const normalizedY = localY / (this.length / 2);  // -1 to 1
    
    // Priority-based location determination
    
    // 1. Check weapons (small hit boxes)
    for (let weapon of this.hitLocations.weapons) {
        const weaponDist = Math.sqrt(
            Math.pow(localX - weapon.localX, 2) + 
            Math.pow(localY - weapon.localY, 2)
        );
        if (weaponDist < weapon.hitRadius) {
            return { location: 'weapon', weaponId: weapon.id };
        }
    }
    
    // 2. Check superstructure (elevated, easier to hit)
    if (Math.abs(normalizedY) < 0.3 && Math.abs(normalizedX) < 0.5) {
        // Random distribution between command/control and sensors
        if (Math.random() < 0.6) {
            return { location: 'commandControl' };
        } else {
            return { location: 'sensors' };
        }
    }
    
    // 3. Flight deck (carriers only, top-down hits)
    if (this.type === 'carrier' && Math.abs(normalizedX) < 0.8) {
        if (normalizedY < -0.2) {
            return { location: 'flightDeck' };
        } else if (normalizedY > -0.2 && normalizedY < 0.3) {
            return { location: 'hangar' };
        }
    }
    
    // 4. Propulsion (stern area)
    if (normalizedY > 0.4) {
        return { location: 'propulsion' };
    }
    
    // 5. Hull zones (default)
    if (normalizedY < -0.3) {
        return { location: 'hull', zone: 'bow' };
    } else if (normalizedY > 0.3) {
        return { location: 'hull', zone: 'stern' };
    } else {
        return { location: 'hull', zone: 'midship' };
    }
}
```

### 2.4 Location Damage Effects

**Propulsion Damage:**
```javascript
// Reduce maximum speed based on damage
const propulsionHealth = this.hitLocations.propulsion.hp / 
                        this.hitLocations.propulsion.maxHp;
this.hitLocations.propulsion.efficiency = Math.max(0.2, propulsionHealth);
this.currentMaxSpeed = this.baseSpeed * this.hitLocations.propulsion.efficiency;

// Reduce turn rate
this.turnRate *= this.hitLocations.propulsion.efficiency;

// If destroyed: ship can only drift
if (this.hitLocations.propulsion.isDestroyed) {
    this.currentMaxSpeed = 0;
    this.turnRate = 0;
    // Velocity gradually reduces to zero
}
```

**Flight Deck Damage (Carriers):**
```javascript
const deckHealth = this.hitLocations.flightDeck.hp / 
                   this.hitLocations.flightDeck.maxHp;
this.hitLocations.flightDeck.efficiency = Math.max(0, deckHealth);

// Reduce launch rate
this.aircraftLaunchRate *= this.hitLocations.flightDeck.efficiency;

// Cannot launch if deck destroyed
if (this.hitLocations.flightDeck.isDestroyed) {
    this.hitLocations.flightDeck.launchCapability = false;
}

// Damaged deck causes accidents (random aircraft losses)
if (deckHealth < 0.5 && Math.random() < 0.05) {
    this.hitLocations.hangar.storedAircraft--;
}
```

**Hangar Damage (Carriers):**
```javascript
// Direct damage to stored aircraft
if (this.hitLocations.hangar.hp < this.hitLocations.hangar.maxHp * 0.75) {
    const aircraftLost = Math.floor(Math.random() * 3);
    this.hitLocations.hangar.storedAircraft -= aircraftLost;
}

// Hangar fires (catastrophic)
if (this.hitLocations.hangar.hp < this.hitLocations.hangar.maxHp * 0.3) {
    this.hangarFire = true;
    // Fire spreads, causing continuous damage
    // 10% of remaining hangar HP per second
}
```

**Command & Control Damage:**
```javascript
const ccHealth = this.hitLocations.commandControl.hp / 
                 this.hitLocations.commandControl.maxHp;
this.hitLocations.commandControl.efficiency = Math.max(0.1, ccHealth);

// Reduce weapon accuracy
for (let weapon of this.allWeapons) {
    weapon.currentAccuracy = weapon.baseAccuracy * 
                            this.hitLocations.commandControl.efficiency;
}

// Reduce SAM tracking effectiveness
this.samTrackingEfficiency = this.hitLocations.commandControl.efficiency;

// If destroyed: fire control reverts to local (backup mode)
if (this.hitLocations.commandControl.isDestroyed) {
    this.weaponCoordination = false; // Cannot coordinate multiple systems
    this.samMinTrackTime *= 2;        // Slower locks without CIC
}
```

**Sensor Damage:**
```javascript
const sensorHealth = this.hitLocations.sensors.hp / 
                     this.hitLocations.sensors.maxHp;
this.hitLocations.sensors.efficiency = Math.max(0, sensorHealth);

// Reduce detection range
this.hitLocations.sensors.radarRange = this.hitLocations.sensors.efficiency;
for (let samLauncher of this.samLaunchers) {
    samLauncher.effectiveRange = samLauncher.maxRange * 
                                 this.hitLocations.sensors.radarRange;
}

// Reduce fire control accuracy
this.hitLocations.sensors.fireControlAccuracy = 
    0.5 + (0.5 * this.hitLocations.sensors.efficiency);
for (let weapon of this.allWeapons) {
    weapon.currentAccuracy *= this.hitLocations.sensors.fireControlAccuracy;
}

// If destroyed: manual/visual targeting only
if (this.hitLocations.sensors.isDestroyed) {
    // Drastically reduce all weapon ranges
    this.radarBlind = true;
    for (let sam of this.samLaunchers) {
        sam.effectiveRange = Math.min(sam.effectiveRange, 5000); // Visual range
    }
}
```

**Weapon System Damage:**
```javascript
// Individual weapon HP tracking
applyWeaponDamage(weaponId, damage) {
    const weapon = this.hitLocations.weapons.find(w => w.id === weaponId);
    weapon.hp -= damage;
    
    if (weapon.hp <= 0) {
        weapon.isDestroyed = true;
        weapon.reference.isDestroyed = true;
        console.log(`${weapon.type} ${weaponId} destroyed!`);
    } else {
        // Degraded performance
        const healthRatio = weapon.hp / weapon.maxHp;
        weapon.reference.accuracy *= healthRatio;
        weapon.reference.rateOfFire *= healthRatio;
    }
}
```

**Hull Damage:**
```javascript
// Hull damage feeds into flooding
applyHullDamage(zone, damage) {
    this.hitLocations.hull[zone].hp -= damage;
    
    // Calculate flooding from hull breaches
    const hullDamageRatio = 1 - (this.hitLocations.hull[zone].hp / 
                                 this.hitLocations.hull[zone].maxHp);
    
    // Each hull zone contributes to flooding
    const compartmentsPerZone = this.compartments / 3;
    const floodedInZone = Math.floor(hullDamageRatio * compartmentsPerZone);
    
    // Update total flooded compartments
    this.updateFloodingFromHull();
}
```

---

## 3. CRITICAL HP SYSTEM

### 3.1 Critical HP Pool

**Architecture:**
```javascript
this.criticalHP = {
    current: <baseValue>,
    max: <baseValue>,
    sources: []          // Track what caused critical damage
};
```

**Critical HP Values:**
- Battleship: 500 HP (25% of total)
- Carrier: 375 HP (25% of total)
- Cruiser: 250 HP (25% of total)
- Destroyer: 125 HP (25% of total)

### 3.2 Overflow Damage Mechanics

**Method: `applyLocationDamage(location, damage, penetration)`**
```javascript
applyLocationDamage(location, damage, penetration) {
    const locationData = this.hitLocations[location];
    
    // Apply armor penetration check (see Section 5)
    const effectiveDamage = this.calculateArmorPenetration(
        damage, 
        penetration, 
        locationData.armor
    );
    
    // Apply damage to location
    locationData.hp -= effectiveDamage;
    
    // Check for overflow damage
    if (locationData.hp < 0) {
        const overflow = Math.abs(locationData.hp);
        locationData.hp = 0;
        locationData.isDestroyed = true;
        
        // Overflow goes to critical HP
        this.applyCriticalDamage(overflow, location);
        
        console.log(`${location} DESTROYED! ${overflow} overflow damage to critical HP`);
    }
    
    // Apply location-specific effects
    this.updateLocationEffects(location);
}
```

**Method: `applyCriticalDamage(damage, source)`**
```javascript
applyCriticalDamage(damage, source) {
    this.criticalHP.current -= damage;
    this.criticalHP.sources.push({
        source: source,
        damage: damage,
        time: Date.now()
    });
    
    console.log(`CRITICAL DAMAGE: -${damage} HP from ${source} ` +
                `(${this.criticalHP.current}/${this.criticalHP.max})`);
    
    // Check for sinking
    if (this.criticalHP.current <= 0) {
        this.initiateRapidSinking();
        return true; // Ship will sink
    }
    
    // Critical warnings at thresholds
    const criticalRatio = this.criticalHP.current / this.criticalHP.max;
    if (criticalRatio <= 0.25) {
        console.log(`CRITICAL: Ship at ${(criticalRatio*100).toFixed(0)}% critical HP!`);
        this.criticalWarning = true;
    }
    
    return false;
}
```

### 3.3 Rapid Sinking

**When Critical HP Reaches Zero:**
```javascript
initiateRapidSinking() {
    this.isSinking = true;
    this.rapidSinking = true;
    this.sinkRate = 0.2;      // Sink in 5 seconds instead of 10
    this.isDestroyed = true;
    
    console.log(`${this.type.toUpperCase()} CRITICAL FAILURE - RAPID SINKING!`);
    
    // All systems go offline
    for (let location in this.hitLocations) {
        this.hitLocations[location].isDestroyed = true;
    }
    
    // Catastrophic visual effects
    this.catastrophicFailure = true;
}
```

### 3.4 Alternative Sinking Conditions

**Ship Can Sink From:**
1. Critical HP reaches 0 (instant destruction)
2. All three hull zones destroyed (progressive flooding)
3. 70%+ compartments flooded (current system)
4. Propulsion + hull damage combination (dead in water + flooding)

```javascript
checkSinkingConditions() {
    // Critical HP depletion
    if (this.criticalHP.current <= 0) {
        return { sinking: true, reason: 'critical_damage' };
    }
    
    // All hull zones destroyed
    const allHullDestroyed = 
        this.hitLocations.hull.bow.hp <= 0 &&
        this.hitLocations.hull.midship.hp <= 0 &&
        this.hitLocations.hull.stern.hp <= 0;
    if (allHullDestroyed) {
        return { sinking: true, reason: 'hull_breach' };
    }
    
    // Catastrophic flooding
    if (this.floodedCompartments >= this.compartments * 0.7) {
        return { sinking: true, reason: 'flooding' };
    }
    
    // Dead in water + major flooding
    if (this.hitLocations.propulsion.isDestroyed && 
        this.floodedCompartments >= this.compartments * 0.5) {
        return { sinking: true, reason: 'immobilized_flooding' };
    }
    
    return { sinking: false };
}
```

---

## 4. ANTI-SHIP WEAPON SYSTEMS

### 4.1 Surface-to-Surface Missiles

**Weapon Specifications:**
```javascript
const antiShipMissiles = {
    harpoon: {
        type: 'AGM-84 Harpoon',
        range: 124000,        // 124 km
        speed: 240,           // m/s (subsonic)
        damage: 221,          // kg warhead
        penetration: 80,
        flightProfile: 'sea-skimming',
        cruiseAltitude: 5,    // meters
        terminalAltitude: 2,  // meters
        hitProbability: 0.75
    },
    exocet: {
        type: 'MM40 Exocet',
        range: 70000,         // 70 km
        speed: 315,           // m/s (high subsonic)
        damage: 165,          // kg warhead
        penetration: 75,
        flightProfile: 'sea-skimming',
        cruiseAltitude: 8,
        terminalAltitude: 2,
        hitProbability: 0.72
    },
    tomahawk: {
        type: 'BGM-109 Tomahawk (Anti-Ship)',
        range: 450000,        // 450 km
        speed: 250,           // m/s (subsonic)
        damage: 454,          // kg warhead
        penetration: 100,
        flightProfile: 'high-low',
        cruiseAltitude: 50,
        terminalAltitude: 5,
        hitProbability: 0.80
    },
    brahmos: {
        type: 'BrahMos',
        range: 290000,        // 290 km
        speed: 900,           // m/s (Mach 2.8)
        damage: 200,
        penetration: 120,     // Supersonic = better penetration
        flightProfile: 'sea-skimming',
        cruiseAltitude: 15,
        terminalAltitude: 5,
        hitProbability: 0.85  // Hard to intercept
    }
};
```

**Anti-Ship Missile Class:**
```javascript
class AntiShipMissile {
    constructor(x, y, altitude, type, target) {
        this.x = x;
        this.y = y;
        this.altitude = altitude;
        this.type = type;
        this.target = target;
        this.specs = antiShipMissiles[type];
        
        // Flight characteristics
        this.speed = 0;
        this.maxSpeed = this.specs.speed;
        this.acceleration = this.maxSpeed / 3;  // 3 second acceleration
        this.heading = 0;
        this.targetAltitude = this.specs.cruiseAltitude;
        
        // Guidance
        this.guidanceMode = 'cruise';  // cruise, terminal
        this.terminalRange = 5000;     // Switch to terminal at 5km
        this.lastKnownTargetX = target.x;
        this.lastKnownTargetY = target.y;
        
        // State
        this.isActive = true;
        this.hasExploded = false;
        this.motorBurnTime = 180;      // 3 minutes
        this.timeAlive = 0;
        
        // Visual
        this.trailPoints = [];
    }
    
    update(dt) {
        if (!this.isActive || this.hasExploded) return;
        
        this.timeAlive += dt;
        
        // Motor burnout check
        if (this.timeAlive > this.motorBurnTime) {
            this.isActive = false;
            return;
        }
        
        // Accelerate to cruise speed
        if (this.speed < this.maxSpeed) {
            this.speed += this.acceleration * dt;
        }
        
        // Update target position (if radar still tracking)
        if (!this.target.isDestroyed && this.canTrackTarget()) {
            this.lastKnownTargetX = this.target.x;
            this.lastKnownTargetY = this.target.y;
        }
        
        // Guidance update
        const distanceToTarget = Math.sqrt(
            Math.pow(this.lastKnownTargetX - this.x, 2) +
            Math.pow(this.lastKnownTargetY - this.y, 2)
        );
        
        // Switch to terminal mode when close
        if (distanceToTarget < this.terminalRange) {
            this.guidanceMode = 'terminal';
            this.targetAltitude = this.specs.terminalAltitude;
        }
        
        // Calculate heading to target
        const targetAngle = Math.atan2(
            this.lastKnownTargetY - this.y,
            this.lastKnownTargetX - this.x
        ) * 180 / Math.PI;
        
        // Turn toward target (missiles have turn rate limits)
        const maxTurnRate = 10; // degrees per second
        let headingDiff = targetAngle - this.heading;
        
        // Normalize angle difference
        while (headingDiff > 180) headingDiff -= 360;
        while (headingDiff < -180) headingDiff += 360;
        
        const turnAmount = Math.max(-maxTurnRate * dt, 
                                    Math.min(maxTurnRate * dt, headingDiff));
        this.heading += turnAmount;
        
        // Altitude control
        const altitudeDiff = this.targetAltitude - this.altitude;
        const climbRate = 10; // m/s
        this.altitude += Math.max(-climbRate * dt, 
                                  Math.min(climbRate * dt, altitudeDiff));
        
        // Update position
        const headingRad = this.heading * Math.PI / 180;
        this.x += this.speed * Math.cos(headingRad) * dt;
        this.y += this.speed * Math.sin(headingRad) * dt;
        
        // Check for impact
        if (this.target.containsPoint(this.x, this.y) && 
            this.altitude < 20) {
            this.explode();
        }
        
        // Trail effect
        this.trailPoints.push({ x: this.x, y: this.y, time: Date.now() });
        this.trailPoints = this.trailPoints.filter(p => 
            Date.now() - p.time < 2000
        );
    }
    
    canTrackTarget() {
        // Missile's own seeker (active radar or IR)
        const distanceToTarget = Math.sqrt(
            Math.pow(this.target.x - this.x, 2) +
            Math.pow(this.target.y - this.y, 2)
        );
        
        // Active radar seeker range (terminal guidance)
        const seekerRange = 20000; // 20km
        return distanceToTarget < seekerRange;
    }
    
    explode() {
        if (this.hasExploded) return;
        
        this.hasExploded = true;
        this.isActive = false;
        
        // Calculate hit location
        const hitLocation = this.target.determineHitLocation(this.x, this.y);
        
        // Apply damage with penetration
        this.target.applyLocationDamage(
            hitLocation.location,
            this.specs.damage,
            this.specs.penetration
        );
        
        console.log(`${this.specs.type} hit ${this.target.type} at ${hitLocation.location}!`);
    }
}
```

### 4.2 Naval Guns

**Gun Specifications:**
```javascript
const navalGuns = {
    '5inch': {
        caliber: 127,         // mm
        shellWeight: 31.75,   // kg
        muzzleVelocity: 808,  // m/s
        range: 24000,         // 24 km
        rateOfFire: 16,       // rounds per minute
        damage: 45,
        penetration: 40,
        accuracy: 0.15,       // Base hit probability at max range
        shellType: 'HE'       // High Explosive
    },
    '8inch': {
        caliber: 203,
        shellWeight: 118,
        muzzleVelocity: 823,
        range: 28000,
        rateOfFire: 8,
        damage: 90,
        penetration: 60,
        accuracy: 0.18,
        shellType: 'AP'       // Armor Piercing available
    },
    '16inch': {
        caliber: 406,
        shellWeight: 1225,    // kg (2700 lbs)
        muzzleVelocity: 762,
        range: 38000,
        rateOfFire: 2,
        damage: 350,
        penetration: 200,     // Massive penetration
        accuracy: 0.22,
        shellType: 'AP'
    }
};
```

**Naval Gun System:**
```javascript
// Add to ship specs
navalGuns: [
    {
        type: '16inch',
        count: 3,             // 3 barrels per turret
        turrets: 3,           // 3 turrets
        x: 0,
        y: -80,
        traverse: 270,        // degrees of rotation
        elevation: { min: -5, max: 45 },
        fireCooldown: 0,
        ammunition: 100,      // shells per gun
        currentTarget: null
    }
]

// Gun firing method
fireNavalGuns(targets, dt) {
    const shells = [];
    
    for (let gun of this.navalGuns) {
        if (gun.fireCooldown > 0) {
            gun.fireCooldown -= dt;
            continue;
        }
        
        if (gun.ammunition <= 0) continue;
        
        // Find target in range
        let target = null;
        let minDist = Infinity;
        
        for (let ship of targets) {
            if (ship.isDestroyed) continue;
            
            const dist = Math.sqrt(
                Math.pow(ship.x - this.x, 2) +
                Math.pow(ship.y - this.y, 2)
            );
            
            if (dist < navalGuns[gun.type].range && dist < minDist) {
                minDist = dist;
                target = ship;
            }
        }
        
        if (!target) continue;
        
        // Fire salvo (all barrels)
        const specs = navalGuns[gun.type];
        for (let barrel = 0; barrel < gun.count; barrel++) {
            const shell = new NavalShell(
                this.x,
                this.y,
                gun.type,
                target,
                minDist
            );
            shells.push(shell);
        }
        
        gun.ammunition -= gun.count;
        gun.fireCooldown = 60 / specs.rateOfFire; // Convert RPM to seconds
        
        console.log(`${gun.type} guns fired salvo at ${target.type}!`);
    }
    
    return shells;
}
```

**Naval Shell Class:**
```javascript
class NavalShell {
    constructor(x, y, gunType, target, range) {
        this.x = x;
        this.y = y;
        this.altitude = 10;    // Fired from gun height
        this.specs = navalGuns[gunType];
        this.target = target;
        
        // Ballistic trajectory calculation
        const angleToTarget = Math.atan2(target.y - y, target.x - x);
        const elevation = this.calculateElevation(range);
        
        // Initial velocity components
        const v = this.specs.muzzleVelocity;
        const elevRad = elevation * Math.PI / 180;
        const angleRad = angleToTarget;
        
        this.velocityX = v * Math.cos(elevRad) * Math.cos(angleRad);
        this.velocityY = v * Math.cos(elevRad) * Math.sin(angleRad);
        this.velocityZ = v * Math.sin(elevRad);
        
        // State
        this.isActive = true;
        this.hasImpacted = false;
        this.timeOfFlight = 0;
        this.gravity = 9.8;
        
        // Dispersion (shells spread out)
        this.applyDispersion();
    }
    
    calculateElevation(range) {
        // Simplified ballistic calculation
        const v = this.specs.muzzleVelocity;
        const g = this.gravity;
        
        // Elevation for range (assuming no air resistance)
        const angle = 0.5 * Math.asin((g * range) / (v * v));
        return angle * 180 / Math.PI;
    }
    
    applyDispersion() {
        // Accuracy degradation with range
        const dispersionFactor = 1 - this.specs.accuracy;
        const spread = 100 * dispersionFactor; // meters
        
        this.velocityX += (Math.random() - 0.5) * spread;
        this.velocityY += (Math.random() - 0.5) * spread;
    }
    
    update(dt) {
        if (!this.isActive || this.hasImpacted) return;
        
        this.timeOfFlight += dt;
        
        // Apply gravity
        this.velocityZ -= this.gravity * dt;
        
        // Update position
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
        this.altitude += this.velocityZ * dt;
        
        // Check for impact
        if (this.altitude <= 0) {
            this.altitude = 0;
            this.checkImpact();
        }
    }
    
    checkImpact() {
        this.hasImpacted = true;
        this.isActive = false;
        
        // Check if shell hit target ship
        if (this.target.containsPoint(this.x, this.y)) {
            const hitLocation = this.target.determineHitLocation(this.x, this.y);
            
            this.target.applyLocationDamage(
                hitLocation.location,
                this.specs.damage,
                this.specs.penetration
            );
            
            console.log(`${this.specs.caliber}mm shell hit ${this.target.type}!`);
        } else {
            // Near miss - splash damage
            const dist = Math.sqrt(
                Math.pow(this.target.x - this.x, 2) +
                Math.pow(this.target.y - this.y, 2)
            );
            
            if (dist < 30) { // 30m splash radius
                const splashDamage = this.specs.damage * 0.2 * (1 - dist/30);
                this.target.applyLocationDamage(
                    'hull',
                    splashDamage,
                    0  // No penetration for splash
                );
                console.log(`${this.specs.caliber}mm shell near miss: ${splashDamage.toFixed(0)} splash damage`);
            }
        }
    }
}
```

### 4.3 Torpedoes

**Torpedo Specifications:**
```javascript
const torpedoes = {
    mk48: {
        type: 'Mk 48 ADCAP',
        speed: 28,            // m/s (55 knots)
        range: 38000,         // 38 km
        depth: 10,            // meters below surface
        damage: 295,          // kg warhead
        penetration: 150,     // Devastating underwater penetration
        guidance: 'wire-guided + active/passive sonar',
        turnRate: 5,          // degrees per second
        hitProbability: 0.80
    },
    type53: {
        type: 'Type 53-65',
        speed: 22,            // m/s (45 knots)
        range: 18000,
        depth: 8,
        damage: 400,          // Larger warhead
        penetration: 180,
        guidance: 'wake-homing',
        turnRate: 4,
        hitProbability: 0.75
    }
};
```

**Torpedo Class:**
```javascript
class Torpedo {
    constructor(x, y, type, target) {
        this.x = x;
        this.y = y;
        this.depth = torpedoes[type].depth;
        this.type = type;
        this.specs = torpedoes[type];
        this.target = target;
        
        // Calculate initial heading to target
        this.heading = Math.atan2(
            target.y - y,
            target.x - x
        ) * 180 / Math.PI;
        
        this.speed = this.specs.speed;
        this.isActive = true;
        this.hasExploded = false;
        this.distanceTraveled = 0;
        
        // Sonar tracking
        this.sonarLock = true;
        this.lastTargetUpdate = Date.now();
    }
    
    update(dt) {
        if (!this.isActive || this.hasExploded) return;
        
        // Update heading to track target
        if (this.sonarLock && !this.target.isDestroyed) {
            const targetAngle = Math.atan2(
                this.target.y - this.y,
                this.target.x - this.x
            ) * 180 / Math.PI;
            
            let headingDiff = targetAngle - this.heading;
            while (headingDiff > 180) headingDiff -= 360;
            while (headingDiff < -180) headingDiff += 360;
            
            const turnAmount = Math.max(
                -this.specs.turnRate * dt,
                Math.min(this.specs.turnRate * dt, headingDiff)
            );
            this.heading += turnAmount;
        }
        
        // Update position
        const headingRad = this.heading * Math.PI / 180;
        const dx = this.speed * Math.cos(headingRad) * dt;
        const dy = this.speed * Math.sin(headingRad) * dt;
        this.x += dx;
        this.y += dy;
        this.distanceTraveled += Math.sqrt(dx*dx + dy*dy);
        
        // Check range limit
        if (this.distanceTraveled > this.specs.range) {
            this.isActive = false;
            return;
        }
        
        // Check for impact
        const distToTarget = Math.sqrt(
            Math.pow(this.target.x - this.x, 2) +
            Math.pow(this.target.y - this.y, 2)
        );
        
        if (distToTarget < 5) { // 5m proximity fuse
            this.explode();
        }
    }
    
    explode() {
        if (this.hasExploded) return;
        
        this.hasExploded = true;
        this.isActive = false;
        
        // Torpedoes hit underwater, always target hull
        // Randomize which hull section (weighted toward waterline)
        const zones = ['bow', 'midship', 'stern'];
        const weights = [0.25, 0.5, 0.25]; // Prefer midship
        const rand = Math.random();
        let zone;
        if (rand < weights[0]) zone = 'bow';
        else if (rand < weights[0] + weights[1]) zone = 'midship';
        else zone = 'stern';
        
        // Apply massive hull damage
        this.target.applyLocationDamage(
            'hull',
            this.specs.damage,
            this.specs.penetration,
            zone
        );
        
        // Torpedoes cause catastrophic flooding
        const compartmentsDamaged = Math.floor(Math.random() * 3) + 2; // 2-4
        this.target.floodedCompartments += compartmentsDamaged;
        
        console.log(`TORPEDO HIT! ${this.specs.type} struck ${zone} section. ` +
                    `+${compartmentsDamaged} flooded compartments!`);
    }
}
```

### 4.4 Ship Weapon Loadouts

**Updated Ship Specifications:**
```javascript
// Add to battleship spec:
antiShipWeapons: {
    navalGuns: [
        { type: '16inch', turrets: 3, barrels: 3, ammo: 100, x: 0, y: -80 },
        { type: '16inch', turrets: 2, barrels: 3, ammo: 100, x: 0, y: 60 }
    ],
    missiles: [
        { type: 'tomahawk', launchers: 32, x: -10, y: 0 }
    ]
},

// Add to cruiser spec:
antiShipWeapons: {
    navalGuns: [
        { type: '8inch', turrets: 3, barrels: 3, ammo: 150, x: 0, y: -50 },
        { type: '5inch', turrets: 2, barrels: 1, ammo: 200, x: 0, y: 50 }
    ],
    missiles: [
        { type: 'harpoon', launchers: 8, x: -8, y: -20 },
        { type: 'harpoon', launchers: 8, x: 8, y: -20 }
    ]
},

// Add to destroyer spec:
antiShipWeapons: {
    navalGuns: [
        { type: '5inch', turrets: 1, barrels: 1, ammo: 300, x: 0, y: -40 }
    ],
    missiles: [
        { type: 'harpoon', launchers: 8, x: 0, y: 0 }
    ],
    torpedoes: [
        { type: 'mk48', tubes: 6, torpedoes: 12, x: 0, y: 20 }
    ]
}
```

---

## 5. ARMOR PENETRATION SYSTEM

### 5.1 Penetration Mechanics

**Method: `calculateArmorPenetration(damage, penetration, armor)`**
```javascript
calculateArmorPenetration(damage, penetration, armor) {
    // Complete negation if penetration below armor
    if (penetration < armor) {
        console.log(`ARMOR HELD! Penetration ${penetration} < Armor ${armor}`);
        return 0;
    }
    
    // Calculate overpenetration
    const overpenetration = penetration - armor;
    
    // Damage scaling based on overpenetration
    let damageMultiplier;
    if (overpenetration < armor * 0.5) {
        // Barely penetrated: 25-50% damage
        damageMultiplier = 0.25 + (overpenetration / (armor * 0.5)) * 0.25;
    } else if (overpenetration < armor * 1.5) {
        // Good penetration: 50-100% damage
        damageMultiplier = 0.5 + ((overpenetration - armor * 0.5) / armor) * 0.5;
    } else {
        // Massive overpenetration: 100% damage + bonus
        damageMultiplier = 1.0 + Math.min((overpenetration - armor * 1.5) / armor, 0.5);
    }
    
    const effectiveDamage = damage * damageMultiplier;
    
    console.log(`Penetration ${penetration} vs Armor ${armor}: ` +
                `${(damageMultiplier * 100).toFixed(0)}% damage (${effectiveDamage.toFixed(0)})`);
    
    return effectiveDamage;
}
```

### 5.2 Armor Values by Location

**Armor Allocation:**
```javascript
const armorValues = {
    battleship: {
        propulsion: 120,      // Engine room heavily armored
        commandControl: 100,  // Conning tower/bridge armor
        sensors: 60,          // Exposed equipment
        weapons: {
            navalGun: 150,    // Turret face armor
            aaBattery: 30,
            samLauncher: 50,
            ciws: 25
        },
        hull: {
            bow: 100,
            midship: 150,     // Belt armor
            stern: 80
        }
    },
    carrier: {
        propulsion: 80,
        flightDeck: 40,       // Deck armor
        hangar: 60,           // Hangar deck
        commandControl: 70,
        sensors: 50,
        weapons: {
            aaBattery: 25,
            samLauncher: 40,
            ciws: 20
        },
        hull: {
            bow: 60,
            midship: 80,
            stern: 60
        }
    },
    cruiser: {
        propulsion: 70,
        commandControl: 60,
        sensors: 40,
        weapons: {
            navalGun: 80,
            aaBattery: 25,
            samLauncher: 40,
            ciws: 20
        },
        hull: {
            bow: 60,
            midship: 80,
            stern: 50
        }
    },
    destroyer: {
        propulsion: 40,
        commandControl: 35,
        sensors: 25,
        weapons: {
            navalGun: 40,
            aaBattery: 20,
            samLauncher: 30,
            ciws: 15
        },
        hull: {
            bow: 30,
            midship: 40,
            stern: 30
        }
    }
};
```

### 5.3 Weapon Penetration Values

**Penetration by Weapon Type:**
```javascript
const weaponPenetration = {
    // Anti-ship missiles
    'harpoon': 80,
    'exocet': 75,
    'tomahawk': 100,
    'brahmos': 120,
    
    // Naval guns
    '5inch_HE': 20,       // High explosive - low penetration
    '5inch_AP': 40,       // Armor piercing
    '8inch_HE': 30,
    '8inch_AP': 60,
    '16inch_HE': 80,
    '16inch_AP': 200,     // Devastating penetration
    
    // Torpedoes
    'mk48': 150,          // Underwater explosion + shaped charge
    'type53': 180,
    
    // Air-launched weapons
    'bomb_250kg': 50,
    'bomb_500kg': 80,
    'bomb_1000kg': 120,
    'bomb_2000kg': 180,
    
    // Rockets and missiles
    'rocket_70mm': 15,
    'agm65_maverick': 60,
    'agm88_harm': 40,     // Anti-radiation (hits sensors)
    
    // AA weapons (for reference - minimal pen)
    'flak_light': 5,
    'flak_medium': 8,
    'flak_heavy': 12
};
```

### 5.4 Penetration Example Scenarios

**Scenario 1: Harpoon vs. Destroyer**
```
Harpoon missile (pen: 80) hits destroyer hull midship (armor: 40)
Overpenetration: 80 - 40 = 40
Overpenetration ratio: 40 / 40 = 1.0 (good penetration)
Damage multiplier: 50% + (0.5 / 1.0) * 50% = 75%
Harpoon damage: 221 kg
Effective damage: 221 * 0.75 = 165.75 HP
```

**Scenario 2: 16-inch AP Shell vs. Battleship Belt**
```
16" AP (pen: 200) hits battleship midship (armor: 150)
Overpenetration: 200 - 150 = 50
Overpenetration ratio: 50 / 150 = 0.33 (barely penetrated)
Damage multiplier: 25% + (0.33) * 25% = 33%
Shell damage: 350 HP
Effective damage: 350 * 0.33 = 115.5 HP
```

**Scenario 3: Exocet vs. Battleship Turret**
```
Exocet (pen: 75) hits naval gun turret (armor: 150)
Penetration: 75 < 150
ARMOR HOLDS - NO DAMAGE
Result: Missile explodes externally, turret undamaged
```

**Scenario 4: Torpedo vs. Carrier Hull**
```
Mk 48 torpedo (pen: 150) hits carrier midship underwater (armor: 80)
Overpenetration: 150 - 80 = 70
Overpenetration ratio: 70 / 80 = 0.875 (good penetration)
Damage multiplier: 50% + (0.375 / 1.0) * 50% = 68.75%
Torpedo damage: 295 kg
Effective damage: 295 * 0.6875 = 202.8 HP
+ Catastrophic flooding bonus
```

---

## 6. SHIP MANEUVER SYSTEM

### 6.1 Speed Control

**Speed States:**
```javascript
const speedStates = {
    'stop': 0,
    'ahead_slow': 0.25,      // 25% of max speed
    'ahead_half': 0.5,
    'ahead_standard': 0.75,
    'ahead_full': 1.0,
    'ahead_flank': 1.2,      // Emergency speed (damages engines over time)
    'astern_slow': -0.25,    // Reverse
    'astern_half': -0.5
};

// Add to CapitalShip
this.orderedSpeed = 'ahead_standard';
this.currentSpeed = this.baseSpeed * 0.75;
this.speedAcceleration = this.baseSpeed / 60; // 60 seconds to reach full speed
this.isAtOrderedSpeed = false;
```

**Method: `setOrderedSpeed(speedState)`**
```javascript
setOrderedSpeed(speedState) {
    if (!speedStates.hasOwnProperty(speedState)) {
        console.log(`Invalid speed state: ${speedState}`);
        return;
    }
    
    this.orderedSpeed = speedState;
    this.isAtOrderedSpeed = false;
    
    console.log(`${this.type}: Ordered ${speedState}`);
    
    // Check if flank speed damages engines
    if (speedState === 'ahead_flank') {
        this.flankSpeedTime = 0;
    }
}

updateSpeed(dt) {
    // Calculate target speed
    const speedMultiplier = speedStates[this.orderedSpeed];
    const targetSpeed = this.baseSpeed * speedMultiplier * 
                       this.hitLocations.propulsion.efficiency;
    
    // Gradually accelerate/decelerate
    if (Math.abs(this.currentSpeed - targetSpeed) < this.speedAcceleration * dt) {
        this.currentSpeed = targetSpeed;
        this.isAtOrderedSpeed = true;
    } else if (this.currentSpeed < targetSpeed) {
        this.currentSpeed += this.speedAcceleration * dt;
    } else {
        // Deceleration is faster than acceleration
        this.currentSpeed -= this.speedAcceleration * dt * 1.5;
    }
    
    // Flank speed engine wear
    if (this.orderedSpeed === 'ahead_flank') {
        this.flankSpeedTime += dt;
        
        // Damage propulsion after extended flank speed
        if (this.flankSpeedTime > 300) { // 5 minutes
            const damage = 0.5 * dt; // 0.5 HP per second
            this.hitLocations.propulsion.hp -= damage;
            
            if (this.flankSpeedTime % 60 < dt) { // Log every minute
                console.log(`${this.type}: Flank speed damaging engines! ` +
                          `${this.hitLocations.propulsion.hp.toFixed(0)}/${this.hitLocations.propulsion.maxHp} HP`);
            }
        }
    }
}
```

### 6.2 Heading Control

**Turn Rate Calculation:**
```javascript
// Base turn rates (degrees per second at full speed)
const baseTurnRates = {
    battleship: 1.5,    // Slow to turn
    carrier: 1.2,       // Even slower
    cruiser: 2.0,
    destroyer: 3.5      // Most maneuverable
};

// Add to constructor
this.baseTurnRate = baseTurnRates[this.type];
this.currentTurnRate = this.baseTurnRate;
this.orderedHeading = this.heading;
this.rudderAngle = 0;      // -35 to +35 degrees
this.maxRudderAngle = 35;
```

**Method: `setOrderedHeading(newHeading)`**
```javascript
setOrderedHeading(newHeading) {
    // Normalize heading
    while (newHeading < 0) newHeading += 360;
    while (newHeading >= 360) newHeading -= 360;
    
    this.orderedHeading = newHeading;
    
    // Calculate required turn direction
    let headingDiff = newHeading - this.heading;
    while (headingDiff > 180) headingDiff -= 360;
    while (headingDiff < -180) headingDiff += 360;
    
    // Set rudder angle
    if (Math.abs(headingDiff) < 5) {
        this.rudderAngle = 0; // Straight
    } else {
        this.rudderAngle = Math.sign(headingDiff) * this.maxRudderAngle;
    }
    
    console.log(`${this.type}: Ordered heading ${newHeading}° (turn ${headingDiff.toFixed(0)}°)`);
}

updateHeading(dt) {
    if (Math.abs(this.heading - this.orderedHeading) < 1) {
        this.heading = this.orderedHeading;
        this.rudderAngle = 0;
        return;
    }
    
    // Turn rate affected by speed and propulsion damage
    const speedFactor = Math.abs(this.currentSpeed) / this.baseSpeed;
    const propulsionFactor = this.hitLocations.propulsion.efficiency;
    
    this.currentTurnRate = this.baseTurnRate * 
                          Math.max(0.1, speedFactor) * 
                          propulsionFactor;
    
    // Apply rudder angle
    const rudderFactor = this.rudderAngle / this.maxRudderAngle;
    const turnAmount = this.currentTurnRate * rudderFactor * dt;
    
    this.heading += turnAmount;
    
    // Normalize heading
    while (this.heading < 0) this.heading += 360;
    while (this.heading >= 360) this.heading -= 360;
}
```

### 6.3 Turn Radius

**Turn Radius Calculation:**
```javascript
calculateTurnRadius() {
    // Turn radius based on speed and turn rate
    // R = v / (ω * π/180) where ω is turn rate in deg/s
    
    const speedMetersPerSec = Math.abs(this.currentSpeed);
    const turnRateRadPerSec = this.currentTurnRate * Math.PI / 180;
    
    if (turnRateRadPerSec === 0) return Infinity;
    
    const turnRadius = speedMetersPerSec / turnRateRadPerSec;
    
    return turnRadius;
}

// Realistic turn radii examples:
// Destroyer at 18 m/s, 3.5°/s: R = 18 / (3.5 * π/180) = 295 meters
// Battleship at 15 m/s, 1.5°/s: R = 15 / (1.5 * π/180) = 573 meters
// Carrier at 12 m/s, 1.2°/s: R = 12 / (1.2 * π/180) = 573 meters
```

### 6.4 Emergency Maneuvers

**Emergency Turn:**
```javascript
executeEmergencyTurn(direction) {
    // Hard turn (full rudder)
    const turnAngle = direction === 'port' ? -90 : 90;
    const newHeading = (this.heading + turnAngle + 360) % 360;
    
    this.setOrderedHeading(newHeading);
    this.rudderAngle = direction === 'port' ? -this.maxRudderAngle : this.maxRudderAngle;
    
    // Reduce speed for tighter turn
    this.setOrderedSpeed('ahead_half');
    
    console.log(`${this.type}: EMERGENCY TURN ${direction.toUpperCase()}!`);
}
```

**Emergency Stop:**
```javascript
executeEmergencyStop() {
    // Full reverse
    this.setOrderedSpeed('astern_half');
    
    // Stopping distance calculation
    const stoppingTime = Math.abs(this.currentSpeed / (this.speedAcceleration * 1.5));
    const stoppingDistance = this.currentSpeed * stoppingTime * 0.5; // Average velocity
    
    console.log(`${this.type}: EMERGENCY STOP! Stopping in ${stoppingDistance.toFixed(0)}m ` +
                `(${stoppingTime.toFixed(0)}s)`);
    
    return { distance: stoppingDistance, time: stoppingTime };
}
```

### 6.5 Formation Keeping

**Formation Positions:**
```javascript
const formations = {
    line_ahead: {
        spacing: 500,     // meters between ships
        positions: [
            { x: 0, y: 0 },
            { x: 0, y: 500 },
            { x: 0, y: 1000 }
        ]
    },
    line_abreast: {
        spacing: 800,
        positions: [
            { x: -800, y: 0 },
            { x: 0, y: 0 },
            { x: 800, y: 0 }
        ]
    },
    echelon_starboard: {
        spacing: 500,
        positions: [
            { x: 0, y: 0 },
            { x: 400, y: 500 },
            { x: 800, y: 1000 }
        ]
    },
    circular_screen: {
        radius: 2000,
        positions: [
            { x: 0, y: 0 },              // Carrier in center
            { x: 2000, y: 0 },           // Screen ships
            { x: 1414, y: 1414 },
            { x: 0, y: 2000 },
            { x: -1414, y: 1414 },
            { x: -2000, y: 0 },
            { x: -1414, y: -1414 },
            { x: 0, y: -2000 },
            { x: 1414, y: -1414 }
        ]
    }
};
```

**Method: `maintainFormation(formationType, position, leader)`**
```javascript
maintainFormation(formationType, positionIndex, leader) {
    const formation = formations[formationType];
    const targetPos = formation.positions[positionIndex];
    
    // Calculate world position based on leader's position and heading
    const leaderHeadingRad = leader.heading * Math.PI / 180;
    
    const targetWorldX = leader.x + 
        (targetPos.x * Math.cos(leaderHeadingRad) - 
         targetPos.y * Math.sin(leaderHeadingRad));
    
    const targetWorldY = leader.y + 
        (targetPos.x * Math.sin(leaderHeadingRad) + 
         targetPos.y * Math.cos(leaderHeadingRad));
    
    // Calculate required heading to station
    const dx = targetWorldX - this.x;
    const dy = targetWorldY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const requiredHeading = Math.atan2(dx, -dy) * 180 / Math.PI;
    
    // Adjust heading and speed to maintain station
    if (distance > formation.spacing * 1.2) {
        // Too far behind - increase speed
        this.setOrderedSpeed('ahead_full');
        this.setOrderedHeading(requiredHeading);
    } else if (distance < formation.spacing * 0.8) {
        // Too close - reduce speed
        this.setOrderedSpeed('ahead_slow');
        this.setOrderedHeading(requiredHeading);
    } else {
        // On station - match leader's speed and heading
        this.orderedSpeed = leader.orderedSpeed;
        this.setOrderedHeading(leader.heading);
    }
}
```

---

## 7. IMPLEMENTATION PLAN

### 7.1 Phase 1: Core Hit Location System

**Tasks:**
1. Add `hitLocations` data structure to constructor
2. Implement `determineHitLocation(x, y)` method
3. Replace `takeDamage()` with `applyLocationDamage()`
4. Add location-specific HP pools
5. Implement basic location destruction

**Testing:**
- Verify hit locations are correctly identified
- Confirm HP is properly distributed
- Test location destruction triggers

### 7.2 Phase 2: Critical HP Pool

**Tasks:**
1. Add `criticalHP` property
2. Implement overflow damage mechanics
3. Add `applyCriticalDamage()` method
4. Implement rapid sinking for critical HP depletion

**Testing:**
- Verify overflow damage transfers to critical HP
- Test sinking when critical HP reaches 0
- Confirm location damage effects work

### 7.3 Phase 3: Armor Penetration

**Tasks:**
1. Add armor values to each hit location
2. Implement `calculateArmorPenetration()` method
3. Add penetration values to all weapons
4. Update damage application to use penetration

**Testing:**
- Test armor negation (pen < armor)
- Verify damage scaling with overpenetration
- Confirm different weapons behave correctly

### 7.4 Phase 4: Anti-Ship Weapons

**Tasks:**
1. Create `AntiShipMissile` class
2. Create `NavalShell` class
3. Create `Torpedo` class
4. Add weapon systems to ship specs
5. Implement firing methods

**Testing:**
- Test missile guidance and flight
- Verify naval gun ballistics
- Test torpedo tracking
- Confirm damage application

### 7.5 Phase 5: Maneuver System

**Tasks:**
1. Add speed control properties
2. Implement `setOrderedSpeed()` and `updateSpeed()`
3. Add turn rate mechanics
4. Implement `setOrderedHeading()` and `updateHeading()`
5. Add emergency maneuvers

**Testing:**
- Verify speed changes are gradual
- Test turning mechanics and radius
- Confirm propulsion damage affects movement
- Test emergency maneuvers

### 7.6 Phase 6: Visual Updates

**Tasks:**
1. Add damage indicators for locations
2. Update health bar to show critical HP
3. Add visual effects for location damage
4. Improve sinking animations
5. Add maneuver indicators

**Testing:**
- Verify visual feedback is clear
- Test performance with multiple ships
- Confirm effects match damage state

### 7.7 Backward Compatibility

**Maintain Existing Behavior:**
```javascript
// Wrapper for old takeDamage() calls
takeDamage(amount, hitX, hitY) {
    // Determine hit location
    const hit = this.determineHitLocation(hitX, hitY);
    
    // Apply with default penetration
    const defaultPenetration = 50; // Medium penetration
    
    if (hit.location === 'hull') {
        this.applyLocationDamage('hull', amount, defaultPenetration, hit.zone);
    } else if (hit.location === 'weapon') {
        const weapon = this.hitLocations.weapons.find(w => w.id === hit.weaponId);
        weapon.hp -= amount;
        if (weapon.hp <= 0) weapon.isDestroyed = true;
    } else {
        this.applyLocationDamage(hit.location, amount, defaultPenetration);
    }
}
```

---

## 8. CONFIGURATION AND TUNING

### 8.1 Balance Parameters

**Adjustable Values:**
```javascript
const balanceConfig = {
    // Damage scaling
    criticalHPPercentage: 0.25,        // 25% of total HP
    overflowDamageTransfer: 1.0,       // 100% of overflow goes to critical
    
    // Penetration scaling
    penetrationDamageScaling: {
        barelyPenetrated: { min: 0.25, max: 0.5 },
        goodPenetration: { min: 0.5, max: 1.0 },
        overpenetration: { max: 1.5 }
    },
    
    // Location effects
    propulsionEfficiencyScaling: 'linear',  // or 'quadratic'
    sensorRangeReduction: 'linear',
    commandAccuracyReduction: 'linear',
    
    // Maneuver parameters
    accelerationTime: 60,              // Seconds to full speed
    decelerationMultiplier: 1.5,       // Decel faster than accel
    flankSpeedDamageDelay: 300,        // 5 minutes before damage
    flankSpeedDamageRate: 0.5,         // HP per second
    
    // Turn rates (deg/s)
    turnRates: {
        battleship: 1.5,
        carrier: 1.2,
        cruiser: 2.0,
        destroyer: 3.5
    },
    
    // Weapon balance
    torpedoFloodingBonus: { min: 2, max: 4 },
    navalGunDispersion: 100,           // meters at max range
    missileSeaSkimmingAltitude: 5      // meters
};
```

### 8.2 Debug and Visualization

**Debug Display:**
```javascript
renderDebugInfo() {
    if (!debugMode) return;
    
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(this.x + this.beam, this.y - this.length/2, 200, 300);
    
    ctx.fillStyle = 'white';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    
    let y = this.y - this.length/2 + 15;
    const lineHeight = 12;
    
    // Ship info
    ctx.fillText(`${this.type.toUpperCase()}`, this.x + this.beam + 5, y);
    y += lineHeight * 1.5;
    
    // Critical HP
    const critRatio = this.criticalHP.current / this.criticalHP.max;
    ctx.fillStyle = critRatio > 0.5 ? 'lime' : critRatio > 0.25 ? 'yellow' : 'red';
    ctx.fillText(`Critical: ${this.criticalHP.current.toFixed(0)}/${this.criticalHP.max}`, 
                this.x + this.beam + 5, y);
    y += lineHeight;
    
    // Location HP
    ctx.fillStyle = 'white';
    for (let loc in this.hitLocations) {
        if (loc === 'weapons' || loc === 'hull') continue;
        const locData = this.hitLocations[loc];
        if (!locData.hp) continue;
        
        const hpRatio = locData.hp / locData.maxHp;
        ctx.fillStyle = hpRatio > 0.5 ? 'lime' : hpRatio > 0 ? 'yellow' : 'red';
        ctx.fillText(`${loc}: ${locData.hp.toFixed(0)}/${locData.maxHp}`, 
                    this.x + this.beam + 5, y);
        y += lineHeight;
    }
    
    // Hull zones
    ctx.fillStyle = 'cyan';
    ctx.fillText(`Hull:`, this.x + this.beam + 5, y);
    y += lineHeight;
    for (let zone in this.hitLocations.hull) {
        const zoneData = this.hitLocations.hull[zone];
        const hpRatio = zoneData.hp / zoneData.maxHp;
        ctx.fillStyle = hpRatio > 0.5 ? 'lime' : hpRatio > 0 ? 'yellow' : 'red';
        ctx.fillText(`  ${zone}: ${zoneData.hp.toFixed(0)}`, 
                    this.x + this.beam + 5, y);
        y += lineHeight;
    }
    
    // Movement
    y += lineHeight * 0.5;
    ctx.fillStyle = 'white';
    ctx.fillText(`Speed: ${this.currentSpeed.toFixed(1)} m/s (${this.orderedSpeed})`, 
                this.x + this.beam + 5, y);
    y += lineHeight;
    ctx.fillText(`Heading: ${this.heading.toFixed(0)}° → ${this.orderedHeading.toFixed(0)}°`, 
                this.x + this.beam + 5, y);
    y += lineHeight;
    ctx.fillText(`Turn Rate: ${this.currentTurnRate.toFixed(2)}°/s`, 
                this.x + this.beam + 5, y);
    y += lineHeight;
    ctx.fillText(`Turn Radius: ${this.calculateTurnRadius().toFixed(0)}m`, 
                this.x + this.beam + 5, y);
    
    ctx.restore();
}
```

---

## 9. SUMMARY

This design expands the CapitalShip class with:

1. **Hit Location System** - Individual HP pools for propulsion, C&C, sensors, weapons, hull sections, and carrier-specific systems (flight deck, hangar)

2. **Critical HP Pool** - 25% of total HP reserved for catastrophic damage from destroyed locations; ship sinks when depleted

3. **Armor Penetration** - Weapon penetration values vs. location armor values; damage completely negated if penetration < armor, scaled based on overpenetration amount

4. **Anti-Ship Weapons** - Surface-to-surface missiles (Harpoon, Exocet, Tomahawk, BrahMos), naval guns (5", 8", 16"), and torpedoes with realistic ballistics and guidance

5. **Maneuver System** - Speed control (stop, slow, half, standard, full, flank), realistic turning with speed-dependent turn radius, emergency maneuvers, and formation keeping

All systems maintain backward compatibility with the existing implementation while adding significantly more tactical depth and realism to capital ship combat.

**File Location:** `/home/user/Dogfight2/CAPITAL_SHIP_EXPANSION_DESIGN.md`
**Estimated Implementation Time:** 20-30 hours for full system
**Lines of Code Added:** ~2000-2500 LOC

---

## APPENDIX: Quick Reference

**Hit Location Priority:**
1. Weapons (small hitboxes)
2. Superstructure (command/sensors)
3. Flight deck/hangar (carriers)
4. Propulsion (stern)
5. Hull zones (bow/midship/stern)

**Penetration Formula:**
```
if (penetration < armor): damage = 0
else if (overpenetration < armor * 0.5): damage *= 0.25-0.5
else if (overpenetration < armor * 1.5): damage *= 0.5-1.0
else: damage *= 1.0-1.5
```

**Ship Speed States:**
- Stop: 0%
- Ahead Slow: 25%
- Ahead Half: 50%
- Ahead Standard: 75%
- Ahead Full: 100%
- Ahead Flank: 120% (damages engines)

**Turn Radius Formula:**
```
R = v / (ω * π/180)
where v = speed (m/s), ω = turn rate (deg/s)
```
