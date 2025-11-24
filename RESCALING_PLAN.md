# Aircraft Image Rescaling Plan

## Current State Analysis

### Current Scale
- **Aircraft Image Size**: `baseSize = 15` pixels (with `sizeMultiplier` 0.88-1.11)
- **Canvas Size**: 1800 × 1000 pixels
- **Scale Factor**: ~1 pixel ≈ 1 meter (implied from comments)
- **Weapon Ranges**: 400-800 meters (typical)
- **Aircraft Dimensions**: Real-world fighters are ~9-12m long, ~10-12m wingspan

### Problem
PNG aircraft images are being rendered at only 15 pixels, making them very small and losing detail. Original images are likely 200-400+ pixels wide.

---

## Proposed Solution

### Option A: Increase Image Size Only (Simplest)
**Scale Factor**: 3-4x increase
- **New baseSize**: 45-60 pixels (3-4x current)
- **Pros**: Minimal changes, images look better
- **Cons**: Aircraft will appear larger relative to terrain/ranges (may look odd)

### Option B: Proportional Rescaling (Recommended)
**Scale Factor**: 3x overall scale increase
- **New baseSize**: 45 pixels (3x current)
- **Scale Factor**: 1 pixel ≈ 0.33 meters (3x more detail)
- **Pros**: Maintains proportions, everything scales together
- **Cons**: More work, need to update many systems

---

## Recommended Approach: Option B (3x Scale)

### 1. Aircraft Image Rendering
**File**: `dogfight.html` line ~14703
```javascript
// OLD:
const baseSize = 15;

// NEW:
const baseSize = 45; // 3x increase
```

**Impact**: Aircraft images will be 3x larger (45px base instead of 15px)

---

### 2. Canvas & World Scale
**File**: `dogfight.html` line ~1432-1433

**Option 2A: Keep Canvas Same, Change Scale Factor**
- Keep `CANVAS_WIDTH = 1800`, `CANVAS_HEIGHT = 1000`
- Add scale constant: `const WORLD_SCALE = 3.0; // 1 pixel = 0.33 meters`
- Multiply all distances by `WORLD_SCALE` for display
- Divide all distances by `WORLD_SCALE` for calculations

**Option 2B: Scale Canvas Proportionally**
- New `CANVAS_WIDTH = 5400` (3x)
- New `CANVAS_HEIGHT = 3000` (3x)
- Update HTML canvas element size
- May need viewport/zoom adjustments

**Recommendation**: Option 2A (keep canvas, use scale factor)

---

### 3. Weapon Ranges
**Files**: Multiple locations in aircraft database

**Current Ranges**:
- Machine Guns: 400m
- Heavy Machine Guns: 600m  
- Cannons: 800m
- Rockets: 1500m
- Missiles: 2000m+

**New Ranges** (multiply by 3):
- Machine Guns: 1200m (400 × 3)
- Heavy Machine Guns: 1800m (600 × 3)
- Cannons: 2400m (800 × 3)
- Rockets: 4500m (1500 × 3)
- Missiles: 6000m+ (2000 × 3)

**Implementation**: Add `WORLD_SCALE` multiplier to all range values

---

### 4. Terrain & Ground Features
**File**: `dogfight.html` - Terrain class

**Current**:
- Mountain height: 1000m
- Ground target sizes: 20-60m radius
- Terrain features scale with meters

**New** (multiply by 3):
- Mountain height: 3000m (displayed)
- Ground target sizes: 60-180m radius (displayed)
- All terrain distances × 3

**Implementation**: Apply `WORLD_SCALE` to all terrain rendering

---

### 5. Aircraft Movement & Distances
**File**: `dogfight.html` - Aircraft class

**Current**:
- Aircraft positions in meters (x, y)
- Speed in m/s
- Distances calculated in meters

**New**:
- Keep internal calculations in meters (unchanged)
- Apply `WORLD_SCALE` only for rendering/display
- Movement speeds stay same (time-based, not distance-based)

**Implementation**: 
- Add `WORLD_SCALE` constant
- Multiply display positions by `WORLD_SCALE`
- Keep calculation logic unchanged

---

### 6. Explosion Radii
**Files**: Bomb, Rocket, Missile classes

**Current**:
- Bombs: 50m radius
- Rockets: 20m radius
- Missiles: 20-35m radius

**New** (multiply by 3):
- Bombs: 150m radius (displayed)
- Rockets: 60m radius (displayed)
- Missiles: 60-105m radius (displayed)

