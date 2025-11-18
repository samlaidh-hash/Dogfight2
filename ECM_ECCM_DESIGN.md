# ECM/ECCM System Design for Dogfight2
**Version:** 1.0
**Date:** 2025-11-18
**Status:** Design Document - Ready for Implementation

---

## Executive Summary

This document details the design and implementation plan for Electronic Countermeasures (ECM) and Electronic Counter-Countermeasures (ECCM) systems in Dogfight2. The design integrates seamlessly with existing countermeasures (chaff/flares), SAM systems, missiles, and radar mechanics while adding strategic depth to modern and jet-era combat.

---

## Current State Analysis

### Existing Systems (Already Implemented)
✅ **Chaff** - Radar decoys (8s lifetime, 50m radius, RCS decay)
✅ **Flares** - IR decoys (5s burn, 2000K temperature, 40m radius)
✅ **Missile Lock System** - Lock strength (0-1), countermeasure susceptibility
✅ **SAM Radar** - Search/track modes, detection probability, RCS-based detection
✅ **Missile Types** - Heat-seeking, radar-guided, optical
✅ **Modern Jets** - F-15C, MiG-29 with countermeasure capacity
✅ **Proportional Navigation** - Advanced missile guidance algorithm

### Missing ECM/ECCM Capabilities
❌ Active radar jamming (noise, deception)
❌ Electronic attack pods
❌ ECCM for missiles/radars (burn-through, home-on-jam)
❌ Frequency hopping and waveform agility
❌ Multi-mode seekers
❌ AESA radar resistance
❌ Generation-based availability (Vietnam → Modern)
❌ ECM effect on SAM detection and tracking

---

## System Architecture

### 1. ECM System Components

#### 1.1 ECM Pod/Suite Class
```javascript
class ECMSuite {
    constructor(aircraft, config) {
        // Parent aircraft
        this.aircraft = aircraft;
        
        // ECM Configuration
        this.ecmType = config.ecmType; // 'internal', 'pod', 'external'
        this.generation = config.generation; // 1-5 (Vietnam → 6th gen)
        
        // Jamming capabilities
        this.jammingPower = config.jammingPower; // Watts (100-10000+)
        this.jammingRange = config.jammingRange; // Effective range in meters
        this.jammingTypes = config.jammingTypes; // Array: ['noise', 'deception', 'barrage']
        
        // Frequency coverage
        this.frequencyBands = config.frequencyBands; // ['X', 'Ku', 'Ka', etc.]
        this.canFrequencyHop = config.canFrequencyHop; // Boolean
        
        // Operational state
        this.isActive = false;
        this.currentMode = 'standby'; // 'standby', 'noise', 'deception', 'spot'
        this.powerLevel = 1.0; // 0-1, adjustable
        this.burnTime = 0; // How long jamming has been active
        this.maxContinuousTime = config.maxContinuousTime || Infinity; // Seconds before overheat
        
        // Resource costs
        this.powerDraw = config.powerDraw || 0; // Electrical power requirement
        this.fuelPenalty = config.fuelPenalty || 0; // Extra fuel consumption
        
        // Effectiveness modifiers
        this.effectiveness = 1.0; // Base effectiveness, modified by conditions
        this.angleOfCoverage = config.angleOfCoverage || 360; // Degrees (some pods directional)
        
        // Cool-down and duty cycle
        this.overheatTime = 0;
        this.cooldownRate = config.cooldownRate || 1.0; // Heat dissipation rate
    }
    
    activateJamming(mode = 'noise') {
        if (this.overheatTime > 0) return false;
        
        this.isActive = true;
        this.currentMode = mode;
        console.log(`🔊 ECM activated: ${mode} jamming`);
        return true;
    }
    
    deactivateJamming() {
        this.isActive = false;
        this.currentMode = 'standby';
    }
    
    update(dt) {
        if (this.isActive) {
            this.burnTime += dt;
            
            // Check for overheat
            if (this.burnTime >= this.maxContinuousTime) {
                this.overheatTime = 30; // 30 second cooldown
                this.deactivateJamming();
                console.log('⚠️ ECM overheated! Cooling down...');
            }
            
            // Apply fuel penalty
            if (this.aircraft.fuel) {
                this.aircraft.fuel -= this.fuelPenalty * dt;
            }
        } else {
            // Cool down
            this.burnTime = Math.max(0, this.burnTime - this.cooldownRate * dt);
            if (this.overheatTime > 0) {
                this.overheatTime -= dt;
            }
        }
    }
    
    // Calculate jamming effectiveness against a specific threat
    calculateJammingEffect(threat) {
        if (!this.isActive) return 0;
        
        // Distance factor
        const dx = threat.x - this.aircraft.x;
        const dy = threat.y - this.aircraft.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.jammingRange) return 0;
        
        // Base effectiveness by power
        let effect = this.effectiveness * this.powerLevel;
        
        // Range degradation (inverse square law)
        effect *= Math.max(0, 1 - (distance / this.jammingRange) ** 2);
        
        // Check angle of coverage for directional pods
        if (this.angleOfCoverage < 360) {
            const angleToThreat = Math.atan2(dy, dx) * 180 / Math.PI;
            const relativeAngle = Math.abs(((angleToThreat - this.aircraft.heading + 180) % 360) - 180);
            
            if (relativeAngle > this.angleOfCoverage / 2) {
                effect *= 0.1; // Reduced effectiveness outside main lobe
            }
        }
        
        // Mode-specific effects
        switch (this.currentMode) {
            case 'noise':
                effect *= 1.0; // Standard effectiveness
                break;
            case 'deception':
                effect *= 1.3; // More effective but requires more power
                break;
            case 'barrage':
                effect *= 0.8; // Less focused but wider coverage
                break;
            case 'spot':
                effect *= 1.5; // Very effective against single target
                break;
        }
        
        return Math.min(1.0, effect);
    }
}
```

#### 1.2 Jamming Effects on Different Systems

**Effect on SAM Radar Detection:**
```javascript
// Modify SAMSite.searchForTargets()
searchForTargets(aircraft) {
    // ... existing code ...
    
    for (let plane of aircraft) {
        // ... existing detection code ...
        
        // Check for ECM jamming
        let jammingFactor = 0;
        if (plane.ecmSuite && plane.ecmSuite.isActive) {
            jammingFactor = plane.ecmSuite.calculateJammingEffect(this);
        }
        
        // Modified detection probability with ECM
        let detectionProb = rcs * (1 - distance3D / this.config.radarRange);
        detectionProb *= (1 - jammingFactor * 0.6); // ECM reduces detection by up to 60%
        
        // Deception jamming can create false targets
        if (plane.ecmSuite && plane.ecmSuite.currentMode === 'deception' && Math.random() < jammingFactor * 0.3) {
            this.createFalseTarget(plane);
        }
        
        // ... rest of detection logic ...
    }
}
```

