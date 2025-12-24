# Jet Fighter Values Review

**Date:** 2025-01-19  
**Status:** ⚠️ **Issues Found - Speed Values Incorrect**

---

## Jet Fighters Found

### 1. Me-262 Schwalbe (Early Jet Age) ✅

**Location:** `dogfight.html:2011-2032`

| Parameter | Value | Status | Notes |
|-----------|-------|--------|-------|
| **maxSpeed** | 240 m/s | ✅ **CORRECT** | ~870 km/h (Mach 0.71) - Accurate |
| **minSpeed** | 50 m/s | ✅ **CORRECT** | Higher stall speed for jets |
| **maxTurnRate** | 48°/s | ✅ **CORRECT** | Poor turn rate (early jet) |
| **maxClimbRate** | 20 m/s | ✅ **CORRECT** | Good climb rate |
| **maxDiveRate** | 50 m/s | ✅ **CORRECT** | Fast dive capability |
| **maxGForce** | 6G | ✅ **CORRECT** | Reasonable for early jet |
| **maxAcceleration** | 25 m/s² | ✅ **CORRECT** | Good acceleration |
| **fuelConsumption** | 2.5 | ✅ **CORRECT** | High fuel consumption |
| **isJet** | true | ✅ **CORRECT** | Properly flagged |

**Assessment:** ✅ **All values correct** - Me-262 specifications are accurate.

---

### 2. F-4 Phantom II (Vietnam Era) ⚠️

**Location:** `dogfight.html:4106-4151`

| Parameter | Value | Status | Notes |
|-----------|-------|--------|-------|
| **maxSpeed** | 630 m/s | ❌ **INCORRECT** | Should be ~410 m/s (sea level) or ~658 m/s (high altitude) |
| **minSpeed** | 75 m/s | ✅ **CORRECT** | Reasonable stall speed |
| **maxTurnRate** | 85°/s | ⚠️ **QUESTIONABLE** | High for F-4 (should be ~60-70°/s) |
| **maxClimbRate** | 50 m/s | ✅ **CORRECT** | Good climb rate |
| **maxDiveRate** | 100 m/s | ✅ **CORRECT** | Fast dive |
| **maxGForce** | 8.5G | ✅ **CORRECT** | Accurate |
| **maxAcceleration** | 80 m/s² | ⚠️ **HIGH** | Very high acceleration |
| **fuelConsumption** | 4.5 | ✅ **CORRECT** | High fuel consumption |
| **isJet** | true | ✅ **CORRECT** | Properly flagged |

**Speed Analysis:**
- **Current:** 630 m/s = 2,268 km/h = Mach 1.84 (at sea level) ❌ **Too fast**
- **Should be:** ~410 m/s = 1,476 km/h = Mach 1.2 (sea level) OR
- **Should be:** ~658 m/s = 2,370 km/h = Mach 2.23 (high altitude)

**Issue:** Speed value appears to be between sea-level and high-altitude speeds, but is too high for typical game altitudes (1000-4000m).

**Recommendation:** Change to **410 m/s** for sea-level/low-altitude combat, or implement altitude-based speed calculations.

---

### 3. F-4G Wild Weasel (Cold War Era) ⚠️

**Location:** `dogfight.html:4152-4199`

| Parameter | Value | Status | Notes |
|-----------|-------|--------|-------|
| **maxSpeed** | 630 m/s | ❌ **SAME ISSUE** | Same as F-4 (should be ~410 m/s) |
| **minSpeed** | 75 m/s | ✅ **CORRECT** | Same as F-4 |
| **maxTurnRate** | 85°/s | ⚠️ **SAME ISSUE** | Should be ~60-70°/s |
| **maxClimbRate** | 50 m/s | ✅ **CORRECT** | Same as F-4 |
| **maxDiveRate** | 100 m/s | ✅ **CORRECT** | Same as F-4 |
| **maxGForce** | 8.5G | ✅ **CORRECT** | Same as F-4 |
| **fuelConsumption** | 5.0 | ✅ **CORRECT** | Higher than F-4 (ECM equipment) |

**Assessment:** Same speed issue as F-4 Phantom II.

---

### 4. F-15C Eagle (Modern Era) ⚠️

**Location:** `dogfight.html:4200-4243`

| Parameter | Value | Status | Notes |
|-----------|-------|--------|-------|
| **maxSpeed** | 720 m/s | ❌ **INCORRECT** | Should be ~410 m/s (sea level) or ~737 m/s (high altitude) |
| **minSpeed** | 70 m/s | ✅ **CORRECT** | Reasonable stall speed |
| **maxTurnRate** | 100°/s | ⚠️ **VERY HIGH** | Should be ~70-80°/s |
| **maxClimbRate** | 75 m/s | ✅ **CORRECT** | Excellent climb rate |
| **maxDiveRate** | 120 m/s | ✅ **CORRECT** | Very fast dive |
| **maxGForce** | 9G | ✅ **CORRECT** | Accurate |
| **maxAcceleration** | 100 m/s² | ⚠️ **VERY HIGH** | Extremely high acceleration |
| **fuelConsumption** | 5.5 | ✅ **CORRECT** | High fuel consumption |
| **isJet** | true | ✅ **CORRECT** | Properly flagged |

**Speed Analysis:**
- **Current:** 720 m/s = 2,592 km/h = Mach 2.1 (at sea level) ❌ **Too fast**
- **Should be:** ~410 m/s = 1,476 km/h = Mach 1.2 (sea level) OR
- **Should be:** ~737 m/s = 2,655 km/h = Mach 2.5 (high altitude)

**Issue:** Speed value is too high for typical game altitudes.