**Implementation**: Apply `WORLD_SCALE` to explosion rendering

---

### 7. Ground Targets
**File**: `dogfight.html` - GroundTarget class

**Current**:
- Truck: 20m radius
- AA Gun: 30m radius
- Fuel Depot: 60m radius

**New** (multiply by 3):
- Truck: 60m radius (displayed)
- AA Gun: 90m radius (displayed)
- Fuel Depot: 180m radius (displayed)

**Implementation**: Apply `WORLD_SCALE` to ground target rendering

---

### 8. Camera & Zoom System
**File**: `dogfight.html` - Camera/rendering code

**Current**: Camera follows aircraft, zoom levels may exist

**New**: 
- If zoom system exists, may need adjustment
- Camera bounds may need scaling
- Minimap scale may need adjustment

**Implementation**: Review camera code, apply `WORLD_SCALE` where needed

---

### 9. UI Elements (Ranges, Distances)
**Files**: UI display code

**Current**: Displays distances in meters

**New**: 
- Keep displaying in meters (unchanged)
- Only visual scale changes, not displayed values

**Implementation**: No changes needed (display values stay same)

---

## Implementation Steps

### Phase 1: Setup Scale Constant
1. Add `WORLD_SCALE = 3.0` constant near top of script
2. Document that 1 pixel = 0.33 meters (3x detail)

### Phase 2: Aircraft Images
1. Change `baseSize` from 15 to 45
2. Test image rendering quality

### Phase 3: Weapon Ranges
1. Find all `range:` properties in aircraft database
2. Multiply by `WORLD_SCALE` (or use in calculations)
3. Update weapon range checks in combat code

### Phase 4: Terrain & Ground
1. Apply `WORLD_SCALE` to terrain rendering
2. Apply `WORLD_SCALE` to ground target rendering
3. Apply `WORLD_SCALE` to mountain heights

### Phase 5: Explosions & Effects
1. Apply `WORLD_SCALE` to explosion radii rendering
2. Apply `WORLD_SCALE` to particle effects
3. Apply `WORLD_SCALE` to smoke/fire effects

### Phase 6: Camera & Viewport
1. Review camera system
2. Apply `WORLD_SCALE` to camera bounds if needed
3. Test zoom functionality

### Phase 7: Testing & Refinement
1. Test all weapon ranges
2. Test ground attack
3. Test terrain visibility
4. Test aircraft movement
5. Adjust scale if needed (2.5x or 4x instead of 3x)

---

## Alternative: Gradual Approach

If full rescaling is too complex, consider:

1. **Step 1**: Just increase aircraft image size to 30-40px (2-2.5x)
   - Minimal code changes
   - Better image quality
   - Slight scale mismatch (acceptable)

2. **Step 2**: If needed, scale weapon ranges proportionally
   - Update range values
   - Keep everything else same

3. **Step 3**: Full rescaling (if Step 1-2 not sufficient)

---

## Code Locations to Modify

### High Priority
1. **Line ~14703**: `baseSize = 15` → `baseSize = 45`
2. **Line ~1432-1433**: Add `WORLD_SCALE` constant
3. **Aircraft database**: All `range:` properties (multiply by 3 or use scale)
4. **Combat code**: Range checks (apply scale)

### Medium Priority
5. **Terrain class**: Rendering scale
6. **GroundTarget class**: Size rendering
7. **Bomb/Rocket classes**: Explosion radius rendering

### Low Priority
8. **Camera system**: Bounds and zoom
9. **Particle effects**: Scale
10. **UI elements**: Any distance-based sizing

---

## Testing Checklist

- [ ] Aircraft images render at proper size
- [ ] Weapon ranges work correctly
- [ ] Ground targets visible and properly sized
- [ ] Terrain features scale correctly
- [ ] Explosions scale correctly
- [ ] Aircraft movement feels natural
- [ ] Camera follows correctly
- [ ] Zoom works (if applicable)
- [ ] Combat ranges feel balanced
- [ ] Ground attack ranges work
- [ ] UI displays correct distances

---

## Notes

- **Keep calculations in meters**: Internal game logic should stay in real-world meters
- **Only scale rendering**: Apply `WORLD_SCALE` only to visual rendering, not calculations
- **Test incrementally**: Make changes in phases and test each phase
- **Consider performance**: Larger images may impact performance (test on slower devices)
- **Backup first**: Save current working version before making changes

