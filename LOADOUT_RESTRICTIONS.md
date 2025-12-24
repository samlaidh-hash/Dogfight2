# Loadout Restrictions System

**Date:** 2025-01-19  
**Status:** ✅ **IMPLEMENTED**

---

## Overview

The loadout system now includes **multiple mechanisms** to limit which equipment can be mounted on aircraft hardpoints.

---

## ✅ Implemented Restrictions

### 1. **Hardpoint Compatibility** ✅

**How it works:**
- Each store has a `compatibleHardpoints` array
- Stores can only mount on matching hardpoint types
- Enforced in UI (stores grayed out if incompatible)
- Enforced on mount attempt (alert if incompatible)

**Example:**
```javascript
aim9_sidewinder: {
    compatibleHardpoints: ['wing_tip', 'wing_inner', 'wing_outer', 'fuselage']
    // Can mount on wing tips, inner/outer wing pylons, or fuselage
}

bomb_1000lb: {
    compatibleHardpoints: ['centerline', 'fuselage']
    // Can only mount on centerline or fuselage (too heavy for wings)
}
```

**Hardpoint Types:**
- `wing_tip` - Wing tip pylons (light stores only)
- `wing_outer` - Outer wing pylons
- `wing_inner` - Inner wing pylons (heavier stores)
- `fuselage` - Fuselage-mounted pylons
- `centerline` - Centerline pylon (heaviest stores)

---

### 2. **Era Filtering** ✅ **NEWLY IMPLEMENTED**

**How it works:**
- Stores have an `era` field (`'WW1'`, `'WW2'`, `'Vietnam'`, `'Modern'`)
- Aircraft have an `era` field in `aircraftDatabase`
- Stores are filtered by era compatibility when building inventory
- Incompatible stores are grayed out and cannot be mounted

**Era Progression:**
```
WW1 → WW2 → Vietnam → Modern
```

**Rules:**
- Aircraft can use stores from **same era or earlier eras**
- Aircraft **cannot** use stores from **future eras**
- Example: WW2 aircraft can use WW2 stores, but NOT Modern stores
- Example: Modern aircraft can use WW2, Vietnam, or Modern stores

**Implementation:**
- `buildStoreInventory()` filters stores by era before display
- `createStoreItem()` marks incompatible stores visually
- `mountStore()` validates era compatibility before mounting

**Example:**
```javascript
// WW2 Aircraft (Spitfire)
- ✅ Can use: WW2 bombs, WW2 rockets, WW2 fuel tanks
- ❌ Cannot use: Modern missiles, ECM pods, modern bombs

// Modern Aircraft (F-15C)
- ✅ Can use: All eras (WW2, Vietnam, Modern)
- ✅ Can use: Modern missiles, ECM pods, modern bombs
```

---

### 3. **Visual Indicators** ✅

**Incompatible Stores:**
- Grayed out (opacity: 0.4)
- Cursor changes to "not-allowed"
- Tooltip shows reason: "Incompatible: Modern era store cannot be used on WW2 era aircraft"
- Cannot be clicked/mounted

**Compatible Stores:**
- Normal appearance
- Highlighted on hover
- Can be clicked to mount

**Era Badge:**
- Stores from different eras show "Era: [era name]" badge
- Color: Orange (#f39c12)
- Only shown if compatible but from different era

---

## ⚠️ Not Yet Implemented (Potential Future Enhancements)

### 4. **Aircraft-Specific Restrictions**

**Could be added:**
- Per-aircraft allowlists/denylists
- Example: "F-4G can only mount SEAD weapons"
- Example: "MiG-21 cannot mount ECM pods"

**Implementation would require:**
```javascript
// In aircraftDatabase
'F-4G': {
    // ... existing fields ...
    allowedStores: ['aim9_sidewinder', 'agm45_shrike', 'ecm_pod'],
    // OR
    restrictedStores: ['bomb_1000lb'] // Cannot mount heavy bombs
}
```

---

### 5. **Weight Restrictions**

**Currently:**
- Hardpoints have `maxWeight` in `initializeHardpoints()`
- But not enforced in UI or mount logic

**Could be added:**
- Check store weight against hardpoint `maxWeight`
- Prevent mounting if store exceeds capacity
- Show weight warnings

---

### 6. **Mission-Specific Restrictions**

**Could be added:**
- Mission type determines available stores
- Example: "Air Superiority" mission → only air-to-air missiles
- Example: "Ground Attack" mission → bombs and rockets only

---

## Current Restriction Summary

| Restriction Type | Status | Enforced Where |
|-----------------|--------|----------------|
| **Hardpoint Compatibility** | ✅ Implemented | UI + Mount Logic |
| **Era Filtering** | ✅ Implemented | UI + Mount Logic |
| **Visual Indicators** | ✅ Implemented | UI Display |
| **Aircraft-Specific** | ❌ Not Implemented | - |
| **Weight Limits** | ⚠️ Defined but not enforced | Hardpoint definitions exist |
| **Mission Restrictions** | ❌ Not Implemented | - |

---

## Code Locations

### Era Filtering Implementation

**File:** `dogfight.html`

**Functions:**
- `buildStoreInventory()` (line ~3141) - Filters stores by era
- `createStoreItem()` (line ~3202) - Marks incompatible stores visually
- `mountStore()` (line ~3280) - Validates era before mounting

**Store Era Fields:**
- All stores now have `era` field
- Original 11 stores: Added era fields
- Extended 20 stores: Already had era fields

**Aircraft Era:**
- Retrieved from `aircraftDatabase[aircraftType].era`
- Used to filter available stores

---

## Usage Examples

### WW2 Aircraft (Spitfire)
```
Available Stores:
✅ WW2 bombs (AN-M64, GP 500lb, SC 500, etc.)
✅ WW2 rockets (RP-3 Rail, M8 Launcher)
✅ WW2 fuel tanks (150gal, 300gal)
❌ Modern missiles (AIM-9, AIM-120) - Grayed out
❌ ECM pods - Grayed out
❌ Modern bombs (Mk.82, Mk.84) - Grayed out
```

### Modern Aircraft (F-15C)
```
Available Stores:
✅ All WW2 stores (historical compatibility)
✅ All Vietnam stores
✅ All Modern stores
✅ Modern missiles (AIM-9, AIM-120, AMRAAM)
✅ ECM pods (ALQ-131, ALQ-184)
✅ Modern bombs (Mk.82, Mk.83, Mk.84)
```

---

## Testing Checklist

- [x] Era filtering works in `buildStoreInventory()`
- [x] Incompatible stores are grayed out
- [x] Era validation in `mountStore()`
- [x] Alert messages show correct era mismatch
- [x] Compatible stores from different eras show era badge
- [x] Hardpoint compatibility still works
- [x] All stores have era fields

---

## Summary

**Current State:**
- ✅ **Hardpoint compatibility** - Fully enforced
- ✅ **Era filtering** - Fully implemented and enforced
- ✅ **Visual feedback** - Incompatible stores clearly marked
- ⚠️ **Weight limits** - Defined but not enforced
- ❌ **Aircraft-specific** - Not implemented
- ❌ **Mission restrictions** - Not implemented

**Result:**
Players can now only mount historically appropriate stores on aircraft. WW2 aircraft cannot use modern missiles, and modern aircraft can use older stores for historical missions.

---

**Implementation Complete**  
*Last Updated: 2025-01-19*