**Effect on Missile Tracking:**
```javascript
// Modify Missile.proportionalNavigation()
proportionalNavigation(dt) {
    if (!this.target || this.target.isDestroyed || !this.isLocked) {
        return;
    }
    
    // Check for ECM jamming (radar-guided missiles only)
    if (this.type === 'radar-guided' && this.target.ecmSuite && this.target.ecmSuite.isActive) {
        const jammingEffect = this.target.ecmSuite.calculateJammingEffect(this);
        
        // Degrade lock strength based on jamming
        this.lockStrength *= (1 - jammingEffect * 0.4);
        
        // Chance to break lock entirely
        if (Math.random() < jammingEffect * 0.15 * dt) {
            this.isLocked = false;
            console.log('📡 Missile lock broken by ECM jamming!');
            return;
        }
        
        // Add guidance errors
        if (jammingEffect > 0.5) {
            // Add random noise to target position
            const errorMagnitude = jammingEffect * 100; // Up to 100m position error
            dx += (Math.random() - 0.5) * errorMagnitude;
            dy += (Math.random() - 0.5) * errorMagnitude;
            dz += (Math.random() - 0.5) * errorMagnitude;
        }
    }
    
    // ... rest of guidance logic ...
}
```

---

### 2. ECCM System Components

#### 2.1 ECCM Features for Missiles

```javascript
class ECCMCapability {
    constructor(config) {
        this.generation = config.generation; // 1-5
        
        // ECCM techniques
        this.hasBurnThrough = config.hasBurnThrough || false; // Can increase power to see through jamming
        this.hasHomeOnJam = config.hasHomeOnJam || false; // Can track jamming source
        this.hasFrequencyAgility = config.hasFrequencyAgility || false; // Can change frequencies
        this.hasMultiModeSeeker = config.hasMultiModeSeeker || false; // Multiple guidance modes
        this.hasSidelobleSuppression = config.hasSidelobleSuppression || false; // Resistant to deception
        
        // ECCM effectiveness
        this.burnThroughPower = config.burnThroughPower || 1.0; // Power multiplier
        this.jammingResistance = config.jammingResistance || 0.0; // 0-1, inherent resistance
        this.lockRetention = config.lockRetention || 0.5; // How well it maintains lock under jamming
        
        // Multi-mode seeker modes
        this.availableModes = config.availableModes || ['radar-guided']; // Can switch between modes
        this.currentMode = this.availableModes[0];
    }
    
    // Process jamming and apply ECCM countermeasures
    processJamming(missile, jammingEffect) {
        let effectiveJamming = jammingEffect;
        
        // Apply inherent resistance
        effectiveJamming *= (1 - this.jammingResistance);
        
        // Burn-through mode
        if (this.hasBurnThrough && jammingEffect > 0.3) {
            // Increase power to burn through jamming
            effectiveJamming *= 0.5; // 50% reduction in jamming effect
            console.log('🔥 Missile burn-through mode activated!');
        }
        
        // Home-on-jam
        if (this.hasHomeOnJam && jammingEffect > 0.5) {
            // Switch to passive homing on jamming source
            missile.guidanceMode = 'home-on-jam';
            missile.lockStrength = Math.max(missile.lockStrength, 0.7); // Strong lock on jammer
            effectiveJamming *= 0.2; // Jamming helps the missile!
            console.log('📍 Missile homing on jamming source!');
        }
        
        // Frequency agility
        if (this.hasFrequencyAgility && Math.random() < 0.3) {
            // Randomly hop frequencies to avoid jamming
            effectiveJamming *= 0.7; // 30% reduction
        }
        
        // Multi-mode seeker
        if (this.hasMultiModeSeeker && effectiveJamming > 0.6) {
            // Switch to alternative guidance mode (e.g., radar → IR)
            const alternativeModes = this.availableModes.filter(m => m !== this.currentMode);
            if (alternativeModes.length > 0) {
                this.currentMode = alternativeModes[0];
                missile.type = this.currentMode;
                effectiveJamming *= 0.4; // Switched to mode not being jammed
                console.log(`🔄 Missile switched to ${this.currentMode} guidance!`);
            }
        }
        
        return effectiveJamming;
    }
}
```

#### 2.2 ECCM for SAM Radars

