// AIRSHIP INTEGRATION GUIDE FOR DOGFIGHT 2
// This file shows how to integrate airships into the game

// ==============================================================================
// STEP 1: ADD AIRSHIP ARRAY (Add near where groundTargets array is declared, around line 3312)
// ==============================================================================

let airships = []; // Active airships in the mission

// ==============================================================================
// STEP 2: ADD AIRSHIP INITIALIZATION IN MISSION START
// ==============================================================================

// In the startMission() function or wherever missions initialize their units,
// add airship spawning based on mission requirements:

function startMissionWithAirships(mission) {
    // ... existing mission start code ...

    // Clear airships
    airships = [];

    // Spawn airships if mission has them
    if (mission.airships) {
        for (let airshipDef of mission.airships) {
            const airship = new Airship(
                airshipDef.x,
                airshipDef.y,
                airshipDef.altitude,
                airshipDef.type,
                airshipDef.heading || 0
            );

            // Set target for moving airships
            if (airshipDef.targetX && airshipDef.targetY) {
                airship.targetX = airshipDef.targetX;
                airship.targetY = airshipDef.targetY;
                airship.targetAltitude = airshipDef.targetAltitude || airshipDef.altitude;
            }

            airships.push(airship);
        }
    }
}

// ==============================================================================
// STEP 3: UPDATE AIRSHIPS IN GAME LOOP
// ==============================================================================

// In the main gameLoop() function, around where other entities are updated:

function gameLoop() {
    // ... existing game loop code ...

    if (gameState === 'EXECUTION') {
        const dt = 1 / 60; // 60 FPS

        // Update airships
        for (let airship of airships) {
            airship.update(dt);

            // Airship AI - drop bombs on targets if zeppelin/bomber
            if (airship.canCarryBombs && !airship.isDestroyed && airship.bombs > 0) {
                // Simple AI: drop bombs when over ground targets
                for (let target of groundTargets) {
                    if (target.isDestroyed) continue;

                    const dx = target.x - airship.x;
                    const dy = target.y - airship.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Drop bomb if roughly over target
                    if (dist < 100 && Math.random() < 0.01) {
                        const bomb = airship.dropBomb();
                        if (bomb) {
                            bombs.push(bomb);
                            console.log(`${airship.name} dropped a bomb!`);
                        }
                    }
                }
            }

            // Defensive guns fire at player and enemy aircraft
            if (airship.hasDefensiveGuns && !airship.isDestroyed) {
                // Build list of hostile aircraft
                const hostileAircraft = [];
                if (airship.nation === 'German') {
                    // German airships shoot at Allied planes
                    if (spitfire && !spitfire.isDestroyed) hostileAircraft.push(spitfire);
                    // Add wingmen if they exist
                } else {
                    // Allied airships shoot at Axis planes
                    // Add enemy aircraft to hostileAircraft array
                }

                const shots = airship.fireDefensiveGuns(hostileAircraft);
                for (let shot of shots) {
                    if (shot.hit) {
                        applyComponentDamage(shot.target, shot.damage);
                        console.log(`${airship.name} defensive gun hit ${shot.target.name}!`);
                    }
                }
            }
        }

        // Remove destroyed airships that have finished exploding
        airships = airships.filter(a => !a.hasExploded || a.explosionParticles.length > 0);
    }

    // ... rest of game loop ...
}

// ==============================================================================
// STEP 4: RENDER AIRSHIPS
// ==============================================================================

// In the rendering section of gameLoop(), add airship rendering:

function renderGame() {
    // ... existing rendering code ...

    // Calculate camera position
    const cameraX = spitfire.x - canvas.width / 2;
    const cameraY = spitfire.y - canvas.height / 2;

    // Render ground targets
    for (let target of groundTargets) {
        target.render();
    }

    // Render airships
    for (let airship of airships) {
        airship.render(ctx, cameraX, cameraY);
    }

    // Render aircraft
    // ... existing aircraft rendering ...
}

// ==============================================================================
// STEP 5: HANDLE PLAYER ATTACKS ON AIRSHIPS
// ==============================================================================

// In the code that handles player firing (bullet hit detection), add airship checks:

