# Dogfight 2 - Detailed Technical Analysis of Partial Features

## Document Structure
This is a deep technical dive into the partially implemented features with code examples, architecture details, and implementation roadmaps.

---

# FEATURE 3: CUSTOM SCENARIOS - DETAILED TECHNICAL ANALYSIS

## Current Implementation Analysis

### Mission Data Structure (Lines 814-939)

**Current Format:**
```javascript
{
    id: 1,
    name: "First Blood",
    type: "dogfight",
    description: "Your first combat sortie...",
    objectives: ["Destroy enemy aircraft"],
    playerAircraft: "Spitfire",
    enemyAircraft: ["Me-109"],
    weather: "clear",
    timeOfDay: "noon",
    briefing: "Intelligence reports..."
}
```

**Mission Types Currently Supported:**
- `"dogfight"` - Air-to-air combat
- `"escort"` - Protect friendly bombers
- `"ground_attack"` - Destroy ground targets

**Extensible Properties:**
```javascript
{
    playerWingmen: ["Spitfire"],      // For 2v2+ scenarios
    groundTargets: 4,                  // Number of targets
    groundTargetTypes: ["bridge"],     // Specific types
    weather: "storm",                  // clear, wind, rain, storm
    timeOfDay: "dawn",                 // dawn, morning, noon, evening
    difficulty: "hard",                // easy, normal, hard, ace
    // Custom properties can be added:
    friendlyBombers: 2,                // Escort mission bombers
    restrictedArea: { x, y, radius },  // No-fly zone
    historicalContext: "string"        // Flavor text
}
```

### Mission Loading System (Lines 9571-9595)

**Current Function:**
```javascript
function loadMission(missionId) {
    currentMission = missions.find(m => m.id === missionId) || missions[0];
    campaignState.currentMission = missionId;
    showMissionBriefing();
}

function showMissionBriefing() {
    const briefing = document.getElementById('briefingContent');
    briefing.innerHTML = `
        <h3>Mission ${currentMission.id}: ${currentMission.name}</h3>
        <p>${currentMission.description}</p>
        <h4>Objectives:</h4>
        <ul>
            ${currentMission.objectives.map(obj => `<li>${obj}</li>`).join('')}
        </ul>
    `;
    document.getElementById('missionBriefing').style.display = 'block';
}
```

### Mission Initialization (Lines 9597-9639)

**Current Process:**
1. Hide briefing, set gameState = 'ORDER'
2. Apply weather from mission
3. Create player aircraft at position (400, 500, alt: 1200)
4. Create enemy aircraft from enemyAircraft array
5. Create ground targets if groundTargets specified
6. Start game loop

---

## What's Missing - Implementation Roadmap

### 1. UI Mission Editor Panel

