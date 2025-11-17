const fs = require('fs');
const path = require('path');

console.log('🔍 Quick Game Diagnostics\n');
console.log('='.repeat(60));

// Check if dogfight.html exists
const htmlFile = path.join(__dirname, 'dogfight.html');
if (fs.existsSync(htmlFile)) {
    console.log('✅ dogfight.html exists');
    
    const content = fs.readFileSync(htmlFile, 'utf8');
    
    // Check for common issues
    console.log('\n📋 Checking for common issues...\n');
    
    // Check for WW1 battle functions
    if (content.includes('function startWW1Battle')) {
        console.log('✅ startWW1Battle function found');
    } else {
        console.log('❌ startWW1Battle function NOT found');
    }
    
    if (content.includes('function showWW1BattleSelector')) {
        console.log('✅ showWW1BattleSelector function found');
    } else {
        console.log('❌ showWW1BattleSelector function NOT found');
    }
    
    // Check for scenario functions
    if (content.includes('function showScenarioSelector')) {
        console.log('✅ showScenarioSelector function found');
    } else {
        console.log('❌ showScenarioSelector function NOT found');
    }
    
    if (content.includes('scenariosDatabase')) {
        console.log('✅ scenariosDatabase found');
        const scenarioMatches = content.match(/id:\s*'([^']+)'/g);
        if (scenarioMatches) {
            console.log(`   Found ${scenarioMatches.length} scenarios`);
        }
    } else {
        console.log('❌ scenariosDatabase NOT found');
    }
    
    // Check for WW1Terrain class
    if (content.includes('class WW1Terrain')) {
        console.log('✅ WW1Terrain class found');
    } else {
        console.log('❌ WW1Terrain class NOT found');
    }
    
    // Check for AerialUnit class
    if (content.includes('class AerialUnit')) {
        console.log('✅ AerialUnit class found');
    } else {
        console.log('❌ AerialUnit class NOT found');
    }
    
    // Check for aircraft database
    if (content.includes('aircraftDatabase')) {
        console.log('✅ aircraftDatabase found');
        
        // Count WW1 aircraft
        const ww1Aircraft = [
            'Camel', 'SE5', 'DH2', 'Nieuport24', 'SpadXIII', 'O400',
            'FK8', 'Salmson2', 'MoraneAI', 'BristolF2', 'HanriotHD3',
            'LetordLet5', 'DrII', 'DVII', 'DV', 'EIV', 'AEGGIV', 'DFWCV'
        ];
        
        let foundCount = 0;
        ww1Aircraft.forEach(ac => {
            if (content.includes(`'${ac}':`)) {
                foundCount++;
            }
        });
        console.log(`   Found ${foundCount}/${ww1Aircraft.length} WW1 aircraft in database`);
    } else {
        console.log('❌ aircraftDatabase NOT found');
    }
    
    // Check for image loading
    if (content.includes('aircraftImages')) {
        console.log('✅ aircraftImages object found');
        
        // Check for WW1 image paths
        const ww1Images = ['camel', 'se5', 'dh2', 'nieuport24', 'sxiii', 'dri'];
        let imageCount = 0;
        ww1Images.forEach(img => {
            if (content.includes(`images/${img}.png`)) {
                imageCount++;
            }
        });
        console.log(`   Found ${imageCount}/${ww1Images.length} WW1 image paths`);
    } else {
        console.log('❌ aircraftImages object NOT found');
    }
    
    // Check for gameEra variable
    if (content.includes('gameEra')) {
        console.log('✅ gameEra variable found');
    } else {
        console.log('❌ gameEra variable NOT found');
    }
    
    // Check for render function
    if (content.includes('function render()')) {
        console.log('✅ render function found');
        
        // Check if it calls terrain.render()
        if (content.includes('terrain.render()')) {
            console.log('✅ render function calls terrain.render()');
        } else {
            console.log('❌ render function does NOT call terrain.render()');
        }
    } else {
        console.log('❌ render function NOT found');
    }
    
    // Check for gameLoop function
    if (content.includes('function gameLoop()')) {
        console.log('✅ gameLoop function found');
    } else {
        console.log('❌ gameLoop function NOT found');
    }
    
    // Check for syntax errors (basic check)
    console.log('\n📋 Checking for syntax issues...\n');
    
    // Check for unclosed brackets (basic)
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces === closeBraces) {
        console.log(`✅ Braces balanced (${openBraces} pairs)`);
    } else {
        console.log(`❌ Braces NOT balanced: ${openBraces} open, ${closeBraces} close`);
    }
    
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens === closeParens) {
        console.log(`✅ Parentheses balanced (${openParens} pairs)`);
    } else {
        console.log(`❌ Parentheses NOT balanced: ${openParens} open, ${closeParens} close`);
    }
    
    // Check for common JavaScript errors
    console.log('\n📋 Checking for potential issues...\n');
    
    // Check for undefined variables that might cause issues
    const undefinedChecks = [
        { pattern: /ww1AlliedAircraft\.length/, name: 'ww1AlliedAircraft' },
        { pattern: /ww1CentralAircraft\.length/, name: 'ww1CentralAircraft' },
        { pattern: /aerialUnits/, name: 'aerialUnits array' }
    ];
    
    undefinedChecks.forEach(check => {
        if (content.match(check.pattern)) {
            // Check if it's declared
            if (content.includes(`let ${check.name}`) || content.includes(`var ${check.name}`) || content.includes(`const ${check.name}`)) {
                console.log(`✅ ${check.name} is declared`);
            } else {
                console.log(`⚠️  ${check.name} is used but may not be declared`);
            }
        }
    });
    
    // Check image files exist
    console.log('\n📋 Checking for image files...\n');
    const imagesDir = path.join(__dirname, 'images');
    if (fs.existsSync(imagesDir)) {
        console.log('✅ images/ directory exists');
        
        const ww1ImageFiles = ['camel.png', 'se5.png', 'dh2.png', 'nieuport24.png', 'sxiii.png', 'dri.png'];
        let foundImages = 0;
        ww1ImageFiles.forEach(img => {
            const imgPath = path.join(imagesDir, img);
            if (fs.existsSync(imgPath)) {
                foundImages++;
                console.log(`   ✅ ${img} exists`);
            } else {
                console.log(`   ❌ ${img} NOT found`);
            }
        });
        console.log(`\n   Found ${foundImages}/${ww1ImageFiles.length} WW1 image files`);
    } else {
        console.log('❌ images/ directory NOT found');
    }
    
} else {
    console.log('❌ dogfight.html NOT found');
}

console.log('\n' + '='.repeat(60));
console.log('✅ Quick diagnostics complete!');
console.log('\n💡 To run full browser diagnostics, install Playwright browsers:');
console.log('   npx playwright install chromium');

