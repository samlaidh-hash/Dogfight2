/*
 * ================================================================================
 * LOADOUT UI SYSTEM - JavaScript Implementation
 * ================================================================================
 * Add this JavaScript to dogfight.html in the <script> section
 * (after the aircraft definitions, around line 1060)
 * ================================================================================
 */

// ===== WEAPON STORE DATA STRUCTURES =====

const WEAPON_STORES = {
    // Air-to-Air Missiles
    aim9_sidewinder: {
        id: 'aim9_sidewinder',
        name: 'AIM-9 Sidewinder',
        type: 'missile_aa',
        icon: '🚀',
        weight: 85,
        drag: 0.15,
        count: 1,
        damage: 50,
        range: 3000,
        speed: 600,
        compatibleHardpoints: ['wing_tip', 'wing_inner', 'wing_outer', 'fuselage'],
        description: 'Short-range infrared-guided air-to-air missile'
    },
    aim7_sparrow: {
        id: 'aim7_sparrow',
        name: 'AIM-7 Sparrow',
        type: 'missile_aa',
        icon: '🚀',
        weight: 230,
        drag: 0.25,
        count: 1,
        damage: 70,
        range: 5000,
        speed: 800,
        compatibleHardpoints: ['fuselage', 'wing_inner'],
        description: 'Medium-range radar-guided air-to-air missile'
    },

    // Bombs
    bomb_250lb: {
        id: 'bomb_250lb',
        name: '250lb GP Bomb',
        type: 'bomb',
        icon: '💣',
        weight: 113,
        drag: 0.20,
        count: 1,
        damage: 100,
        blastRadius: 50,
        compatibleHardpoints: ['wing_inner', 'wing_outer', 'fuselage', 'centerline'],
        description: 'General purpose 250-pound bomb'
    },
    bomb_500lb: {
        id: 'bomb_500lb',
        name: '500lb GP Bomb',
        type: 'bomb',
        icon: '💣',
        weight: 227,
        drag: 0.30,
        count: 1,
        damage: 200,
        blastRadius: 80,
        compatibleHardpoints: ['wing_inner', 'fuselage', 'centerline'],
        description: 'General purpose 500-pound bomb'
    },
    bomb_1000lb: {
        id: 'bomb_1000lb',
        name: '1000lb GP Bomb',
        type: 'bomb',
        icon: '💣',
        weight: 454,
        drag: 0.40,
        count: 1,
        damage: 400,
        blastRadius: 120,
        compatibleHardpoints: ['centerline', 'fuselage'],
        description: 'Heavy general purpose 1000-pound bomb'
    },

    // Rockets
    hydra_70: {
        id: 'hydra_70',
        name: 'Hydra 70 Rocket Pod',
        type: 'rocket',
        icon: '🎯',
        weight: 115,
        drag: 0.25,
        count: 19,
        damage: 20,
        range: 8000,
        compatibleHardpoints: ['wing_outer', 'wing_inner'],
        description: '19x 70mm unguided rockets'
    },
    zuni_rocket: {
        id: 'zuni_rocket',
        name: 'Zuni Rocket Pod',
        type: 'rocket',
        icon: '🎯',
        weight: 180,
        drag: 0.30,
        count: 4,
        damage: 60,
        range: 4500,
        compatibleHardpoints: ['wing_inner', 'fuselage'],
        description: '4x 127mm heavy unguided rockets'
    },

    // Anti-Radar Missiles
    agm45_shrike: {
        id: 'agm45_shrike',
        name: 'AGM-45 Shrike',
        type: 'missile_ar',
        icon: '⚡',
        weight: 177,
        drag: 0.20,
        count: 1,
        damage: 150,
        range: 16000,
        compatibleHardpoints: ['wing_inner', 'fuselage'],
        description: 'Anti-radiation missile for SEAD missions'
    },

    // Fuel Tanks
    fuel_tank_150gal: {
        id: 'fuel_tank_150gal',
        name: '150gal Fuel Tank',
        type: 'fuel',
        icon: '⛽',
        weight: 567,
        drag: 0.35,
        fuelCapacity: 567,
        compatibleHardpoints: ['wing_inner', 'centerline'],
        description: 'External fuel tank for extended range'
    },
    fuel_tank_300gal: {
        id: 'fuel_tank_300gal',
        name: '300gal Fuel Tank',
        type: 'fuel',
        icon: '⛽',
        weight: 1134,
        drag: 0.50,
        fuelCapacity: 1134,
        compatibleHardpoints: ['centerline', 'fuselage'],
        description: 'Large external fuel tank for long-range missions'
    },

    // Gun Pods
    gunpod_20mm: {
        id: 'gunpod_20mm',
        name: '20mm Gun Pod',
        type: 'gun',
        icon: '🔫',
        weight: 272,
        drag: 0.25,
        ammo: 300,
        rof: 6,
        damage: [8, 15],
        compatibleHardpoints: ['centerline', 'fuselage'],
        description: 'External 20mm cannon pod'
    }
};