**HTML Structure Needed:**
```html
<div id="missionEditor" style="display: none;">
    <div class="panel-title">MISSION EDITOR</div>
    
    <!-- Basic Info -->
    <div class="editor-section">
        <h4>Mission Properties</h4>
        <div class="setting-row">
            <label>Mission Name:</label>
            <input type="text" id="missionName" placeholder="e.g., Custom Dogfight">
        </div>
        <div class="setting-row">
            <label>Mission Type:</label>
            <select id="missionType">
                <option value="dogfight">Dogfight</option>
                <option value="escort">Escort</option>
                <option value="ground_attack">Ground Attack</option>
            </select>
        </div>
        <div class="setting-row">
            <label>Description:</label>
            <textarea id="missionDescription" rows="3"></textarea>
        </div>
    </div>
    
    <!-- Environment -->
    <div class="editor-section">
        <h4>Environment</h4>
        <div class="setting-row">
            <label>Weather:</label>
            <select id="missionWeather">
                <option value="clear">Clear</option>
                <option value="wind">Wind</option>
                <option value="rain">Rain</option>
                <option value="storm">Storm</option>
            </select>
        </div>
        <div class="setting-row">
            <label>Time of Day:</label>
            <select id="missionTimeOfDay">
                <option value="dawn">Dawn</option>
                <option value="morning">Morning</option>
                <option value="noon">Noon</option>
                <option value="evening">Evening</option>
            </select>
        </div>
    </div>
    
    <!-- Aircraft Setup -->
    <div class="editor-section">
        <h4>Player Aircraft</h4>
        <div class="setting-row">
            <label>Aircraft Type:</label>
            <select id="playerAircraftType">
                <!-- Populated from aircraftDatabase -->
            </select>
        </div>
        <div class="setting-row">
            <label>Altitude (m):</label>
            <input type="number" id="playerAltitude" value="1200" min="100" max="5000">
        </div>
        <div class="setting-row">
            <label>Starting Heading:</label>
            <input type="number" id="playerHeading" value="90" min="0" max="359">
        </div>
    </div>
    
    <!-- Enemy Aircraft -->
    <div class="editor-section">
        <h4>Enemy Aircraft</h4>
        <div id="enemyList"></div>
        <button class="btn" onclick="addEnemyAircraft()">ADD ENEMY</button>
    </div>
    
    <!-- Ground Targets -->
    <div class="editor-section">
        <h4>Ground Targets</h4>
        <div class="setting-row">
            <label>Ground Target Type:</label>
            <select id="groundTargetType">
                <option value="truck">Truck</option>
                <option value="aa_gun">AA Gun</option>
                <option value="fuel_depot">Fuel Depot</option>
                <option value="bridge">Bridge</option>
            </select>
            <button class="btn" onclick="addGroundTarget()">ADD TARGET</button>
        </div>
        <div id="groundTargetList"></div>
    </div>
    
    <!-- Objectives -->
    <div class="editor-section">
        <h4>Objectives</h4>
        <div id="objectiveList"></div>
        <button class="btn" onclick="addObjective()">ADD OBJECTIVE</button>
    </div>
    
    <!-- Actions -->
    <div style="text-align: center; margin-top: 20px;">
        <button class="btn btn-primary" onclick="saveMissionToDraft()">SAVE DRAFT</button>
        <button class="btn btn-primary" onclick="previewMission()">PREVIEW</button>
        <button class="btn btn-primary" onclick="exportMissionJSON()">EXPORT JSON</button>
        <button class="btn" onclick="closeEditor()">CLOSE</button>
    </div>
</div>
```

### 2. Mission Editor JavaScript Functions

**Core Editor Functions:**
```javascript
class MissionEditor {
    constructor() {
        this.currentMission = this.getBlankMission();
        this.draftMissions = [];
        this.loadDrafts();
    }
    
    getBlankMission() {
        return {
            id: Math.max(...missions.map(m => m.id), 0) + 1,
            name: "Untitled Mission",
            type: "dogfight",
            description: "",
            briefing: "",
            objectives: ["Destroy enemy aircraft"],
            playerAircraft: "Spitfire",
            playerAltitude: 1200,
            playerHeading: 90,
            playerWingmen: [],
            enemyAircraft: [],
            groundTargets: [],
            weather: "clear",
            timeOfDay: "noon",
            difficulty: "normal"
        };
    }
    
    addEnemyAircraft(type = "Me-109", count = 1) {
        for (let i = 0; i < count; i++) {
            this.currentMission.enemyAircraft.push({
                type: type,
                altitude: 1200,
                heading: 270,
                position: {
                    x: 1400 + Math.random() * 200,
                    y: 500 + Math.random() * 200
                }
            });
        }
        this.updateUI();
    }
    
    addGroundTarget(type = "truck", x = 600, y = 300) {
        this.currentMission.groundTargets.push({
            type: type,
            position: { x, y }
        });
        this.updateUI();
    }
    
    addObjective(text = "Objective") {
        this.currentMission.objectives.push(text);
        this.updateUI();
    }
    
    removeEnemyAircraft(index) {
        this.currentMission.enemyAircraft.splice(index, 1);
        this.updateUI();
    }
    
    removeGroundTarget(index) {
        this.currentMission.groundTargets.splice(index, 1);
        this.updateUI();
    }
    
    removeObjective(index) {
        this.currentMission.objectives.splice(index, 1);
        this.updateUI();
    }
    
    saveDraft() {
        const draftId = Date.now();
        this.currentMission.draftId = draftId;
        this.currentMission.savedAt = new Date().toISOString();
        localStorage.setItem(`dogfight_draft_${draftId}`, JSON.stringify(this.currentMission));
        this.draftMissions.push(this.currentMission);
        alert(`Draft saved as "${this.currentMission.name}"`);
    }
    
    loadDraft(draftId) {
        const data = localStorage.getItem(`dogfight_draft_${draftId}`);
        if (data) {
            this.currentMission = JSON.parse(data);
            this.updateUI();
        }
    }
    
    loadDrafts() {
        this.draftMissions = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('dogfight_draft_')) {
                const mission = JSON.parse(localStorage.getItem(key));
                this.draftMissions.push(mission);
            }
        }
    }
    
    exportAsJSON() {
        const json = JSON.stringify(this.currentMission, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mission_${this.currentMission.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    importFromJSON(jsonString) {
        try {
            const mission = JSON.parse(jsonString);
            if (!mission.name || !mission.type) {
                throw new Error("Invalid mission format");
            }
            this.currentMission = mission;
            this.updateUI();
            return true;
        } catch (error) {
            alert(`Import error: ${error.message}`);
            return false;
        }
    }
    
    validateMission() {
        const errors = [];
        
        if (!this.currentMission.name.trim()) 
            errors.push("Mission must have a name");
        if (!this.currentMission.playerAircraft) 
            errors.push("Player aircraft must be selected");
        if (this.currentMission.type === 'dogfight' && this.currentMission.enemyAircraft.length === 0) 
            errors.push("Dogfight mission must have at least one enemy");
        if (this.currentMission.objectives.length === 0) 
            errors.push("Mission must have at least one objective");
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    launchMission() {
        const validation = this.validateMission();
        if (!validation.isValid) {
            alert("Mission validation failed:\n" + validation.errors.join("\n"));
            return false;
        }
        
        // Add to missions array temporarily
        missions.push({...this.currentMission});
        loadMission(this.currentMission.id);
        return true;
    }
}

// Global editor instance
const missionEditor = new MissionEditor();
```

