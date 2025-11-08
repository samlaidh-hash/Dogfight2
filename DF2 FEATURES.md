Dogfight

The battle space is mountainous so Aircraft can fly low and use the mountains for cover or fly higher.

Each aircraft is represented by a top-down SVG. The SVG's size depends on its current altitude, the higher the plane is the larger it is (based on the idea that the viewer is looking down on the planes).

The game alternates between Order phases and Execution phases. During the Order phase players left click on their own Aircraft to issue movement orders, then left click again to lock the orders in.
When you left click a ghost copy of the aircraft is created at the point where the aircraft will be at the end of the next execution phase if you do nothing else with it apart from left click again.
Moving the mouse moves the ghost to where you want the Aircraft to end its next turn. The mousewheel rotates the Aircraft and the WS keys increase the ghosts altitude or decrease it respectively.

When you move the ghost to a Stressful position it turns Yellow, if you move it to an illegal position it turns red.
Whilst the ghost is red LMB has no effect (i.e. it doesn't lock in the maneuver).

Whilst in maneuver mode a small panel appears next to the Ghost showing the airspeed at that desired location at the end of the next Order phase and the maximum G force the aircraft will suffer moving to that position.

Each Aircraft has a set of performance values: maximum turning rate, maximum speed, minimum speed, maximum climb rate and maximum dive rate and maximum G force, maximum acceleration and maximum braking. If the forecast speed is >max air speed the aircraft will take damage, if predicted air speed is >20% higher than max air speed the ghost turns red and the maneuver cannot be locked in. If the forecast speed is <min air speed the aircraft will stall and lose control and the ghost turns yellow. If the predicted climb rate is >maximum climb rate the Ghost turns red. If the predicted dive rate is >maximum dive rate the ghost turns yellow and takes damage, >maximum dive rate +20% and it turns red. The model should allows slips and skids, but turn the ghost yellow and indicate a warning that such is happening.

If a ghost position will result in a collision with terrain a "Pull Up" warning flashes.

Left clicking on an aircraft with movement orders locked in unlocks it and allows new orders to be issued.
Once all player controlled aircraft have orders issued the option to Execute appears. LMB on execute and all aircraft are simultaneously moved to their new positions over a period of 4 seconds, firing weapons etc.. as they go.
The game then offers the chance to replay the phase or start the next Order phase.

The basic game uses a player controlled Spitfire vs. an Me-109 starting on parallel tracks 500m apart.
Aircraft will automatically fire guns, expending ammunition, when they have a chance of hitting their opponent. The player can adjust the acceptable chance by using the AD keys (A reduces it, D increases it) when in maneuver mode. This is mainly used to preserve ammo.
Accuracy improves with time the target is in the attackers firing arc "drawing a bead", but then returns to normal once they leave the firing arc.
Pilots have pilot skill and gunnery skill. Gunnery skill is used to determine if they can hit an enemy with guns (they will lead their shots). Pilot skill modifies an Aircrafts performance ratings. If skill is <50% they are worse, if >50% better.

PLACEHOLDERS
Radar Gunsights
Radar
Infrared Search and Track (IRST)
Rockets
Infrared (IR) Missiles
Radar Guided (RG) Missiles
Chaff
Flares
Air to Ground Missiles (AGM's)
Anti-Ship Missiles (ASM's)
Iron Bombs
Smart Bombs