// Hardpoint definitions for different aircraft
const AIRCRAFT_HARDPOINTS = {
    'Spitfire': [
        { id: 'wing_left_outer', position: { left: '22%', top: '45%' }, type: 'wing_outer', mirror: 'wing_right_outer' },
        { id: 'wing_right_outer', position: { left: '78%', top: '45%' }, type: 'wing_outer', mirror: 'wing_left_outer' },
        { id: 'wing_left_inner', position: { left: '35%', top: '48%' }, type: 'wing_inner', mirror: 'wing_right_inner' },
        { id: 'wing_right_inner', position: { left: '65%', top: '48%' }, type: 'wing_inner', mirror: 'wing_left_inner' },
        { id: 'fuselage_center', position: { left: '50%', top: '52%' }, type: 'centerline', mirror: null }
    ],
    'Me-109': [
        { id: 'wing_left', position: { left: '28%', top: '47%' }, type: 'wing_outer', mirror: 'wing_right' },
        { id: 'wing_right', position: { left: '72%', top: '47%' }, type: 'wing_outer', mirror: 'wing_left' },
        { id: 'centerline', position: { left: '50%', top: '50%' }, type: 'centerline', mirror: null }
    ],
    'P-51': [
        { id: 'wing_tip_left', position: { left: '18%', top: '44%' }, type: 'wing_tip', mirror: 'wing_tip_right' },
        { id: 'wing_tip_right', position: { left: '82%', top: '44%' }, type: 'wing_tip', mirror: 'wing_tip_left' },
        { id: 'wing_left_outer', position: { left: '28%', top: '46%' }, type: 'wing_outer', mirror: 'wing_right_outer' },
        { id: 'wing_right_outer', position: { left: '72%', top: '46%' }, type: 'wing_outer', mirror: 'wing_left_outer' },
        { id: 'wing_left_inner', position: { left: '38%', top: '48%' }, type: 'wing_inner', mirror: 'wing_right_inner' },
        { id: 'wing_right_inner', position: { left: '62%', top: '48%' }, type: 'wing_inner', mirror: 'wing_left_inner' }
    ],
    'P-47': [
        { id: 'wing_left_outer', position: { left: '25%', top: '46%' }, type: 'wing_outer', mirror: 'wing_right_outer' },
        { id: 'wing_right_outer', position: { left: '75%', top: '46%' }, type: 'wing_outer', mirror: 'wing_left_outer' },
        { id: 'wing_left_mid', position: { left: '32%', top: '47%' }, type: 'wing_outer', mirror: 'wing_right_mid' },
        { id: 'wing_right_mid', position: { left: '68%', top: '47%' }, type: 'wing_outer', mirror: 'wing_left_mid' },
        { id: 'wing_left_inner', position: { left: '38%', top: '48%' }, type: 'wing_inner', mirror: 'wing_right_inner' },
        { id: 'wing_right_inner', position: { left: '62%', top: '48%' }, type: 'wing_inner', mirror: 'wing_left_inner' },
        { id: 'fuselage_center', position: { left: '50%', top: '50%' }, type: 'fuselage', mirror: null }
    ],
    'Hurricane': [
        { id: 'wing_left', position: { left: '30%', top: '46%' }, type: 'wing_outer', mirror: 'wing_right' },
        { id: 'wing_right', position: { left: '70%', top: '46%' }, type: 'wing_outer', mirror: 'wing_left' }
    ],
    'P-40': [
        { id: 'wing_left', position: { left: '32%', top: '47%' }, type: 'wing_outer', mirror: 'wing_right' },
        { id: 'wing_right', position: { left: '68%', top: '47%' }, type: 'wing_outer', mirror: 'wing_left' },
        { id: 'centerline', position: { left: '50%', top: '50%' }, type: 'centerline', mirror: null }
    ],
    'Fw-190': [
        { id: 'wing_left_outer', position: { left: '26%', top: '46%' }, type: 'wing_outer', mirror: 'wing_right_outer' },
        { id: 'wing_right_outer', position: { left: '74%', top: '46%' }, type: 'wing_outer', mirror: 'wing_left_outer' },
        { id: 'wing_left_inner', position: { left: '36%', top: '48%' }, type: 'wing_inner', mirror: 'wing_right_inner' },
        { id: 'wing_right_inner', position: { left: '64%', top: '48%' }, type: 'wing_inner', mirror: 'wing_left_inner' }
    ],
    'Me-262': [
        { id: 'wing_left_outer', position: { left: '24%', top: '45%' }, type: 'wing_outer', mirror: 'wing_right_outer' },
        { id: 'wing_right_outer', position: { left: '76%', top: '45%' }, type: 'wing_outer', mirror: 'wing_left_outer' },
        { id: 'wing_left_inner', position: { left: '34%', top: '47%' }, type: 'wing_inner', mirror: 'wing_right_inner' },
        { id: 'wing_right_inner', position: { left: '66%', top: '47%' }, type: 'wing_inner', mirror: 'wing_left_inner' },
        { id: 'fuselage_front', position: { left: '50%', top: '48%' }, type: 'fuselage', mirror: null },
        { id: 'fuselage_rear', position: { left: '50%', top: '52%' }, type: 'fuselage', mirror: null }
    ],
    'Zero': [
        { id: 'wing_left', position: { left: '28%', top: '46%' }, type: 'wing_outer', mirror: 'wing_right' },
        { id: 'wing_right', position: { left: '72%', top: '46%' }, type: 'wing_outer', mirror: 'wing_left' },
        { id: 'centerline', position: { left: '50%', top: '50%' }, type: 'centerline', mirror: null }
    ]
};

