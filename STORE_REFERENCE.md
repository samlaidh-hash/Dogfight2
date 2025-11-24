# Quick Reference: Weapon Stores Database

## Summary Statistics

- **Total Stores:** 31
- **Store Types:** 6 (bomb, missile, rocket_pod, fuel_tank, gun_pod, ecm_pod)
- **Eras:** 3 (WW2, Vietnam, Modern)

---

## Bombs (8 total)

### WW2 Era (5)
| ID | Name | Weight | Damage | Radius |
|----|------|--------|--------|--------|
| AN_M30_100 | AN-M30 100lb GP Bomb | 45 kg | 40 | 30m |
| GP_500 | GP 500lb Bomb (British) | 227 kg | 75 | 48m |
| AN_M64_500 | AN-M64 500lb GP Bomb | 227 kg | 80 | 50m |
| SC_250 | SC 250 (German 250kg) | 250 kg | 65 | 45m |
| SC_500 | SC 500 (German 500kg) | 500 kg | 100 | 60m |

### Modern Era (3)
| ID | Name | Weight | Damage | Radius |
|----|------|--------|--------|--------|
| MK82 | Mk.82 500lb Bomb | 241 kg | 95 | 55m |
| MK83 | Mk.83 1000lb Bomb | 447 kg | 130 | 70m |
| MK84 | Mk.84 2000lb Bomb | 894 kg | 180 | 90m |

---

## Missiles (6 total)

### Heat-Seeking (3)
| ID | Name | Weight | Guidance | Damage | Radius |
|----|------|--------|----------|--------|--------|
| R60_APHID | R-60 Aphid (AA-8) | 43 kg | heat-seeking | 50 | 20m |
| AIM9_SIDEWINDER | AIM-9 Sidewinder | 85 kg | heat-seeking | 60 | 25m |
| AIM9L | AIM-9L Sidewinder (All-Aspect) | 85 kg | heat-seeking | 65 | 28m |

### Radar-Guided (2)
| ID | Name | Weight | Guidance | Damage | Radius |
|----|------|--------|----------|--------|--------|
| AIM120_AMRAAM | AIM-120 AMRAAM | 152 kg | radar-guided | 75 | 30m |
| R27_ALAMO | R-27 Alamo (AA-10) | 253 kg | radar-guided | 85 | 35m |

### Other Guidance (1)
| ID | Name | Weight | Guidance | Damage | Radius |
|----|------|--------|----------|--------|--------|
| AIM7_SPARROW | AIM-7 Sparrow | 230 kg | beam-riding | 70 | 28m |

---

## Rocket Pods (6 total)

### WW2 Era (2)
| ID | Name | Weight | Rockets | Per-Rocket Damage |
|----|------|--------|---------|-------------------|
| M8_LAUNCHER | M8 4.5" Launcher (6 Rockets) | 65 kg | 6 | 48 |
| RP3_RAIL | RP-3 Rail (8× 60lb Rockets) | 85 kg | 8 | 55 |

