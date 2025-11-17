// WW1 ZEPPELIN BOMBING RUN MISSION
// Complete mission definition ready to add to the missions array in index.html

{
    id: 11,
    name: "The Sky Pirates",
    type: "bomber_intercept",
    description: "Night raid! A German Zeppelin L-30 is approaching London with a full bomb load. Intercept and destroy it before it reaches the city.",
    objectives: [
        "Destroy the German Zeppelin",
        "Prevent bombs from hitting London",
        "Survive the encounter"
    ],
    playerAircraft: "Sopwith Camel", // WW1 British fighter
    enemyAircraft: [], // No escort fighters - the Zeppelin is alone
    airships: [
        {
            type: 'zeppelin',
            x: -3000,  // Starts 3km away
            y: 0,
            altitude: 850, // High altitude bombing
            heading: 90, // Flying east toward London
            targetX: 3000, // Target is London (3km away)
            targetY: 0,
            targetAltitude: 850
        }
    ],
    groundTargets: 0, // No ground targets in this mission
    weather: "night", // Night mission
    timeOfDay: "night",
    briefing: `
    ===== MISSION BRIEFING: THE SKY PIRATES =====

    Date: October 13, 1917
    Time: 2300 hours (11:00 PM)
    Location: London Defense Zone

    SITUATION:
    A German Zeppelin L-30 has been detected by our coastal spotters, approaching
    London under cover of darkness. The airship is carrying an estimated 20 high-
    explosive bombs and is flying at high altitude (850 meters) to avoid ground-
    based AA fire.

    YOUR AIRCRAFT:
    Sopwith Camel - Armed with twin .303 Vickers machine guns. A portion of your
    ammunition belt consists of incendiary rounds, specifically designed for
    balloon-busting missions. These rounds are EXTREMELY effective against
    hydrogen-filled airships.

    ENEMY FORCES:
    - 1x Zeppelin L-30 (German)
      * 198 meters long - absolutely massive!
      * Cruising speed: ~80 km/h (very slow)
      * 20 bombs onboard
      * Defensive armament: 3× machine gun positions (top, rear, ventral)
      * Filled with highly flammable hydrogen gas

    MISSION OBJECTIVES:
    1. Intercept the Zeppelin before it reaches London (3km away)
    2. Destroy the airship using incendiary ammunition
    3. Do not let it drop its bomb load on the city
    4. Return safely

    TACTICAL NOTES:
    - The Zeppelin is HUGE and easy to hit, but heavily armed
    - Approach from below or the sides to avoid defensive fire
    - Aim for the gas cells along the length of the envelope
    - Incendiary rounds will cause fire - once ignited, the Zeppelin is doomed
    - Fire spreads slowly at first, then catastrophically
    - The airship will attempt to drop bombs when over targets
    - Watch for the defensive gunners - they can damage your aircraft
    - Night conditions reduce visibility but also make you harder to spot

    ATTACK STRATEGY:
    1. Climb to intercept altitude (850m+)
    2. Approach from the side or rear to minimize exposure to defensive fire
    3. Make firing passes along the length of the envelope
    4. Watch for fire to start spreading - once it does, break off and observe
    5. Be ready to dodge falling debris from the explosion

    HISTORICAL CONTEXT:
    Zeppelin raids on London were terrifying but ultimately ineffective. The
    introduction of incendiary ammunition and dedicated fighter patrols made
    these hydrogen-filled giants death traps. By late 1917, most Zeppelin raids
    had been abandoned due to heavy losses.

    When a Zeppelin caught fire, it created a spectacular and horrifying sight -
    visible for miles. The crew had no chance of survival.

    Good hunting, and God save the King!

    ===== END BRIEFING =====
    `
}

// ==============================================================================
// BONUS: Additional WW1 Airship Missions
// ==============================================================================