```javascript
// Add to SAMSite class
class SAMSite {
    constructor(x, y, type) {
        // ... existing code ...
        
        // ECCM capabilities based on SAM generation
        this.eccm = {
            generation: this.getGeneration(),
            hasSidelobleBlanking: false, // Reduces effectiveness of deception jamming
            hasFrequencyHopping: false, // Makes jamming harder
            hasBurnThrough: false, // Can increase power
            hasHomeOnJam: false, // Can fire ARM-like missile at jammer
            hasLowProbabilityOfIntercept: false, // AESA feature - hard to detect/jam
            jammingResistance: 0.0 // Base resistance to jamming
        };
        
        this.applyECCMByType();
    }
    
    getGeneration() {
        // Determine generation based on SAM type
        switch (this.type) {
            case 'sa2': return 1; // 1960s
            case 'patriot': return 3; // 1980s-90s
            case 's300': return 4; // 2000s
            case 'shilka': return 2; // 1970s
            default: return 1;
        }
    }
    
    applyECCMByType() {
        switch (this.type) {
            case 'sa2':
                // Early SAM - minimal ECCM
                this.eccm.jammingResistance = 0.1;
                break;
                
            case 'patriot':
                // Modern SAM - good ECCM
                this.eccm.hasSidelobleBlanking = true;
                this.eccm.hasFrequencyHopping = true;
                this.eccm.hasBurnThrough = true;
                this.eccm.jammingResistance = 0.4;
                break;
                
            case 's300':
                // Advanced SAM - excellent ECCM
                this.eccm.hasSidelobleBlanking = true;
                this.eccm.hasFrequencyHopping = true;
                this.eccm.hasBurnThrough = true;
                this.eccm.hasHomeOnJam = true;
                this.eccm.hasLowProbabilityOfIntercept = true;
                this.eccm.jammingResistance = 0.6;
                break;
                
            case 'shilka':
                // Radar AAA - moderate ECCM
                this.eccm.hasFrequencyHopping = true;
                this.eccm.jammingResistance = 0.2;
                break;
        }
    }
    
    processECM(aircraft) {
        if (!aircraft.ecmSuite || !aircraft.ecmSuite.isActive) {
            return 0; // No jamming
        }
        
        let jammingEffect = aircraft.ecmSuite.calculateJammingEffect(this);
        
        // Apply ECCM countermeasures
        let effectiveJamming = jammingEffect;
        
        // Inherent resistance
        effectiveJamming *= (1 - this.eccm.jammingResistance);
        
        // Sidelobe blanking vs deception jamming
        if (this.eccm.hasSidelobleBlanking && aircraft.ecmSuite.currentMode === 'deception') {
            effectiveJamming *= 0.6; // 40% reduction against deception
        }
        
        // Frequency hopping
        if (this.eccm.hasFrequencyHopping) {
            effectiveJamming *= 0.75; // 25% reduction
        }
        
        // Burn-through mode
        if (this.eccm.hasBurnThrough && effectiveJamming > 0.4) {
            // Increase radar power to burn through jamming
            effectiveJamming *= 0.7; // 30% reduction
            this.burnThroughMode = true;
            console.log(`${this.config.name} activated burn-through mode!`);
        }
        
        // LPI radar (AESA)
        if (this.eccm.hasLowProbabilityOfIntercept) {
            effectiveJamming *= 0.5; // Very resistant to jamming
        }
        
        // Home-on-jam capability
        if (this.eccm.hasHomeOnJam && effectiveJamming > 0.6) {
            // Can track the jammer itself
            this.homeOnJamMode = true;
            this.trackedTarget = aircraft; // Lock directly onto jammer
            effectiveJamming *= 0.3; // Jamming actually helps us find them!
            console.log(`${this.config.name} homing on jamming source!`);
        }
        
        return effectiveJamming;
    }
}
```

---

### 3. Generation-Based Availability

#### 3.1 ECM Capability by Era

```javascript
const ECM_GENERATIONS = {
    // Generation 1: Vietnam Era (1960s-1970s)
    GEN1: {
        era: 'Vietnam',
        years: '1960-1975',
        jammingPower: 100-500, // Watts
        jammingRange: 5000, // 5km
        jammingTypes: ['noise'], // Only noise jamming
        frequencyBands: ['X'], // Limited frequency coverage
        canFrequencyHop: false,
        maxContinuousTime: 60, // 1 minute before overheat
        angleOfCoverage: 120, // Directional pods
        effectiveness: 0.4,
        aircraft: ['F-4 Phantom', 'F-105 Thunderchief', 'EA-6B Prowler (dedicated)']
    },
    
    // Generation 2: Cold War (1970s-1980s)
    GEN2: {
        era: 'Cold War',
        years: '1975-1985',
        jammingPower: 500-2000,
        jammingRange: 10000, // 10km
        jammingTypes: ['noise', 'deception'],
        frequencyBands: ['X', 'Ku'],
        canFrequencyHop: true,
        maxContinuousTime: 120,
        angleOfCoverage: 180,
        effectiveness: 0.6,
        aircraft: ['F-4G Wild Weasel', 'F-111', 'EA-6B Prowler', 'EF-111 Raven']
    },
    
    // Generation 3: Modern (1980s-2000s)
    GEN3: {
        era: 'Modern',
        years: '1985-2000',
        jammingPower: 2000-5000,
        jammingRange: 20000, // 20km
        jammingTypes: ['noise', 'deception', 'barrage'],
        frequencyBands: ['X', 'Ku', 'Ka'],
        canFrequencyHop: true,
        maxContinuousTime: 180,
        angleOfCoverage: 240,
        effectiveness: 0.75,
        aircraft: ['F-15E Strike Eagle', 'F/A-18 Hornet', 'EA-6B Prowler', 'Tornado ECR']
    },
    
    // Generation 4: Advanced Modern (2000s-2010s)
    GEN4: {
        era: 'Advanced Modern',
        years: '2000-2015',
        jammingPower: 5000-10000,
        jammingRange: 30000, // 30km
        jammingTypes: ['noise', 'deception', 'barrage', 'spot'],
        frequencyBands: ['X', 'Ku', 'Ka', 'L', 'S'],
        canFrequencyHop: true,
        maxContinuousTime: 300,
        angleOfCoverage: 360,
        effectiveness: 0.85,
        aircraft: ['F/A-18G Growler', 'F-15E', 'F-16CJ', 'Rafale', 'Eurofighter']
    },
    
    // Generation 5: Stealth + Advanced EW (2010s+)
    GEN5: {
        era: '5th Generation',
        years: '2015+',
        jammingPower: 10000+,
        jammingRange: 50000, // 50km
        jammingTypes: ['noise', 'deception', 'barrage', 'spot', 'adaptive'],
        frequencyBands: ['Full Spectrum'], // All bands
        canFrequencyHop: true,
        maxContinuousTime: Infinity, // Advanced cooling
        angleOfCoverage: 360,
        effectiveness: 0.95,
        features: ['AESA-based jamming', 'Cognitive EW', 'Cyber attack'],
        aircraft: ['F-35 Lightning II', 'F-22 Raptor', 'EA-18G Growler (upgraded)']
    }
};
```

#### 3.2 ECCM Capability by Era

