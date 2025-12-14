// ============================================================================
// WEAPON STORE SYSTEM FOR HARDPOINT IMPLEMENTATION
// ============================================================================
// This file defines all available weapon stores that can be mounted on
// aircraft hardpoints. Stores are weapons, fuel tanks, pods, etc. that
// physically attach to the aircraft.
//
// Integration with existing weapon classes:
// - Bombs use existing Bomb class when dropped
// - Missiles use Missile class when launched (to be created)
// - Rockets use existing Rocket class when fired
// ============================================================================

/**
 * WeaponStore Class
 * Represents a physical store (weapon, tank, pod) that can be mounted on a hardpoint
 */
class WeaponStore {
    constructor(config) {
        // Basic identification
        this.type = config.type;           // 'bomb', 'missile', 'rocket_pod', 'fuel_tank', 'gun_pod', 'ecm_pod'
        this.name = config.name;           // Display name (e.g., 'Mk.82 500lb Bomb')
        this.id = config.id;               // Unique identifier for database lookup

        // Physical properties affecting aircraft performance
        this.weight = config.weight;       // Weight in kilograms
        this.dragCoefficient = config.dragCoefficient || 0.1;  // Aerodynamic drag (0.0 - 1.0)

        // Era classification
        this.era = config.era;             // 'WW2', 'Vietnam', 'Modern'

        // Visual representation
        this.visual = {
            shape: config.visual?.shape || 'ellipse',     // 'ellipse', 'rectangle', 'cylinder'
            color: config.visual?.color || '#444444',     // Primary color
            width: config.visual?.width || 4,             // Width in pixels
            height: config.visual?.height || 12,          // Height in pixels
            detailColor: config.visual?.detailColor || '#666666'  // Secondary color for details
        };

        // Type-specific properties
        this.capacity = config.capacity || 0;              // For rocket_pod: number of rockets, gun_pod: rounds
        this.currentCount = config.capacity || 0;          // Current ammunition remaining

        // Weapon-specific properties
        this.explosiveYield = config.explosiveYield || 0;  // For bombs/missiles: damage potential
        this.explosionRadius = config.explosionRadius || 0;
        this.guidanceType = config.guidanceType || 'none'; // 'none', 'heat-seeking', 'radar-guided', 'beam-riding'

        // Fuel tank specific
        this.fuelCapacity = config.fuelCapacity || 0;      // Liters of fuel
        this.currentFuel = config.fuelCapacity || 0;       // Current fuel remaining
        this.jettisionable = config.jettisionable !== false; // Can be dropped

        // ECM specific
        this.jamEffectiveness = config.jamEffectiveness || 0; // 0.0 - 1.0 for ECM pods

        // Gun pod specific
        this.caliber = config.caliber || 0;                // Millimeters
        this.rateOfFire = config.rateOfFire || 0;          // Rounds per second

        // Gameplay flags
        this.expendable = config.expendable !== false;     // Can be used/fired
        this.isActive = true;                              // Store is mounted and functional
        this.isExpended = false;                           // All ammo used up
    }

    /**
     * Get the current weight including remaining fuel/ammo
     */
    getCurrentWeight() {
        if (this.type === 'fuel_tank') {
            // Fuel weight: ~0.8 kg per liter
            const fuelWeight = this.currentFuel * 0.8;
            const emptyWeight = this.weight * 0.15; // Tank itself is ~15% of full weight
            return emptyWeight + fuelWeight;
        }
        return this.weight;
    }

    /**
     * Get current drag coefficient (can vary with expenditure)
     */
    getCurrentDrag() {
        if (this.type === 'fuel_tank' && this.currentFuel === 0) {
            return this.dragCoefficient * 1.2; // Empty tanks have more drag
        }
        return this.dragCoefficient;
    }

    /**
     * Use one unit of this store (fire rocket, drop bomb, etc.)
     */
    use() {
        if (!this.expendable || this.isExpended) {
            return false;
        }

        if (this.type === 'rocket_pod' || this.type === 'gun_pod') {
            this.currentCount--;
            if (this.currentCount <= 0) {
                this.currentCount = 0;
                this.isExpended = true;
            }
            return true;
        } else if (this.type === 'bomb' || this.type === 'missile') {
            this.isExpended = true;
            this.isActive = false;
            return true;
        }

        return false;
    }