function handlePlayerFiring() {
    // ... existing code for firing at aircraft ...

    // Check hits on airships
    for (let airship of airships) {
        if (airship.isDestroyed || airship.hasExploded) continue;

        // Calculate if player is aiming at airship
        const dx = airship.x - spitfire.x;
        const dy = airship.y - spitfire.y;
        const dz = airship.altitude - spitfire.altitude;
        const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Check if in range
        if (dist3D < spitfire.weaponRange) {
            // Calculate angle to airship
            const angleToAirship = Math.atan2(dx, -dy) * 180 / Math.PI;
            let angleDiff = Math.abs(angleToAirship - spitfire.heading);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;

            // Airships are HUGE - easier to hit! 10 degree cone instead of 5
            if (angleDiff < 10) {
                // Hit! Determine if incendiary ammunition
                const isIncendiary = (Math.random() < 0.2); // 20% of rounds are incendiary
                const damage = 5 + Math.random() * 5;

                airship.takeDamage(damage, isIncendiary);

                if (isIncendiary) {
                    console.log(`INCENDIARY HIT on ${airship.name}! Damage: ${damage * airship.fireVulnerability}`);
                } else {
                    console.log(`Hit ${airship.name}! Damage: ${damage}`);
                }
            }
        }
    }
}

// ==============================================================================
// STEP 6: ADD BOMBS/ROCKETS HITTING AIRSHIPS
// ==============================================================================

// In bomb/rocket update code, check for hits on airships:

function updateBombs(dt) {
    for (let bomb of bombs) {
        bomb.update(dt);

        // Check if bomb hits an airship (in flight!)
        for (let airship of airships) {
            if (airship.isDestroyed || airship.hasExploded) continue;

            const dx = airship.x - bomb.x;
            const dy = airship.y - bomb.y;
            const dz = airship.altitude - bomb.altitude;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Airships are huge - can be hit by bombs
            if (dist < airship.length / 2) {
                bomb.isActive = false;
                airship.takeDamage(50, true); // Bombs cause fire!
                console.log(`Bomb hit ${airship.name}!`);
            }
        }
    }
}

// ==============================================================================
// STEP 7: MISSION OBJECTIVES
// ==============================================================================

// Add airship-related mission objectives:

function checkMissionObjectives() {
    // ... existing objective checks ...

    // Check if all enemy airships destroyed
    if (currentMission.objectives.includes('Destroy enemy airships')) {
        const enemyAirshipsRemaining = airships.filter(a =>
            !a.isDestroyed && a.nation === 'German'
        ).length;

        if (enemyAirshipsRemaining === 0) {
            console.log('All enemy airships destroyed!');
            // Complete objective
        }
    }

    // Check if observation balloons protected
    if (currentMission.objectives.includes('Protect observation balloons')) {
        const balloons = airships.filter(a => a.type === 'observation_balloon');
        const balloonsAlive = balloons.filter(a => !a.isDestroyed).length;

        if (balloonsAlive === 0) {
            console.log('Mission failed: All observation balloons destroyed!');
            // Fail mission
        }
    }
}

// ==============================================================================
// STEP 8: ADD UI ELEMENTS FOR AIRSHIPS
// ==============================================================================

// Add airship status to HUD/tactical display:

function renderAirshipStatus() {
    // In HUD rendering:
    let yPos = 100;
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';

    for (let airship of airships) {
        if (airship.isDestroyed) continue;

        const statusText = `${airship.name}: ${airship.health.toFixed(0)}% HP`;
        const fireText = airship.isOnFire ? ' [ON FIRE!]' : '';
        const bombText = airship.canCarryBombs ? ` Bombs: ${airship.bombs}/${airship.maxBombs}` : '';

        ctx.fillText(statusText + fireText + bombText, 10, yPos);
        yPos += 20;
    }
}

// ==============================================================================
// STEP 9: KEY BINDINGS FOR TARGETING AIRSHIPS
// ==============================================================================

// Add key to cycle through airship targets:

// In keydown handler, add:
case 'T': // Cycle through airship targets
    if (airships.length > 0) {
        const aliveAirships = airships.filter(a => !a.isDestroyed);
        if (aliveAirships.length > 0) {
            currentAirshipTarget = (currentAirshipTarget + 1) % aliveAirships.length;
            console.log(`Targeting: ${aliveAirships[currentAirshipTarget].name}`);
        }
    }
    break;

// ==============================================================================
// EXAMPLE MISSIONS WITH AIRSHIPS
// ==============================================================================