// ===== LOADOUT STATE =====

let currentLoadout = {
    aircraft: null,
    hardpoints: {},  // { hardpointId: storeId }
    selectedHardpoint: null,
    symmetricLoading: true,
    basePerformance: {
        speed: 100,
        turn: 100,
        climb: 100,
        accel: 100
    }
};

// Selected weapon index for in-game cycling
let selectedWeaponIndex = 0;

// ===== LOADOUT PANEL FUNCTIONS =====

function showLoadoutPanel(aircraftType) {
    currentLoadout.aircraft = aircraftType;
    currentLoadout.hardpoints = {};
    currentLoadout.selectedHardpoint = null;
    currentLoadout.symmetricLoading = document.getElementById('symmetricLoading')?.checked ?? true;

    // Update aircraft name
    document.getElementById('loadoutAircraftName').textContent = aircraftType;

    // Clear and rebuild hardpoint display
    const silhouette = document.getElementById('aircraftSilhouette');
    silhouette.innerHTML = '';

    const hardpoints = AIRCRAFT_HARDPOINTS[aircraftType] || AIRCRAFT_HARDPOINTS['Spitfire'];
    hardpoints.forEach(hp => {
        const hardpointDiv = document.createElement('div');
        hardpointDiv.className = 'hardpoint';
        hardpointDiv.id = `hp_${hp.id}`;
        hardpointDiv.style.left = hp.position.left;
        hardpointDiv.style.top = hp.position.top;
        hardpointDiv.title = `${hp.id} (${hp.type})`;
        hardpointDiv.setAttribute('data-hardpoint-id', hp.id);
        hardpointDiv.setAttribute('data-hardpoint-type', hp.type);
        hardpointDiv.setAttribute('data-mirror', hp.mirror || '');
        hardpointDiv.onclick = () => selectHardpoint(hp.id);
        silhouette.appendChild(hardpointDiv);
    });

    // Build store inventory
    buildStoreInventory();

    // Reset performance display
    updatePerformanceDisplay();

    // Show the panel
    document.getElementById('loadoutPanel').style.display = 'block';

    // Show tutorial on first use
    const hasSeenTutorial = localStorage.getItem('loadout_tutorial_seen');
    if (!hasSeenTutorial) {
        setTimeout(() => {
            showLoadoutTutorial();
            localStorage.setItem('loadout_tutorial_seen', 'true');
        }, 500);
    }
}