**Recommendation:** Change to **410 m/s** for sea-level/low-altitude combat.

---

### 5. MiG-21 (Referenced but Not Defined) ❌

**Location:** Scenarios reference `'MiG-21'` but aircraft is **NOT defined** in database.

**Scenarios Using MiG-21:**
- `dogfight.html:23171-23172` - "Rolling Thunder" scenario
- `dogfight.html:23187` - "Linebacker" scenario
- `dogfight.html:23203` - "MIGCAP" scenario

**Impact:** Scenarios will fail to load or aircraft will not render.

**Recommendation:** Add MiG-21 to aircraft database.

---

## Speed Value Comparison

### Current Values vs Historical Data

| Aircraft | Current Speed | Sea Level Speed | High Altitude Speed | Status |
|----------|---------------|-----------------|---------------------|--------|
| **Me-262** | 240 m/s | 240 m/s ✓ | 240 m/s | ✅ Correct |
| **F-4 Phantom** | 630 m/s | 410 m/s | 658 m/s | ❌ Too high |
| **F-4G** | 630 m/s | 410 m/s | 658 m/s | ❌ Too high |
| **F-15C** | 720 m/s | 410 m/s | 737 m/s | ❌ Too high |

**Note:** Game appears to use sea-level/low-altitude speeds (based on Me-262 value), so modern jets should be ~410 m/s, not 630-720 m/s.

---

## Turn Rate Analysis

### Current vs Historical Turn Rates

| Aircraft | Current | Historical | Status |
|----------|---------|------------|--------|
| **Me-262** | 48°/s | ~45-50°/s | ✅ Correct |
| **F-4 Phantom** | 85°/s | ~60-70°/s | ⚠️ High |
| **F-15C** | 100°/s | ~70-80°/s | ⚠️ Very High |

**Issue:** Modern jets have high turn rates that may be unrealistic. However, this could be intentional for gameplay balance.

---

## Recommendations

### 🔴 High Priority Fixes

1. **Fix F-4 Phantom II Speed**
   ```javascript
   maxSpeed: 410,  // Change from 630 to 410 m/s
   ```

2. **Fix F-4G Wild Weasel Speed**
   ```javascript
   maxSpeed: 410,  // Change from 630 to 410 m/s
   ```

3. **Fix F-15C Eagle Speed**
   ```javascript
   maxSpeed: 410,  // Change from 720 to 410 m/s (or 450 for slight advantage)
   ```

4. **Add MiG-21 to Database**
   ```javascript
   'MiG-21': {
       name: 'Mikoyan-Gurevich MiG-21 Fishbed',
       nation: 'Soviet',
       role: 'Interceptor',
       era: 'Vietnam',
       generation: 2,
       firstYear: 1959,
       lastYear: 2013,
       sizeMultiplier: 1.15,
       maxSpeed: 400,  // m/s (~1,440 km/h, Mach 1.17)
       minSpeed: 70,
       maxTurnRate: 75,
       maxClimbRate: 60,
       maxDiveRate: 110,
       maxGForce: 8.5,
       maxAcceleration: 70,
       maxBraking: 35,
       serviceCeiling: 19000,
       weapons: { type: 'cannon', count: 1, ammo: 200, burstSize: 6, damage: [8, 15], rof: 2 },
       fuelCapacity: 6000,
       fuelConsumption: 4.0,
       isJet: true,
       rcs: 8,
       color: '#ff6666'
   }
   ```

### 🟡 Medium Priority Adjustments

5. **Adjust F-4 Turn Rate**
   ```javascript
   maxTurnRate: 65,  // Change from 85 to 65°/s
   ```

6. **Adjust F-15C Turn Rate**
   ```javascript
   maxTurnRate: 75,  // Change from 100 to 75°/s
   ```

7. **Adjust Acceleration Values**
   - F-4: Reduce from 80 to 60 m/s²
   - F-15C: Reduce from 100 to 70 m/s²

### 🟢 Low Priority Enhancements

8. **Implement Altitude-Based Speed**
   - Add altitude modifier to speed calculations
   - High-altitude jets get speed bonus
   - More realistic but more complex

9. **Add More Jet Fighters**
   - F-86 Sabre (Korean War)
   - MiG-15 (Korean War)
   - F-16 Fighting Falcon (Modern)
   - Su-27 Flanker (Modern)

---

## Speed Unit Verification

**Question:** Are speeds in m/s or km/h?

**Evidence:**
- Me-262: 240 m/s = 864 km/h ✓ (correct for Me-262)
- WW2 props: 165-180 m/s = 594-648 km/h ✓ (correct)
- F-4: 630 m/s = 2,268 km/h ❌ (too fast - should be ~410 m/s)

**Conclusion:** Speeds are in **m/s**, but F-4 and F-15C values are incorrect (too high).

---

## Summary

### ✅ Correct Values
- Me-262: All values correct
- Fuel consumption: All correct
- G-force limits: All correct
- Climb rates: All correct

### ❌ Critical Issues
1. **F-4 Phantom II:** Speed too high (630 m/s → should be 410 m/s)
2. **F-4G Wild Weasel:** Speed too high (630 m/s → should be 410 m/s)
3. **F-15C Eagle:** Speed too high (720 m/s → should be 410 m/s)
4. **MiG-21:** Not defined in database (referenced in scenarios)

### ⚠️ Questionable Values
- F-4 turn rate: 85°/s (may be too high)
- F-15C turn rate: 100°/s (very high, may be intentional for gameplay)
- Acceleration values: Very high (may be intentional)

---

**Review Complete**  
*Last Updated: 2025-01-19*