const airshipMissions = [
    {
        id: 11,
        name: "Zeppelin Raid",
        type: "bomber_intercept",
        description: "German Zeppelin approaching London. Intercept and destroy before it reaches the city!",
        objectives: ["Destroy the Zeppelin", "Prevent bombing of city"],
        playerAircraft: "Sopwith Camel", // WW1 aircraft
        enemyAircraft: [], // No escort
        airships: [
            {
                type: 'zeppelin',
                x: -2000,
                y: 0,
                altitude: 800,
                heading: 90,
                targetX: 2000,
                targetY: 0,
                targetAltitude: 800
            }
        ],
        weather: "night",
        timeOfDay: "night",
        briefing: "A German Zeppelin L-30 is approaching London under cover of darkness. It's carrying 20 bombs and must be stopped! Use incendiary ammunition for maximum effect. Watch out for defensive gunners!"
    },
    {
        id: 12,
        name: "Balloon Buster",
        type: "ground_attack",
        description: "Destroy enemy observation balloons providing artillery spotting.",
        objectives: ["Destroy 3 observation balloons", "Avoid AA fire"],
        playerAircraft: "Sopwith Camel",
        enemyAircraft: ["Fokker Dr.I", "Fokker Dr.I"], // Protecting the balloons
        airships: [
            {
                type: 'observation_balloon',
                x: -500,
                y: -800,
                altitude: 400,
                heading: 0
            },
            {
                type: 'observation_balloon',
                x: 0,
                y: -800,
                altitude: 400,
                heading: 0
            },
            {
                type: 'observation_balloon',
                x: 500,
                y: -800,
                altitude: 400,
                heading: 0
            }
        ],
        groundTargets: 6, // AA guns protecting the balloons
        weather: "clear",
        timeOfDay: "dawn",
        briefing: "Enemy observation balloons are directing artillery fire on our positions. Destroy all three balloons. They're tethered and easy targets, but well-defended by AA guns and fighter patrols. Be quick!"
    },
    {
        id: 13,
        name: "Airship Duel",
        type: "escort",
        description: "Protect our R-33 airship from enemy fighters while it conducts reconnaissance.",
        objectives: ["Protect the R-33", "Destroy enemy fighters"],
        playerAircraft: "SE5a",
        enemyAircraft: ["Fokker Dr.I", "Fokker D.VII", "Fokker D.VII"],
        airships: [
            {
                type: 'r_class',
                x: 0,
                y: 0,
                altitude: 600,
                heading: 90,
                targetX: 1500,
                targetY: 0,
                targetAltitude: 600
            }
        ],
        weather: "clear",
        timeOfDay: "morning",
        briefing: "Our R-33 class airship is conducting photo reconnaissance of enemy positions. Three enemy fighters have been spotted approaching. The airship has defensive guns but needs fighter protection. Don't let them use incendiary ammunition!"
    },
    {
        id: 14,
        name: "The Hindenburg's Ancestor",
        type: "bomber_intercept",
        description: "Two German Zeppelins on a bombing raid. Stop them both!",
        objectives: ["Destroy both Zeppelins", "Survive"],
        playerAircraft: "Sopwith Camel",
        playerWingmen: ["SE5a"],
        enemyAircraft: [], // Just the zeppelins
        airships: [
            {
                type: 'zeppelin',
                x: -1500,
                y: -500,
                altitude: 900,
                heading: 90,
                targetX: 2000,
                targetY: -500,
                targetAltitude: 900
            },
            {
                type: 'zeppelin',
                x: -1500,
                y: 500,
                altitude: 850,
                heading: 90,
                targetX: 2000,
                targetY: 500,
                targetAltitude: 850
            }
        ],
        weather: "storm",
        timeOfDay: "evening",
        briefing: "Two Zeppelins detected! They're approaching in formation for a major bombing raid. You and your wingman must stop them both. Storm conditions will make it difficult. Aim for the gas cells with incendiary rounds. One good burst can ignite the entire airship!"
    }
];

// ==============================================================================
// NOTES FOR INTEGRATION
// ==============================================================================

/*
IMPORTANT INTEGRATION POINTS:

1. The airship implementation file should be inserted into index.html after the GroundTarget class (around line 2531)

2. Initialize the airships array near line 3312 where other game arrays are declared

3. Add airship updates in the gameLoop() function during EXECUTION state

4. Add airship rendering in the render section

5. Integrate airship hit detection in weapon firing code

6. Add missions to the missions array (starting around line 765)

7. Consider adding WW1-era aircraft to the aircraftDatabase if not already present:
   - Sopwith Camel
   - SE5a
   - Fokker Dr.I (triplane)
   - Fokker D.VII
   - Albatros D.Va
   - SPAD XIII

8. Add incendiary ammunition mechanic if not already present - some weapon types should
   have a chance to use incendiary rounds (especially useful against airships)

9. Consider adding targeting UI to show current airship target and its status

10. Add sound effects:
    - Airship explosion (deep, dramatic)
    - Fire crackling
    - Defensive gun fire from airships

GAME BALANCE NOTES:

- Airships are HUGE and slow - easy to hit
- Incendiary ammunition is 3-4x more effective against airships
- Fire can spread and cause catastrophic explosion
- Gas cell damage causes gradual descent
- Defensive guns are weak but can harass attackers
- Observation balloons are stationary - sitting ducks but heavily defended
- Zeppelins at high altitude (800-1000m) are harder to reach
- Successful hits on gas cells create dramatic visual feedback
*/