// Mission 12: Balloon Buster
{
    id: 12,
    name: "Balloon Buster",
    type: "ground_attack",
    description: "Destroy enemy observation balloons directing artillery fire on our trenches.",
    objectives: [
        "Destroy all 3 observation balloons",
        "Survive AA fire",
        "Avoid or destroy enemy fighter patrol"
    ],
    playerAircraft: "Sopwith Camel",
    enemyAircraft: [
        "Fokker Dr.I",  // The Red Baron's triplane
        "Fokker Dr.I"
    ],
    airships: [
        {
            type: 'observation_balloon',
            x: -1000,
            y: -1200,
            altitude: 400,
            heading: 0
        },
        {
            type: 'observation_balloon',
            x: -200,
            y: -1300,
            altitude: 450,
            heading: 0
        },
        {
            type: 'observation_balloon',
            x: 600,
            y: -1100,
            altitude: 420,
            heading: 0
        }
    ],
    groundTargets: 8, // AA guns protecting the balloons
    weather: "clear",
    timeOfDay: "dawn",
    briefing: `
    Enemy observation balloons are directing devastating artillery fire on our
    forward positions. You must destroy all three balloons to blind the enemy
    artillery.

    WARNING: The balloons are heavily defended by:
    - Multiple AA gun positions
    - Fighter patrol (2× Fokker Dr.I triplanes)

    The balloons are tethered and stationary - easy targets if you can get close.
    Use incendiary ammunition for quick kills. The observers will attempt to
    parachute out when their balloon is hit.

    Attack fast and get out - this is a dangerous mission!
    `
}

// Mission 13: Airship Convoy Escort
{
    id: 13,
    name: "The Airship Convoy",
    type: "escort",
    description: "Escort two British R-class airships on a reconnaissance mission through enemy territory.",
    objectives: [
        "Protect both airships until they reach the objective",
        "Destroy all enemy fighters",
        "At least one airship must survive"
    ],
    playerAircraft: "SE5a", // British fighter with better high-altitude performance
    playerWingmen: ["SE5a", "Sopwith Camel"],
    enemyAircraft: [
        "Fokker D.VII",  // Appears at 1 minute
        "Fokker D.VII",
        "Albatros D.Va", // Appears at 2 minutes
        "Albatros D.Va"
    ],
    airships: [
        {
            type: 'r_class',
            x: 0,
            y: 0,
            altitude: 600,
            heading: 90,
            targetX: 3000,
            targetY: 200,
            targetAltitude: 650
        },
        {
            type: 'r_class',
            x: -200,
            y: -150,
            altitude: 580,
            heading: 90,
            targetX: 2800,
            targetY: 50,
            targetAltitude: 630
        }
    ],
    groundTargets: 4, // Some AA positions en route
    weather: "wind",
    timeOfDay: "morning",
    briefing: `
    Two R-33 class airships are conducting photo reconnaissance of enemy positions
    deep behind the lines. Intelligence reports enemy fighters in the area.

    Your mission: Fly escort and protect the airships until they complete their
    reconnaissance run (3km inland). The airships are slow and vulnerable, but
    they have defensive guns.

    Expected enemy fighters: Fokker D.VII and Albatros D.Va
    Threat level: HIGH

    Do NOT let enemy fighters get close enough to use incendiary ammunition on
    our airships. One good burst could spell disaster.

    Stay close to the airships and intercept any threats immediately!
    `
}