### 3. Aircraft Placement Canvas

**Visual Placement Tool:**
```javascript
class AircraftPlacementCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.missions = [];
        this.selectedAircraft = null;
        this.gridSize = 50;
        this.terrainScale = 2; // 2 pixels = 1 meter
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.onRightClick(e);
        });
    }
    
    addAircraftMarker(aircraft, type) {
        // Add visual marker for aircraft placement
        const rect = this.canvas.getBoundingClientRect();
        const x = aircraft.position.x / this.terrainScale;
        const y = aircraft.position.y / this.terrainScale;
        
        const marker = {
            x: x,
            y: y,
            aircraft: aircraft,
            type: type, // 'player', 'enemy', 'wingman'
            selected: false
        };
        
        this.markers = this.markers || [];
        this.markers.push(marker);
        this.render();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
        
        // Draw terrain features (mountains, etc.)
        this.drawTerrain();
        
        // Draw aircraft markers
        if (this.markers) {
            for (let marker of this.markers) {
                this.drawAircraftMarker(marker);
            }
        }
    }
    
    drawAircraftMarker(marker) {
        const { x, y, type, selected } = marker;
        
        const colors = {
            'player': '#00ff00',
            'enemy': '#ff0000',
            'wingman': '#00ffff'
        };
        
        this.ctx.fillStyle = colors[type] || '#fff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw heading indicator
        const headingAngle = marker.aircraft.heading * Math.PI / 180;
        this.ctx.strokeStyle = colors[type];
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(
            x + 12 * Math.cos(headingAngle),
            y + 12 * Math.sin(headingAngle)
        );
        this.ctx.stroke();
        
        // Highlight selected
        if (selected) {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 12, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking on aircraft
        for (let marker of this.markers || []) {
            const dist = Math.hypot(marker.x - x, marker.y - y);
            if (dist < 12) {
                this.selectedAircraft = marker;
                this.dragging = true;
                return;
            }
        }
    }
    
    onMouseMove(e) {
        if (!this.dragging || !this.selectedAircraft) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.selectedAircraft.x = x;
        this.selectedAircraft.y = y;
        this.selectedAircraft.aircraft.position = {
            x: x * this.terrainScale,
            y: y * this.terrainScale
        };
        
        this.render();
    }
    
    onMouseUp(e) {
        this.dragging = false;
    }
    
    onRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Find and remove aircraft at this position
        for (let i = 0; i < (this.markers || []).length; i++) {
            const marker = this.markers[i];
            const dist = Math.hypot(marker.x - x, marker.y - y);
            if (dist < 12) {
                this.markers.splice(i, 1);
                this.render();
                return;
            }
        }
    }
    
    drawTerrain() {
        // Simple terrain visualization
        this.ctx.fillStyle = '#2a4a2a';
        
        // Mountains (triangle pattern)
        const mountains = [
            { x: 150, y: 200, size: 40 },
            { x: 800, y: 150, size: 50 }
        ];
        
        for (let mountain of mountains) {
            this.ctx.beginPath();
            this.ctx.moveTo(mountain.x, mountain.y + mountain.size);
            this.ctx.lineTo(mountain.x - mountain.size, mountain.y + mountain.size * 2);
            this.ctx.lineTo(mountain.x + mountain.size, mountain.y + mountain.size * 2);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
}
```