function hideLoadoutPanel() {
    document.getElementById('loadoutPanel').style.display = 'none';
}

function selectHardpoint(hardpointId) {
    // Deselect previous
    const allHardpoints = document.querySelectorAll('.hardpoint');
    allHardpoints.forEach(hp => hp.classList.remove('selected'));

    // Select new
    const hardpointDiv = document.getElementById(`hp_${hardpointId}`);
    if (hardpointDiv) {
        hardpointDiv.classList.add('selected');
        currentLoadout.selectedHardpoint = hardpointId;

        // Update info text
        const currentStore = currentLoadout.hardpoints[hardpointId];
        if (currentStore) {
            const store = WEAPON_STORES[currentStore];
            document.getElementById('hardpointInfo').textContent =
                `${hardpointId}: ${store.name} - Click a store to replace, or click the same hardpoint to remove`;
        } else {
            document.getElementById('hardpointInfo').textContent =
                `${hardpointId}: Empty - Select a store from the right panel`;
        }

        // Update store inventory compatibility
        updateStoreCompatibility(hardpointDiv.getAttribute('data-hardpoint-type'));
    }
}

function buildStoreInventory() {
    const inventory = document.getElementById('storeInventory');
    inventory.innerHTML = '';

    const categories = {
        'Air-to-Air': ['missile_aa'],
        'Air-to-Ground': ['bomb', 'rocket'],
        'SEAD': ['missile_ar'],
        'Fuel': ['fuel'],
        'Guns': ['gun']
    };

    for (const [categoryName, types] of Object.entries(categories)) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'store-category';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'store-category-title';
        titleDiv.textContent = categoryName;
        categoryDiv.appendChild(titleDiv);

        const stores = Object.values(WEAPON_STORES).filter(s => types.includes(s.type));
        stores.forEach(store => {
            const storeDiv = createStoreItem(store);
            categoryDiv.appendChild(storeDiv);
        });

        if (stores.length > 0) {
            inventory.appendChild(categoryDiv);
        }
    }
}

function createStoreItem(store) {
    const div = document.createElement('div');
    div.className = 'store-item';
    div.setAttribute('data-store-id', store.id);

    const header = document.createElement('div');
    header.className = 'store-item-header';

    const name = document.createElement('div');
    name.className = 'store-item-name';
    name.textContent = store.name;

    const icon = document.createElement('div');
    icon.className = 'store-item-icon';
    icon.textContent = store.icon;

    header.appendChild(name);
    header.appendChild(icon);
    div.appendChild(header);

    const stats = document.createElement('div');
    stats.className = 'store-item-stats';

    const weight = document.createElement('div');
    weight.className = 'store-item-stat';
    weight.textContent = `Weight: ${store.weight}kg | Drag: ${(store.drag * 100).toFixed(0)}%`;
    stats.appendChild(weight);

    if (store.damage) {
        const damage = document.createElement('div');
        damage.className = 'store-item-stat';
        damage.textContent = `Damage: ${store.damage}` + (store.count > 1 ? ` x${store.count}` : '');
        stats.appendChild(damage);
    }

    if (store.range) {
        const range = document.createElement('div');
        range.className = 'store-item-stat';
        range.textContent = `Range: ${(store.range/1000).toFixed(1)}km`;
        stats.appendChild(range);
    }

    div.appendChild(stats);

    div.onclick = () => mountStore(store.id);

    return div;
}

