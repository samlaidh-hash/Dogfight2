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
 * Create a Missile instance from a missile store
 * @param {WeaponStore} store - Missile store
 * @param {number} x - Launch X position
 * @param {number} y - Launch Y position
 * @param {number} altitude - Launch altitude
 * @param {Aircraft} shooter - Aircraft launching the missile
 * @param {Aircraft|CapitalShip} target - Target to lock onto
 * @returns {Missile|null} - Missile object or null if invalid
 */
function createMissileFromStore(store, x, y, altitude, shooter, target) {
    if (store.type !== 'missile') {
        console.error('Store is not a missile type');
        return null;
    }

    if (!shooter || !target) {
        console.error('Shooter and target required for missile launch');
        return null;
    }

    // Check if Missile class is available (should be defined in main game)
    if (typeof Missile === 'undefined') {
        console.error('Missile class not defined - ensure it is loaded before weapon-stores.js');
        return null;
    }

    // Create missile instance
    const missile = new Missile(x, y, altitude, shooter, target, store);
    
    // Mark store as used (decrements count)
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
