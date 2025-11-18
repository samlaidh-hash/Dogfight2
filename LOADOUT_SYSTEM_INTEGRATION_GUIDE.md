# Loadout System Integration Guide

## Overview

This guide explains how to integrate the complete Loadout Selection and Management UI into the Dogfight 2 game. The system provides a comprehensive pre-mission loadout screen, in-game weapon selection, and performance impact visualization.

## Files Created

1. **loadout-ui-system.html** - Contains all CSS styling and HTML markup
2. **loadout-system.js** - Complete JavaScript implementation
3. **LOADOUT_SYSTEM_INTEGRATION_GUIDE.md** - This integration guide

## Integration Steps

### Step 1: Add CSS Styling

**Location:** `/home/user/Dogfight2/dogfight.html` - Insert before `</style>` tag (line ~439)

**What to add:** Copy the entire CSS section from `loadout-ui-system.html` (lines with the `/* ===== LOADOUT PANEL STYLING ===== */` comment block)

**Quick Method:**
```bash
# Extract CSS from loadout-ui-system.html and note the content
# Then manually insert before </style> in dogfight.html
```

### Step 2: Add HTML Markup

**Location:** `/home/user/Dogfight2/dogfight.html` - Inside `gameContainer` div, after `playerSwitchScreen` (line ~659)

**What to add:** Copy the entire HTML section from `loadout-ui-system.html` starting with:
```html
<!-- Loadout Selection Panel -->
<div id="loadoutPanel">
...
</div>

<!-- In-game HUD Loadout Display -->
<div id="hudLoadout" style="display: none;">
...
</div>

<!-- Tutorial/Help Overlay -->
<div id="loadoutTutorial">
...
</div>
```

### Step 3: Add JavaScript Code

**Location:** `/home/user/Dogfight2/dogfight.html` - In the `<script>` section, after aircraft definitions (line ~1060)

**What to add:** Copy the entire contents of `loadout-system.js`

### Step 4: Integrate with Mission Flow

**Location:** Find the `showMissionBriefing()` function (around line 7655)

**Modify the function to show loadout screen:**

```javascript
function showMissionBriefing() {
    const briefing = document.getElementById('briefingContent');
    briefing.innerHTML = `
        <h2>${currentMission.name}</h2>
        <p><strong>Type:</strong> ${currentMission.type}</p>
        <p><strong>Briefing:</strong> ${currentMission.briefing}</p>
        <h3>Objectives:</h3>
        <ul>${currentMission.objectives.map(obj => `<li>${obj}</li>`).join('')}</ul>
    `;

    // Hide the mission briefing panel
    document.getElementById('missionBriefing').style.display = 'none';

    // Show loadout panel instead
    showLoadoutPanel(currentMission.playerAircraft);
}
```

**Alternative:** If you want to keep the briefing, modify `startMission()` button to first show loadout:

```javascript
// In the Mission Briefing HTML (line ~610), change the button:
<button class="btn btn-primary" onclick="showLoadoutPanel(currentMission.playerAircraft)">SELECT LOADOUT</button>
```

### Step 5: Add Keyboard Handler for Weapon Cycling

**Location:** Find the keyboard event handler (line ~6451)

**Add this case to the switch statement:**

```javascript
window.addEventListener('keydown', (e) => {
    // ... existing code ...

    // Weapon cycling (add before wingman commands or in a separate section)
    if (e.key.toLowerCase() === 'z' && gameState === 'ORDER') {
        cycleWeapon();
        return;
    }

    // ... rest of keyboard handling ...
});
```

### Step 6: Update Game Loop for HUD Display

**Location:** Find the `gameLoop()` or main render function

**Add this call to update the HUD:**

```javascript
function gameLoop() {
    // ... existing game loop code ...

    // Update loadout HUD during gameplay
    if (gameState === 'ORDER' || gameState === 'EXECUTION') {
        updateHUDLoadout();
    }

    // ... rest of game loop ...
}
```

### Step 7: Integrate Weapon Firing (Optional Enhancement)

**Location:** Find existing weapon key handlers (N, K, M keys)

**Modify to use loadout system:**

```javascript
case 'n':  // Bomb key
case 'N':
    const currentWeapon = getCurrentWeapon();
    if (currentWeapon && currentWeapon.store.type === 'bomb') {
        fireCurrentWeapon();
    }
    break;

case 'k':  // Rocket key
case 'K':
    const currentWeapon = getCurrentWeapon();
    if (currentWeapon && currentWeapon.store.type === 'rocket') {
        fireCurrentWeapon();
    }
    break;

case 'm':  // Missile key
case 'M':
    const currentWeapon = getCurrentWeapon();
    if (currentWeapon && (currentWeapon.store.type === 'missile_aa' || currentWeapon.store.type === 'missile_ar')) {
        fireCurrentWeapon();
    }
    break;
```