// Mission 14: Multi-Zeppelin Night Raid
{
    id: 14,
    name: "Night of Fire",
    type: "bomber_intercept",
    description: "Multiple Zeppelins detected on a coordinated bombing raid. This is going to be intense!",
    objectives: [
        "Destroy at least 2 Zeppelins",
        "Minimize damage to London",
        "Survive the night"
    ],
    playerAircraft: "Sopwith Camel",
    playerWingmen: ["SE5a"], // One wingman to help
    enemyAircraft: [], // Just the Zeppelins
    airships: [
        {
            type: 'zeppelin',
            x: -3500,
            y: -600,
            altitude: 900,
            heading: 90,
            targetX: 2500,
            targetY: -400,
            targetAltitude: 900
        },
        {
            type: 'zeppelin',
            x: -3200,
            y: 0,
            altitude: 850,
            heading: 90,
            targetX: 2800,
            targetY: 0,
            targetAltitude: 850
        },
        {
            type: 'zeppelin',
            x: -3600,
            y: 700,
            altitude: 920,
            heading: 85,
            targetX: 2400,
            targetY: 500,
            targetAltitude: 920
        }
    ],
    groundTargets: 0,
    weather: "storm",
    timeOfDay: "night",
    briefing: `
    ===== CRITICAL ALERT =====

    THREE ZEPPELINS detected approaching London in formation!

    This is the largest raid we've faced. The enemy is throwing everything at us.
    You and your wingman must stop as many as possible before they reach the city.

    Time is critical. Storm conditions will make this difficult.

    PRIORITY TARGETS:
    1. Lead Zeppelin (center) - closest to London
    2. Northern Zeppelin - targeting industrial district
    3. Southern Zeppelin - targeting docks

    Each Zeppelin carries 15-20 bombs. Catastrophic damage is expected if they
    reach their targets.

    Use wingman commands to coordinate attacks. You cannot do this alone.

    This will be remembered as either London's darkest hour or our finest defense.

    GOOD LUCK. ALL OF ENGLAND IS COUNTING ON YOU.

    ===== END TRANSMISSION =====
    `
}

// ==============================================================================
// WW1 AIRCRAFT ADDITIONS FOR AIRSHIP MISSIONS
// ==============================================================================

// If these aircraft don't exist in aircraftDatabase, here are the specs:

const ww1Aircraft = {
    'Sopwith Camel': {
        name: 'Sopwith Camel F.1',
        nation: 'British',
        role: 'Fighter',
        maxSpeed: 55, // m/s (~195 km/h)
        minSpeed: 20,
        maxTurnRate: 85, // Very maneuverable!
        maxClimbRate: 8,
        maxDiveRate: 25,
        maxGForce: 5,
        maxAcceleration: 8,
        maxBraking: 12,
        weapons: {
            type: 'mg',
            name: '2× .303 Vickers',
            count: 2,
            ammo: 1000,
            burstSize: 4,
            damage: [2, 4],
            rof: 1
        },
        fuelCapacity: 150,
        fuelConsumption: 0.3,
        canCarryBombs: true,
        bombCapacity: 2,
        color: '#6B8E23' // Olive drab
    },
    'SE5a': {
        name: 'Royal Aircraft Factory SE5a',
        nation: 'British',
        role: 'Fighter',
        maxSpeed: 60, // m/s (~215 km/h)
        minSpeed: 22,
        maxTurnRate: 75,
        maxClimbRate: 10,
        maxDiveRate: 28,
        maxGForce: 6,
        maxAcceleration: 9,
        maxBraking: 13,
        weapons: {
            type: 'mg',
            name: '1× Vickers + 1× Lewis',
            count: 2,
            ammo: 800,
            burstSize: 4,
            damage: [2, 5],
            rof: 1
        },
        fuelCapacity: 180,
        fuelConsumption: 0.32,
        canCarryBombs: true,
        bombCapacity: 4,
        color: '#4A5D23'
    },
    'Fokker Dr.I': {
        name: 'Fokker Dr.I Triplane',
        nation: 'German',
        role: 'Fighter',
        maxSpeed: 53, // m/s (~190 km/h)
        minSpeed: 18,
        maxTurnRate: 90, // Extremely maneuverable!
        maxClimbRate: 12, // Excellent climb
        maxDiveRate: 22,
        maxGForce: 5.5,
        maxAcceleration: 8,
        maxBraking: 11,
        weapons: {
            type: 'mg',
            name: '2× Spandau MG 08',
            count: 2,
            ammo: 1000,
            burstSize: 4,
            damage: [2, 4],
            rof: 1
        },
        fuelCapacity: 140,
        fuelConsumption: 0.28,
        color: '#8B0000' // Red Baron red
    },
    'Fokker D.VII': {
        name: 'Fokker D.VII',
        nation: 'German',
        role: 'Fighter',
        maxSpeed: 62, // m/s (~220 km/h)
        minSpeed: 20,
        maxTurnRate: 80,
        maxClimbRate: 11,
        maxDiveRate: 30,
        maxGForce: 6,
        maxAcceleration: 10,
        maxBraking: 14,
        weapons: {
            type: 'mg',
            name: '2× Spandau MG 08',
            count: 2,
            ammo: 1000,
            burstSize: 4,
            damage: [2, 5],
            rof: 1
        },
        fuelCapacity: 160,
        fuelConsumption: 0.3,
        color: '#4B4B4B' // Dark grey
    },
    'Albatros D.Va': {
        name: 'Albatros D.Va',
        nation: 'German',
        role: 'Fighter',
        maxSpeed: 58, // m/s (~210 km/h)
        minSpeed: 21,
        maxTurnRate: 70,
        maxClimbRate: 9,
        maxDiveRate: 32, // Good dive performance
        maxGForce: 5.5,
        maxAcceleration: 9,
        maxBraking: 12,
        weapons: {
            type: 'mg',
            name: '2× Spandau MG 08',
            count: 2,
            ammo: 1000,
            burstSize: 4,
            damage: [2, 4],
            rof: 1
        },
        fuelCapacity: 150,
        fuelConsumption: 0.29,
        color: '#8FBC8F' // German green
    }
};