function updateStoreCompatibility(selectedHardpointType) {
    const storeItems = document.querySelectorAll('.store-item');
    storeItems.forEach(item => {
        const storeId = item.getAttribute('data-store-id');
        const store = WEAPON_STORES[storeId];

        if (store.compatibleHardpoints.includes(selectedHardpointType)) {
            item.classList.remove('incompatible');
        } else {
            item.classList.add('incompatible');
        }
    });
}

function mountStore(storeId) {
    if (!currentLoadout.selectedHardpoint) {
        alert('Please select a hardpoint first!');
        return;
    }

    const hardpointDiv = document.getElementById(`hp_${currentLoadout.selectedHardpoint}`);
    const hardpointType = hardpointDiv.getAttribute('data-hardpoint-type');
    const store = WEAPON_STORES[storeId];

    // Check compatibility
    if (!store.compatibleHardpoints.includes(hardpointType)) {
        alert(`${store.name} is not compatible with this hardpoint type (${hardpointType})`);
        return;
    }

    // Mount the store
    currentLoadout.hardpoints[currentLoadout.selectedHardpoint] = storeId;

    // Update hardpoint visual
    hardpointDiv.classList.add('mounted');
    hardpointDiv.innerHTML = `<span class="store-icon">${store.icon}</span>`;

    // Symmetric loading
    if (currentLoadout.symmetricLoading) {
        const mirrorId = hardpointDiv.getAttribute('data-mirror');
        if (mirrorId) {
            currentLoadout.hardpoints[mirrorId] = storeId;
            const mirrorDiv = document.getElementById(`hp_${mirrorId}`);
            if (mirrorDiv) {
                mirrorDiv.classList.add('mounted');
                mirrorDiv.innerHTML = `<span class="store-icon">${store.icon}</span>`;
            }
        }
    }

    // Update performance
    updatePerformanceDisplay();

    // Update weight
    updateLoadoutWeight();
}

function removeStore(hardpointId) {
    delete currentLoadout.hardpoints[hardpointId];
    const hardpointDiv = document.getElementById(`hp_${hardpointId}`);
    if (hardpointDiv) {
        hardpointDiv.classList.remove('mounted');
        hardpointDiv.innerHTML = '';
    }
    updatePerformanceDisplay();
    updateLoadoutWeight();
}

function updateLoadoutWeight() {
    let totalWeight = 0;
    for (const [hardpointId, storeId] of Object.entries(currentLoadout.hardpoints)) {
        const store = WEAPON_STORES[storeId];
        totalWeight += store.weight;
    }
    document.getElementById('loadoutWeight').textContent = totalWeight.toFixed(0);

    // Warn if overweight
    const weightSpan = document.querySelector('.loadout-weight');
    if (totalWeight > 2000) {
        weightSpan.classList.add('warning');
    } else {
        weightSpan.classList.remove('warning');
    }
}