```javascript
const ECCM_GENERATIONS = {
    // Generation 1: Early SAMs (1960s)
    GEN1: {
        era: 'Vietnam',
        systems: ['SA-2 Guideline', 'SA-3 Goa', 'Nike Hercules'],
        jammingResistance: 0.1,
        features: ['Basic filtering'],
        vulnerabilities: ['Noise jamming very effective', 'No frequency agility']
    },
    
    // Generation 2: Improved SAMs (1970s-1980s)
    GEN2: {
        era: 'Cold War',
        systems: ['SA-6 Gainful', 'Roland', 'Hawk (improved)', 'ZSU-23-4 Shilka'],
        jammingResistance: 0.2,
        features: ['Frequency hopping', 'Basic burn-through'],
        vulnerabilities: ['Deception jamming effective']
    },
    
    // Generation 3: Modern SAMs (1980s-2000s)
    GEN3: {
        era: 'Modern',
        systems: ['Patriot', 'SA-10 Grumble', 'SA-11 Gadfly'],
        jammingResistance: 0.4,
        features: [
            'Frequency hopping',
            'Burn-through mode',
            'Sidelobe blanking',
            'Track-while-scan'
        ],
        vulnerabilities: ['Advanced spot jamming can work']
    },
    
    // Generation 4: Advanced SAMs (2000s-2010s)
    GEN4: {
        era: 'Advanced Modern',
        systems: ['S-300PMU', 'SA-20 Gargoyle', 'Patriot PAC-3'],
        jammingResistance: 0.6,
        features: [
            'Advanced frequency hopping',
            'Multi-mode burn-through',
            'Sidelobe blanking',
            'Home-on-jam',
            'Phased array radar'
        ],
        vulnerabilities: ['Requires multi-axis jamming']
    },
    
    // Generation 5: Latest SAMs (2010s+)
    GEN5: {
        era: '5th Generation',
        systems: ['S-400 Triumf', 'S-500', 'Patriot PAC-3 MSE', 'THAAD'],
        jammingResistance: 0.7,
        features: [
            'AESA radar (LPI)',
            'Cognitive ECCM',
            'Multi-mode seekers',
            'Home-on-jam',
            'Adaptive waveforms',
            'Networked defense'
        ],
        vulnerabilities: ['Very difficult to jam effectively']
    }
};
```

---

### 4. Aircraft-Specific ECM/ECCM Capabilities

#### 4.1 Aircraft Database Extensions

```javascript
// Add to aircraftDatabase
const aircraftDatabase = {
    // ... existing aircraft ...
    
    'F-15C': {
        // ... existing stats ...
        
        // ECM Suite
        ecmSuite: {
            ecmType: 'internal',
            generation: 3,
            jammingPower: 3000,
            jammingRange: 15000,
            jammingTypes: ['noise', 'deception'],
            frequencyBands: ['X', 'Ku'],
            canFrequencyHop: true,
            maxContinuousTime: 180,
            angleOfCoverage: 240,
            powerDraw: 50,
            fuelPenalty: 0.3,
            cooldownRate: 1.0
        }
    },
    
    'F-4G': { // Wild Weasel
        name: 'F-4G Wild Weasel',
        era: 'Cold War',
        role: 'SEAD (Suppression of Enemy Air Defenses)',
        
        // ... flight stats ...
        
        // Advanced ECM Suite (specialized SEAD aircraft)
        ecmSuite: {
            ecmType: 'dedicated',
            generation: 2,
            jammingPower: 5000, // More powerful for dedicated role
            jammingRange: 25000, // Longer range
            jammingTypes: ['noise', 'deception', 'barrage'],
            frequencyBands: ['X', 'Ku', 'Ka'],
            canFrequencyHop: true,
            maxContinuousTime: 300,
            angleOfCoverage: 360,
            powerDraw: 100,
            fuelPenalty: 0.5,
            cooldownRate: 1.5,
            specialFeatures: ['radar_warning_receiver', 'threat_library']
        },
        
        // Can carry anti-radiation missiles
        canCarryARM: true,
        armCapacity: 4
    },
    
    'EA-18G': { // Growler
        name: 'EA-18G Growler',
        era: 'Advanced Modern',
        role: 'Electronic Attack',
        
        // ... flight stats ...
        
        // State-of-the-art ECM
        ecmSuite: {
            ecmType: 'dedicated',
            generation: 4,
            jammingPower: 10000,
            jammingRange: 40000,
            jammingTypes: ['noise', 'deception', 'barrage', 'spot', 'adaptive'],
            frequencyBands: ['Full Spectrum'],
            canFrequencyHop: true,
            maxContinuousTime: Infinity,
            angleOfCoverage: 360,
            powerDraw: 200,
            fuelPenalty: 0.8,
            cooldownRate: 2.0,
            specialFeatures: [
                'aesa_jamming',
                'cognitive_ew',
                'threat_library',
                'coordinated_jamming',
                'communications_jamming'
            ]
        },
        
        canCarryARM: true,
        armCapacity: 5
    },
    
    // WW2 aircraft have no ECM
    'Spitfire': {
        // ... existing stats ...
        ecmSuite: null, // No ECM in WW2 era
        chaffCapacity: 0,
        flareCapacity: 0
    },
    
    // Early jets have basic countermeasures
    'F-86': {
        name: 'F-86 Sabre',
        era: 'Korea',
        // ... stats ...
        ecmSuite: null, // No active ECM yet
        chaffCapacity: 30, // Basic chaff only
        flareCapacity: 0
    }
};
```

#### 4.2 Missile ECCM Capabilities

```javascript
const MISSILE_ECCM_PROFILES = {
    // Early missiles - no ECCM
    'AIM-9B': { // 1950s Sidewinder
        generation: 1,
        type: 'heat-seeking',
        eccm: null,
        chaffSusceptibility: 0.0, // IR missile, immune to chaff
        flareSusceptibility: 0.95 // Very vulnerable to flares
    },
    
    // Vietnam-era missiles
    'AIM-7E': { // Sparrow
        generation: 2,
        type: 'radar-guided',
        eccm: {
            generation: 1,
            hasBurnThrough: true,
            jammingResistance: 0.1,
            lockRetention: 0.3
        },
        chaffSusceptibility: 0.8,
        flareSusceptibility: 0.0
    },
    
    // Modern missiles
    'AIM-120C': { // AMRAAM
        generation: 4,
        type: 'radar-guided',
        eccm: {
            generation: 4,
            hasBurnThrough: true,
            hasHomeOnJam: true,
            hasFrequencyAgility: true,
            hasSidelobleSuppression: true,
            jammingResistance: 0.5,
            lockRetention: 0.8
        },
        chaffSusceptibility: 0.3,
        flareSusceptibility: 0.0
    },
    
    'AIM-9X': { // Advanced Sidewinder
        generation: 4,
        type: 'heat-seeking',
        eccm: {
            generation: 4,
            hasMultiModeSeeker: true,
            availableModes: ['heat-seeking', 'optical'],
            lockRetention: 0.85
        },
        chaffSusceptibility: 0.0,
        flareSusceptibility: 0.25 // Much more resistant to flares
    },
    
    // SAM missiles
    'SA-2': {
        generation: 1,
        type: 'radar-guided',
        eccm: null, // No ECCM
        chaffSusceptibility: 0.85,
        flareSusceptibility: 0.0
    },
    
    'Patriot': {
        generation: 3,
        type: 'radar-guided',
        eccm: {
            generation: 3,
            hasBurnThrough: true,
            hasHomeOnJam: true,
            hasFrequencyAgility: true,
            jammingResistance: 0.4,
            lockRetention: 0.7
        },
        chaffSusceptibility: 0.4,
        flareSusceptibility: 0.0
    },
    
    'S-300': {
        generation: 4,
        type: 'radar-guided',
        eccm: {
            generation: 4,
            hasBurnThrough: true,
            hasHomeOnJam: true,
            hasFrequencyAgility: true,
            hasMultiModeSeeker: true,
            availableModes: ['radar-guided', 'optical'],
            hasSidelobleSuppression: true,
            jammingResistance: 0.6,
            lockRetention: 0.85
        },
        chaffSusceptibility: 0.25,
        flareSusceptibility: 0.0
    }
};
```

