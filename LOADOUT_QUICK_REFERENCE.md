# Loadout System - Quick Reference

## Files Created

| File | Purpose |
|------|---------|
| `loadout-ui-system.html` | CSS & HTML markup |
| `loadout-system.js` | JavaScript implementation |
| `LOADOUT_SYSTEM_INTEGRATION_GUIDE.md` | Step-by-step integration |
| `LOADOUT_SYSTEM_SUMMARY.md` | Complete system documentation |
| `LOADOUT_QUICK_REFERENCE.md` | This quick reference |

## Quick Integration Steps

1. **Add CSS** - Copy CSS from `loadout-ui-system.html` to `dogfight.html` before `</style>` (line 439)
2. **Add HTML** - Copy HTML from `loadout-ui-system.html` to `dogfight.html` inside `gameContainer` (after line 659)
3. **Add JavaScript** - Copy all of `loadout-system.js` to `dogfight.html` `<script>` section (after line 1060)
4. **Hook into Mission Flow** - Call `showLoadoutPanel(aircraftType)` before mission start
5. **Add Keyboard Handler** - Add 'Z' key handler for `cycleWeapon()`
6. **Update Game Loop** - Call `updateHUDLoadout()` during gameplay

## Key Functions

```javascript
// Show loadout screen
showLoadoutPanel(aircraftType)

// Apply a preset
applyPreset('air_to_air' | 'ground_attack' | 'long_range' | 'sead' | 'clean')

// Confirm loadout and start mission
confirmLoadout()

// In-game weapon cycling
cycleWeapon()  // Z key

// Fire current weapon
fireCurrentWeapon()  // N, K, or M keys

// Update HUD display
updateHUDLoadout()  // Call in game loop
```

## Weapon Stores Available

### Air-to-Air (2)
- AIM-9 Sidewinder - Short-range IR missile
- AIM-7 Sparrow - Medium-range radar missile

### Air-to-Ground (5)
- 250lb GP Bomb
- 500lb GP Bomb
- 1000lb GP Bomb
- Hydra 70 Rocket Pod (19x rockets)
- Zuni Rocket Pod (4x heavy rockets)

### SEAD (1)
- AGM-45 Shrike - Anti-radar missile

### Fuel (2)
- 150gal Fuel Tank
- 300gal Fuel Tank

### Guns (1)
- 20mm Gun Pod

## Aircraft Hardpoints

| Aircraft | Hardpoints | Notes |
|----------|------------|-------|
| Spitfire | 5 | 2 outer, 2 inner wing, 1 centerline |
| Me-109 | 3 | 2 wing, 1 centerline |
| P-51 | 6 | 2 wing tips, 2 outer, 2 inner |
| P-47 | 7 | Most versatile loadout |
| Hurricane | 2 | 2 wing only |
| P-40 | 3 | 2 wing, 1 centerline |
| Fw-190 | 4 | 2 outer, 2 inner wing |
| Me-262 | 6 | 2 outer, 2 inner wing, 2 fuselage |
| Zero | 3 | 2 wing, 1 centerline |

## Keyboard Controls

| Key | Function |
|-----|----------|
| **Z** | Cycle through weapons |
| **N** | Drop/fire selected bomb |
| **K** | Fire selected rocket |
| **M** | Fire selected missile |

## Quick Presets

1. **Air-to-Air** - All missiles for dogfighting
2. **Ground Attack** - Bombs + rockets for ground strike
3. **Long Range** - Fuel tanks for extended missions
4. **SEAD** - Anti-radar missiles for air defense suppression
5. **Clean** - No stores for maximum performance

## Performance Impact Guide

| Loadout Weight | Performance | Color |
|----------------|-------------|-------|
| 0-500kg | Minimal (90-100%) | Green |
| 500-1000kg | Moderate (70-89%) | Yellow |
| 1000-2000kg | Heavy (50-69%) | Orange |
| 2000kg+ | Severe (<50%) | Red |

## Troubleshooting

**Loadout panel doesn't show:**
- Check CSS added before `</style>`
- Verify HTML added inside `gameContainer`
- Ensure `showLoadoutPanel()` is called

**Hardpoints not clickable:**
- Verify JavaScript loaded without errors
- Check browser console for error messages

**Weapons don't cycle:**
- Verify 'Z' key handler added to keyboard event listener
- Check that `spitfire.mountedWeapons` exists

**Performance bars don't update:**
- Ensure `updatePerformanceDisplay()` is called after mounting stores
- Verify bar elements exist in HTML

## Data Structure Quick Reference

### Current Loadout State
```javascript
currentLoadout = {
    aircraft: "Spitfire",
    hardpoints: {
        "wing_left_outer": "aim9_sidewinder",
        "wing_right_outer": "aim9_sidewinder"
    },
    selectedHardpoint: "wing_left_outer",
    symmetricLoading: true
}
```

### Weapon Store Example
```javascript
{
    id: 'aim9_sidewinder',
    name: 'AIM-9 Sidewinder',
    type: 'missile_aa',
    icon: '🚀',
    weight: 85,
    drag: 0.15,
    count: 1,
    damage: 50,
    range: 3000,
    compatibleHardpoints: ['wing_tip', 'wing_outer', 'wing_inner']
}
```

### Hardpoint Example
```javascript
{
    id: 'wing_left_outer',
    position: { left: '22%', top: '45%' },
    type: 'wing_outer',
    mirror: 'wing_right_outer'
}
```

## Integration with Other Systems

### Hardpoint Class
When available, replace `AIRCRAFT_HARDPOINTS` with Hardpoint instances.

### WeaponStore Class
When available, replace `WEAPON_STORES` with WeaponStore instances.

### PerformanceCalculator
When available, replace `updatePerformanceDisplay()` calculation with:
```javascript
const perfImpact = PerformanceCalculator.calculateLoadoutImpact(currentLoadout, aircraftType);
```

## File Locations (Absolute Paths)

- `/home/user/Dogfight2/loadout-ui-system.html`
- `/home/user/Dogfight2/loadout-system.js`
- `/home/user/Dogfight2/LOADOUT_SYSTEM_INTEGRATION_GUIDE.md`
- `/home/user/Dogfight2/LOADOUT_SYSTEM_SUMMARY.md`
- `/home/user/Dogfight2/LOADOUT_QUICK_REFERENCE.md`

## Need More Info?

- **Integration:** See `LOADOUT_SYSTEM_INTEGRATION_GUIDE.md`
- **Full Docs:** See `LOADOUT_SYSTEM_SUMMARY.md`
- **Code:** See `loadout-ui-system.html` and `loadout-system.js`

---

**Version:** 1.0.0 | **Status:** ✅ Complete
