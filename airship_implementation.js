// Airship class - Lighter-than-air units (Zeppelins, blimps, observation balloons)
// This code should be inserted after the GroundTarget class in index.html

class Airship {
    constructor(x, y, altitude, type = 'zeppelin', heading = 0) {
        this.x = x;
        this.y = y;
        this.altitude = altitude;
        this.type = type; // 'zeppelin', 'blimp', 'observation_balloon', 'r_class'
        this.heading = heading;

        // Load airship specifications from database
        const specs = airshipDatabase[type] || airshipDatabase['blimp'];
        this.name = specs.name;
        this.nation = specs.nation;
        this.role = specs.role;

        // Movement characteristics - very slow!
        this.speed = specs.speed;
        this.maxSpeed = specs.maxSpeed;
        this.minSpeed = specs.minSpeed;
        this.maxTurnRate = specs.maxTurnRate; // Very slow turn rate
        this.maxClimbRate = specs.maxClimbRate;

        // Physical characteristics - huge!
        this.length = specs.length; // 100-200m long!
        this.width = specs.width;
        this.height = specs.height;
        this.volume = specs.volume; // m³ of lifting gas
        this.liftCapacity = specs.liftCapacity; // kg

        // Gas cell system - multiple cells for progressive damage
        this.gasCells = specs.gasCells.map(cell => ({
            capacity: cell.capacity,
            currentGas: cell.capacity,
            damaged: false,
            leakRate: 0,
            position: cell.position // Position along airship (0=nose, 1=tail)
        }));
        this.totalGas = this.gasCells.reduce((sum, cell) => sum + cell.currentGas, 0);
        this.maxGas = this.totalGas;

        // Extremely high fire vulnerability!
        this.fireVulnerability = specs.fireVulnerability; // Multiplier for incendiary damage
        this.isOnFire = false;
        this.fireIntensity = 0; // 0-1, how much of the airship is burning
        this.fireSpreadRate = specs.fireSpreadRate;
        this.fireDamagePerSecond = 20;
        this.timeUntilExplosion = 0; // Countdown to catastrophic explosion
        this.hasExploded = false;

        // Health and damage
        this.health = 100;
        this.maxHealth = 100;
        this.structuralDamage = 0; // Damage to frame
        this.isDestroyed = false;

        // Payload
        this.canCarryBombs = specs.canCarryBombs || false;
        this.bombs = this.canCarryBombs ? (specs.bombCapacity || 0) : 0;
        this.maxBombs = this.bombs;
        this.bombCooldown = 0;
        this.payload = specs.payload || 0; // kg

        // Defensive armament
        this.hasDefensiveGuns = specs.hasDefensiveGuns || false;
        this.defensiveGuns = specs.defensiveGuns || [];
        this.gunCooldowns = this.defensiveGuns.map(() => 0);

        // Tethered mechanics (for observation balloons)
        this.isTethered = specs.isTethered || false;
        this.tetherX = x;
        this.tetherY = y;
        this.tetherLength = specs.tetherLength || 500; // meters
        this.tetherStrength = 100; // Can be damaged
        this.providesSpotting = specs.providesSpotting || false;
        this.spottingRange = specs.spottingRange || 2000; // meters

        // AI behavior
        this.targetX = x;
        this.targetY = y;
        this.targetAltitude = altitude;
        this.hasOrders = false;
        this.isPlayerControlled = false;

        // Visual effects
        this.smokeParticles = [];
        this.fireParticles = [];
        this.explosionParticles = [];

        // Color for rendering
        this.color = specs.color || '#cccccc';
    }