---

### 5. Integration with Existing Systems

#### 5.1 Missile Hit Probability Modifications

```javascript
// Modify missile proximity check to account for ECM/ECCM
checkProximityFuse() {
    if (!this.target || this.target.isDestroyed || this.hasExploded) return;
    
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dz = this.target.altitude - this.altitude;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Base proximity range
    let effectiveProximityRange = this.proximityFuseRange;
    
    // ECM effects on proximity fuse
    if (this.type === 'radar-guided' && this.target.ecmSuite && this.target.ecmSuite.isActive) {
        let jammingEffect = this.target.ecmSuite.calculateJammingEffect(this);
        
        // Apply ECCM if available
        if (this.eccm) {
            jammingEffect = this.eccm.processJamming(this, jammingEffect);
        }
        
        // Jamming can reduce proximity fuse effectiveness
        effectiveProximityRange *= (1 - jammingEffect * 0.5);
        
        // Or even cause premature detonation (deception jamming)
        if (this.target.ecmSuite.currentMode === 'deception' && Math.random() < jammingEffect * 0.1) {
            console.log('💥 Deception jamming caused premature missile detonation!');
            this.explode();
            return;
        }
    }
    
    // Check if within effective proximity range
    if (distance <= effectiveProximityRange) {
        this.explode();
    }
}

// Hit probability calculation
calculateHitProbability() {
    if (!this.target || this.target.isDestroyed) return 0;
    
    let baseProbability = this.lockStrength;
    
    // Missile generation affects base accuracy
    if (this.generation) {
        baseProbability *= (0.3 + this.generation * 0.15); // Gen 1: 45%, Gen 5: 105% (capped)
    }
    
    // ECM effects
    if (this.type === 'radar-guided' && this.target.ecmSuite && this.target.ecmSuite.isActive) {
        let jammingEffect = this.target.ecmSuite.calculateJammingEffect(this);
        
        // Apply ECCM
        if (this.eccm) {
            jammingEffect = this.eccm.processJamming(this, jammingEffect);
        }
        
        // Reduce hit probability
        baseProbability *= (1 - jammingEffect * 0.6);
    }
    
    // Countermeasures effects (existing system, enhanced)
    this.checkCountermeasures();
    baseProbability *= this.lockStrength;
    
    // Target maneuvers (existing)
    const targetGForce = this.target.currentGForce || 0;
    baseProbability *= (1 - targetGForce * 0.08);
    
    // Range effects
    const distance = this.getDistanceToTarget();
    const rangeFactor = Math.max(0, 1 - distance / this.maxRange);
    baseProbability *= (0.5 + rangeFactor * 0.5);
    
    // Aspect angle
    const aspectAngle = this.getAspectAngle();
    if (aspectAngle > 150) { // Rear aspect
        baseProbability *= 1.3;
    } else if (aspectAngle < 30) { // Head-on
        baseProbability *= 0.7;
    }
    
    return Math.min(1.0, Math.max(0, baseProbability));
}
```

#### 5.2 SAM Detection Integration

```javascript
// Enhance SAMSite.searchForTargets() with ECM/ECCM
searchForTargets(aircraft) {
    this.detectedTargets = [];
    let highestThreat = null;
    let highestThreatLevel = 0;
    
    for (let plane of aircraft) {
        if (plane.isDestroyed) continue;
        
        const dx = plane.x - this.x;
        const dy = plane.y - this.y;
        const distance2D = Math.sqrt(dx * dx + dy * dy);
        const distance3D = Math.sqrt(distance2D * distance2D + plane.altitude * plane.altitude);
        
        // Check if in radar range
        if (distance3D > this.config.radarRange) continue;
        if (plane.altitude < this.config.minAltitude) continue;
        if (plane.altitude > this.config.maxAltitude) continue;
        
        // Calculate RCS (Radar Cross Section)
        let rcs = 1.0;
        if (plane.size) rcs = plane.size / 20;
        if (plane.rcs) rcs = plane.rcs; // Use explicit RCS if provided
        
        // Base detection probability
        let detectionProb = rcs * (1 - distance3D / this.config.radarRange);
        
        // === ECM/ECCM INTEGRATION ===
        
        // Check for ECM jamming
        let effectiveJamming = 0;
        if (plane.ecmSuite && plane.ecmSuite.isActive) {
            effectiveJamming = this.processECM(plane);
            
            // Reduce detection probability based on effective jamming
            detectionProb *= (1 - effectiveJamming * 0.7);
            
            // Deception jamming can create false targets
            if (plane.ecmSuite.currentMode === 'deception') {
                // ECCM sidelobe blanking reduces false targets
                let falseTargetChance = effectiveJamming * 0.25;
                if (this.eccm.hasSidelobleBlanking) {
                    falseTargetChance *= 0.4;
                }
                
                if (Math.random() < falseTargetChance) {
                    this.createFalseTarget(plane);
                }
            }
            
            // Home-on-jam mode
            if (this.homeOnJamMode && effectiveJamming > 0.5) {
                detectionProb = 0.95; // Almost certain detection when homing on jammer
            }
        }
        
        // Low RCS (stealth) aircraft
        if (plane.isStealthy && !this.eccm.hasLowProbabilityOfIntercept) {
            // Only advanced AESA radars can detect stealth well
            detectionProb *= 0.3;
        } else if (plane.isStealthy && this.eccm.hasLowProbabilityOfIntercept) {
            detectionProb *= 0.7; // AESA better but still reduced
        }
        
        // === END ECM/ECCM INTEGRATION ===
        
        // Detection check
        if (Math.random() < detectionProb || this.trackedTarget === plane) {
            this.detectedTargets.push({
                aircraft: plane,
                distance: distance3D,
                threat: this.calculateThreatLevel(plane, distance3D),
                isJamming: effectiveJamming > 0.3
            });
            
            // Threat assessment
            const threatLevel = this.calculateThreatLevel(plane, distance3D);
            if (threatLevel > highestThreatLevel) {
                highestThreatLevel = threatLevel;
                highestThreat = plane;
            }
        }
    }
    
    // Switch to track mode if we found a high threat
    if (this.radarMode === 'search' && highestThreat && highestThreatLevel > 0.5) {
        this.radarMode = 'track';
        this.trackedTarget = highestThreat;
        this.trackingTime = 0;
        
        const distance = Math.sqrt(
            Math.pow(highestThreat.x - this.x, 2) + 
            Math.pow(highestThreat.y - this.y, 2)
        ) / 1000;
        
        console.log(`${this.config.name} tracking ${highestThreat.name} at ${distance.toFixed(1)}km`);
    }
}

createFalseTarget(sourceAircraft) {
    // Create a phantom radar return from deception jamming
    const falseTarget = {
        x: sourceAircraft.x + (Math.random() - 0.5) * 1000,
        y: sourceAircraft.y + (Math.random() - 0.5) * 1000,
        altitude: sourceAircraft.altitude + (Math.random() - 0.5) * 500,
        isDestroyed: false,
        isPhantom: true,
        lifetime: 3.0, // Exists for 3 seconds
        age: 0
    };
    
    this.detectedTargets.push({
        aircraft: falseTarget,
        distance: this.getDistance(falseTarget),
        threat: 0.3,
        isJamming: false
    });
    
    console.log(`📡 ${this.config.name} detected false target from deception jamming`);
}
```