// ==============================================================================
// INCENDIARY AMMUNITION SYSTEM
// ==============================================================================

// Add this to the weapon firing code to implement incendiary rounds:

function fireWeapons(aircraft, target) {
    // ... existing firing code ...

    // 20% of rounds are incendiary (historically accurate for balloon-busting missions)
    const isIncendiary = Math.random() < 0.2;

    if (hitDetected) {
        // Regular target (aircraft, ground target)
        if (target.type !== 'airship') {
            target.takeDamage(damage);
        } else {
            // Airship - check for incendiary
            target.takeDamage(damage, isIncendiary);

            if (isIncendiary && !target.isOnFire) {
                console.log(`INCENDIARY HIT on ${target.name}!`);
                // Visual/audio feedback for incendiary hit
            }
        }
    }
}

// ==============================================================================
// NOTES FOR MISSION DESIGNER
// ==============================================================================

/*
MISSION BALANCING TIPS:

1. Single Zeppelin Mission (Easy-Medium):
   - 1 Zeppelin
   - No escort fighters
   - Start 3km away from target
   - Give player 2-3 minutes to intercept

2. Balloon Buster (Medium):
   - 3 observation balloons
   - 2-3 enemy fighters
   - 6-8 AA guns
   - Balloons are stationary but well-defended

3. Escort Mission (Medium-Hard):
   - 1-2 friendly airships to protect
   - 3-4 enemy fighters (waves)
   - Friendly airship has defensive guns but needs help
   - Mission fails if airship destroyed

4. Multi-Zeppelin Raid (Hard):
   - 2-3 Zeppelins
   - Possibly 1-2 enemy fighters as escort
   - Player has 1 wingman
   - Time pressure - stop them before they reach city

DIFFICULTY FACTORS:
- Airship altitude (higher = takes longer to intercept)
- Number of defensive guns on airship
- Weather conditions (storm/night reduces visibility)
- Enemy fighter escorts
- Number of airships
- Time to intercept

DRAMATIC ELEMENTS:
- Night missions with searchlights
- Storm missions with lightning illuminating the Zeppelin
- Fire spread animation is key to spectacle
- Massive explosion at the end
- Falling debris from destroyed airships
- Observer parachutes from balloons
- Radio chatter about bombs hitting/missing targets

HISTORICAL ACCURACY:
- Zeppelin raids mostly occurred 1915-1917
- Incendiary ammunition was specifically developed for this
- Once ignited, hydrogen airships were doomed
- Crew had no chance of survival
- Raids were mostly ineffective but terrifying
- By 1918, Zeppelins were obsolete for bombing

*/
