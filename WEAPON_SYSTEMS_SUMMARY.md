# Renegade Legion Capital Ship Weapon Systems

## Mount Types

### 1. **Chasers** (Fore/Aft)
- **Arc**: ±45° lateral, ±45° pitch from centerline
- **Fire Modes**: Offensive (all guns simultaneously) or Defensive (sequential fire)
- **Positions**:
  - Forward Chasers: front of ship
  - Aft Chasers: rear of ship
- **Guns Per Bank**: 10

### 2. **Broadsides** (Port/Starboard)
- **Arc**: ±45° from beam (90° total)
- **Fire Modes**: Offensive (25 guns simultaneously) or Defensive (1 gun at a time sequentially)
- **Positions**: 3 banks per side (Fore, Mid, Aft)
- **Guns Per Bank**: 25
- **Note**: Each side has 75 total guns (3 banks × 25 guns)

### 3. **Spinal Mount**
- **Arc**: ±30° from centerline (tight forward arc)
- **Fire Mode**: Offensive only
- **Guns Per Mount**: 1 (single massive weapon)
- **Special**: Often has shield penetration capability

### 4. **Turret**
- **Arc**: 360° yaw, ±60° pitch
- **Guns Per Turret**: 2
- **Usage**: Point defense or all-aspect coverage

### 5. **Missile Arrays**
- **Type**: Launch cells
- **Fire Rate**: 1 missile per cell per second
- **Standard Loadout**: 8 cells (8 missiles/second total)
- **Power**: Always active (doesn't use power management)

---

## Weapon Types

### 1. **LASER**
- **Damage**:
  - Chasers: 30 per gun
  - Broadsides: 40 per gun
  - Spinal: 80
- **Range**: 50,000m (50km)
- **Special**: Standard energy weapon, no penetration
- **Color**: Green (chasers/spinal) or Red (broadsides)

### 2. **PARTICLE BEAM**
- **Damage**:
  - Banks (chaser replacement): 40 per gun
  - Turret: 60
  - Spinal: 85
- **Range**: 50,000m (50km)
- **Special**: 25% critical hit chance (1.8x damage multiplier)
- **Color**: Purple/Violet
- **Note**: Higher damage and crit chance, but no shield penetration

### 3. **MASS DRIVER**
- **Damage**:
  - Banks (broadside replacement): 38 per gun
  - Turret: 55
  - Spinal: 80
- **Range**: 100,000m (100km) - DOUBLE laser range
- **Accuracy**:
  - Base: 90-95%
  - Optimal Range: 0-25km (full accuracy)
  - Dropoff: 60-65% reduction beyond 25km
- **Special**: Penetrates flicker shields (20% damage through, 80% absorbed)
- **Color**: Orange/Yellow
- **Note**: Kinetic weapon, trades reliability for range and penetration

---

## Fire Modes

### **Offensive Mode**
- All guns in bank fire simultaneously
- Creates massive alpha strike
- Example: Broadside bank fires all 25 guns at once → 25 laser beams
- Full cooldown before next salvo (2.0-3.0 seconds)

### **Defensive Mode**
- Guns fire sequentially, one at a time
- Continuous stream of fire
- Example: Broadside in defensive mode fires 1 gun every 0.2s
- Prioritizes missiles > fighters > ships
- After all guns fire once, full cycle cooldown applies

---

## Typical Ship Loadouts

### **Destroyer (DD)**
- Chasers (fore/aft): 10 guns each = 20 total
- Missile Arrays: 8 cells

### **Light Cruiser (CL)**
- Chasers (fore/aft): 10 guns each = 20 total
- 1-2 Turrets: 2 guns each
- Missile Arrays: 8 cells

### **Heavy Cruiser (CA)**
- Chasers (fore/aft): 10 guns each = 20 total
- Broadsides (port): 3 banks × 25 guns = 75 guns
- Broadsides (starboard): 3 banks × 25 guns = 75 guns
- **Total Broadside**: 150 guns
- Missile Arrays: 8 cells

### **Battlecruiser (BC)**
- Chasers (fore/aft): 10 guns each = 20 total
- Broadsides (port/starboard): 150 guns total
- Spinal Mount: 1 gun
- Missile Arrays: 8 cells

### **Battleship (BB)**
- Chasers (fore/aft): 10 guns each = 20 total
- Broadsides (port/starboard): 150 guns total
- Spinal Mount: 1 gun (usually mass driver)
- Turrets: 2-4 turrets
- Missile Arrays: 8 cells

### **Carrier (CV)**
- Chasers (fore/aft): 10 guns each = 20 total
- Point Defense Turrets: 4-8 turrets (defensive mode only)
- Missile Arrays: 8 cells
- **Primary Weapon**: Fighters (50-200 craft)

---

## Power Management Integration

Weapons consume power points from the power management system:
- **Level 1**: Chasers only
- **Level 2**: Chasers + (Broadside OR Spinal)
- **Level 3**: Chasers + Broadside + Spinal (everything)
- **Level 0**: Overload shields or engines, minimal weapons

Missiles always fire regardless of power allocation.