### Vietnam Era (1)
| ID | Name | Weight | Rockets | Per-Rocket Damage |
|----|------|--------|---------|-------------------|
| LAU3_19 | LAU-3/A (19× 2.75" Rockets) | 95 kg | 19 | 40 |

### Modern Era (3)
| ID | Name | Weight | Rockets | Per-Rocket Damage |
|----|------|--------|---------|-------------------|
| HYDRA70_7 | LAU-68 (7× Hydra 70) | 58 kg | 7 | 42 |
| HYDRA70_19 | LAU-61 (19× Hydra 70) | 102 kg | 19 | 42 |
| UB32 | UB-32 (32× S-5 Rockets) | 115 kg | 32 | 35 |

---

## Fuel Tanks (5 total)

### WW2 Era (2)
| ID | Name | Weight | Capacity | Drag |
|----|------|--------|----------|------|
| DROP_150 | 150 Gallon Drop Tank | 455 kg | 568L | 0.16 |
| DROP_300 | 300 Gallon Drop Tank | 910 kg | 1136L | 0.18 |

### Vietnam Era (1)
| ID | Name | Weight | Capacity | Drag |
|----|------|--------|----------|------|
| CENTERLINE_370 | 370 Gallon Centerline Tank | 1122 kg | 1401L | 0.17 |

### Modern Era (2)
| ID | Name | Weight | Capacity | Drag |
|----|------|--------|----------|------|
| DROP_1000L | 1000 Liter Drop Tank | 800 kg | 1000L | 0.19 |
| DROP_600 | 600 Gallon Drop Tank | 1820 kg | 2271L | 0.20 |

**Note:** All fuel tanks are jettisionable. Weight decreases as fuel is consumed.

---

## Gun Pods (3 total)

### Vietnam Era (1)
| ID | Name | Weight | Caliber | Rounds | RoF | Duration |
|----|------|--------|---------|--------|-----|----------|
| SUU23_A | SUU-23/A 20mm Gun Pod | 286 kg | 20mm | 1200 | 100/sec | 12.0s |

### Modern Era (2)
| ID | Name | Weight | Caliber | Rounds | RoF | Duration |
|----|------|--------|---------|--------|-----|----------|
| ADEN_POD | ADEN 30mm Gun Pod | 320 kg | 30mm | 150 | 22/sec | 6.8s |
| GPU5_A | GPU-5/A 30mm GAU-8 Pod | 860 kg | 30mm | 353 | 70/sec | 5.0s |

---

## ECM Pods (3 total - all Modern Era)

| ID | Name | Weight | Effectiveness | Drag |
|----|------|--------|---------------|------|
| ALQ184 | ALQ-184 ECM Pod | 160 kg | 70% | 0.14 |
| SPS141 | SPS-141 ECM Pod (Soviet) | 170 kg | 60% | 0.16 |
| ALQ131 | ALQ-131 ECM Pod | 195 kg | 65% | 0.15 |

**Note:** ECM pods are not expendable and provide continuous jamming.

---

## Weight Extremes

### Lightest by Type
- **Bomb:** AN-M30 100lb (45 kg)
- **Missile:** R-60 Aphid (43 kg)
- **Rocket Pod:** LAU-68 (58 kg)
- **Fuel Tank:** Drop 150 (455 kg)
- **Gun Pod:** SUU-23/A (286 kg)
- **ECM Pod:** ALQ-184 (160 kg)

### Heaviest by Type
- **Bomb:** Mk.84 2000lb (894 kg)
- **Missile:** R-27 Alamo (253 kg)
- **Rocket Pod:** UB-32 (115 kg)
- **Fuel Tank:** Drop 600 (1820 kg) **← Heaviest store overall**
- **Gun Pod:** GPU-5/A (860 kg)
- **ECM Pod:** ALQ-131 (195 kg)

---

## Drag Comparison

### Lowest Drag (Most Aerodynamic)
1. AIM-120 AMRAAM: 0.06
2. AIM-9L Sidewinder: 0.07
3. R-27 Alamo: 0.07

### Highest Drag (Least Aerodynamic)
1. RP-3 Rail: 0.35
2. M8 Launcher: 0.32
3. UB-32: 0.28

---

## Performance Impact Examples

### Light Fighter Loadout (2× AIM-9)
- Total Weight: 170 kg
- Acceleration: 96.7%
- Turn Rate: 98.3%
- Top Speed: 97.6%
- **Impact:** Minimal performance loss

### Heavy Strike Loadout (2× Mk.84, 600gal tank, 2× rocket pods)
- Total Weight: 4068 kg
- Acceleration: 55.1%
- Turn Rate: 74.3%
- Climb Rate: 46.0%
- Top Speed: 85.6%
- **Impact:** Severe performance penalty

### Balanced Ground Attack (4× Mk.82, 2× Hydra, 300gal tank)
- Total Weight: 2213 kg
- Acceleration: 69.3%
- Turn Rate: 83.3%
- Climb Rate: 57.8%
- Top Speed: 82.9%
- **Impact:** Moderate performance loss

---

## Quick Selection Guide

### For Air Superiority
- **Best:** AIM-9L, AIM-120 AMRAAM
- **Low drag:** Minimal speed loss
- **Light weight:** Good maneuverability

### For Ground Attack (Precision)
- **Best:** Mk.82 bombs, Hydra rockets
- **Moderate weight:** Acceptable performance
- **Good damage:** Effective against most targets

### For Ground Attack (Heavy)
- **Best:** Mk.84 bombs, multiple rocket pods
- **Heavy weight:** Poor dogfight capability
- **Maximum damage:** Best for hardened targets

### For Extended Range
- **Best:** 300-600 gallon drop tanks
- **Jettisionable:** Drop when empty or threatened
- **Trade-off:** Weight/drag for range

### For Defense
- **Best:** ECM pods (ALQ-184)
- **Minimal impact:** Low weight/drag
- **Continuous benefit:** Always active

---

## Color Coding (Visual Reference)

- **Bombs:** Dark gray (#3d3d3d - #4a4a4a)
- **Missiles:** Light gray/silver (#c0c0c0 - #e8e8e8)
- **Rocket Pods:** Medium gray/olive (#555555 - #4a4a3a)
- **Fuel Tanks:** Metal gray (#656565 - #707070)
- **Gun Pods:** Dark gray/black (#3a3a3a - #454545)
- **ECM Pods:** Medium gray (#555555 - #606060)

---

## Usage Notes

1. **Store IDs** - Use with `createStore(id)` function
2. **Weight** - Includes full fuel/ammo load
3. **Drag** - Higher values = more speed penalty
4. **Damage** - Base damage before distance falloff
5. **Radius** - Explosion/blast radius in meters
6. **All tanks jettisionable** - Drop when needed
7. **ECM pods** - Not expendable, continuous effect
8. **Gun/Rocket pods** - Track remaining ammunition

---

*For complete documentation, see WEAPON_STORES.md*