    update(dt) {
        if (this.isDestroyed || this.hasExploded) {
            // Update explosion particles even after explosion
            this.explosionParticles = this.explosionParticles.filter(p => {
                p.life -= dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 20 * dt; // Gravity
                return p.life > 0;
            });
            return;
        }

        // Fire damage and spread
        if (this.isOnFire) {
            // Fire spreads over time
            this.fireIntensity += this.fireSpreadRate * dt;
            this.fireIntensity = Math.min(1.0, this.fireIntensity);

            // Fire causes continuous damage
            const fireDamage = this.fireDamagePerSecond * this.fireIntensity * dt;
            this.health -= fireDamage;
            this.structuralDamage += fireDamage;

            // Fire burns gas cells, causing lift loss
            for (let cell of this.gasCells) {
                if (Math.random() < this.fireIntensity * 0.1 * dt) {
                    cell.leakRate += 10; // Fire dramatically increases leak rate
                    cell.damaged = true;
                }
            }

            // Countdown to explosion once fire is intense
            if (this.fireIntensity > 0.7) {
                this.timeUntilExplosion += dt;
                if (this.timeUntilExplosion > 3.0) { // 3 seconds before catastrophic explosion
                    this.explode();
                    return;
                }
            }

            // Generate fire particles
            if (Math.random() < this.fireIntensity * 5 * dt) {
                this.fireParticles.push({
                    x: this.x + (Math.random() - 0.5) * this.length,
                    y: this.y + (Math.random() - 0.5) * this.width,
                    life: 1.0,
                    size: 10 + Math.random() * 20
                });
            }
        }

        // Update fire particles
        this.fireParticles = this.fireParticles.filter(p => {
            p.life -= dt * 2;
            p.y -= 20 * dt; // Rise up
            return p.life > 0;
        });

        // Gas cell leakage (progressive altitude loss)
        let totalLift = 0;
        for (let cell of this.gasCells) {
            if (cell.damaged && cell.leakRate > 0) {
                cell.currentGas -= cell.leakRate * dt;
                cell.currentGas = Math.max(0, cell.currentGas);

                // Leak slows down as gas escapes
                cell.leakRate *= 0.99;
            }
            totalLift += cell.currentGas;
        }

        this.totalGas = totalLift;

        // Loss of lift causes descent
        const liftRatio = this.totalGas / this.maxGas;
        if (liftRatio < 0.9) {
            // Start descending when lift is compromised
            const descentRate = (1 - liftRatio) * 5; // m/s descent
            this.altitude -= descentRate * dt;
            this.altitude = Math.max(0, this.altitude);
        }

        // Crash if altitude reaches zero
        if (this.altitude <= 0 && !this.isDestroyed) {
            this.isDestroyed = true;
            console.log(`${this.name} crashed into the ground!`);
        }

        // Check for destruction
        if (this.health <= 0) {
            if (this.isOnFire) {
                this.explode();
            } else {
                this.isDestroyed = true;
            }
        }

        // Movement (unless tethered)
        if (!this.isTethered && !this.isDestroyed) {
            // Very slow movement toward target
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 10) {
                const moveX = (dx / dist) * this.speed * dt;
                const moveY = (dy / dist) * this.speed * dt;
                this.x += moveX;
                this.y += moveY;

                // Update heading
                this.heading = Math.atan2(dx, -dy) * 180 / Math.PI;
            }

            // Altitude adjustment (very slow)
            const altDiff = this.targetAltitude - this.altitude;
            if (Math.abs(altDiff) > 5) {
                this.altitude += Math.sign(altDiff) * this.maxClimbRate * dt;
            }
        } else if (this.isTethered) {
            // Tethered - slight drift in wind but constrained
            const driftX = (Math.random() - 0.5) * 2 * dt;
            const driftY = (Math.random() - 0.5) * 2 * dt;
            this.x += driftX;
            this.y += driftY;

            // Keep within tether length
            const dx = this.x - this.tetherX;
            const dy = this.y - this.tetherY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > this.tetherLength) {
                this.x = this.tetherX + (dx / dist) * this.tetherLength;
                this.y = this.tetherY + (dy / dist) * this.tetherLength;
            }
        }

        // Update bomb cooldown
        if (this.bombCooldown > 0) {
            this.bombCooldown -= dt;
        }

        // Update defensive gun cooldowns
        for (let i = 0; i < this.gunCooldowns.length; i++) {
            if (this.gunCooldowns[i] > 0) {
                this.gunCooldowns[i] -= dt;
            }
        }

        // Generate smoke if damaged
        if (this.health < 70 && Math.random() < 0.1 * dt) {
            this.smokeParticles.push({
                x: this.x + (Math.random() - 0.5) * this.length * 0.5,
                y: this.y + (Math.random() - 0.5) * this.width,
                life: 1.0,
                size: 15 + Math.random() * 15
            });
        }

        // Update smoke particles
        this.smokeParticles = this.smokeParticles.filter(p => {
            p.life -= dt * 0.5;
            p.y -= 10 * dt; // Drift up
            p.size += 10 * dt; // Expand
            return p.life > 0;
        });
    }

    takeDamage(amount, isIncendiary = false) {
        if (this.isDestroyed || this.hasExploded) return false;

        // Incendiary ammunition is devastating to airships!
        if (isIncendiary) {
            amount *= this.fireVulnerability; // 3x damage for incendiary

            // High chance to start fire
            if (Math.random() < 0.3 || this.isOnFire) {
                this.isOnFire = true;
                this.fireIntensity = Math.max(this.fireIntensity, 0.2);
            }
        }

        this.health -= amount;

        // Random gas cell damage
        if (Math.random() < 0.3) {
            const cellIndex = Math.floor(Math.random() * this.gasCells.length);
            const cell = this.gasCells[cellIndex];
            cell.damaged = true;
            cell.leakRate += amount * 0.5;
        }

        if (this.health <= 0) {
            if (this.isOnFire || isIncendiary) {
                this.explode();
            } else {
                this.isDestroyed = true;
            }
            return true;
        }
        return false;
    }

    explode() {
        if (this.hasExploded) return;

        this.hasExploded = true;
        this.isDestroyed = true;
        console.log(`CATASTROPHIC EXPLOSION: ${this.name} exploded!`);

        // Create massive explosion effect
        for (let i = 0; i < 50; i++) {
            this.explosionParticles.push({
                x: this.x + (Math.random() - 0.5) * this.length,
                y: this.y + (Math.random() - 0.5) * this.width,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 1.0,
                size: 20 + Math.random() * 40
            });
        }

        // TODO: Damage nearby aircraft/ground targets from blast
    }

    dropBomb() {
        if (!this.canCarryBombs || this.bombs <= 0 || this.bombCooldown > 0) {
            return null;
        }

        this.bombs--;
        this.bombCooldown = 2.0; // 2 second cooldown

        // Create bomb at airship position
        return new Bomb(this.x, this.y, this.altitude, this.speed, this.heading);
    }

    fireDefensiveGuns(targetAircraft) {
        if (!this.hasDefensiveGuns || this.isDestroyed) return [];

        const shots = [];

        for (let i = 0; i < this.defensiveGuns.length; i++) {
            if (this.gunCooldowns[i] > 0) continue;

            const gun = this.defensiveGuns[i];

            // Find target in range
            for (let target of targetAircraft) {
                if (target.isDestroyed) continue;

                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const dz = target.altitude - this.altitude;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < gun.range) {
                    // Fire at target
                    this.gunCooldowns[i] = gun.rateOfFire;

                    // Check if hit
                    const hitChance = gun.accuracy * Math.max(0.1, 1 - dist / gun.range);
                    if (Math.random() < hitChance) {
                        shots.push({
                            target: target,
                            damage: gun.damage,
                            hit: true
                        });
                    } else {
                        shots.push({
                            target: target,
                            damage: 0,
                            hit: false
                        });
                    }
                    break;
                }
            }
        }

        return shots;
    }

    render(ctx, cameraX, cameraY) {
        if (this.hasExploded && this.explosionParticles.length === 0) return;

        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        // Render explosion particles
        for (let p of this.explosionParticles) {
            const px = p.x - cameraX;
            const py = p.y - cameraY;
            const alpha = p.life;

            ctx.fillStyle = `rgba(255, ${150 * p.life}, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, p.size * (1 - p.life * 0.5), 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.hasExploded) return;

        // Render tether (for observation balloons)
        if (this.isTethered) {
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(this.tetherX - cameraX, this.tetherY - cameraY);
            ctx.stroke();
        }

        // Render airship body
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.heading * Math.PI / 180);

        // Scale based on altitude (perspective)
        const scale = 1 + (this.altitude / 1000);

        if (this.isDestroyed) {
            // Destroyed - falling wreckage
            ctx.fillStyle = 'rgba(60, 60, 60, 0.6)';
            ctx.fillRect(-this.length * 0.3 * scale, -this.width * 0.3 * scale,
                        this.length * 0.6 * scale, this.width * 0.6 * scale);
        } else {
            // Main envelope (cigar shape for zeppelins, rounder for balloons)
            const gradient = ctx.createLinearGradient(-this.length * 0.5 * scale, 0,
                                                     this.length * 0.5 * scale, 0);
            gradient.addColorStop(0, 'rgba(120, 120, 120, 0.3)');
            gradient.addColorStop(0.5, this.color);
            gradient.addColorStop(1, 'rgba(80, 80, 80, 0.3)');

            if (this.type === 'observation_balloon') {
                // Balloon shape (circular)
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.ellipse(0, 0, this.width * 0.5 * scale, this.height * 0.5 * scale, 0, 0, Math.PI * 2);
                ctx.fill();

                // Gondola
                ctx.fillStyle = '#885533';
                ctx.fillRect(-10 * scale, this.height * 0.4 * scale, 20 * scale, 15 * scale);
            } else {
                // Cigar shape (elongated ellipse)
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.ellipse(0, 0, this.length * 0.5 * scale, this.width * 0.5 * scale, 0, 0, Math.PI * 2);
                ctx.fill();

                // Gondola
                ctx.fillStyle = '#666666';
                ctx.fillRect(-this.length * 0.2 * scale, this.width * 0.4 * scale,
                            this.length * 0.4 * scale, this.width * 0.3 * scale);

                // Tail fins
                ctx.fillStyle = '#555555';
                ctx.beginPath();
                ctx.moveTo(this.length * 0.5 * scale, 0);
                ctx.lineTo(this.length * 0.6 * scale, -this.width * 0.3 * scale);
                ctx.lineTo(this.length * 0.5 * scale, -this.width * 0.2 * scale);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(this.length * 0.5 * scale, 0);
                ctx.lineTo(this.length * 0.6 * scale, this.width * 0.3 * scale);
                ctx.lineTo(this.length * 0.5 * scale, this.width * 0.2 * scale);
                ctx.closePath();
                ctx.fill();
            }

            // Fire overlay
            if (this.isOnFire) {
                ctx.fillStyle = `rgba(255, 100, 0, ${this.fireIntensity * 0.6})`;
                ctx.beginPath();
                if (this.type === 'observation_balloon') {
                    ctx.ellipse(0, 0, this.width * 0.5 * scale, this.height * 0.5 * scale, 0, 0, Math.PI * 2);
                } else {
                    ctx.ellipse(0, 0, this.length * 0.5 * scale, this.width * 0.5 * scale, 0, 0, Math.PI * 2);
                }
                ctx.fill();
            }
        }

        ctx.restore();

        // Render fire particles
        for (let p of this.fireParticles) {
            const px = p.x - cameraX;
            const py = p.y - cameraY;
            ctx.fillStyle = `rgba(255, ${100 + 155 * p.life}, 0, ${p.life})`;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Render smoke particles
        for (let p of this.smokeParticles) {
            const px = p.x - cameraX;
            const py = p.y - cameraY;
            ctx.fillStyle = `rgba(40, 40, 40, ${p.life * 0.5})`;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Health bar
        if (this.health < 100 && !this.isDestroyed) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.fillRect(screenX - 40, screenY - 60, 80 * (this.health / 100), 6);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.strokeRect(screenX - 40, screenY - 60, 80, 6);
        }

        // Name label
        if (!this.isDestroyed) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, screenX, screenY - 70);

            // Fire warning
            if (this.isOnFire) {
                ctx.fillStyle = 'rgba(255, 50, 0, 0.9)';
                ctx.font = 'bold 14px Arial';
                ctx.fillText('ON FIRE!', screenX, screenY - 85);
            }
        }
    }
}

// Airship database with specifications
const airshipDatabase = {
    'zeppelin': {
        name: 'Zeppelin L-30 (German)',
        nation: 'German',
        role: 'Bomber',
        speed: 22, // m/s (~80 km/h)
        maxSpeed: 25,
        minSpeed: 10,
        maxTurnRate: 5, // Very slow turn
        maxClimbRate: 2,
        length: 198, // meters
        width: 24,
        height: 30,
        volume: 55200, // m³
        liftCapacity: 40000, // kg
        gasCells: [
            { capacity: 9200, position: 0.1 },
            { capacity: 9200, position: 0.25 },
            { capacity: 9200, position: 0.4 },
            { capacity: 9200, position: 0.5 },
            { capacity: 9200, position: 0.6 },
            { capacity: 9200, position: 0.75 }
        ],
        fireVulnerability: 3.0, // 3x damage from incendiary
        fireSpreadRate: 0.15,
        canCarryBombs: true,
        bombCapacity: 20,
        payload: 10000, // kg
        hasDefensiveGuns: true,
        defensiveGuns: [
            { position: 'top', range: 400, damage: 5, accuracy: 0.15, rateOfFire: 1.5 },
            { position: 'rear', range: 400, damage: 5, accuracy: 0.15, rateOfFire: 1.5 },
            { position: 'ventral', range: 400, damage: 5, accuracy: 0.15, rateOfFire: 1.5 }
        ],
        color: '#aaaaaa'
    },
    'r_class': {
        name: 'R.33 Class (British)',
        nation: 'British',
        role: 'Patrol/Reconnaissance',
        speed: 20, // m/s
        maxSpeed: 24,
        minSpeed: 10,
        maxTurnRate: 6,
        maxClimbRate: 2.5,
        length: 195, // meters
        width: 24,
        height: 28,
        volume: 52000, // m³
        liftCapacity: 35000, // kg
        gasCells: [
            { capacity: 8667, position: 0.1 },
            { capacity: 8667, position: 0.3 },
            { capacity: 8667, position: 0.5 },
            { capacity: 8667, position: 0.7 },
            { capacity: 8667, position: 0.8 },
            { capacity: 8667, position: 0.9 }
        ],
        fireVulnerability: 3.0,
        fireSpreadRate: 0.15,
        canCarryBombs: true,
        bombCapacity: 12,
        payload: 8000, // kg
        hasDefensiveGuns: true,
        defensiveGuns: [
            { position: 'top', range: 400, damage: 5, accuracy: 0.15, rateOfFire: 1.5 },
            { position: 'rear', range: 400, damage: 5, accuracy: 0.15, rateOfFire: 1.5 }
        ],
        color: '#9999aa'
    },
    'blimp': {
        name: 'Coastal Patrol Blimp',
        nation: 'Allied',
        role: 'Anti-Submarine Patrol',
        speed: 15, // m/s
        maxSpeed: 18,
        minSpeed: 8,
        maxTurnRate: 8,
        maxClimbRate: 1.5,
        length: 60, // meters
        width: 15,
        height: 18,
        volume: 8500, // m³
        liftCapacity: 5000, // kg
        gasCells: [
            { capacity: 2833, position: 0.2 },
            { capacity: 2833, position: 0.5 },
            { capacity: 2834, position: 0.8 }
        ],
        fireVulnerability: 3.0,
        fireSpreadRate: 0.2,
        canCarryBombs: true,
        bombCapacity: 4,
        payload: 1000, // kg
        hasDefensiveGuns: true,
        defensiveGuns: [
            { position: 'rear', range: 350, damage: 4, accuracy: 0.12, rateOfFire: 1.8 }
        ],
        color: '#888899'
    },
    'observation_balloon': {
        name: 'Observation Balloon',
        nation: 'Allied',
        role: 'Artillery Spotting',
        speed: 0, // Stationary (tethered)
        maxSpeed: 0,
        minSpeed: 0,
        maxTurnRate: 0,
        maxClimbRate: 0,
        length: 20, // meters (diameter)
        width: 20,
        height: 25,
        volume: 1000, // m³
        liftCapacity: 500, // kg
        gasCells: [
            { capacity: 1000, position: 0.5 }
        ],
        fireVulnerability: 4.0, // Even more vulnerable!
        fireSpreadRate: 0.3,
        canCarryBombs: false,
        bombCapacity: 0,
        payload: 200, // kg (observer + equipment)
        hasDefensiveGuns: false,
        defensiveGuns: [],
        isTethered: true,
        tetherLength: 500, // meters
        providesSpotting: true,
        spottingRange: 2000,
        color: '#ddddcc'
    }
};