### 4. Save/Load System

**LocalStorage Integration:**
```javascript
class MissionStorage {
    static saveMission(mission) {
        const key = `mission_${mission.id}`;
        localStorage.setItem(key, JSON.stringify(mission));
        localStorage.setItem('mission_list', JSON.stringify(this.getAllMissions()));
    }
    
    static loadMission(missionId) {
        const data = localStorage.getItem(`mission_${missionId}`);
        return data ? JSON.parse(data) : null;
    }
    
    static deleteMission(missionId) {
        localStorage.removeItem(`mission_${missionId}`);
    }
    
    static getAllMissions() {
        const list = localStorage.getItem('mission_list');
        return list ? JSON.parse(list) : [];
    }
    
    static exportMission(missionId) {
        const mission = this.loadMission(missionId);
        return JSON.stringify(mission, null, 2);
    }
    
    static importMission(jsonString) {
        try {
            const mission = JSON.parse(jsonString);
            mission.id = Math.max(...missions.map(m => m.id), 0) + 1;
            this.saveMission(mission);
            missions.push(mission);
            return mission;
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }
}
```

---

# FEATURE 4: DYNAMIC CAMPAIGN SYSTEM - DETAILED TECHNICAL ANALYSIS

## Current Implementation Analysis

### Campaign State Structure (Lines 801-810)

**Current State:**
```javascript
let campaignState = {
    currentMission: 0,
    missionsCompleted: 0,
    totalKills: 0,
    pilotExperience: 0,
    pilotFatigue: 0,
    availableAircraft: ['Spitfire', 'Me-109'],
    damagedAircraft: {},
    score: 0
};
```

**Mission Progression (Lines 9673-9678):**
```javascript
// After mission completes:
campaignState.missionsCompleted++;
campaignState.pilotExperience += 100;
campaignState.score += 1000;

// Auto-advance to next mission or show completion
if (campaignState.missionsCompleted < missions.length) {
    loadMission(currentMission.id + 1);
}
```

### Mission Objective Checking (Lines 9641-9650)

**Current Logic:**
```javascript
function checkMissionObjectives() {
    if (!currentMission) return;
    
    let objectivesComplete = 0;
    const totalObjectives = currentMission.objectives.length;
    
    if (currentMission.type === 'dogfight') {
        const enemiesDestroyed = aircraft.filter(
            a => !a.isPlayer && a.isDestroyed
        ).length;
        // Assumes "Destroy enemy aircraft" objectives
    }
    // ... more logic
}
```

---

## What's Missing - Implementation Roadmap

### 1. Campaign Map Data Structure