function updatePerformanceDisplay() {
    // Calculate performance impact based on total weight and drag
    let totalWeight = 0;
    let totalDrag = 0;

    for (const [hardpointId, storeId] of Object.entries(currentLoadout.hardpoints)) {
        const store = WEAPON_STORES[storeId];
        totalWeight += store.weight;
        totalDrag += store.drag;
    }

    // Performance penalties (simplified - actual calc would be in PerformanceCalculator)
    const weightPenalty = totalWeight / 100; // 1% per 100kg
    const dragPenalty = totalDrag * 10; // 10% per drag point

    const speedPenalty = Math.min(50, dragPenalty * 1.2);
    const turnPenalty = Math.min(60, weightPenalty + dragPenalty * 0.8);
    const climbPenalty = Math.min(55, weightPenalty * 1.5 + dragPenalty * 0.5);
    const accelPenalty = Math.min(45, weightPenalty * 1.2);

    const perfSpeed = Math.max(50, 100 - speedPenalty);
    const perfTurn = Math.max(40, 100 - turnPenalty);
    const perfClimb = Math.max(45, 100 - climbPenalty);
    const perfAccel = Math.max(55, 100 - accelPenalty);

    updatePerformanceBar('perfSpeed', perfSpeed);
    updatePerformanceBar('perfTurn', perfTurn);
    updatePerformanceBar('perfClimb', perfClimb);
    updatePerformanceBar('perfAccel', perfAccel);

    // Show warning if performance is severely degraded
    const avgPerf = (perfSpeed + perfTurn + perfClimb + perfAccel) / 4;
    const warning = document.getElementById('perfWarning');
    if (avgPerf < 70) {
        warning.style.display = 'block';
        warning.textContent = avgPerf < 60
            ? '⚠️ CRITICAL: Extreme performance degradation!'
            : '⚠️ WARNING: Heavy loadout will impact performance';
    } else {
        warning.style.display = 'none';
    }
}

function updatePerformanceBar(statName, percentage) {
    const bar = document.getElementById(`${statName}Bar`);
    const value = document.getElementById(`${statName}Value`);

    bar.style.width = `${percentage}%`;
    value.textContent = `${percentage.toFixed(0)}%`;

    // Color coding
    bar.classList.remove('degraded', 'moderate');
    if (percentage < 60) {
        bar.classList.add('degraded');
    } else if (percentage < 80) {
        bar.classList.add('moderate');
    }
}

// ===== PRESET LOADOUTS =====

function applyPreset(presetName) {
    // Clear current loadout
    for (const hardpointId of Object.keys(currentLoadout.hardpoints)) {
        removeStore(hardpointId);
    }
    currentLoadout.hardpoints = {};

    const hardpoints = AIRCRAFT_HARDPOINTS[currentLoadout.aircraft] || AIRCRAFT_HARDPOINTS['Spitfire'];

    switch (presetName) {
        case 'air_to_air':
            // Load air-to-air missiles
            hardpoints.forEach(hp => {
                if (hp.type === 'wing_tip' || hp.type === 'wing_outer') {
                    currentLoadout.hardpoints[hp.id] = 'aim9_sidewinder';
                } else if (hp.type === 'wing_inner') {
                    currentLoadout.hardpoints[hp.id] = 'aim7_sparrow';
                }
            });
            break;

        case 'ground_attack':
            // Load bombs and rockets
            hardpoints.forEach(hp => {
                if (hp.type === 'wing_outer') {
                    currentLoadout.hardpoints[hp.id] = 'hydra_70';
                } else if (hp.type === 'wing_inner') {
                    currentLoadout.hardpoints[hp.id] = 'bomb_500lb';
                } else if (hp.type === 'centerline') {
                    currentLoadout.hardpoints[hp.id] = 'bomb_1000lb';
                }
            });
            break;

        case 'long_range':
            // Load fuel tanks
            hardpoints.forEach(hp => {
                if (hp.type === 'centerline') {
                    currentLoadout.hardpoints[hp.id] = 'fuel_tank_300gal';
                } else if (hp.type === 'wing_inner') {
                    currentLoadout.hardpoints[hp.id] = 'fuel_tank_150gal';
                }
            });
            break;

        case 'sead':
            // Load anti-radar missiles
            hardpoints.forEach(hp => {
                if (hp.type === 'wing_inner' || hp.type === 'fuselage') {
                    currentLoadout.hardpoints[hp.id] = 'agm45_shrike';
                }
            });
            break;

        case 'clean':
            // No stores - already cleared
            break;
    }

    // Update visuals
    for (const [hardpointId, storeId] of Object.entries(currentLoadout.hardpoints)) {
        const hardpointDiv = document.getElementById(`hp_${hardpointId}`);
        const store = WEAPON_STORES[storeId];
        if (hardpointDiv && store) {
            hardpointDiv.classList.add('mounted');
            hardpointDiv.innerHTML = `<span class="store-icon">${store.icon}</span>`;
        }
    }

    updatePerformanceDisplay();
    updateLoadoutWeight();
}

