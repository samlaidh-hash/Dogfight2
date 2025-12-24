#!/usr/bin/env python3
"""
Script to enhance visual effects in dogfight.html
"""

def enhance_bomb_explosion():
    """Add particle system to Bomb.explode()"""
    with open('dogfight.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the explode() method in Bomb class
    old_explode_start = """            explode() {
                if (this.hasExploded) return;
                this.hasExploded = true;
                this.explosionTime = Date.now();
                this.isActive = false;

                // Damage ground targets in radius"""

    new_explode_start = """            explode() {
                if (this.hasExploded) return;
                this.hasExploded = true;
                this.explosionTime = Date.now();
                this.isActive = false;

                // Create explosion particles
                const particleCount = 20 + Math.floor(Math.random() * 15); // 20-35 particles
                for (let i = 0; i < particleCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 30 + Math.random() * 70; // 30-100 m/s
                    const size = 2 + Math.random() * 4; // 2-6 size
                    const life = 0.6 + Math.random() * 0.6; // 0.6-1.2 seconds

                    explosionParticles.push({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: size,
                        life: life,
                        maxLife: life,
                        type: Math.random() < 0.4 ? 'debris' : 'fire', // 40% debris, 60% fire
                        createdAt: Date.now()
                    });
                }

                // Damage ground targets in radius"""

    if old_explode_start in content:
        content = content.replace(old_explode_start, new_explode_start, 1)
        print("✓ Enhanced Bomb.explode() with particles")
    else:
        print("✗ Could not find Bomb.explode() pattern")
        return False

    with open('dogfight.html', 'w', encoding='utf-8') as f:
        f.write(content)

    return True

def enhance_bomb_render():
    """Enhanced Bomb.render() with better explosion visuals"""
    with open('dogfight.html', 'r', encoding='utf-8') as f:
        content = f.read()

    old_render = """            render() {
                if (this.hasExploded) {
                    // Render explosion
                    const elapsed = Date.now() - this.explosionTime;
                    if (elapsed < 1000) {
                        const progress = elapsed / 1000;
                        const alpha = 1 - progress;
                        const size = (20 + progress * 40) * WORLD_SCALE;
                        const x = this.x * WORLD_SCALE;
                        const y = this.y * WORLD_SCALE;

                        // Orange fireball
                        ctx.fillStyle = `rgba(255, 150, 0, ${alpha * 0.8})`;
                        ctx.beginPath();
                        ctx.arc(x, y, size, 0, Math.PI * 2);
                        ctx.fill();

                        // Yellow core
                        ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
                        ctx.beginPath();
                        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
                        ctx.fill();

                        // Smoke
                        ctx.fillStyle = `rgba(40, 40, 40, ${alpha * 0.5})`;
                        ctx.beginPath();
                        ctx.arc(x, y, size * 1.2, 0, Math.PI * 2);
                        ctx.fill();
                    }"""

    new_render = """            render() {
                if (this.hasExploded) {
                    // Render enhanced explosion
                    const elapsed = Date.now() - this.explosionTime;
                    if (elapsed < 1200) {
                        const progress = elapsed / 1200;
                        const alpha = 1 - progress;
                        const size = (20 + progress * 50) * WORLD_SCALE;
                        const x = this.x * WORLD_SCALE;
                        const y = this.y * WORLD_SCALE;

                        // Expanding shockwave ring
                        if (progress < 0.4) {
                            const ringProgress = progress / 0.4;
                            const ringAlpha = (1 - ringProgress) * 0.6;
                            const ringSize = size * (0.8 + ringProgress * 1.5);
                            ctx.strokeStyle = `rgba(255, 200, 100, ${ringAlpha})`;
                            ctx.lineWidth = 4 * WORLD_SCALE;
                            ctx.beginPath();
                            ctx.arc(x, y, ringSize, 0, Math.PI * 2);
                            ctx.stroke();
                        }

                        // Outer smoke/dark ring
                        ctx.fillStyle = `rgba(60, 40, 30, ${alpha * 0.6})`;
                        ctx.beginPath();
                        ctx.arc(x, y, size * 1.3, 0, Math.PI * 2);
                        ctx.fill();

                        // Red-orange outer fireball
                        const gradient1 = ctx.createRadialGradient(x, y, 0, x, y, size);
                        gradient1.addColorStop(0, `rgba(255, 200, 100, ${alpha * 0.9})`);
                        gradient1.addColorStop(0.5, `rgba(255, 120, 0, ${alpha * 0.8})`);
                        gradient1.addColorStop(1, `rgba(180, 50, 0, 0)`);
                        ctx.fillStyle = gradient1;
                        ctx.beginPath();
                        ctx.arc(x, y, size, 0, Math.PI * 2);
                        ctx.fill();

                        // Bright yellow-white core
                        const coreSize = size * (0.4 - progress * 0.2);
                        const gradient2 = ctx.createRadialGradient(x, y, 0, x, y, coreSize);
                        gradient2.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                        gradient2.addColorStop(0.6, `rgba(255, 255, 150, ${alpha * 0.9})`);
                        gradient2.addColorStop(1, `rgba(255, 200, 50, 0)`);
                        ctx.fillStyle = gradient2;
                        ctx.beginPath();
                        ctx.arc(x, y, coreSize, 0, Math.PI * 2);
                        ctx.fill();

                        // Flash effect at start
                        if (progress < 0.15) {
                            const flashAlpha = (1 - progress / 0.15) * 0.7;
                            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                            ctx.beginPath();
                            ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }"""

    if old_render in content:
        content = content.replace(old_render, new_render, 1)
        print("✓ Enhanced Bomb.render() with better explosion visuals")
    else:
        print("✗ Could not find Bomb.render() pattern")
        return False

    with open('dogfight.html', 'w', encoding='utf-8') as f:
        f.write(content)

    return True

if __name__ == '__main__':
    import os
    os.chdir('/home/user/Dogfight2')

    print("Enhancing visual effects...")
    enhance_bomb_explosion()
    enhance_bomb_render()
    print("\nDone!")