**Territory System:**
```javascript
class CampaignMap {
    constructor(theaterId = 'europe_1943') {
        this.theaterId = theaterId;
        this.territories = this.initializeTerritories();
        this.factions = {
            'allied': { name: 'Allied', color: '#0088ff' },
            'axis': { name: 'Axis', color: '#ff4400' },
            'neutral': { name: 'Neutral', color: '#888888' }
        };
    }
    
    initializeTerritories() {
        const territories = {};
        const territoryData = [
            // Europe 1943 territories
            {
                id: 'france_north',
                name: 'Northern France',
                owner: 'axis',
                control: 1.0,
                importance: 'high',
                resources: { aircraft: 100, fuel: 5000, pilots: 50 },
                position: { x: 300, y: 200 },
                radius: 40,
                borders: ['france_south', 'belgium', 'germany']
            },
            {
                id: 'france_south',
                name: 'Southern France',
                owner: 'axis',
                control: 0.8,
                importance: 'medium',
                resources: { aircraft: 50, fuel: 2500, pilots: 25 },
                position: { x: 350, y: 350 },
                radius: 35,
                borders: ['france_north', 'italy', 'spain']
            },
            {
                id: 'germany',
                name: 'Germany',
                owner: 'axis',
                control: 1.0,
                importance: 'critical',
                resources: { aircraft: 200, fuel: 10000, pilots: 100 },
                position: { x: 500, y: 180 },
                radius: 50,
                borders: ['france_north', 'poland', 'czechoslovakia']
            },
            {
                id: 'uk',
                name: 'United Kingdom',
                owner: 'allied',
                control: 1.0,
                importance: 'critical',
                resources: { aircraft: 150, fuel: 8000, pilots: 75 },
                position: { x: 150, y: 150 },
                radius: 40,
                borders: ['france_north']
            },
            {
                id: 'poland',
                name: 'Poland',
                owner: 'axis',
                control: 0.9,
                importance: 'high',
                resources: { aircraft: 60, fuel: 3000, pilots: 30 },
                position: { x: 600, y: 200 },
                radius: 35,
                borders: ['germany', 'czechoslovakia']
            },
            // ... more territories
        ];
        
        for (let data of territoryData) {
            territories[data.id] = new Territory(data);
        }
        
        return territories;
    }
    
    getTerritoryByPosition(x, y) {
        for (let [id, territory] of Object.entries(this.territories)) {
            const dist = Math.hypot(x - territory.position.x, y - territory.position.y);
            if (dist <= territory.radius) {
                return territory;
            }
        }
        return null;
    }
    
    changeOwnership(territoryId, newOwner, controlAmount = 1.0) {
        const territory = this.territories[territoryId];
        if (territory) {
            territory.owner = newOwner;
            territory.control = controlAmount;
            
            // Alert bordering territories
            for (let borderTerrId of territory.borders) {
                const borderTerr = this.territories[borderTerrId];
                if (borderTerr && borderTerr.owner !== newOwner) {
                    borderTerr.contested = true;
                }
            }
        }
    }
    
    calculateVictoryCondition() {
        let alliedTerritories = 0;
        let axisTerritories = 0;
        let totalTerritories = Object.keys(this.territories).length;
        
        for (let territory of Object.values(this.territories)) {
            if (territory.owner === 'allied') alliedTerritories++;
            else if (territory.owner === 'axis') axisTerritories++;
        }
        
        return {
            alliedControl: alliedTerritories / totalTerritories,
            axisControl: axisTerritories / totalTerritories,
            winner: alliedTerritories > axisTerritories ? 'allied' : 
                    axisTerritories > alliedTerritories ? 'axis' : null
        };
    }
}

class Territory {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.owner = data.owner; // 'allied', 'axis', 'neutral'
        this.control = data.control; // 0-1, how secure
        this.importance = data.importance; // low, medium, high, critical
        this.resources = data.resources; // aircraft, fuel, pilots
        this.position = data.position;
        this.radius = data.radius;
        this.borders = data.borders;
        this.contested = false;
        this.defenseDifficulty = this.importance === 'critical' ? 'ace' : 'normal';
    }
    
    updateControl(amount) {
        this.control = Math.max(0, Math.min(1, this.control + amount));
    }
    
    getAvailableResources() {
        const utilizationRate = this.control; // Lower control = fewer resources
        return {
            aircraft: Math.floor(this.resources.aircraft * utilizationRate),
            fuel: Math.floor(this.resources.fuel * utilizationRate),
            pilots: Math.floor(this.resources.pilots * utilizationRate)
        };
    }
}
```

### 2. Campaign Map UI Rendering