// ===== TUTORIAL FUNCTIONS =====

function showLoadoutTutorial() {
    document.getElementById('loadoutTutorial').style.display = 'flex';
}

function hideLoadoutTutorial() {
    document.getElementById('loadoutTutorial').style.display = 'none';
}

// ===== CONFIRM LOADOUT AND START MISSION =====

function confirmLoadout() {
    // Apply loadout to player aircraft
    if (window.spitfire && currentLoadout.aircraft) {
        spitfire.loadout = { ...currentLoadout.hardpoints };
        spitfire.mountedWeapons = getMountedWeapons();
    }

    // Hide loadout panel
    hideLoadoutPanel();

    // Start the mission (call existing startMission function)
    if (typeof startMission === 'function') {
        startMission();
    }
}

function getMountedWeapons() {
    const weapons = [];
    const weaponCounts = {};

    for (const [hardpointId, storeId] of Object.entries(currentLoadout.hardpoints)) {
        const store = WEAPON_STORES[storeId];
        if (!weaponCounts[storeId]) {
            weaponCounts[storeId] = {
                store: store,
                count: 0,
                hardpoints: []
            };
        }
        weaponCounts[storeId].count += (store.count || 1);
        weaponCounts[storeId].hardpoints.push(hardpointId);
    }

    for (const [storeId, data] of Object.entries(weaponCounts)) {
        weapons.push({
            id: storeId,
            name: data.store.name,
            type: data.store.type,
            icon: data.store.icon,
            remaining: data.count,
            total: data.count,
            hardpoints: data.hardpoints,
            store: data.store
        });
    }

    return weapons;
}

// ===== IN-GAME HUD LOADOUT DISPLAY =====

function updateHUDLoadout() {
    if (!window.spitfire || !spitfire.mountedWeapons) return;

    const hudLoadout = document.getElementById('hudLoadout');
    if (gameState === 'ORDER' || gameState === 'EXECUTION') {
        hudLoadout.style.display = 'block';
    } else {
        hudLoadout.style.display = 'none';
        return;
    }

    const weaponList = document.getElementById('hudWeaponList');
    weaponList.innerHTML = '';

    spitfire.mountedWeapons.forEach((weapon, index) => {
        const weaponDiv = document.createElement('div');
        weaponDiv.className = 'hud-weapon-item';
        if (index === selectedWeaponIndex) {
            weaponDiv.classList.add('selected');
        }
        if (weapon.remaining === 0) {
            weaponDiv.classList.add('depleted');
        }

        const leftDiv = document.createElement('div');
        leftDiv.innerHTML = `${weapon.icon} <span class="hud-weapon-name">${weapon.name}</span>`;

        const rightDiv = document.createElement('div');
        const countSpan = document.createElement('span');
        countSpan.className = 'hud-weapon-count';
        if (weapon.remaining === 0) {
            countSpan.classList.add('empty');
        } else if (weapon.remaining < weapon.total * 0.3) {
            countSpan.classList.add('low');
        }
        countSpan.textContent = `${weapon.remaining}/${weapon.total}`;
        rightDiv.appendChild(countSpan);

        weaponDiv.appendChild(leftDiv);
        weaponDiv.appendChild(rightDiv);
        weaponList.appendChild(weaponDiv);
    });
}