### Step 8: Add Loadout Properties to Aircraft Class

**Location:** Find the `Aircraft` constructor (search for `class Aircraft` or `function Aircraft`)

**Add these properties:**

```javascript
class Aircraft {
    constructor(name, type, x, y, altitude, heading, isPlayer) {
        // ... existing properties ...

        // Loadout system properties
        this.loadout = {};  // Hardpoint assignments { hardpointId: storeId }
        this.mountedWeapons = [];  // Active weapon inventory

        // ... rest of constructor ...
    }
}
```

## Verification

After integration, verify the following:

1. **CSS Styling:** Loadout panel should have dark theme with performance bars
2. **Mission Flow:** Loadout screen appears before mission start
3. **Hardpoints:** Clicking hardpoints selects them (red highlight)
4. **Store Selection:** Clicking stores mounts them to selected hardpoint
5. **Performance Bars:** Bars update when loadout changes
6. **Presets:** Quick loadout buttons work correctly
7. **Symmetric Loading:** Checkbox auto-mirrors left/right pylons
8. **HUD Display:** In-game HUD shows mounted weapons
9. **Weapon Cycling:** 'Z' key cycles through weapons
10. **Tutorial:** Help button shows tutorial overlay

## Testing Checklist

- [ ] Loadout panel displays on mission start
- [ ] Aircraft silhouette shows correct hardpoints
- [ ] Hardpoint selection works (visual feedback)
- [ ] Store mounting works (icons appear on hardpoints)
- [ ] Incompatible stores are grayed out
- [ ] Performance bars update correctly
- [ ] Weight calculation displays
- [ ] Warnings appear for heavy loadouts
- [ ] Preset buttons load correct configurations
- [ ] Symmetric loading mirrors correctly
- [ ] Tutorial displays on first use
- [ ] HUD shows weapons during gameplay
- [ ] 'Z' key cycles weapons
- [ ] Selected weapon is highlighted
- [ ] Weapon counts decrease when fired
- [ ] Empty weapons are grayed out

## Troubleshooting

### Loadout panel doesn't appear
- Check that CSS was added before `</style>`
- Verify HTML was added inside `gameContainer`
- Ensure `showLoadoutPanel()` is being called

### Hardpoints don't show
- Verify aircraft type exists in `AIRCRAFT_HARDPOINTS` object
- Check console for JavaScript errors
- Ensure `aircraftSilhouette` div exists

### Performance bars don't update
- Check that `updatePerformanceDisplay()` is called after mounting stores
- Verify bar elements exist in HTML

### Weapon cycling doesn't work
- Ensure keyboard handler for 'Z' key is added
- Check that `spitfire.mountedWeapons` is populated
- Verify `cycleWeapon()` function exists

### Symmetric loading doesn't mirror
- Check that hardpoints have `mirror` property set
- Verify `symmetricLoading` checkbox is checked
- Ensure mirror hardpoint IDs match

## Advanced Customization

### Adding New Weapon Stores

Edit `WEAPON_STORES` object in loadout-system.js:

```javascript
new_store_id: {
    id: 'new_store_id',
    name: 'Display Name',
    type: 'missile_aa|bomb|rocket|missile_ar|fuel|gun',
    icon: '🚀',  // Emoji icon
    weight: 100,  // kg
    drag: 0.20,  // 0.0 to 1.0
    count: 1,  // Number of rounds/missiles
    damage: 50,
    range: 3000,  // meters
    compatibleHardpoints: ['wing_tip', 'wing_outer', 'wing_inner', 'fuselage', 'centerline'],
    description: 'Store description'
}
```

### Adding Hardpoints to Aircraft

Edit `AIRCRAFT_HARDPOINTS` object:

```javascript
'AircraftName': [
    {
        id: 'unique_hardpoint_id',
        position: { left: '30%', top: '45%' },  // CSS positioning
        type: 'wing_tip|wing_outer|wing_inner|fuselage|centerline',
        mirror: 'opposite_hardpoint_id'  // For symmetric loading, or null
    },
    // ... more hardpoints ...
]
```

### Customizing Performance Calculations

Modify `updatePerformanceDisplay()` function to integrate with actual PerformanceCalculator class when available.

### Adding Custom Presets

Add new cases to `applyPreset()` function:

```javascript
case 'custom_preset':
    hardpoints.forEach(hp => {
        if (hp.type === 'wing_outer') {
            currentLoadout.hardpoints[hp.id] = 'your_store_id';
        }
    });
    break;
```