---

### 6. User Interface Elements

#### 6.1 ECM Controls

```javascript
// Keyboard controls for ECM
document.addEventListener('keydown', (e) => {
    if (gameState !== EXECUTION) {
        // ECM controls during planning phase
        if (selectedAircraft && selectedAircraft.ecmSuite) {
            switch(e.key.toLowerCase()) {
                case 'j': // Toggle jamming
                    if (selectedAircraft.ecmSuite.isActive) {
                        selectedAircraft.ecmSuite.deactivateJamming();
                    } else {
                        selectedAircraft.ecmSuite.activateJamming('noise');
                    }
                    break;
                    
                case 'n': // Noise jamming
                    selectedAircraft.ecmSuite.activateJamming('noise');
                    break;
                    
                case 'm': // Deception jamming
                    selectedAircraft.ecmSuite.activateJamming('deception');
                    break;
                    
                case 'b': // Barrage jamming
                    if (selectedAircraft.ecmSuite.jammingTypes.includes('barrage')) {
                        selectedAircraft.ecmSuite.activateJamming('barrage');
                    }
                    break;
            }
        }
    }
});
```

#### 6.2 ECM Status Display

```javascript
// Add to aircraft HUD display
function renderECMStatus(aircraft, x, y) {
    if (!aircraft.ecmSuite) return;
    
    const suite = aircraft.ecmSuite;
    
    ctx.save();
    ctx.font = '12px monospace';
    
    // ECM panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, 200, 80);
    ctx.strokeStyle = suite.isActive ? '#00ff00' : '#666666';
    ctx.strokeRect(x, y, 200, 80);
    
    // Title
    ctx.fillStyle = '#00ff00';
    ctx.fillText('ECM SUITE', x + 5, y + 15);
    
    // Status
    const status = suite.isActive ? suite.currentMode.toUpperCase() : 'STANDBY';
    const statusColor = suite.isActive ? '#00ff00' : '#ffaa00';
    ctx.fillStyle = statusColor;
    ctx.fillText(`Status: ${status}`, x + 5, y + 30);
    
    // Power level
    if (suite.isActive) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Power: ${(suite.powerLevel * 100).toFixed(0)}%`, x + 5, y + 45);
        
        // Power bar
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 70, y + 35, suite.powerLevel * 120, 10);
        ctx.strokeStyle = '#00ff00';
        ctx.strokeRect(x + 70, y + 35, 120, 10);
    }
    
    // Overheat warning
    if (suite.overheatTime > 0) {
        ctx.fillStyle = '#ff0000';
        ctx.fillText(`COOLING: ${suite.overheatTime.toFixed(0)}s`, x + 5, y + 60);
    } else if (suite.maxContinuousTime < Infinity) {
        const timeRemaining = suite.maxContinuousTime - suite.burnTime;
        if (timeRemaining < 30 && suite.isActive) {
            ctx.fillStyle = '#ffaa00';
            ctx.fillText(`Time: ${timeRemaining.toFixed(0)}s`, x + 5, y + 60);
        }
    }
    
    // Controls hint
    ctx.fillStyle = '#888888';
    ctx.font = '10px monospace';
    ctx.fillText('J:Toggle N:Noise M:Decoy', x + 5, y + 75);
    
    ctx.restore();
}
```

#### 6.3 ECM Visual Effects

```javascript
// Render ECM jamming effects
function renderECMEffects() {
    for (let aircraft of allAircraft) {
        if (!aircraft.ecmSuite || !aircraft.ecmSuite.isActive) continue;
        
        const suite = aircraft.ecmSuite;
        
        ctx.save();
        ctx.translate(aircraft.x, aircraft.y);
        
        // Jamming aura
        const pulseSize = 30 + Math.sin(Date.now() / 200) * 10;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
        
        // Color based on jamming mode
        let color;
        switch (suite.currentMode) {
            case 'noise':
                color = '100, 255, 100'; // Green
                break;
            case 'deception':
                color = '255, 255, 100'; // Yellow
                break;
            case 'barrage':
                color = '255, 100, 100'; // Red
                break;
            default:
                color = '100, 100, 255'; // Blue
        }
        
        gradient.addColorStop(0, `rgba(${color}, 0.4)`);
        gradient.addColorStop(0.5, `rgba(${color}, 0.2)`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Jamming symbols/particles
        const particleCount = 8;
        const time = Date.now() / 1000;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + time;
            const radius = 20 + Math.sin(time * 2 + i) * 5;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            
            ctx.fillStyle = `rgba(${color}, ${0.6 + Math.sin(time * 3 + i) * 0.3})`;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // ECM indicator icon
        ctx.fillStyle = `rgba(${color}, 0.8)`;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', 0, -aircraft.size - 10);
        
        ctx.restore();
    }
}
```

#### 6.4 Threat Warning Display

```javascript
// Enhanced threat warning with ECM status
function renderThreatWarnings() {
    // ... existing SAM threat warnings ...
    
    // ECM effectiveness display
    if (playerAircraft.ecmSuite && playerAircraft.ecmSuite.isActive) {
        let jammingThreats = 0;
        let successfulJamming = 0;
        
        // Check effectiveness against nearby threats
        for (let sam of samSites) {
            if (sam.isDestroyed) continue;
            
            const distance = Math.sqrt(
                Math.pow(sam.x - playerAircraft.x, 2) + 
                Math.pow(sam.y - playerAircraft.y, 2)
            );
            
            if (distance < playerAircraft.ecmSuite.jammingRange) {
                jammingThreats++;
                
                const jammingEffect = playerAircraft.ecmSuite.calculateJammingEffect(sam);
                const effectiveJamming = sam.processECM(playerAircraft);
                
                if (effectiveJamming > 0.3) {
                    successfulJamming++;
                }
            }
        }
        
        // Display jamming effectiveness
        if (jammingThreats > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(canvasWidth - 250, 100, 240, 60);
            ctx.strokeStyle = '#00ff00';
            ctx.strokeRect(canvasWidth - 250, 100, 240, 60);
            
            ctx.font = 'bold 14px monospace';
            ctx.fillStyle = '#00ff00';
            ctx.fillText('ECM ACTIVE', canvasWidth - 240, 120);
            
            ctx.font = '12px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Jamming ${successfulJamming}/${jammingThreats} threats`, canvasWidth - 240, 140);
            
            const effectiveness = (successfulJamming / jammingThreats * 100).toFixed(0);
            ctx.fillText(`Effectiveness: ${effectiveness}%`, canvasWidth - 240, 155);
            
            ctx.restore();
        }
    }
    
    // ECCM warning (when enemy uses ECCM against your jamming)
    if (playerAircraft.ecmSuite && playerAircraft.ecmSuite.isActive) {
        for (let sam of samSites) {
            if (sam.isDestroyed || !sam.trackedTarget === playerAircraft) continue;
            
            if (sam.burnThroughMode || sam.homeOnJamMode) {
                ctx.save();
                
                // Flashing warning
                if (Math.floor(Date.now() / 500) % 2 === 0) {
                    ctx.fillStyle = 'rgba(255, 100, 0, 0.9)';
                    ctx.fillRect(canvasWidth / 2 - 150, 200, 300, 50);
                    ctx.strokeStyle = '#ff6600';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(canvasWidth / 2 - 150, 200, 300, 50);
                    
                    ctx.font = 'bold 20px monospace';
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    
                    if (sam.homeOnJamMode) {
                        ctx.fillText('⚠️ HOME-ON-JAM ACTIVE ⚠️', canvasWidth / 2, 230);
                    } else if (sam.burnThroughMode) {
                        ctx.fillText('⚠️ BURN-THROUGH MODE ⚠️', canvasWidth / 2, 230);
                    }
                }
                
                ctx.restore();
            }
        }
    }
}
```

---

### 7. Implementation Recommendations

#### 7.1 Implementation Phases

**Phase 1: Core ECM System (Week 1)**
- [ ] Implement ECMSuite class
- [ ] Add ECM properties to modern aircraft (F-15C, MiG-29)
- [ ] Integrate ECM effects on SAM detection
- [ ] Basic keyboard controls (J, N, M keys)
- [ ] Simple visual effects (aura, icon)

**Phase 2: ECCM for SAMs (Week 1-2)**
- [ ] Add ECCM properties to SAMSite class
- [ ] Implement burn-through mode
- [ ] Implement frequency hopping
- [ ] Implement home-on-jam capability
- [ ] Update SAM detection logic with ECCM

**Phase 3: Missile ECCM (Week 2)**
- [ ] Create ECCMCapability class
- [ ] Add ECCM to missile types
- [ ] Implement burn-through for missiles
- [ ] Implement home-on-jam for missiles
- [ ] Multi-mode seeker logic

**Phase 4: Generation System (Week 2-3)**
- [ ] Define ECM_GENERATIONS constants
- [ ] Define ECCM_GENERATIONS constants
- [ ] Define MISSILE_ECCM_PROFILES
- [ ] Apply generation-based capabilities to aircraft/SAMs
- [ ] Create historical scenarios (Vietnam, Gulf War, Modern)

**Phase 5: Advanced Features (Week 3)**
- [ ] Dedicated EW aircraft (F-4G, EA-18G)
- [ ] ECM pod drag/weight penalties
- [ ] Coordinated jamming (multiple aircraft)
- [ ] AESA radar simulation (LPI)
- [ ] Stealth vs radar interactions

**Phase 6: UI and Polish (Week 3-4)**
- [ ] Complete ECM status display
- [ ] Enhanced threat warnings
- [ ] ECM effectiveness meters
- [ ] ECCM warning indicators
- [ ] Help text and tutorials

**Phase 7: Testing and Balance (Week 4)**
- [ ] Test all ECM/ECCM interactions
- [ ] Balance jamming effectiveness
- [ ] Balance ECCM counters
- [ ] Create test missions for each generation
- [ ] Performance optimization

#### 7.2 Code Integration Points

**Files to Modify:**
1. **index.html** (main game file)
   - Add ECMSuite class (~150 lines)
   - Add ECCMCapability class (~100 lines)
   - Modify SAMSite class (+200 lines)
   - Modify Missile class (+150 lines)
   - Add UI rendering (+200 lines)
   - Add keyboard controls (+50 lines)
   - Total: ~850 new lines

2. **Aircraft Database**
   - Add ecmSuite property to all aircraft
   - Add generation-based ECM capabilities
   - (~50 lines for database updates)

3. **Missile Definitions**
   - Add ECCM profiles for each missile type
   - (~100 lines)

4. **Mission Scenarios**
   - Create ECM/ECCM test missions
   - SEAD missions with jamming required
   - (~300 lines for 5-6 new missions)

**Total New Code:** ~1,300 lines

#### 7.3 Performance Considerations

- ECM calculations only run when ECM is active
- ECCM logic only runs when jamming detected
- Use distance checks to skip out-of-range calculations
- Cache jamming effectiveness for frame (avoid recalculating)
- Limit false target generation (max 3 per jammer)
- Use object pooling for ECM particles/effects

#### 7.4 Testing Strategy

**Unit Tests:**
1. ECM effectiveness at various ranges
2. ECCM countering different ECM modes
3. Generation matchups (Gen 1 ECM vs Gen 4 ECCM)
4. Multi-aircraft jamming coordination
5. Edge cases (no ECM, no ECCM, both null)

**Integration Tests:**
1. ECM vs SA-2 (should be very effective)
2. ECM vs Patriot (moderately effective)
3. ECM vs S-300 (minimally effective)
4. Home-on-jam vs jammer aircraft
5. Burn-through vs noise jamming
6. Multi-mode seeker switching

**Mission Tests:**
1. Mission: "Wild Weasel" - Vietnam SEAD with ECM
2. Mission: "Growler Strike" - Modern ECM escort
3. Mission: "ECCM Challenge" - Face advanced SAMs with ECCM
4. Mission: "Generation Gap" - WW2 vs modern SAMs (no ECM)
5. Mission: "Electronic Warfare" - Pure EW scenario

---

### 8. Gameplay Impact

#### 8.1 Tactical Depth

**Without ECM/ECCM (Current):**
- Evade missiles with maneuvers
- Drop chaff/flares reactively
- Terrain masking only defense against SAMs
- All modern SAMs equally threatening

**With ECM/ECCM (Enhanced):**
- Pre-emptive ECM activation before SAM range
- Choose jamming mode based on threat
- Manage ECM burn time and cooldowns
- SEAD aircraft required for heavy SAM environments
- Generation matchups matter (era-appropriate challenges)
- Coordinated strikes with ECM escort
- ECCM forces tactical decisions (turn off ECM to avoid home-on-jam?)

#### 8.2 Historical Accuracy

**Vietnam Era (Gen 1):**
- F-4 Phantom with basic noise jammers
- SA-2 with minimal ECCM
- ECM very effective, revolutionizes tactics
- Wild Weasel missions critical

**Cold War (Gen 2-3):**
- Improved jamming pods
- SAMs gain ECCM, arms race
- Dedicated EW aircraft (EF-111, EA-6B)
- SEAD becomes more complex

**Modern Era (Gen 4-5):**
- Advanced AESA jamming
- SAMs with home-on-jam
- Multi-mode seekers
- ECM/ECCM cat-and-mouse game
- Stealth becomes important

#### 8.3 Mission Design Opportunities

**New Mission Types:**
1. **SEAD Strike** - Destroy SAM with ECM support
2. **ECM Escort** - Protect bombers with jamming
3. **Wild Weasel** - Hunt SAMs with ARM + ECM
4. **Electronic Attack** - Growler pure EW mission
5. **ECCM Challenge** - Face advanced ECCM SAMs
6. **Generation Mismatch** - Modern SAMs vs older aircraft
7. **Coordinated Strike** - Multi-aircraft jamming coordination

---

### 9. Advanced Features (Future Expansion)

#### 9.1 Communications Jamming
- Jam enemy radio communications
- Prevent coordination between SAM sites
- Break enemy formation cohesion

#### 9.2 Cognitive EW
- AI learns jamming patterns
- Adaptive ECCM responses
- Machine learning threat library

#### 9.3 Networked Defense
- SAM sites share tracking data
- Coordinated ECCM response
- Handoff between sites

#### 9.4 Cyber Attack
- Gen 5 aircraft can cyber-attack SAM systems
- Temporary system disruption
- False commands to enemy systems

#### 9.5 Towed Decoys
- Physical decoys trailing aircraft
- Attract missiles away from aircraft
- Consumable item (limited quantity)

---

### 10. Balance Recommendations

#### 10.1 ECM Effectiveness by Generation

**Gen 1 ECM vs Various SAMs:**
- vs SA-2 (Gen 1): 50-60% effective ✅ Historical
- vs Patriot (Gen 3): 10-20% effective
- vs S-300 (Gen 4): 5-10% effective
- vs S-400 (Gen 5): <5% effective

**Gen 3 ECM vs Various SAMs:**
- vs SA-2 (Gen 1): 80-90% effective
- vs Patriot (Gen 3): 40-50% effective ✅ Balanced
- vs S-300 (Gen 4): 20-30% effective
- vs S-400 (Gen 5): 10-15% effective

**Gen 4 ECM vs Various SAMs:**
- vs SA-2 (Gen 1): 95%+ effective (trivial)
- vs Patriot (Gen 3): 60-70% effective
- vs S-300 (Gen 4): 40-50% effective ✅ Challenging
- vs S-400 (Gen 5): 25-35% effective

#### 10.2 ECCM Effectiveness

**Home-on-Jam:**
- Should provide 70-80% lock retention
- Makes jamming a double-edged sword
- Tactical decision: jam or stay silent?

**Burn-Through:**
- 30-50% jamming reduction
- Works better at close range
- Limited by radar power

**Frequency Agility:**
- 20-30% jamming reduction
- Baseline ECCM for modern systems
- Countered by wideband jamming

#### 10.3 Resource Management

**ECM Fuel Penalty:**
- Gen 1-2: 0.2-0.3 fuel/sec extra
- Gen 3-4: 0.4-0.6 fuel/sec extra
- Dedicated EW: 0.6-1.0 fuel/sec extra

**Overheat Times:**
- Gen 1: 60 seconds continuous, 30s cooldown
- Gen 2: 120 seconds continuous, 30s cooldown
- Gen 3: 180 seconds continuous, 20s cooldown
- Gen 4+: No overheat (advanced cooling)

---

## Conclusion

This ECM/ECCM system design provides a comprehensive, historically-grounded electronic warfare simulation that integrates seamlessly with Dogfight2's existing systems. The generation-based approach ensures era-appropriate capabilities while the detailed ECCM modeling creates a realistic cat-and-mouse dynamic between jamming and counter-jamming.

**Key Features:**
- ✅ Realistic ECM effects on radar detection and missile guidance
- ✅ Comprehensive ECCM countermeasures (burn-through, home-on-jam, frequency agility)
- ✅ Generation-based capabilities (Vietnam → Modern)
- ✅ Aircraft-specific ECM suites
- ✅ Missile ECCM profiles
- ✅ Seamless integration with existing countermeasures
- ✅ Rich tactical gameplay depth
- ✅ Historical accuracy across eras
- ✅ Clear UI feedback and controls
- ✅ Balanced and testable design

**Implementation Effort:** ~4 weeks, ~1,300 lines of code

**Status:** Ready for implementation

---

*Document prepared for Dogfight2 by Claude*
*Date: 2025-11-18*
*Version: 1.0 - Complete Design Specification*