**Canvas Rendering:**
```javascript
class CampaignMapUI {
    constructor(canvasId, campaignMap) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.map = campaignMap;
        this.zoom = 1.0;
        this.pan = { x: 0, y: 0 };
        this.selectedTerritory = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.onClick(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }
    
    render() {
        // Clear
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for transformations
        this.ctx.save();
        this.ctx.translate(this.pan.x, this.pan.y);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Draw territories
        for (let territory of Object.values(this.map.territories)) {
            this.drawTerritory(territory);
        }
        
        // Draw borders/connections
        for (let territory of Object.values(this.map.territories)) {
            this.drawBorders(territory);
        }
        
        this.ctx.restore();
        
        // Draw UI overlays
        this.drawLegend();
        this.drawStats();
        
        if (this.selectedTerritory) {
            this.drawTerritoryInfo(this.selectedTerritory);
        }
    }
    
    drawTerritory(territory) {
        const { position, radius, owner, control, importance } = territory;
        
        // Territory circle
        const colors = {
            'allied': '#0088ff',
            'axis': '#ff4400',
            'neutral': '#888888'
        };
        
        this.ctx.fillStyle = colors[owner];
        this.ctx.globalAlpha = control; // Opacity = control amount
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        
        // Border based on importance
        this.ctx.strokeStyle = colors[owner];
        this.ctx.lineWidth = importance === 'critical' ? 3 : 1.5;
        this.ctx.stroke();
        
        // Label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(territory.name, position.x, position.y);
        
        // Contested indicator
        if (territory.contested) {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(position.x, position.y, radius + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }
    
    drawBorders(territory) {
        const colors = {
            'allied': '#0088ff',
            'axis': '#ff4400'
        };
        
        for (let borderId of territory.borders) {
            const borderTerr = this.map.territories[borderId];
            if (borderTerr) {
                this.ctx.strokeStyle = territory.owner === borderTerr.owner ? 
                    '#666' : '#fff';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(territory.position.x, territory.position.y);
                this.ctx.lineTo(borderTerr.position.x, borderTerr.position.y);
                this.ctx.stroke();
            }
        }
    }
    
    drawLegend() {
        const legendX = 10;
        const legendY = 10;
        const itemHeight = 20;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(legendX, legendY, 150, 60);
        
        this.ctx.fillStyle = '#0088ff';
        this.ctx.fillRect(legendX + 10, legendY + 10, 15, 15);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('Allied Territory', legendX + 30, legendY + 22);
        
        this.ctx.fillStyle = '#ff4400';
        this.ctx.fillRect(legendX + 10, legendY + 30, 15, 15);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('Axis Territory', legendX + 30, legendY + 42);
    }
    
    drawStats() {
        const victory = this.map.calculateVictoryCondition();
        const statsX = this.canvas.width - 200;
        const statsY = 10;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(statsX, statsY, 190, 100);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Campaign Progress', statsX + 10, statsY + 20);
        
        // Allied control bar
        this.ctx.fillStyle = '#0088ff';
        const alliedWidth = victory.alliedControl * 150;
        this.ctx.fillRect(statsX + 10, statsY + 30, alliedWidth, 15);
        
        // Axis control bar
        this.ctx.fillStyle = '#ff4400';
        const axisWidth = victory.axisControl * 150;
        this.ctx.fillRect(statsX + 10 + alliedWidth, statsY + 30, axisWidth, 15);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(statsX + 10, statsY + 30, 150, 15);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Allied: ${Math.round(victory.alliedControl * 100)}%`, 
            statsX + 10, statsY + 70);
        this.ctx.fillText(`Axis: ${Math.round(victory.axisControl * 100)}%`, 
            statsX + 10, statsY + 85);
    }
    
    drawTerritoryInfo(territory) {
        const panelX = 10;
        const panelY = 150;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(panelX, panelY, 250, 200);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(territory.name, panelX + 10, panelY + 20);
        
        const resources = territory.getAvailableResources();
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Owner: ${territory.owner}`, panelX + 10, panelY + 45);
        this.ctx.fillText(`Control: ${Math.round(territory.control * 100)}%`, 
            panelX + 10, panelY + 65);
        this.ctx.fillText(`Aircraft: ${resources.aircraft}`, panelX + 10, panelY + 85);
        this.ctx.fillText(`Fuel: ${resources.fuel}`, panelX + 10, panelY + 105);
        this.ctx.fillText(`Pilots: ${resources.pilots}`, panelX + 10, panelY + 125);
        
        // Attack button
        if (territory.owner !== campaignState.playerSide) {
            this.ctx.fillStyle = '#ff6600';
            this.ctx.fillRect(panelX + 10, panelY + 145, 100, 25);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText('ATTACK', panelX + 35, panelY + 163);
        }
    }
    
    onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.pan.x) / this.zoom;
        const y = (e.clientY - rect.top - this.pan.y) / this.zoom;
        
        const territory = this.map.getTerritoryByPosition(x, y);
        if (territory) {
            this.selectedTerritory = territory;
            this.render();
        }
    }
    
    onWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom *= zoomFactor;
        this.zoom = Math.max(0.5, Math.min(3, this.zoom));
        this.render();
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.pan.x) / this.zoom;
        const y = (e.clientY - rect.top - this.pan.y) / this.zoom;
        
        const territory = this.map.getTerritoryByPosition(x, y);
        this.canvas.style.cursor = territory ? 'pointer' : 'default';
    }
}
```

### 3. Resource Management System

**Production & Losses:**
```javascript
class CampaignResources {
    constructor() {
        this.nations = {
            'allied': {
                aircraftProduction: 150,      // per turn
                lossesMission: 0,
                lossesMap: 0,
                availableAircraft: 300,
                pilots: 150
            },
            'axis': {
                aircraftProduction: 100,      // per turn
                lossesMission: 0,
                lossesMap: 0,
                availableAircraft: 200,
                pilots: 100
            }
        };
        this.repairQueue = []; // { aircraft, nation, hoursNeeded, turnsRemaining }
        this.supplyLines = []; // Territory chains for supply
    }
    
    recordMissionLosses(nation, aircraftLost, pilotsLost) {
        const nation_data = this.nations[nation];
        nation_data.lossesMission += aircraftLost;
        nation_data.availableAircraft -= aircraftLost;
        nation_data.pilots -= pilotsLost;
    }
    
    recordMapLosses(nation, aircraftLost) {
        const nation_data = this.nations[nation];
        nation_data.lossesMap += aircraftLost;
        nation_data.availableAircraft -= aircraftLost;
    }
    
    processProductionCycle(turn) {
        // Process production at turn start
        for (let [nation, data] of Object.entries(this.nations)) {
            // Base production
            data.availableAircraft += data.aircraftProduction;
            
            // Production modifiers based on territory control
            const territory_modifier = this.getProductionModifier(nation);
            data.availableAircraft = Math.floor(
                data.availableAircraft * territory_modifier
            );
            
            // Max aircraft cap
            const cap = nation === 'allied' ? 500 : 350;
            data.availableAircraft = Math.min(data.availableAircraft, cap);
        }
        
        // Process repairs
        this.processRepairs();
    }
    
    processRepairs() {
        for (let repair of this.repairQueue) {
            repair.turnsRemaining--;
            if (repair.turnsRemaining <= 0) {
                // Aircraft repaired
                const nation_data = this.nations[repair.nation];
                nation_data.availableAircraft++;
                
                // Remove from queue
                const idx = this.repairQueue.indexOf(repair);
                this.repairQueue.splice(idx, 1);
            }
        }
    }
    
    canSelectAircraft(nation, aircraftType) {
        return this.nations[nation].availableAircraft > 0;
    }
    
    selectAircraft(nation, aircraftType) {
        const nation_data = this.nations[nation];
        if (nation_data.availableAircraft > 0) {
            nation_data.availableAircraft--;
            return true;
        }
        return false;
    }
    
    damageAircraft(nation, aircraftType, damage) {
        if (damage > 80) {
            // Total loss
            this.recordMapLosses(nation, 1);
        } else {
            // Repairable - send to repair queue
            const repairTurns = Math.ceil(damage / 20); // 5-10 turns to repair
            this.repairQueue.push({
                nation: nation,
                aircraftType: aircraftType,
                turnsRemaining: repairTurns,
                damage: damage
            });
        }
    }
    
    getProductionModifier(nation) {
        // Territory control affects production
        const controlled = campaignMap.territories;
        let territoriesHeld = 0;
        
        for (let territory of Object.values(controlled)) {
            if (territory.owner === nation) {
                territoriesHeld += territory.control;
            }
        }
        
        return 0.7 + (territoriesHeld / 20); // Min 0.7, max based on territories
    }
}
```

### 4. Campaign Progression Logic

**Turn-Based Campaign:**
```javascript
class CampaignState {
    constructor() {
        this.turn = 0;
        this.campaign = 'europe_1943';
        this.playerSide = 'allied'; // or 'axis'
        this.objectives = this.generateObjectives();
        this.availableMissions = [];
        this.pilotStats = {
            rank: 'Flight Sergeant',
            experience: 0,
            kills: 0,
            fatigue: 0
        };
    }
    
    startCampaignTurn() {
        this.turn++;
        
        // Process production
        campaignResources.processProductionCycle(this.turn);
        
        // Generate available missions for this turn
        this.availableMissions = this.generateTurnMissions();
        
        // Check victory conditions
        const victory = campaignMap.calculateVictoryCondition();
        if (victory.alliedControl > 0.6) {
            this.endCampaign('allied', victory.alliedControl);
        } else if (victory.axisControl > 0.6) {
            this.endCampaign('axis', victory.axisControl);
        }
    }
    
    generateTurnMissions() {
        const missions = [];
        
        for (let [terrId, territory] of 
             Object.entries(campaignMap.territories)) {
            
            // Generate missions at contested/enemy territories
            if (territory.owner !== this.playerSide || territory.contested) {
                const missionType = territory.importance === 'critical' ? 
                    'bombing' : 'fighter_sweep';
                
                const difficulty = territory.owner === this.playerSide ? 
                    'normal' : territory.defenseDifficulty;
                
                missions.push({
                    territory: terrId,
                    type: missionType,
                    difficulty: difficulty,
                    reward: territory.importance === 'critical' ? 500 : 200,
                    riskLevel: territory.owner === this.playerSide ? 'low' : 'high'
                });
            }
        }
        
        return missions.slice(0, 5); // Max 5 missions per turn
    }
    
    completeMission(territoryId, success) {
        const territory = campaignMap.territories[territoryId];
        
        if (success) {
            // Territory gains control
            if (territory.owner === this.playerSide) {
                territory.updateControl(0.1); // Reinforce control
            } else {
                territory.updateControl(-0.2); // Reduce enemy control
                
                // If control drops below 50%, flip territory
                if (territory.control < 0.5) {
                    territory.owner = this.playerSide;
                    territory.control = 0.5;
                }
            }
            
            // Score and experience
            campaignState.score += 500;
            this.pilotStats.experience += 100;
            this.pilotStats.kills += 5;
            
            // Update pilot fatigue
            this.pilotStats.fatigue += 10;
        } else {
            // Mission failed - territory becomes contested
            territory.contested = true;
            this.pilotStats.fatigue += 20;
        }
        
        // Update pilot rank
        this.updatePilotRank();
    }
    
    updatePilotRank() {
        const ranks = [
            { minExp: 0, rank: 'Flight Sergeant' },
            { minExp: 500, rank: 'Flying Officer' },
            { minExp: 1500, rank: 'Squadron Leader' },
            { minExp: 3000, rank: 'Wing Commander' },
            { minExp: 5000, rank: 'Group Captain' }
        ];
        
        for (let i = ranks.length - 1; i >= 0; i--) {
            if (this.pilotStats.experience >= ranks[i].minExp) {
                this.pilotStats.rank = ranks[i].rank;
                break;
            }
        }
    }
    
    updateFatigue() {
        // Fatigue reduces pilot effectiveness
        // Each mission adds fatigue
        // Rest/rotation decreases fatigue
        
        if (this.pilotStats.fatigue > 50) {
            // Pilot is exhausted - skill penalties apply
            return 0.7; // 30% skill reduction
        }
        if (this.pilotStats.fatigue > 30) {
            return 0.85; // 15% skill reduction
        }
        return 1.0;
    }
    
    endCampaign(winner, controlPercent) {
        const screen = document.getElementById('campaignEnd');
        const message = winner === this.playerSide ? 
            `VICTORY! You control ${Math.round(controlPercent * 100)}% of territory!` :
            `DEFEAT! Enemy controls ${Math.round(controlPercent * 100)}% of territory.`;
        
        screen.innerHTML = `
            <h2>${message}</h2>
            <p>Final Rank: ${this.pilotStats.rank}</p>
            <p>Total Kills: ${this.pilotStats.kills}</p>
            <p>Experience: ${this.pilotStats.experience}</p>
            <button onclick="location.reload()">RESTART CAMPAIGN</button>
        `;
        screen.style.display = 'block';
    }
}
```

---

## Estimated Implementation Schedule

### Phase 1: Mission Editor (6-8 hours)
- [ ] Mission Editor UI panel (2 hours)
- [ ] Aircraft placement canvas (2 hours)
- [ ] Save/load system (2 hours)
- [ ] Testing & refinement (1-2 hours)

### Phase 2: Campaign Map (4-6 hours)
- [ ] Territory data structure (1 hour)
- [ ] Campaign map rendering (2 hours)
- [ ] Territory control system (1-2 hours)
- [ ] Integration (1 hour)

### Phase 3: Resource Management (5-7 hours)
- [ ] Resource tracking (2 hours)
- [ ] Production system (1.5 hours)
- [ ] Repair queue (1 hour)
- [ ] Territory modifier logic (1-1.5 hours)

### Phase 4: Campaign Progression (4-5 hours)
- [ ] Turn system (1 hour)
- [ ] Mission generation (1.5 hours)
- [ ] Territory control logic (1 hour)
- [ ] Victory conditions (1-1.5 hours)

### Total Estimated Effort: 19-26 hours

---

## Quick Wins (Can be done immediately)

1. **JSON Export** (30 min)
   - Add button to export current mission as JSON
   - Allow import of custom JSON missions

2. **Campaign Progress Bar** (1 hour)
   - Visual territory control meter
   - Mission count display

3. **Pilot Fatigue Effects** (1.5 hours)
   - Use existing pilotFatigue value
   - Apply skill penalties for tired pilots
   - Show fatigue in UI