    /**
     * Render the store on the aircraft
     */
    render(ctx, x, y, heading) {
        if (!this.isActive) return;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((heading - 180) * Math.PI / 180);

        switch (this.visual.shape) {
            case 'ellipse':
                // Bomb/missile shape
                ctx.fillStyle = this.visual.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, this.visual.width / 2, this.visual.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Fins for missiles
                if (this.type === 'missile') {
                    ctx.fillStyle = this.visual.detailColor;
                    ctx.beginPath();
                    ctx.moveTo(-this.visual.width, this.visual.height / 3);
                    ctx.lineTo(0, this.visual.height / 3 - 2);
                    ctx.lineTo(this.visual.width, this.visual.height / 3);
                    ctx.fill();
                }
                break;

            case 'cylinder':
                // Fuel tank/pod shape
                ctx.fillStyle = this.visual.color;
                ctx.fillRect(-this.visual.width / 2, -this.visual.height / 2, this.visual.width, this.visual.height);

                // End caps
                ctx.beginPath();
                ctx.ellipse(0, -this.visual.height / 2, this.visual.width / 2, 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(0, this.visual.height / 2, this.visual.width / 2, 2, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'rectangle':
                // Rocket pod shape
                ctx.fillStyle = this.visual.color;
                ctx.fillRect(-this.visual.width / 2, -this.visual.height / 2, this.visual.width, this.visual.height);

                // Detail lines
                ctx.strokeStyle = this.visual.detailColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(-this.visual.width / 2, -this.visual.height / 2, this.visual.width, this.visual.height);
                break;
        }

        ctx.restore();
    }
}

// ============================================================================
// WEAPON STORE DATABASE
// ============================================================================
// Comprehensive database of all available stores organized by type and era
// ============================================================================

const WEAPON_STORES = {

    // ========================================================================
    // BOMBS - Free-fall unguided munitions
    // ========================================================================

    // WW2 Era Bombs
    'AN_M64_500': {
        id: 'AN_M64_500',
        type: 'bomb',
        name: 'AN-M64 500lb GP Bomb',
        era: 'WW2',
        weight: 227,  // kg
        dragCoefficient: 0.15,
        explosiveYield: 80,
        explosionRadius: 50,
        visual: {
            shape: 'ellipse',
            color: '#3d3d3d',
            width: 6,
            height: 14,
            detailColor: '#5a5a5a'
        }
    },

    'GP_500': {
        id: 'GP_500',
        type: 'bomb',
        name: 'GP 500lb Bomb (British)',
        era: 'WW2',
        weight: 227,
        dragCoefficient: 0.16,
        explosiveYield: 75,
        explosionRadius: 48,
        visual: {
            shape: 'ellipse',
            color: '#4a4a3a',
            width: 6,
            height: 14,
            detailColor: '#666655'
        }
    },

    'SC_500': {
        id: 'SC_500',
        type: 'bomb',
        name: 'SC 500 (German 500kg)',
        era: 'WW2',
        weight: 500,
        dragCoefficient: 0.14,
        explosiveYield: 100,
        explosionRadius: 60,
        visual: {
            shape: 'ellipse',
            color: '#3a3a3a',
            width: 7,
            height: 16,
            detailColor: '#555555'
        }
    },

    'AN_M30_100': {
        id: 'AN_M30_100',
        type: 'bomb',
        name: 'AN-M30 100lb GP Bomb',
        era: 'WW2',
        weight: 45,
        dragCoefficient: 0.18,
        explosiveYield: 40,
        explosionRadius: 30,
        visual: {
            shape: 'ellipse',
            color: '#3d3d3d',
            width: 4,
            height: 10,
            detailColor: '#5a5a5a'
        }
    },

    'SC_250': {
        id: 'SC_250',
        type: 'bomb',
        name: 'SC 250 (German 250kg)',
        era: 'WW2',
        weight: 250,
        dragCoefficient: 0.15,
        explosiveYield: 65,
        explosionRadius: 45,
        visual: {
            shape: 'ellipse',
            color: '#3a3a3a',
            width: 5,
            height: 13,
            detailColor: '#555555'
        }
    },

    // Modern Era Bombs
    'MK82': {
        id: 'MK82',
        type: 'bomb',
        name: 'Mk.82 500lb Bomb',
        era: 'Modern',
        weight: 241,
        dragCoefficient: 0.12,
        explosiveYield: 95,
        explosionRadius: 55,
        visual: {
            shape: 'ellipse',
            color: '#4a4a4a',
            width: 6,
            height: 15,
            detailColor: '#666666'
        }
    },

    'MK84': {
        id: 'MK84',
        type: 'bomb',
        name: 'Mk.84 2000lb Bomb',
        era: 'Modern',
        weight: 894,
        dragCoefficient: 0.13,
        explosiveYield: 180,
        explosionRadius: 90,
        visual: {
            shape: 'ellipse',
            color: '#4a4a4a',
            width: 9,
            height: 22,
            detailColor: '#666666'
        }
    },

    'MK83': {
        id: 'MK83',
        type: 'bomb',
        name: 'Mk.83 1000lb Bomb',
        era: 'Modern',
        weight: 447,
        dragCoefficient: 0.13,
        explosiveYield: 130,
        explosionRadius: 70,
        visual: {
            shape: 'ellipse',
            color: '#4a4a4a',
            width: 7,
            height: 18,
            detailColor: '#666666'
        }
    },

    // ========================================================================
    // MISSILES - Guided weapons
    // ========================================================================

    // Heat-Seeking Missiles
    'AIM9_SIDEWINDER': {
        id: 'AIM9_SIDEWINDER',
        type: 'missile',
        name: 'AIM-9 Sidewinder',
        era: 'Modern',
        weight: 85,
        dragCoefficient: 0.08,
        explosiveYield: 60,
        explosionRadius: 25,
        guidanceType: 'heat-seeking',
        visual: {
            shape: 'ellipse',
            color: '#e0e0e0',
            width: 4,
            height: 16,
            detailColor: '#333333'
        }
    },

    'R60_APHID': {
        id: 'R60_APHID',
        type: 'missile',
        name: 'R-60 Aphid (AA-8)',
        era: 'Modern',
        weight: 43,
        dragCoefficient: 0.09,
        explosiveYield: 50,
        explosionRadius: 20,
        guidanceType: 'heat-seeking',
        visual: {
            shape: 'ellipse',
            color: '#c0c0c0',
            width: 3,
            height: 14,
            detailColor: '#8b0000'
        }
    },

    'AIM9L': {
        id: 'AIM9L',
        type: 'missile',
        name: 'AIM-9L Sidewinder (All-Aspect)',
        era: 'Modern',
        weight: 85,
        dragCoefficient: 0.07,
        explosiveYield: 65,
        explosionRadius: 28,
        guidanceType: 'heat-seeking',
        visual: {
            shape: 'ellipse',
            color: '#e8e8e8',
            width: 4,
            height: 16,
            detailColor: '#000080'
        }
    },

    // Radar-Guided Missiles
    'AIM120_AMRAAM': {
        id: 'AIM120_AMRAAM',
        type: 'missile',
        name: 'AIM-120 AMRAAM',
        era: 'Modern',
        weight: 152,
        dragCoefficient: 0.06,
        explosiveYield: 75,
        explosionRadius: 30,
        guidanceType: 'radar-guided',
        visual: {
            shape: 'ellipse',
            color: '#d0d0d0',
            width: 4,
            height: 18,
            detailColor: '#000080'
        }
    },

    'R27_ALAMO': {
        id: 'R27_ALAMO',
        type: 'missile',
        name: 'R-27 Alamo (AA-10)',
        era: 'Modern',
        weight: 253,
        dragCoefficient: 0.07,
        explosiveYield: 85,
        explosionRadius: 35,
        guidanceType: 'radar-guided',
        visual: {
            shape: 'ellipse',
            color: '#b8b8b8',
            width: 5,
            height: 20,
            detailColor: '#8b0000'
        }
    },

    'AIM7_SPARROW': {
        id: 'AIM7_SPARROW',
        type: 'missile',
        name: 'AIM-7 Sparrow',
        era: 'Vietnam',
        weight: 230,
        dragCoefficient: 0.08,
        explosiveYield: 70,
        explosionRadius: 28,
        guidanceType: 'beam-riding',
        visual: {
            shape: 'ellipse',
            color: '#c8c8c8',
            width: 5,
            height: 19,
            detailColor: '#4a4a4a'
        }
    },

    // ========================================================================
    // ROCKET PODS - Unguided rockets in launch containers
    // ========================================================================

    'LAU3_19': {
        id: 'LAU3_19',
        type: 'rocket_pod',
        name: 'LAU-3/A (19× 2.75" Rockets)',
        era: 'Vietnam',
        weight: 95,  // Loaded weight
        dragCoefficient: 0.25,
        capacity: 19,
        explosiveYield: 40,  // Per rocket
        explosionRadius: 20,
        visual: {
            shape: 'rectangle',
            color: '#555555',
            width: 8,
            height: 20,
            detailColor: '#777777'
        }
    },

    'UB32': {
        id: 'UB32',
        type: 'rocket_pod',
        name: 'UB-32 (32× S-5 Rockets)',
        era: 'Modern',
        weight: 115,
        dragCoefficient: 0.28,
        capacity: 32,
        explosiveYield: 35,
        explosionRadius: 18,
        visual: {
            shape: 'rectangle',
            color: '#4a4a3a',
            width: 10,
            height: 22,
            detailColor: '#666655'
        }
    },

    'RP3_RAIL': {
        id: 'RP3_RAIL',
        type: 'rocket_pod',
        name: 'RP-3 Rail (8× 60lb Rockets)',
        era: 'WW2',
        weight: 85,
        dragCoefficient: 0.35,
        capacity: 8,
        explosiveYield: 55,
        explosionRadius: 25,
        visual: {
            shape: 'rectangle',
            color: '#3a3a2a',
            width: 6,
            height: 18,
            detailColor: '#555544'
        }
    },

    'M8_LAUNCHER': {
        id: 'M8_LAUNCHER',
        type: 'rocket_pod',
        name: 'M8 4.5" Launcher (6 Rockets)',
        era: 'WW2',
        weight: 65,
        dragCoefficient: 0.32,
        capacity: 6,
        explosiveYield: 48,
        explosionRadius: 22,
        visual: {
            shape: 'rectangle',
            color: '#3d3d3d',
            width: 5,
            height: 16,
            detailColor: '#5a5a5a'
        }
    },

    'HYDRA70_7': {
        id: 'HYDRA70_7',
        type: 'rocket_pod',
        name: 'LAU-68 (7× Hydra 70)',
        era: 'Modern',
        weight: 58,
        dragCoefficient: 0.22,
        capacity: 7,
        explosiveYield: 42,
        explosionRadius: 20,
        visual: {
            shape: 'rectangle',
            color: '#606060',
            width: 6,
            height: 18,
            detailColor: '#808080'
        }
    },

    'HYDRA70_19': {
        id: 'HYDRA70_19',
        type: 'rocket_pod',
        name: 'LAU-61 (19× Hydra 70)',
        era: 'Modern',
        weight: 102,
        dragCoefficient: 0.24,
        capacity: 19,
        explosiveYield: 42,
        explosionRadius: 20,
        visual: {
            shape: 'rectangle',
            color: '#606060',
            width: 8,
            height: 20,
            detailColor: '#808080'
        }
    },

    // ========================================================================
    // FUEL TANKS - External drop tanks for extended range
    // ========================================================================

    'DROP_300': {
        id: 'DROP_300',
        type: 'fuel_tank',
        name: '300 Gallon Drop Tank',
        era: 'WW2',
        weight: 910,  // Full weight (300 gal × 3.785 L/gal × 0.8 kg/L)
        dragCoefficient: 0.18,
        fuelCapacity: 1136,  // Liters
        jettisionable: true,
        visual: {
            shape: 'cylinder',
            color: '#6a6a6a',
            width: 10,
            height: 28,
            detailColor: '#505050'
        }
    },

    'DROP_600': {
        id: 'DROP_600',
        type: 'fuel_tank',
        name: '600 Gallon Drop Tank',
        era: 'Modern',
        weight: 1820,
        dragCoefficient: 0.20,
        fuelCapacity: 2271,
        jettisionable: true,
        visual: {
            shape: 'cylinder',
            color: '#6a6a6a',
            width: 12,
            height: 36,
            detailColor: '#505050'
        }
    },

    'DROP_1000L': {
        id: 'DROP_1000L',
        type: 'fuel_tank',
        name: '1000 Liter Drop Tank',
        era: 'Modern',
        weight: 800,
        dragCoefficient: 0.19,
        fuelCapacity: 1000,
        jettisionable: true,
        visual: {
            shape: 'cylinder',
            color: '#707070',
            width: 11,
            height: 32,
            detailColor: '#555555'
        }
    },

    'DROP_150': {
        id: 'DROP_150',
        type: 'fuel_tank',
        name: '150 Gallon Drop Tank',
        era: 'WW2',
        weight: 455,
        dragCoefficient: 0.16,
        fuelCapacity: 568,
        jettisionable: true,
        visual: {
            shape: 'cylinder',
            color: '#656565',
            width: 8,
            height: 22,
            detailColor: '#4a4a4a'
        }
    },

    'CENTERLINE_370': {
        id: 'CENTERLINE_370',
        type: 'fuel_tank',
        name: '370 Gallon Centerline Tank',
        era: 'Vietnam',
        weight: 1122,
        dragCoefficient: 0.17,
        fuelCapacity: 1401,
        jettisionable: true,
        visual: {
            shape: 'cylinder',
            color: '#6c6c6c',
            width: 11,
            height: 30,
            detailColor: '#525252'
        }
    },

    // ========================================================================
    // GUN PODS - External cannon/gun installations
    // ========================================================================

    'SUU23_A': {
        id: 'SUU23_A',
        type: 'gun_pod',
        name: 'SUU-23/A 20mm Gun Pod',
        era: 'Vietnam',
        weight: 286,  // With 1200 rounds
        dragCoefficient: 0.22,
        capacity: 1200,
        caliber: 20,
        rateOfFire: 100,  // Rounds per second
        visual: {
            shape: 'cylinder',
            color: '#4a4a4a',
            width: 9,
            height: 26,
            detailColor: '#666666'
        }
    },

    'GPU5_A': {
        id: 'GPU5_A',
        type: 'gun_pod',
        name: 'GPU-5/A 30mm GAU-8 Pod',
        era: 'Modern',
        weight: 860,  // With ammo
        dragCoefficient: 0.24,
        capacity: 353,
        caliber: 30,
        rateOfFire: 70,
        visual: {
            shape: 'cylinder',
            color: '#3a3a3a',
            width: 12,
            height: 32,
            detailColor: '#555555'
        }
    },

    'ADEN_POD': {
        id: 'ADEN_POD',
        type: 'gun_pod',
        name: 'ADEN 30mm Gun Pod',
        era: 'Modern',
        weight: 320,
        dragCoefficient: 0.21,
        capacity: 150,
        caliber: 30,
        rateOfFire: 22,
        visual: {
            shape: 'cylinder',
            color: '#454545',
            width: 10,
            height: 28,
            detailColor: '#606060'
        }
    },

    // ========================================================================
    // ECM PODS - Electronic countermeasures
    // ========================================================================

    'ALQ131': {
        id: 'ALQ131',
        type: 'ecm_pod',
        name: 'ALQ-131 ECM Pod',
        era: 'Modern',
        weight: 195,
        dragCoefficient: 0.15,
        jamEffectiveness: 0.65,  // Reduces enemy radar effectiveness by 65%
        expendable: false,
        visual: {
            shape: 'cylinder',
            color: '#5a5a5a',
            width: 9,
            height: 28,
            detailColor: '#707070'
        }
    },

    'ALQ184': {
        id: 'ALQ184',
        type: 'ecm_pod',
        name: 'ALQ-184 ECM Pod',
        era: 'Modern',
        weight: 160,
        dragCoefficient: 0.14,
        jamEffectiveness: 0.70,
        expendable: false,
        visual: {
            shape: 'cylinder',
            color: '#606060',
            width: 8,
            height: 26,
            detailColor: '#757575'
        }
    },

    'SPS141': {
        id: 'SPS141',
        type: 'ecm_pod',
        name: 'SPS-141 ECM Pod (Soviet)',
        era: 'Modern',
        weight: 170,
        dragCoefficient: 0.16,
        jamEffectiveness: 0.60,
        expendable: false,
        visual: {
            shape: 'cylinder',
            color: '#555555',
            width: 8,
            height: 27,
            detailColor: '#6a6a6a'
        }
    }
};

// ============================================================================
// STORE UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a WeaponStore instance from the database
 */
function createStore(storeId) {
    const config = WEAPON_STORES[storeId];
    if (!config) {
        console.error(`Store ID '${storeId}' not found in database`);
        return null;
    }
    return new WeaponStore(config);
}

/**
 * Get all stores of a specific type
 */
function getStoresByType(type) {
    return Object.keys(WEAPON_STORES)
        .filter(id => WEAPON_STORES[id].type === type)
        .map(id => WEAPON_STORES[id]);
}

/**
 * Get all stores from a specific era
 */
function getStoresByEra(era) {
    return Object.keys(WEAPON_STORES)
        .filter(id => WEAPON_STORES[id].era === era)
        .map(id => WEAPON_STORES[id]);
}

/**
 * Get stores filtered by type and era
 */
function getStores(type = null, era = null) {
    let stores = Object.values(WEAPON_STORES);

    if (type) {
        stores = stores.filter(s => s.type === type);
    }

    if (era) {
        stores = stores.filter(s => s.era === era);
    }

    return stores;
}

/**
 * Calculate total weight of an array of stores
 */
function calculateTotalWeight(stores) {
    return stores.reduce((total, store) => {
        if (store instanceof WeaponStore) {
            return total + store.getCurrentWeight();
        }
        return total;
    }, 0);
}

/**
 * Calculate total drag of an array of stores
 */
function calculateTotalDrag(stores) {
    return stores.reduce((total, store) => {
        if (store instanceof WeaponStore && store.isActive) {
            return total + store.getCurrentDrag();
        }
        return total;
    }, 0);
}

/**
 * Get performance impact of stores on aircraft
 * Returns object with multipliers for various performance characteristics
 */
function getPerformanceImpact(stores, baseWeight = 5000) {
    const totalWeight = calculateTotalWeight(stores);
    const totalDrag = calculateTotalDrag(stores);

    // Weight impact (heavier = slower acceleration, worse turn rate, worse climb)
    const weightRatio = (baseWeight + totalWeight) / baseWeight;
    const accelerationMultiplier = 1.0 / weightRatio;
    const turnRateMultiplier = 1.0 / Math.sqrt(weightRatio);
    const climbRateMultiplier = 1.0 / (weightRatio * 1.2);

    // Drag impact (more drag = lower top speed)
    const dragMultiplier = 1.0 - (totalDrag * 0.15);  // Each 1.0 drag reduces speed by 15%
    const topSpeedMultiplier = Math.max(0.5, dragMultiplier);  // Min 50% speed

    // Asymmetric loading detection
    // (This would need left/right hardpoint information, placeholder for now)
    const asymmetricPenalty = 1.0;  // 1.0 = no penalty

    return {
        acceleration: accelerationMultiplier,
        turnRate: turnRateMultiplier * asymmetricPenalty,
        climbRate: climbRateMultiplier,
        topSpeed: topSpeedMultiplier,
        totalWeight: totalWeight,
        totalDrag: totalDrag,
        weightRatio: weightRatio
    };
}

// ============================================================================
// STORE STATISTICS
// ============================================================================

function getStoreStatistics() {
    const stats = {
        total: 0,
        byType: {},
        byEra: {},
        stores: []
    };

    for (const id in WEAPON_STORES) {
        const store = WEAPON_STORES[id];
        stats.total++;

        // Count by type
        if (!stats.byType[store.type]) {
            stats.byType[store.type] = 0;
        }
        stats.byType[store.type]++;

        // Count by era
        if (!stats.byEra[store.era]) {
            stats.byEra[store.era] = 0;
        }
        stats.byEra[store.era]++;

        // Store info
        stats.stores.push({
            id: id,
            name: store.name,
            type: store.type,
            era: store.era,
            weight: store.weight
        });
    }

    return stats;
}

// ============================================================================
// INTEGRATION WITH EXISTING WEAPON CLASSES
// ============================================================================

/**
 * Create a Bomb instance from a bomb store
 * Uses existing Bomb class from the game
 */
function createBombFromStore(store, x, y, altitude, velocity, heading) {
    if (store.type !== 'bomb') {
        console.error('Store is not a bomb type');
        return null;
    }

    // Create using existing Bomb class
    const bomb = new Bomb(x, y, altitude, velocity, heading);

    // Override with store-specific properties
    bomb.damage = store.explosiveYield;
    bomb.explosionRadius = store.explosionRadius;

    // Mark store as used
    store.use();

    return bomb;
}

/**
 * Create a Rocket instance from a rocket pod store
 * Uses existing Rocket class from the game
 */
function createRocketFromStore(store, x, y, altitude, heading, target = null) {
    if (store.type !== 'rocket_pod') {
        console.error('Store is not a rocket pod type');
        return null;
    }

    if (store.currentCount <= 0) {
        console.warn('Rocket pod is empty');
        return null;
    }

    // Create using existing Rocket class
    const rocket = new Rocket(x, y, altitude, heading, target);

    // Override with store-specific properties
    rocket.damage = store.explosiveYield;
    rocket.explosionRadius = store.explosionRadius;

    // Decrement rocket count
    store.use();

    return rocket;
}

/**
 * Missile Class
 * Represents a guided missile in flight with fuel management, guidance systems, and physics
 */
class Missile {
    /**
     * @param {Object} config - Missile configuration
     * @param {string} config.missileType - Type identifier (e.g., 'AIM9_SIDEWINDER', 'RL_CAPITAL_SHIP')
     * @param {number} config.x - Launch position X
     * @param {number} config.y - Launch position Y
     * @param {number} config.altitude - Launch altitude
     * @param {number} config.heading - Initial heading in degrees
     * @param {Object} config.target - Target object to track
     * @param {number} config.launchVelocity - Initial velocity from launch platform
     */
    constructor(config) {
        // Position and kinematics
        this.x = config.x;
        this.y = config.y;
        this.altitude = config.altitude;
        this.heading = config.heading;

        // Velocity components (inherit from launch platform)
        const launchVel = config.launchVelocity || 0;
        this.velocityX = launchVel * Math.sin(this.heading * Math.PI / 180);
        this.velocityY = -launchVel * Math.cos(this.heading * Math.PI / 180);
        this.speed = launchVel;

        // Missile type and properties (from MISSILE_TYPES)
        this.missileType = config.missileType;
        const type = MISSILE_TYPES[this.missileType];

        if (!type) {
            console.error(`Unknown missile type: ${this.missileType}`);
            return;
        }

        // Combat properties
        this.damage = type.damage;
        this.warheadType = type.warheadType;
        this.explosionRadius = type.explosionRadius;

        // Performance properties
        this.maxSpeed = type.maxSpeed;
        this.acceleration = type.acceleration; // m/s²
        this.maxG = type.maxG; // Maximum G-force for turning
        this.maneuverability = type.maneuverability; // 0.0 - 1.0 rating

        // Fuel system
        this.fuelCapacity = type.fuelCapacity; // kg
        this.currentFuel = type.fuelCapacity;
        this.fuelConsumptionRate = type.fuelConsumptionRate; // kg/s at full thrust
        this.burnTime = type.burnTime; // seconds of fuel
        this.throttle = 0.0; // 0.0 to 1.0, missile controls this smartly

        // Guidance system
        this.guidanceType = type.guidanceType; // 'heat-seeking', 'radar-guided', 'beam-riding', 'inertial'
        this.guidanceEffectiveness = type.guidanceEffectiveness; // 0.0 - 1.0
        this.lockStrength = 1.0; // Can be degraded by ECM
        this.hasLock = true;
        this.seekerFOV = type.seekerFOV || 30; // Field of view in degrees

        // Target tracking
        this.target = config.target;
        this.lastKnownTargetX = this.target?.x || 0;
        this.lastKnownTargetY = this.target?.y || 0;
        this.targetLostTime = 0;

        // Flight state
        this.isActive = true;
        this.hasExploded = false;
        this.explosionTime = 0;
        this.timeAlive = 0;
        this.distanceTraveled = 0;
        this.maxRange = type.maxRange || (this.maxSpeed * this.burnTime * 0.8); // Estimate if not specified

        // Smart fuel management
        this.smartFuel = type.smartFuel !== false; // Default true for modern missiles
        this.coastPhase = false; // Missile can coast to save fuel

        // Proximity fuse
        this.proximityFuse = type.proximityFuse !== false;
        this.proximityRange = type.proximityRange || 10; // meters

        // Visual properties
        this.color = type.color || '#ffffff';
        this.exhaustColor = type.exhaustColor || '#ff6600';
    }

    /**
     * Update missile state
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (!this.isActive || this.hasExploded) return;

        this.timeAlive += dt;

        // Check if out of fuel
        if (this.currentFuel <= 0) {
            this.throttle = 0;
            this.coastPhase = true;
        }

        // Smart fuel management: conserve fuel if target is far
        if (this.smartFuel && !this.coastPhase) {
            this.updateSmartThrottle();
        } else if (!this.coastPhase) {
            this.throttle = 1.0; // Dumb missile: full burn
        }

        // Guidance and targeting
        this.updateGuidance(dt);

        // Physics update
        this.updatePhysics(dt);

        // Check for detonation conditions
        this.checkDetonation();

        // Check if missile exceeded range or lifetime
        if (this.distanceTraveled > this.maxRange || this.timeAlive > this.burnTime * 3) {
            this.isActive = false;
        }
    }

    /**
     * Smart throttle management to conserve fuel
     */
    updateSmartThrottle() {
        if (!this.target || this.target.isDestroyed) {
            this.throttle = 0.5; // Reduced power if no target
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        // Calculate if we need to burn or can coast
        const timeToTarget = distanceToTarget / (this.speed || 1);
        const fuelTimeRemaining = this.currentFuel / this.fuelConsumptionRate;

        if (fuelTimeRemaining > timeToTarget * 2) {
            // Plenty of fuel, can coast or low power
            this.throttle = 0.3;
            this.coastPhase = true;
        } else if (distanceToTarget > 500) {
            // Long range, moderate power
            this.throttle = 0.7;
            this.coastPhase = false;
        } else {
            // Close range, full power for intercept
            this.throttle = 1.0;
            this.coastPhase = false;
        }
    }

    /**
     * Update guidance system and adjust heading
     * @param {number} dt - Delta time
     */
    updateGuidance(dt) {
        if (!this.target || this.target.isDestroyed) {
            // Lost target, continue on last known heading
            this.targetLostTime += dt;
            if (this.targetLostTime > 2.0) {
                // Give up after 2 seconds
                this.hasLock = false;
            }
            return;
        }

        // Calculate angle to target
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Update last known position
        this.lastKnownTargetX = this.target.x;
        this.lastKnownTargetY = this.target.y;

        // Calculate intercept point with proportional navigation
        let targetX = this.target.x;
        let targetY = this.target.y;

        if (this.guidanceType === 'heat-seeking' || this.guidanceType === 'radar-guided') {
            // Lead the target
            const targetVelX = this.target.speed * Math.sin(this.target.heading * Math.PI / 180);
            const targetVelY = -this.target.speed * Math.cos(this.target.heading * Math.PI / 180);
            const closingSpeed = this.speed + this.target.speed;
            const timeToIntercept = distance / (closingSpeed || 1);

            targetX += targetVelX * timeToIntercept * this.guidanceEffectiveness;
            targetY += targetVelY * timeToIntercept * this.guidanceEffectiveness;
        }

        // Calculate desired heading
        const desiredHeading = Math.atan2(targetX - this.x, -(targetY - this.y)) * 180 / Math.PI;

        // Check if target is within seeker FOV
        let headingDiff = desiredHeading - this.heading;
        while (headingDiff > 180) headingDiff -= 360;
        while (headingDiff < -180) headingDiff += 360;

        if (Math.abs(headingDiff) > this.seekerFOV / 2) {
            // Target outside seeker cone
            this.targetLostTime += dt;
        } else {
            this.targetLostTime = 0;
            this.hasLock = true;
        }

        // Apply turn rate limits based on maneuverability
        const maxTurnRate = this.maneuverability * this.maxG * 9.8 / (this.speed || 1) * 180 / Math.PI; // deg/s
        const maxTurn = maxTurnRate * dt;

        if (Math.abs(headingDiff) > maxTurn) {
            this.heading += Math.sign(headingDiff) * maxTurn;
        } else {
            this.heading = desiredHeading;
        }

        // Normalize heading
        while (this.heading < 0) this.heading += 360;
        while (this.heading >= 360) this.heading -= 360;
    }

    /**
     * Update physics (velocity, position, fuel)
     * @param {number} dt - Delta time
     */
    updatePhysics(dt) {
        // Apply thrust acceleration
        if (this.currentFuel > 0 && this.throttle > 0) {
            const thrustAccel = this.acceleration * this.throttle;
            const accelX = thrustAccel * Math.sin(this.heading * Math.PI / 180);
            const accelY = -thrustAccel * Math.cos(this.heading * Math.PI / 180);

            this.velocityX += accelX * dt;
            this.velocityY += accelY * dt;

            // Consume fuel
            this.currentFuel -= this.fuelConsumptionRate * this.throttle * dt;
            if (this.currentFuel < 0) this.currentFuel = 0;
        }

        // Calculate speed and limit to maxSpeed
        this.speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (this.speed > this.maxSpeed) {
            const scale = this.maxSpeed / this.speed;
            this.velocityX *= scale;
            this.velocityY *= scale;
            this.speed = this.maxSpeed;
        }

        // Update position
        const dx = this.velocityX * dt;
        const dy = this.velocityY * dt;
        this.x += dx;
        this.y += dy;
        this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Check for detonation conditions
     */
    checkDetonation() {
        if (!this.target || this.target.isDestroyed) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dz = (this.target.altitude || 0) - this.altitude;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Proximity fuse
        if (this.proximityFuse && distance <= this.proximityRange) {
            this.detonate();
        }

        // Direct hit (very close)
        if (distance <= 2) {
            this.detonate();
        }
    }

    /**
     * Detonate the missile
     */
    detonate() {
        this.hasExploded = true;
        this.isActive = false;
        this.explosionTime = 0;

        // Apply damage to target if close enough
        if (this.target && !this.target.isDestroyed) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.explosionRadius) {
                const damageRatio = 1.0 - (distance / this.explosionRadius);
                const actualDamage = this.damage * damageRatio;

                if (this.target.takeDamage) {
                    this.target.takeDamage(actualDamage, this.warheadType);
                }
            }
        }
    }

    /**
     * Render the missile
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (!this.isActive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.heading * Math.PI / 180);

        // Missile body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Exhaust plume if burning
        if (this.throttle > 0 && this.currentFuel > 0) {
            const plumeLength = 10 * this.throttle;
            const gradient = ctx.createLinearGradient(0, 4, 0, 4 + plumeLength);
            gradient.addColorStop(0, this.exhaustColor);
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(-1, 4);
            ctx.lineTo(1, 4);
            ctx.lineTo(0.5, 4 + plumeLength);
            ctx.lineTo(-0.5, 4 + plumeLength);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

// ============================================================================
// MISSILE TYPE DATABASE
// ============================================================================
// Defines missile performance characteristics based on real-world and
// Renegade Legion specifications
// ============================================================================

const MISSILE_TYPES = {
    // Air-to-air missiles (Heat-seeking)
    'AIM9_SIDEWINDER': {
        damage: 60,
        warheadType: 'HE-FRAG', // High explosive fragmentation
        explosionRadius: 25,
        maxSpeed: 680, // m/s (Mach 2)
        acceleration: 250, // 25G
        maxG: 25,
        maneuverability: 0.75,
        fuelCapacity: 8, // kg
        fuelConsumptionRate: 2, // kg/s
        burnTime: 4,
        guidanceType: 'heat-seeking',
        guidanceEffectiveness: 0.80,
        seekerFOV: 30,
        maxRange: 18000,
        smartFuel: true,
        proximityFuse: true,
        proximityRange: 10,
        color: '#e0e0e0',
        exhaustColor: '#ff6600'
    },

    'AIM9L': {
        damage: 65,
        warheadType: 'HE-FRAG',
        explosionRadius: 28,
        maxSpeed: 680,
        acceleration: 300, // 30G - all aspect capability
        maxG: 30,
        maneuverability: 0.85,
        fuelCapacity: 8,
        fuelConsumptionRate: 2,
        burnTime: 4,
        guidanceType: 'heat-seeking',
        guidanceEffectiveness: 0.90,
        seekerFOV: 60, // All-aspect
        maxRange: 18000,
        smartFuel: true,
        proximityFuse: true,
        proximityRange: 12,
        color: '#e8e8e8',
        exhaustColor: '#ff6600'
    },

    'R60_APHID': {
        damage: 50,
        warheadType: 'HE-FRAG',
        explosionRadius: 20,
        maxSpeed: 650,
        acceleration: 280,
        maxG: 28,
        maneuverability: 0.80,
        fuelCapacity: 5,
        fuelConsumptionRate: 2.5,
        burnTime: 2,
        guidanceType: 'heat-seeking',
        guidanceEffectiveness: 0.75,
        seekerFOV: 25,
        maxRange: 8000,
        smartFuel: true,
        proximityFuse: true,
        proximityRange: 8,
        color: '#c0c0c0',
        exhaustColor: '#ff4400'
    },

    // Radar-guided missiles
    'AIM120_AMRAAM': {
        damage: 75,
        warheadType: 'HE-FRAG',
        explosionRadius: 30,
        maxSpeed: 1200, // Mach 4
        acceleration: 300,
        maxG: 30,
        maneuverability: 0.90,
        fuelCapacity: 20,
        fuelConsumptionRate: 3,
        burnTime: 6.5,
        guidanceType: 'radar-guided',
        guidanceEffectiveness: 0.95,
        seekerFOV: 90,
        maxRange: 100000,
        smartFuel: true,
        proximityFuse: true,
        proximityRange: 15,
        color: '#d0d0d0',
        exhaustColor: '#ff8800'
    },

    'AIM7_SPARROW': {
        damage: 70,
        warheadType: 'HE-FRAG',
        explosionRadius: 28,
        maxSpeed: 1200,
        acceleration: 250,
        maxG: 25,
        maneuverability: 0.70,
        fuelCapacity: 18,
        fuelConsumptionRate: 3,
        burnTime: 6,
        guidanceType: 'beam-riding',
        guidanceEffectiveness: 0.85,
        seekerFOV: 45,
        maxRange: 70000,
        smartFuel: false, // Vietnam-era
        proximityFuse: true,
        proximityRange: 12,
        color: '#c8c8c8',
        exhaustColor: '#ff6600'
    },

    'R27_ALAMO': {
        damage: 85,
        warheadType: 'HE-FRAG',
        explosionRadius: 35,
        maxSpeed: 1300,
        acceleration: 280,
        maxG: 28,
        maneuverability: 0.85,
        fuelCapacity: 25,
        fuelConsumptionRate: 3.5,
        burnTime: 7,
        guidanceType: 'radar-guided',
        guidanceEffectiveness: 0.90,
        seekerFOV: 80,
        maxRange: 80000,
        smartFuel: true,
        proximityFuse: true,
        proximityRange: 14,
        color: '#b8b8b8',
        exhaustColor: '#ff5500'
    },

    // Renegade Legion Capital Ship Missiles
    'RL_CAPITAL_SHIP': {
        damage: 1000,
        warheadType: 'HE', // High explosive
        explosionRadius: 50,
        maxSpeed: 800, // ~30G acceleration capability
        acceleration: 294, // 30G
        maxG: 30,
        maneuverability: 0.70,
        fuelCapacity: 60,
        fuelConsumptionRate: 3, // 20 seconds burn time
        burnTime: 20,
        guidanceType: 'radar-guided',
        guidanceEffectiveness: 0.90,
        seekerFOV: 120, // Space missile, wide seeker
        maxRange: 15000, // Can reach quite far in space
        smartFuel: true, // Intelligent fuel management
        proximityFuse: true,
        proximityRange: 25,
        color: '#888888',
        exhaustColor: '#6666ff'
    },

    // Renegade Legion Dogfight Missiles (anti-fighter)
    'RL_DOGFIGHT': {
        damage: 200,
        warheadType: 'HE-FRAG',
        explosionRadius: 15,
        maxSpeed: 1200, // 60G acceleration
        acceleration: 588, // 60G
        maxG: 60,
        maneuverability: 0.95, // Very agile
        fuelCapacity: 6,
        fuelConsumptionRate: 1.2, // 5 seconds burn time
        burnTime: 5,
        guidanceType: 'heat-seeking',
        guidanceEffectiveness: 0.92,
        seekerFOV: 90,
        maxRange: 5000,
        smartFuel: true,
        proximityFuse: true,
        proximityRange: 8,
        color: '#999999',
        exhaustColor: '#4444ff'
    },

    // Armor-piercing variant (for capital ships)
    'RL_CAPITAL_AP': {
        damage: 800,
        warheadType: 'ARMOR-PIERCING',
        explosionRadius: 30, // Shaped charge, smaller radius
        maxSpeed: 900,
        acceleration: 294,
        maxG: 30,
        maneuverability: 0.65,
        fuelCapacity: 60,
        fuelConsumptionRate: 3,
        burnTime: 20,
        guidanceType: 'radar-guided',
        guidanceEffectiveness: 0.95,
        seekerFOV: 120,
        maxRange: 15000,
        smartFuel: true,
        proximityFuse: false, // Contact fuse only for AP
        proximityRange: 2,
        color: '#777777',
        exhaustColor: '#8888ff'
    }
};

/**
 * Create a Missile instance from a missile store
 */
function createMissileFromStore(store, x, y, altitude, heading, target, launchVelocity = 0) {
    if (store.type !== 'missile') {
        console.error('Store is not a missile type');
        return null;
    }

    // Map store ID to missile type
    // Default to using store ID as missile type, or map specific ones
    let missileType = store.id;

    // Create missile configuration
    const config = {
        missileType: missileType,
        x: x,
        y: y,
        altitude: altitude,
        heading: heading,
        target: target,
        launchVelocity: launchVelocity
    };

    // Create the missile
    const missile = new Missile(config);

    // Mark store as used
    store.use();

    return missile;
}

// ============================================================================
// EXPORT FOR USE IN GAME
// ============================================================================

// If using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WeaponStore,
        WEAPON_STORES,
        Missile,
        MISSILE_TYPES,
        createStore,
        getStoresByType,
        getStoresByEra,
        getStores,
        calculateTotalWeight,
        calculateTotalDrag,
        getPerformanceImpact,
        getStoreStatistics,
        createBombFromStore,
        createRocketFromStore,
        createMissileFromStore
    };
}