Then add a button in the HTML:

```html
<button class="preset-btn" onclick="applyPreset('custom_preset')">
    <div class="preset-name">Custom Preset</div>
    <div class="preset-desc">Description</div>
</button>
```

## File Locations Summary

| File | Purpose | Location |
|------|---------|----------|
| `loadout-ui-system.html` | CSS & HTML reference | `/home/user/Dogfight2/` |
| `loadout-system.js` | JavaScript implementation | `/home/user/Dogfight2/` |
| `dogfight.html` | Main game file (integration target) | `/home/user/Dogfight2/` |
| `LOADOUT_SYSTEM_INTEGRATION_GUIDE.md` | This guide | `/home/user/Dogfight2/` |

## UI Component Structure

```
Loadout Panel (#loadoutPanel)
├── Performance Preview (left)
│   ├── Speed Bar
│   ├── Turn Rate Bar
│   ├── Climb Rate Bar
│   ├── Acceleration Bar
│   └── Warning Display
├── Aircraft Display (center)
│   ├── Silhouette with Hardpoints
│   ├── Loadout Info
│   ├── Weight Display
│   └── Presets Section
│       ├── Preset Buttons
│       └── Symmetric Loading Toggle
└── Store Inventory (right)
    ├── Air-to-Air Category
    ├── Air-to-Ground Category
    ├── SEAD Category
    ├── Fuel Category
    └── Guns Category

HUD Loadout Display (#hudLoadout)
├── Weapon List
│   ├── Weapon Item 1 (with icon, name, count)
│   ├── Weapon Item 2
│   └── ...
└── Hotkey Hint

Tutorial Overlay (#loadoutTutorial)
├── Overview Section
├── How to Use Section
├── Performance Impact Section
├── In-Game Weapon Selection Section
└── Store Types Section
```

## Interaction Flow

```
Mission Selected
    ↓
showMissionBriefing()
    ↓
[BRIEFING DISPLAYED]
    ↓
User clicks "SELECT LOADOUT" (or auto-show)
    ↓
showLoadoutPanel(aircraftType)
    ↓
[LOADOUT PANEL DISPLAYED]
    ↓
User selects hardpoint → selectHardpoint(id)
    ↓
User selects store → mountStore(storeId)
    ↓
Performance bars update → updatePerformanceDisplay()
    ↓
(Optional) User applies preset → applyPreset(name)
    ↓
User clicks "START MISSION" → confirmLoadout()
    ↓
Loadout applied to aircraft
    ↓
hideLoadoutPanel()
    ↓
startMission()
    ↓
[MISSION STARTS]
    ↓
Game Loop → updateHUDLoadout()
    ↓
[HUD DISPLAYS WEAPONS]
    ↓
User presses 'Z' → cycleWeapon()
    ↓
User fires weapon → fireCurrentWeapon()
    ↓
Weapon count decrements
    ↓
HUD updates
```

## Keyboard Controls

| Key | Action | Context |
|-----|--------|---------|
| `Z` | Cycle through mounted weapons | In-game |
| `N` | Fire/drop selected bomb | In-game |
| `K` | Fire selected rocket | In-game |
| `M` | Fire selected missile | In-game |
| `ESC` | Close tutorial (standard) | Loadout screen |

## Notes for Other Agents

- **Hardpoint Class Integration:** The loadout system expects `Hardpoint` objects to be available. When implemented, replace the simplified hardpoint data structure with actual `Hardpoint` instances.

- **WeaponStore Class Integration:** The `WEAPON_STORES` object can be replaced with actual `WeaponStore` class instances. Update the `mountStore()` function accordingly.

- **PerformanceCalculator Integration:** The `updatePerformanceDisplay()` function currently uses simplified calculations. When `PerformanceCalculator` is available, replace with:
  ```javascript
  const perfImpact = PerformanceCalculator.calculateLoadoutImpact(currentLoadout, aircraftType);
  updatePerformanceBar('perfSpeed', perfImpact.speed);
  // ... etc
  ```

- **Weapon Firing Integration:** The `fireCurrentWeapon()` function is a stub. Integrate with actual weapon systems:
  - Bombs: Call existing bomb drop logic
  - Missiles: Call existing missile launch logic
  - Rockets: Call existing rocket fire logic

## Support

For questions or issues:
1. Check console for JavaScript errors
2. Verify all integration steps completed
3. Review troubleshooting section
4. Check that all files are in correct locations

## Version

- **Version:** 1.0.0
- **Date:** 2025-11-17
- **Compatible with:** Dogfight 2 v2.0.0

---

*End of Integration Guide*