function cycleWeapon() {
    if (!window.spitfire || !spitfire.mountedWeapons || spitfire.mountedWeapons.length === 0) {
        return;
    }

    // Cycle to next weapon
    selectedWeaponIndex = (selectedWeaponIndex + 1) % spitfire.mountedWeapons.length;

    // Skip depleted weapons
    let attempts = 0;
    while (spitfire.mountedWeapons[selectedWeaponIndex].remaining === 0 && attempts < spitfire.mountedWeapons.length) {
        selectedWeaponIndex = (selectedWeaponIndex + 1) % spitfire.mountedWeapons.length;
        attempts++;
    }

    updateHUDLoadout();

    // Show notification
    const weapon = spitfire.mountedWeapons[selectedWeaponIndex];
    console.log(`[WEAPON] Selected: ${weapon.name} (${weapon.remaining} remaining)`);
}

function getCurrentWeapon() {
    if (!window.spitfire || !spitfire.mountedWeapons || spitfire.mountedWeapons.length === 0) {
        return null;
    }
    return spitfire.mountedWeapons[selectedWeaponIndex];
}

function fireCurrentWeapon() {
    const weapon = getCurrentWeapon();
    if (!weapon || weapon.remaining === 0) {
        console.log('[WEAPON] No weapon selected or depleted');
        return false;
    }

    // Decrement ammo
    weapon.remaining--;

    // Update HUD
    updateHUDLoadout();

    // Fire weapon based on type
    switch (weapon.store.type) {
        case 'missile_aa':
            // Launch missile (integrate with existing missile code)
            console.log(`[WEAPON] Fired ${weapon.name}`);
            return true;

        case 'bomb':
            // Drop bomb (integrate with existing bomb code)
            console.log(`[WEAPON] Dropped ${weapon.name}`);
            return true;

        case 'rocket':
            // Fire rocket (integrate with existing rocket code)
            console.log(`[WEAPON] Fired ${weapon.name}`);
            return true;

        case 'missile_ar':
            // Fire anti-radar missile
            console.log(`[WEAPON] Fired ${weapon.name}`);
            return true;

        default:
            return false;
    }
}

// ===== INTEGRATION HOOKS =====

/*
 * INTEGRATION INSTRUCTIONS:
 *
 * 1. Modify the mission flow to show loadout screen:
 *    In showMissionBriefing() or after aircraft selection, call:
 *    showLoadoutPanel(selectedAircraftType);
 *
 * 2. Add keyboard handler for weapon cycling:
 *    In the existing keyboard event handler, add:
 *    case 'z':
 *    case 'Z':
 *        cycleWeapon();
 *        return;
 *
 * 3. Update the game loop to show HUD:
 *    In the render/game loop, call:
 *    updateHUDLoadout();
 *
 * 4. Integrate weapon firing:
 *    Modify existing weapon key handlers (N, K, M) to call:
 *    fireCurrentWeapon();
 *
 * 5. Store loadout data in Aircraft class:
 *    Add properties to Aircraft constructor:
 *    this.loadout = {};  // Hardpoint assignments
 *    this.mountedWeapons = [];  // Weapon inventory
 */

// Make functions globally available
window.showLoadoutPanel = showLoadoutPanel;
window.hideLoadoutPanel = hideLoadoutPanel;
window.applyPreset = applyPreset;
window.confirmLoadout = confirmLoadout;
window.showLoadoutTutorial = showLoadoutTutorial;
window.hideLoadoutTutorial = hideLoadoutTutorial;
window.cycleWeapon = cycleWeapon;
window.getCurrentWeapon = getCurrentWeapon;
window.fireCurrentWeapon = fireCurrentWeapon;
window.updateHUDLoadout = updateHUDLoadout;
window.WEAPON_STORES = WEAPON_STORES;
window.AIRCRAFT_HARDPOINTS = AIRCRAFT_HARDPOINTS;

console.log('[LOADOUT SYSTEM] Initialized successfully');
