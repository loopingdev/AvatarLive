/**
 * Hubie Avatar Engine
 * Autonomous animated mascot extracted directly from the official Housebets
 * game "Hubie's Road" (https://www.housebets.com/games/housegames-hubie-s-road).
 *
 * Full-Screen 1080p Streamer Scale:
 * - High-resolution 440px streamer mascot
 * - Autonomous In-World Wardrobe / Dressing Room Door Routine:
 *   Hubie approaches the dressing booth, opens the door, steps inside,
 *   the booth wobbles comically while changing, and Hubie bursts out in fresh drip!
 * - Perfectly Tracked Astronaut Space Suit with Crystal Glass Bubble Helmet,
 *   visible facial expressions & lip-sync, and ion rocket thrusters.
 * - Official Housebets Halloween Spooky & Classic Gent costumes.
 * - Web Audio API Synthesizer (Arcade win chimes, wardrobe sounds, door sounds, fanfare).
 * - Multi-layered Party Paper (Confetti ribbons, spinning gold coins, and stars).
 */

class HubieSoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    playWinSound(multiplier = 2.0) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const isBigWin = multiplier >= 2.5;

        // Crystal Arcade Arpeggio Chime
        const notes = isBigWin
            ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]
            : [523.25, 659.25, 783.99, 1046.50];

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.24, now + idx * 0.08 + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.42);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.45);
        });

        if (isBigWin) {
            const chordTime = now + notes.length * 0.08 + 0.04;
            const chordFreqs = [523.25, 659.25, 783.99, 1046.50];
            chordFreqs.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, chordTime);

                gain.gain.setValueAtTime(0, chordTime);
                gain.gain.linearRampToValueAtTime(0.20, chordTime + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 1.4);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(chordTime);
                osc.stop(chordTime + 1.45);
            });
        }
    }

    playHopSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    playDoorOpenSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(260, now + 0.28);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.32);
    }

    playDoorCloseSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.20);
    }

    playWardrobeShuffleSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Cartoon spring boing & cloth shuffle
        [220, 330, 440].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.14);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.14 + 0.12);

            gain.gain.setValueAtTime(0.12, now + idx * 0.14);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.14);
            osc.stop(now + idx * 0.14 + 0.15);
        });
    }

    playRevealSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const chord = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
        chord.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 1.25);
        });
    }
}

/**
 * Realistic VIP Dressing Room Wardrobe Door on Stream Canvas
 * Architecturally authentic solid wood door, realistic casing, 3D perspective swing,
 * brass hardware, illuminated vanity interior, and 60fps locked rendering.
 */
class DressingRoomDoor {
    constructor(groundY = 1030) {
        this.active = false;
        this.groundY = groundY;
        this.x = 420;
        this.y = groundY;
        this.width = 350;
        this.height = 560;
        this.apertureW = 286;
        this.apertureH = 512;
        this.casingW = 32;
        this.casingTop = 32;

        this.doorAngle = 0; // 0 = closed, 1.36 = wide open (~78 deg)
        this.targetDoorAngle = 0;
        this.fadeAlpha = 0;
        this.targetFadeAlpha = 0;
        this.shakeX = 0;
        this.shakeTimer = 0;
        this.interiorGlow = 0;
    }

    triggerAppearance(x = 420) {
        this.x = x;
        this.active = true;
        this.fadeAlpha = 0;
        this.targetFadeAlpha = 1.0;
        this.doorAngle = 0;
        this.targetDoorAngle = 0;
        this.shakeX = 0;
        this.shakeTimer = 0;
        this.interiorGlow = 0;
    }

    openDoor() {
        this.targetDoorAngle = 1.36;
    }

    closeDoor() {
        this.targetDoorAngle = 0;
    }

    startChanging(duration = 1200) {
        this.shakeTimer = duration;
    }

    startShaking(duration = 1200) {
        this.startChanging(duration);
    }

    triggerDismiss() {
        this.targetDoorAngle = 0;
        this.targetFadeAlpha = 0;
    }

    update(dt) {
        if (!this.active) return;

        // Smooth alpha fade in / out
        const fadeSpeed = dt * 0.0035;
        if (this.fadeAlpha < this.targetFadeAlpha) {
            this.fadeAlpha = Math.min(this.targetFadeAlpha, this.fadeAlpha + fadeSpeed);
        } else if (this.fadeAlpha > this.targetFadeAlpha) {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - fadeSpeed);
            if (this.fadeAlpha <= 0.01 && this.targetFadeAlpha === 0) {
                this.active = false;
                return;
            }
        }

        // Smooth physical spring kinematics for door swing
        const diff = this.targetDoorAngle - this.doorAngle;
        const springK = 0.00032;
        const damping = 0.86;
        this.doorVelocity = (this.doorVelocity || 0) + diff * springK * dt;
        this.doorVelocity *= Math.pow(damping, dt / 16);
        this.doorAngle += this.doorVelocity * dt;
        this.doorAngle = Math.max(0, Math.min(1.42, this.doorAngle));

        // Light spill matches door aperture opening
        this.interiorGlow = Math.sin(Math.min(Math.PI * 0.5, this.doorAngle));

        // Subtle realistic wardrobe wobble while changing inside
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            this.shakeX = Math.sin(performance.now() * 0.038) * 3.5;
        } else {
            this.shakeX = 0;
        }
    }

    /**
     * Draw Interior Dressing Room (Drawn BEHIND Hubie)
     */
    drawInterior(ctx) {
        if (!this.active || this.fadeAlpha <= 0.01) return;

        ctx.save();
        ctx.translate(this.x + this.shakeX, this.y);
        ctx.globalAlpha = this.fadeAlpha;

        const halfW = this.width / 2;
        const apHalfW = this.apertureW / 2;
        const apH = this.apertureH;

        // 1. Soft Floor Shadow beneath wardrobe
        ctx.beginPath();
        ctx.ellipse(0, 4, halfW * 1.08, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fill();

        // 2. Light Spill Beam on stage floor (visible when door is swinging open)
        if (this.doorAngle > 0.04) {
            ctx.save();
            const beamSpread = 160 * this.interiorGlow;
            const beamDist = 120 * this.interiorGlow;
            const beamGrad = ctx.createLinearGradient(0, 0, 0, beamDist);
            beamGrad.addColorStop(0, `rgba(254, 240, 138, ${0.45 * this.interiorGlow})`);
            beamGrad.addColorStop(0.5, `rgba(253, 224, 71, ${0.22 * this.interiorGlow})`);
            beamGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');

            ctx.beginPath();
            ctx.moveTo(-apHalfW + 20, 0);
            ctx.lineTo(-apHalfW - beamSpread, beamDist);
            ctx.lineTo(apHalfW + beamSpread, beamDist);
            ctx.lineTo(apHalfW - 20, 0);
            ctx.closePath();
            ctx.fillStyle = beamGrad;
            ctx.fill();
            ctx.restore();
        }

        // 3. Room Interior (Clipped within door aperture)
        ctx.save();
        ctx.beginPath();
        ctx.rect(-apHalfW, -apH, this.apertureW, apH);
        ctx.clip();

        // Deep Back Wall Tone (Warm dark cherry / mahogany room)
        const wallGrad = ctx.createLinearGradient(0, -apH, 0, 0);
        wallGrad.addColorStop(0, '#1c1012');
        wallGrad.addColorStop(0.7, '#2a171a');
        wallGrad.addColorStop(1, '#3b1d22');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(-apHalfW, -apH, this.apertureW, apH);

        // Perspective Floor Planks inside room
        ctx.fillStyle = '#1a0f0d';
        ctx.beginPath();
        ctx.moveTo(-apHalfW, -60);
        ctx.lineTo(apHalfW, -60);
        ctx.lineTo(apHalfW, 0);
        ctx.lineTo(-apHalfW, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#2d1810';
        ctx.lineWidth = 1.5;
        [-60, -20, 20, 60].forEach(px => {
            ctx.beginPath();
            ctx.moveTo(px * 0.7, -60);
            ctx.lineTo(px * 1.3, 0);
            ctx.stroke();
        });

        // Hollywood Vanity Mirror on back wall
        const mirrorW = 140;
        const mirrorH = 260;
        const mirrorX = -mirrorW / 2;
        const mirrorY = -apH + 70;

        // Mirror Frame
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.roundRect(mirrorX - 6, mirrorY - 6, mirrorW + 12, mirrorH + 12, [mirrorW / 2, mirrorW / 2, 8, 8]);
        ctx.fill();

        // Mirror Glass Surface with warm reflection
        const mirrorGrad = ctx.createLinearGradient(mirrorX, mirrorY, mirrorX + mirrorW, mirrorY + mirrorH);
        mirrorGrad.addColorStop(0, '#fef08a');
        mirrorGrad.addColorStop(0.35, '#fde047');
        mirrorGrad.addColorStop(0.75, '#eab308');
        mirrorGrad.addColorStop(1, '#ca8a04');
        ctx.fillStyle = mirrorGrad;
        ctx.beginPath();
        ctx.roundRect(mirrorX, mirrorY, mirrorW, mirrorH, [mirrorW / 2 - 4, mirrorW / 2 - 4, 6, 6]);
        ctx.fill();

        // Mirror Specular Glare Diagonal
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(mirrorX + 20, mirrorY + 10);
        ctx.lineTo(mirrorX + 50, mirrorY + 10);
        ctx.lineTo(mirrorX + 25, mirrorY + mirrorH - 20);
        ctx.lineTo(mirrorX - 5, mirrorY + mirrorH - 20);
        ctx.closePath();
        ctx.fill();

        // Vanity Light Bulbs along mirror perimeter
        const bulbCount = 8;
        for (let i = 0; i < bulbCount; i++) {
            const angle = Math.PI + (i / (bulbCount - 1)) * Math.PI;
            const bx = Math.cos(angle) * (mirrorW / 2 + 1);
            const by = mirrorY + mirrorW / 2 + Math.sin(angle) * (mirrorW / 2 + 1);

            // Glow aura
            const aura = ctx.createRadialGradient(bx, by, 1, bx, by, 12);
            aura.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
            aura.addColorStop(0.5, 'rgba(253, 224, 71, 0.35)');
            aura.addColorStop(1, 'rgba(253, 224, 71, 0)');
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(bx, by, 12, 0, Math.PI * 2);
            ctx.fill();

            // Bulb glass
            ctx.fillStyle = '#fffbeb';
            ctx.beginPath();
            ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Wardrobe Hanging Rail with Costumes
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-apHalfW + 15, -apH + 45);
        ctx.lineTo(apHalfW - 15, -apH + 45);
        ctx.stroke();

        // Hangers
        [-90, 85].forEach(hx => {
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(hx, -apH + 47);
            ctx.lineTo(hx - 24, -apH + 72);
            ctx.lineTo(hx + 24, -apH + 72);
            ctx.closePath();
            ctx.stroke();
        });

        // Interior Ambient Glow Wash
        const glowGrad = ctx.createRadialGradient(0, -apH * 0.5, 30, 0, -apH * 0.5, apH * 0.7);
        glowGrad.addColorStop(0, 'rgba(254, 240, 138, 0.32)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(-apHalfW, -apH, this.apertureW, apH);

        ctx.restore(); // end aperture clip
        ctx.restore();
    }

    /**
     * Draw Outer Frame & Swinging Door Panel (Drawn IN FRONT OF Hubie)
     */
    drawFrameAndDoor(ctx) {
        if (!this.active || this.fadeAlpha <= 0.01) return;

        ctx.save();
        ctx.translate(this.x + this.shakeX, this.y);
        ctx.globalAlpha = this.fadeAlpha;

        const halfW = this.width / 2;
        const h = this.height;
        const apHalfW = this.apertureW / 2;
        const apH = this.apertureH;

        // 1. Solid Brass Floor Sill / Threshold Kickplate
        const sillGrad = ctx.createLinearGradient(-halfW, 0, halfW, 0);
        sillGrad.addColorStop(0, '#78350f');
        sillGrad.addColorStop(0.2, '#d97706');
        sillGrad.addColorStop(0.5, '#fef08a');
        sillGrad.addColorStop(0.8, '#d97706');
        sillGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = sillGrad;
        ctx.fillRect(-halfW - 6, -8, this.width + 12, 10);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-halfW - 6, -8, this.width + 12, 10);

        // 2. Inner Door Jamb Depth (Wall Thickness Reveal)
        ctx.fillStyle = '#22110c';
        ctx.fillRect(-apHalfW, -apH, 16, apH); // Left jamb reveal
        ctx.fillRect(apHalfW - 16, -apH, 16, apH); // Right jamb reveal
        ctx.fillRect(-apHalfW, -apH, this.apertureW, 14); // Top jamb header

        // Brass Strike Plate on Right Jamb
        ctx.fillStyle = '#d97706';
        ctx.fillRect(apHalfW - 14, -apH * 0.52, 6, 38);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(apHalfW - 12, -apH * 0.52 + 10, 3, 18); // latch hole

        // 3. Architectural Wood Casing / Architrave (Left, Right, and Top Lintel)
        const drawCasing = (x, y, w, h) => {
            // Base wood tone
            const woodGrad = ctx.createLinearGradient(x, y, x + w, y);
            woodGrad.addColorStop(0, '#2e140d');
            woodGrad.addColorStop(0.3, '#542618');
            woodGrad.addColorStop(0.7, '#421d12');
            woodGrad.addColorStop(1, '#230e09');
            ctx.fillStyle = woodGrad;
            ctx.fillRect(x, y, w, h);

            // 3D Beveled Molding Lines
            ctx.strokeStyle = '#7c3f25';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 3, y + 2, w - 6, h - 4);
            ctx.strokeStyle = '#1b0b07';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 8, y + 4, w - 16, h - 8);
        };

        // Left Casing
        drawCasing(-halfW, -h, this.casingW, h);
        // Right Casing
        drawCasing(apHalfW, -h, this.casingW, h);
        // Top Header Casing
        drawCasing(-halfW, -h, this.width, this.casingTop);

        // Base Plinth Blocks (Bottom of each casing)
        ctx.fillStyle = '#251009';
        ctx.fillRect(-halfW - 2, -46, this.casingW + 4, 42);
        ctx.fillRect(apHalfW - 2, -46, this.casingW + 4, 42);
        ctx.strokeStyle = '#632c18';
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfW - 2, -46, this.casingW + 4, 42);
        ctx.strokeRect(apHalfW - 2, -46, this.casingW + 4, 42);

        // 4. Elegant Brass Nameplate above Door: "VIP WARDROBE"
        const plaqueW = 160;
        const plaqueH = 26;
        const plaqueX = -plaqueW / 2;
        const plaqueY = -h - 18;

        const plaqueGrad = ctx.createLinearGradient(plaqueX, plaqueY, plaqueX + plaqueW, plaqueY + plaqueH);
        plaqueGrad.addColorStop(0, '#92400e');
        plaqueGrad.addColorStop(0.25, '#d97706');
        plaqueGrad.addColorStop(0.5, '#fef08a');
        plaqueGrad.addColorStop(0.75, '#d97706');
        plaqueGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = plaqueGrad;
        ctx.beginPath();
        ctx.roundRect(plaqueX, plaqueY, plaqueW, plaqueH, 4);
        ctx.fill();

        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Plaque Screws
        [-plaqueW / 2 + 7, plaqueW / 2 - 7].forEach(sx => {
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.arc(sx, plaqueY + plaqueH / 2, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Plaque Text
        ctx.font = 'bold 11px "Georgia", "Times New Roman", serif';
        ctx.fillStyle = '#2a1205';
        ctx.textAlign = 'center';
        ctx.fillText('✦ VIP WARDROBE ✦', 0, plaqueY + 17);

        // 5. 3D Swinging Door Panel with Physical Slab Thickness & Floor Shadow
        ctx.save();
        const hingeX = -apHalfW + 4;
        ctx.translate(hingeX, 0);

        const doorH = apH - 4;
        const doorW = this.apertureW - 8;
        const theta = this.doorAngle; // 0 (closed) to 1.36 rad (open)
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        // 3D Perspective Projection Coordinates:
        // As door swings open toward camera, the free edge sweeps forward:
        const freeX = doorW * cosT;
        const deltaY = (doorW * sinT) * 0.055; // vertical perspective expansion on free edge
        const doorThickness = 16;
        const thickX = doorThickness * sinT;
        const thickY = doorThickness * cosT * 0.04;

        // A. Dynamic Floor Cast Shadow under the swinging door
        if (theta > 0.03) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(freeX, deltaY);
            ctx.lineTo(freeX + thickX, deltaY + 12 * sinT);
            ctx.lineTo(0, 8 * sinT);
            ctx.closePath();
            const shadowGrad = ctx.createLinearGradient(0, 0, freeX, deltaY);
            shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.48)');
            shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
            ctx.fillStyle = shadowGrad;
            ctx.fill();
            ctx.restore();
        }

        // B. Brass Hinges on Casing Side (stationary hinge pins)
        const drawHinge = (hy) => {
            ctx.fillStyle = '#d97706';
            ctx.fillRect(-6, hy - 16, 7, 32);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(-5, hy - 14, 2, 28);
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.arc(-2.5, hy, 3.5, 0, Math.PI * 2);
            ctx.fill();
        };
        drawHinge(-doorH + 60);
        drawHinge(-doorH * 0.5);
        drawHinge(-60);

        // C. Physical Door Thickness Face (Wood Slab Edge, visible when swinging open!)
        if (theta > 0.04) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(freeX, -doorH - deltaY);
            ctx.lineTo(freeX, deltaY);
            ctx.lineTo(freeX + thickX, deltaY - thickY);
            ctx.lineTo(freeX + thickX, -doorH - deltaY - thickY);
            ctx.closePath();

            const edgeGrad = ctx.createLinearGradient(freeX, 0, freeX + thickX, 0);
            edgeGrad.addColorStop(0, '#1c0a06');
            edgeGrad.addColorStop(0.5, '#36160d');
            edgeGrad.addColorStop(1, '#1b0804');
            ctx.fillStyle = edgeGrad;
            ctx.fill();
            ctx.strokeStyle = '#4e2316';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Spring-Loaded Solid Brass Latch Tongue
            const latchY = -doorH * 0.5 + deltaY * 0.5;
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.moveTo(freeX + thickX * 0.25, latchY - 12);
            ctx.lineTo(freeX + thickX * 0.75 + 5 * sinT, latchY - 6);
            ctx.lineTo(freeX + thickX * 0.75 + 5 * sinT, latchY + 6);
            ctx.lineTo(freeX + thickX * 0.25, latchY + 12);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }

        // D. 3D Door Main Panel (True perspective quad with bevel panels & hardware)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, -doorH);
        ctx.lineTo(freeX, -doorH - deltaY);
        ctx.lineTo(freeX, deltaY);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.clip(); // clip door surface graphics inside 3D quad

        // 3D Perspective affine transform for panel surface
        const slopeY = deltaY / doorW;
        const scaleH = (doorH + deltaY * 2) / doorH;
        ctx.transform(cosT, slopeY, 0, scaleH, 0, 0);

        // Rich wood surface with ambient angle illumination
        const woodShade = 0.68 + 0.32 * cosT;
        const doorWood = ctx.createLinearGradient(0, -doorH, doorW, 0);
        doorWood.addColorStop(0, `rgba(54, 24, 15, ${woodShade})`);
        doorWood.addColorStop(0.4, `rgba(84, 40, 26, ${woodShade})`);
        doorWood.addColorStop(0.8, `rgba(67, 31, 20, ${woodShade})`);
        doorWood.addColorStop(1, `rgba(44, 18, 10, ${woodShade})`);
        ctx.fillStyle = doorWood;
        ctx.fillRect(0, -doorH, doorW, doorH);

        // Door Edge Outline
        ctx.strokeStyle = '#6e3621';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(0, -doorH, doorW, doorH);

        // 4 Raised Wood Panels
        const panelMarginX = 22;
        const panelW = (doorW - panelMarginX * 3) / 2;
        const topPanelH = doorH * 0.44;
        const btmPanelH = doorH * 0.36;

        const drawDoorPanel = (px, py, pw, ph) => {
            ctx.fillStyle = '#200c07';
            ctx.fillRect(px, py, pw, ph);

            const innerGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
            innerGrad.addColorStop(0, '#4f2417');
            innerGrad.addColorStop(1, '#34150d');
            ctx.fillStyle = innerGrad;
            ctx.fillRect(px + 6, py + 6, pw - 12, ph - 12);

            ctx.strokeStyle = '#7c3f25';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px, py + ph);
            ctx.lineTo(px, py);
            ctx.lineTo(px + pw, py);
            ctx.stroke();

            ctx.strokeStyle = '#180704';
            ctx.beginPath();
            ctx.moveTo(px + pw, py);
            ctx.lineTo(px + pw, py + ph);
            ctx.lineTo(px, py + ph);
            ctx.stroke();
        };

        const topY = -doorH + 28;
        const btmY = -doorH * 0.44;
        drawDoorPanel(panelMarginX, topY, panelW, topPanelH);
        drawDoorPanel(panelMarginX * 2 + panelW, topY, panelW, topPanelH);
        drawDoorPanel(panelMarginX, btmY, panelW, btmPanelH);
        drawDoorPanel(panelMarginX * 2 + panelW, btmY, panelW, btmPanelH);

        // Brass Mortise Backplate & Lever Handle with cast shadow
        const handleX = doorW - 28;
        const handleY = -doorH * 0.5;

        // Cast Shadow beneath brass handle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.roundRect(handleX - 5, handleY - 33, 14, 70, 4);
        ctx.fill();

        // Backplate
        const plateGrad = ctx.createLinearGradient(handleX - 8, handleY - 35, handleX + 8, handleY + 35);
        plateGrad.addColorStop(0, '#92400e');
        plateGrad.addColorStop(0.5, '#fef08a');
        plateGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = plateGrad;
        ctx.beginPath();
        ctx.roundRect(handleX - 7, handleY - 35, 14, 70, 4);
        ctx.fill();
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Keyhole
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(handleX, handleY + 16, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(handleX - 1.5, handleY + 16, 3, 7);

        // Lever Handle Shaft & Grip
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(handleX, handleY - 10, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = plateGrad;
        ctx.beginPath();
        ctx.roundRect(handleX - 28, handleY - 14, 30, 8, 4);
        ctx.fill();
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore(); // end door main face clip
        ctx.restore(); // end door transform group
        ctx.restore();
    }

    /**
     * Fallback single draw method
     */
    draw(ctx) {
        this.drawInterior(ctx);
        this.drawFrameAndDoor(ctx);
    }
}

class HubieAvatar {
    constructor(canvasId, speechBubbleId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.speechBubble = document.getElementById(speechBubbleId);
        this.speechBubbleHideTimer = null;

        // Web Audio Synthesizer
        this.sound = new HubieSoundEffects();
        window.addEventListener('click', () => this.sound.init(), { once: true });
        window.addEventListener('keydown', () => this.sound.init(), { once: true });

        // Full-Screen Stream Stage (1920x1080)
        this.groundY = 1030;
        this.x = 880;
        this.targetX = 880;
        this.baseHeight = 440;
        this.direction = 1;

        // In-World Wardrobe Booth
        this.dressingRoom = new DressingRoomDoor(this.groundY);
        this.isChangingCostume = false;
        this.costumeRoutinePhase = null;
        this.routineTimer = 0;
        this.doorTargetX = 420;
        this.dressingScale = 1.0;
        this.inDressingRoom = false;
        this.pendingCostume = 'classic';

        // Costume System ('classic' | 'boss' | 'halloween' | 'surfer')
        this.currentCostume = 'classic';

        // Classic Gent & Official Housebets X Pose Metrics
        this.classicMetrics = {
            spriteSizes: {
                stand: [458, 562],
                crouch: [431, 502],
                jump: [530, 562],
                land: [450, 509],
                celebrate: [390, 580],
                scared: [272, 462],
                fall: [505, 572],
                // Official Housebets X Media Poses:
                flex: [958, 991],
                flag: [790, 965],
                dance: [867, 1028],
                highroller: [574, 958],
                snack: [862, 796],
                blush: [619, 895],
                whistle: [910, 989],
                magnifier: [907, 926],
                boss: [809, 972],
                surfer: [850, 942]
            },
            anchors: {
                stand: 0.3809,
                crouch: 0.4380,
                jump: 0.4631,
                land: 0.4241,
                celebrate: 0.5228,
                scared: 0.4984,
                fall: 0.4719,
                // Official Housebets X Media Anchors:
                flex: 0.50,
                flag: 0.46,
                dance: 0.50,
                highroller: 0.45,
                snack: 0.50,
                blush: 0.50,
                whistle: 0.48,
                magnifier: 0.48,
                boss: 0.48,
                surfer: 0.52
            },
            mouthOffsets: {
                stand:     [217, 193],
                crouch:    [288, 202],
                jump:      [313, 190],
                land:      [266, 193],
                celebrate: [222, 205],
                scared:    [136, 115],
                fall:      [232, 196],
                // Official Housebets X Media Mouth Coordinates:
                flex:       [480, 290],
                flag:       [380, 310],
                dance:      [510, 270],
                highroller: [360, 220],
                snack:      [440, 330],
                blush:      [300, 340],
                whistle:    [420, 340],
                magnifier:  [450, 290],
                boss:       [330, 270],
                surfer:     [330, 220]
            },
            smileWidths: {
                stand: 54, crouch: 58, jump: 56, land: 54, celebrate: 52, scared: 38, fall: 50,
                flex: 56, flag: 56, dance: 60, highroller: 52, snack: 54, blush: 48, whistle: 30, magnifier: 54, boss: 56, surfer: 56
            }
        };

        // Official Halloween Wizard Costume Metrics
        this.halloweenMetrics = {
            spriteSizes: {
                stand: [387, 565],
                crouch: [501, 555],
                jump: [561, 533],
                land: [424, 500],
                celebrate: [411, 582],
                scared: [335, 468],
                fall: [461, 485],
                flex: [958, 991],
                flag: [790, 965],
                dance: [867, 1028],
                highroller: [574, 958],
                snack: [862, 796],
                blush: [619, 895],
                whistle: [910, 989],
                magnifier: [907, 926],
                boss: [809, 972],
                surfer: [850, 942]
            },
            anchors: {
                stand: 0.4334,
                crouch: 0.4578,
                jump: 0.4217,
                land: 0.4697,
                celebrate: 0.4911,
                scared: 0.4938,
                fall: 0.4334,
                flex: 0.50, flag: 0.46, dance: 0.50, highroller: 0.45,
                snack: 0.50, blush: 0.50, whistle: 0.48, magnifier: 0.48, boss: 0.48, surfer: 0.52
            },
            mouthOffsets: {
                stand:     [184, 198],
                crouch:    [248, 206],
                jump:      [275, 185],
                land:      [215, 192],
                celebrate: [208, 204],
                scared:    [168, 120],
                fall:      [212, 188],
                flex:       [480, 290],
                flag:       [380, 310],
                dance:      [510, 270],
                highroller: [360, 220],
                snack:      [440, 330],
                blush:      [300, 340],
                whistle:    [420, 340],
                magnifier:  [450, 290],
                boss:       [330, 270],
                surfer:     [330, 220]
            },
            smileWidths: {
                stand: 52, crouch: 56, jump: 54, land: 52, celebrate: 50, scared: 36, fall: 48,
                flex: 56, flag: 56, dance: 60, highroller: 52, snack: 54, blush: 48, whistle: 30, magnifier: 54, boss: 56, surfer: 56
            }
        };

        // Preload Costume Sprites
        this.costumeSprites = {
            classic: {},
            halloween: {}
        };
        this.spritesLoaded = {
            classic: {},
            halloween: {}
        };
        this.allLoaded = false;

        this.loadCostumeAssets();

        // Smooth Pose Crossfading Engine
        this.currentPose = 'stand';
        this.prevPose = 'stand';
        this.poseBlend = 1.0;
        this.poseBlendDuration = 160;

        // State Machine
        this.state = 'IDLE'; // IDLE, HOPPING, SURFING, FLIPPING, ZERO_G, DANCING, CELEBRATING, LOSS_REACTION, CHANGING_COSTUME
        this.isSpeaking = false;
        this.characterAlpha = 1.0;

        // Smooth Mouth Lip-Sync Engine
        this.mouthOpenness = 0;
        this.targetMouthOpenness = 0;
        this.mouthAlpha = 0;
        this.targetMouthAlpha = 0;
        this.mouthCurX = 0;
        this.mouthCurY = 0;
        this.initMouthCoords();

        // Smoothed Transforms
        this.curScaleX = 1.0;
        this.curScaleY = 1.0;
        this.curRotation = 0;
        this.curHopOffset = 0;

        // Locomotion Engines
        this.isHopping = false;
        this.hopProgress = 0;
        this.hopDuration = 480;
        this.hopStartX = 880;
        this.hopTargetX = 880;
        this.hopHeight = 110;
        this.hopStage = 'crouch';

        this.isSurfing = false;
        this.surfSpeed = 7.5;
        this.surfWaveProgress = 0;

        this.isFlipping = false;
        this.flipProgress = 0;
        this.flipDuration = 680;

        this.isZeroG = false;
        this.zeroGTimer = 0;

        this.isDancing = false;
        this.danceTimer = 0;

        // Visual FX & Particles
        this.confettiParticles = [];
        this.waterRipples = [];
        this.surfSprayParticles = [];
        this.spaceThrusterParticles = [];
        this.floatingSymbolParticles = []; // For hearts (♥), music notes (♪ ♫), stars (✦)
        this.hatFly = { active: false, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vrot: 0 };
        this.splashFx = { active: false, timer: 0, maxTime: 750, x: 0, y: 0 };

        // Special Poses & Expressions from Official @HousebetsHubie
        this.isSpecialPose = false;
        this.specialPoseTimer = 0;
        this.specialPoseDuration = 0;

        // Roaming Waypoints
        this.waypoints = [
            { name: 'center', x: 880 },
            { name: 'game_inspect', x: 420 },
            { name: 'chat_greet', x: 1220 },
            { name: 'roam_left', x: 260 },
            { name: 'roam_right', x: 1140 }
        ];
        this.roamInterval = setInterval(() => this.autonomousRoam(), 11000);

        // Style changes dynamically whenever the game changes
        this.currentGameName = 'House Games';
        this.pendingCostumeChangeOnGameSwitch = false;

        // Start 60fps render loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.render(t));
    }

    loadCostumeAssets() {
        const classicAssets = {
            stand: '/assets/hubie_road/hubie-stand.webp',
            crouch: '/assets/hubie_road/hubie-crouch.webp',
            jump: '/assets/hubie_road/hubie-jump.webp',
            land: '/assets/hubie_road/hubie-land.webp',
            celebrate: '/assets/hubie_road/hubie-celebrate.webp',
            scared: '/assets/hubie_road/hubie-scared.webp',
            fall: '/assets/hubie_road/hubie-fall.webp',
            splash: '/assets/hubie_road/splash-big.webp',
            hat: '/assets/hubie_road/hat-solo.webp',
            // Official Housebets X Media Poses:
            flex: '/assets/hubie_poses/hubie_flex.png',
            flag: '/assets/hubie_poses/hubie_flag.png',
            dance: '/assets/hubie_poses/hubie_dance.png',
            highroller: '/assets/hubie_poses/hubie_highroller.png',
            snack: '/assets/hubie_poses/hubie_snack.png',
            blush: '/assets/hubie_poses/hubie_blush.png',
            whistle: '/assets/hubie_poses/hubie_whistle.png',
            magnifier: '/assets/hubie_poses/hubie_magnifier.png',
            boss: '/assets/hubie_poses/hubie_boss.png',
            surfer: '/assets/hubie_poses/hubie_surfer.png'
        };

        const halloweenAssets = {
            stand: '/assets/hubie_halloween/hubie-stand.webp',
            crouch: '/assets/hubie_halloween/hubie-crouch.webp',
            jump: '/assets/hubie_halloween/hubie-jump.webp',
            land: '/assets/hubie_halloween/hubie-land.webp',
            celebrate: '/assets/hubie_halloween/hubie-celebrate.webp',
            scared: '/assets/hubie_halloween/hubie-scared.webp',
            fall: '/assets/hubie_halloween/hubie-fall.webp',
            splash: '/assets/hubie_halloween/splash-big.webp',
            hat: '/assets/hubie_halloween/hat-solo.webp',
            flex: '/assets/hubie_poses/hubie_flex.png',
            flag: '/assets/hubie_poses/hubie_flag.png',
            dance: '/assets/hubie_poses/hubie_dance.png',
            highroller: '/assets/hubie_poses/hubie_highroller.png',
            snack: '/assets/hubie_poses/hubie_snack.png',
            blush: '/assets/hubie_poses/hubie_blush.png',
            whistle: '/assets/hubie_poses/hubie_whistle.png',
            magnifier: '/assets/hubie_poses/hubie_magnifier.png',
            boss: '/assets/hubie_poses/hubie_boss.png',
            surfer: '/assets/hubie_poses/hubie_surfer.png'
        };

        let loadedCount = 0;
        const total = Object.keys(classicAssets).length + Object.keys(halloweenAssets).length;

        const checkReady = () => {
            loadedCount++;
            if (loadedCount >= total) {
                this.allLoaded = true;
                console.log('[HubieAvatar] All official Hubie costumes & sprites loaded at 1080p stream scale.');
            }
        };

        for (const [key, src] of Object.entries(classicAssets)) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.spritesLoaded.classic[key] = true;
                checkReady();
            };
            this.costumeSprites.classic[key] = img;
        }

        for (const [key, src] of Object.entries(halloweenAssets)) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.spritesLoaded.halloween[key] = true;
                checkReady();
            };
            this.costumeSprites.halloween[key] = img;
        }
    }

    getActiveMetrics() {
        return this.currentCostume === 'halloween' ? this.halloweenMetrics : this.classicMetrics;
    }

    getActiveSprite(pose) {
        const theme = this.currentCostume === 'halloween' ? 'halloween' : 'classic';
        return this.costumeSprites[theme][pose] || this.costumeSprites.classic[pose];
    }

    isSpriteLoaded(pose) {
        const theme = this.currentCostume === 'halloween' ? 'halloween' : 'classic';
        return Boolean(this.spritesLoaded[theme][pose] || this.spritesLoaded.classic[pose]);
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    setPose(newPose) {
        if (newPose === this.currentPose) return;
        this.prevPose = this.currentPose;
        this.currentPose = newPose;
        this.poseBlend = 0.0;
    }

    // =========================================================================
    // SPECIAL CHARACTER POSES & FLOATING SYMBOL PARTICLES (FROM OFFICIAL X)
    // =========================================================================
    addHearts(x, y, count = 12) {
        for (let i = 0; i < count; i++) {
            this.floatingSymbolParticles.push({
                type: 'heart',
                char: Math.random() < 0.6 ? '♥' : '💕',
                x: x + (Math.random() * 140 - 70),
                y: y - 100 - Math.random() * 80,
                vx: (Math.random() - 0.5) * 1.8,
                vy: -(Math.random() * 2.5 + 1.2),
                size: Math.random() * 12 + 18,
                color: Math.random() < 0.5 ? '#ff2a70' : '#ff7597',
                alpha: 1.0,
                life: 1.0,
                decay: 0.012 + Math.random() * 0.008
            });
        }
    }

    addMusicNotes(x, y, count = 8) {
        const notes = ['♪', '♫', '♩', '♬'];
        for (let i = 0; i < count; i++) {
            this.floatingSymbolParticles.push({
                type: 'music',
                char: notes[Math.floor(Math.random() * notes.length)],
                x: x + (Math.random() * 100 - 50),
                y: y - 220 - Math.random() * 60,
                vx: (Math.random() - 0.5) * 2.2,
                vy: -(Math.random() * 2.2 + 1.0),
                size: Math.random() * 10 + 20,
                color: Math.random() < 0.5 ? '#f97316' : '#facc15',
                alpha: 1.0,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.008
            });
        }
    }

    addSparkles(x, y, count = 15) {
        const stars = ['✦', '★', '✧', '♦'];
        for (let i = 0; i < count; i++) {
            this.floatingSymbolParticles.push({
                type: 'sparkle',
                char: stars[Math.floor(Math.random() * stars.length)],
                x: x + (Math.random() * 160 - 80),
                y: y - 140 - Math.random() * 120,
                vx: (Math.random() - 0.5) * 3.0,
                vy: -(Math.random() * 2.8 + 1.5),
                size: Math.random() * 10 + 16,
                color: Math.random() < 0.5 ? '#ffd700' : '#00ffff',
                alpha: 1.0,
                life: 1.0,
                decay: 0.016 + Math.random() * 0.008
            });
        }
    }

    playSpecialPose(poseName, duration = 3500) {
        if (this.isChangingCostume) return;
        this.isSpecialPose = true;
        this.state = 'SPECIAL_POSE';
        this.specialPoseTimer = 0;
        this.specialPoseDuration = duration;
        this.setPose(poseName);

        if (poseName === 'flex') {
            this.addSparkles(this.x, this.groundY, 16);
            this.sound.playWinSound(1.5);
        } else if (poseName === 'flag') {
            this.addSparkles(this.x, this.groundY, 20);
            this.sound.playWinSound(2.0);
        } else if (poseName === 'dance') {
            this.triggerConfetti();
            this.sound.playWinSound(2.5);
        } else if (poseName === 'blush') {
            this.addHearts(this.x, this.groundY, 14);
        } else if (poseName === 'whistle') {
            this.addMusicNotes(this.x, this.groundY, 10);
        } else if (poseName === 'highroller' || poseName === 'boss') {
            this.addSparkles(this.x, this.groundY, 15);
        } else if (poseName === 'snack') {
            this.addSparkles(this.x, this.groundY - 50, 10);
        } else if (poseName === 'surfer') {
            this.addWaterRipple(this.x, this.groundY, 130);
            this.addSurfSpray(this.x, this.groundY);
        }
    }

    /**
     * Triggered automatically whenever Housebets switches to a new game
     * (e.g. Hilo -> Dragon Tower -> Mines -> Limbo -> Dice)
     * Hubie immediately steps into the VIP Wardrobe to switch his outfit for the new game!
     */
    onGameChanged(newGameName) {
        this.currentGameName = newGameName || 'House Games';
        console.log(`[Hubie Avatar] Game switched to ${this.currentGameName}. Triggering wardrobe style change!`);

        if (this.state === 'CELEBRATING' || this.state === 'LOSS_REACTION') {
            this.pendingCostumeChangeOnGameSwitch = true;
            return;
        }

        if (!this.isChangingCostume) {
            this.triggerCostumeChangeRoutine();
        }
    }

    /**
     * Autonomous VIP Dressing Room Door Routine
     * Alternates between Classic Gent, High-Roller Boss, Spooky Halloween, and Wave 2 Surfer!
     */
    triggerCostumeChangeRoutine(targetCostume = null) {
        if (this.isChangingCostume) return;
        this.isChangingCostume = true;
        this.state = 'CHANGING_COSTUME';

        // Rotate cleanly between the two 100% animated game costume sets: Classic OG & Halloween
        const sequence = ['classic', 'halloween'];
        let next = targetCostume;
        if (!next || !sequence.includes(next)) {
            const nextIdx = (sequence.indexOf(this.currentCostume) + 1) % sequence.length;
            next = sequence[nextIdx];
        }
        this.pendingCostume = next;

        // Position dressing room away from Hubie on the stream stage
        const doorX = this.x > 750 ? 440 : 1040;
        this.doorTargetX = doorX;
        this.dressingRoom.triggerAppearance(doorX);

        // Initialize state machine
        this.costumeRoutinePhase = 'WALKING_TO_DOOR';
        this.routineTimer = 0;
        this.dressingScale = 1.0;
        this.inDressingRoom = false;

        const gameCtx = this.currentGameName ? ` for ${this.currentGameName}` : '';
        this.setSpeaking(true, `New game incoming! Heading into the VIP wardrobe for fresh drip${gameCtx}!`);
        this.moveTo(doorX);
    }

    updateCostumeRoutine(dt) {
        if (!this.isChangingCostume) return;

        const door = this.dressingRoom;
        const doorX = this.doorTargetX;
        const dist = Math.abs(this.x - doorX);

        if (this.costumeRoutinePhase === 'WALKING_TO_DOOR') {
            // As Hubie gets within 220px of the door, the door swings open smoothly
            if (dist < 220 && door.targetDoorAngle < 0.1) {
                door.openDoor();
                this.sound.playDoorOpenSound();
            }

            // Hubie arrives at the door threshold and hop has completed
            if (dist <= 35 && !this.isHopping) {
                this.costumeRoutinePhase = 'STEPPING_IN';
                this.routineTimer = 0;
                this.setSpeaking(false);
                this.setPose('stand');
            }
        } else if (this.costumeRoutinePhase === 'STEPPING_IN') {
            this.routineTimer += dt;
            const progress = Math.min(1.0, this.routineTimer / 650);

            // Smoothly glide into center of doorway and scale down slightly for 3D perspective depth
            this.inDressingRoom = true;
            this.x += (doorX - this.x) * 0.18;
            this.dressingScale = 1.0 - progress * 0.15; // 1.0 down to 0.85

            if (progress >= 1.0) {
                this.costumeRoutinePhase = 'DOOR_CLOSING';
                this.routineTimer = 0;
                door.closeDoor();
                this.sound.playDoorCloseSound();
            }
        } else if (this.costumeRoutinePhase === 'DOOR_CLOSING') {
            // Wait for door to shut
            if (door.doorAngle < 0.08) {
                this.costumeRoutinePhase = 'CHANGING_INSIDE';
                this.routineTimer = 0;
                door.startChanging(1100);
                this.sound.playWardrobeShuffleSound();
                this.currentCostume = this.pendingCostume;
            }
        } else if (this.costumeRoutinePhase === 'CHANGING_INSIDE') {
            this.routineTimer += dt;
            if (this.routineTimer >= 1300) {
                this.costumeRoutinePhase = 'STEPPING_OUT';
                this.routineTimer = 0;
                door.openDoor();
                this.sound.playDoorOpenSound();
                this.sound.playRevealSound();
                this.sound.playWinSound(3.0);
                this.triggerConfetti();
                this.setPose(this.currentCostume === 'boss' ? 'boss' : (this.currentCostume === 'surfer' ? 'surfer' : 'celebrate'));

                // Delivery line with game context
                const gameCtx = this.currentGameName ? ` for ${this.currentGameName}` : '';
                let line = `Back in the gentleman sloth top hat and waistcoat! Clean drip secured${gameCtx}!`;
                if (this.currentCostume === 'halloween') {
                    line = `Spooky wizard cape equipped! Multiplying magic is unlocked${gameCtx} squad!`;
                } else if (this.currentCostume === 'boss') {
                    line = `High-roller boss suit with gold cufflinks locked in${gameCtx}! Big bets only squad!`;
                } else if (this.currentCostume === 'surfer') {
                    line = `Wave 2 surfer board ready${gameCtx}! Riding the multiplier tsunami squad!`;
                }
                this.setSpeaking(true, line);
            }
        } else if (this.costumeRoutinePhase === 'STEPPING_OUT') {
            this.routineTimer += dt;
            const progress = Math.min(1.0, this.routineTimer / 750);

            // Step out of the door onto the stream stage
            this.dressingScale = 0.85 + progress * 0.15; // scale back to 1.0
            const stepDir = doorX > 600 ? -1 : 1;
            this.x = doorX + (stepDir * progress * 90);

            if (progress >= 0.6) {
                this.inDressingRoom = false; // Step onto the main stage in front of the door frame
            }

            if (progress >= 1.0) {
                this.costumeRoutinePhase = 'DISMISSING';
                this.routineTimer = 0;
                door.closeDoor();
                this.sound.playDoorCloseSound();
                setTimeout(() => {
                    door.triggerDismiss();
                }, 1000);
            }
        } else if (this.costumeRoutinePhase === 'DISMISSING') {
            this.routineTimer += dt;
            if (this.routineTimer >= 2000) {
                this.isChangingCostume = false;
                this.state = 'IDLE';
                this.setPose('stand');
                this.setSpeaking(false);
                this.costumeRoutinePhase = null;
            }
        }
    }

    initMouthCoords() {
        const m = this.getActiveMetrics();
        const s = this.baseHeight / 562;
        const dX = -(m.spriteSizes.stand[0] * s) * m.anchors.stand;
        const dY = -(m.spriteSizes.stand[1] * s);
        this.mouthCurX = dX + m.mouthOffsets.stand[0] * s;
        this.mouthCurY = dY + m.mouthOffsets.stand[1] * s;
    }

    getPoseMouthCoords(pose) {
        const p = pose || 'stand';
        const m = this.getActiveMetrics();
        const s = this.baseHeight / 562;
        const rawSize = m.spriteSizes[p] || [458, 562];
        const anchor = m.anchors[p] !== undefined ? m.anchors[p] : 0.45;
        const offset = m.mouthOffsets[p] || m.mouthOffsets.stand;

        const dX = -(rawSize[0] * s) * anchor;
        const dY = -(rawSize[1] * s);

        return {
            x: dX + offset[0] * s,
            y: dY + offset[1] * s
        };
    }

    autonomousRoam() {
        if (this.state === 'IDLE' && !this.isSpeaking && !this.isHopping && !this.isSurfing && !this.isChangingCostume && !this.isSpecialPose) {
            const rand = Math.random();
            if (rand < 0.25) {
                const nextWaypoint = this.waypoints[Math.floor(Math.random() * this.waypoints.length)];
                this.acrobaticFlip(nextWaypoint.x);
            } else {
                const nextWaypoint = this.waypoints[Math.floor(Math.random() * this.waypoints.length)];
                this.moveTo(nextWaypoint.x);
            }
        }
    }

    moveTo(targetX) {
        if (this.state === 'CELEBRATING' || this.state === 'LOSS_REACTION') return;

        const clamped = Math.max(180, Math.min(1360, targetX));
        const dist = clamped - this.x;
        if (Math.abs(dist) > 20) {
            this.targetX = clamped;
            this.direction = dist > 0 ? 1 : -1;

            if (Math.abs(dist) >= 340 && !this.isSurfing && !this.isHopping && !this.isChangingCostume) {
                this.startSurfCruise();
            } else if (!this.isHopping && !this.isSurfing) {
                this.startNextHop();
            }
        }
    }

    startSurfCruise() {
        this.isSurfing = true;
        this.state = 'SURFING';
        this.setPose('crouch');
    }

    startNextHop() {
        const remainingDist = this.targetX - this.x;
        if (Math.abs(remainingDist) < 20) {
            this.isHopping = false;
            this.setPose('stand');
            if (this.state === 'HOPPING') this.state = 'IDLE';
            return;
        }

        this.isHopping = true;
        this.state = 'HOPPING';
        this.direction = Math.sign(remainingDist);

        const hopStride = Math.min(Math.abs(remainingDist), 180) * this.direction;
        this.hopStartX = this.x;
        this.hopTargetX = this.x + hopStride;
        this.hopProgress = 0;
        this.hopStage = 'crouch';
        this.sound.playHopSound();
    }

    acrobaticFlip(targetX) {
        if (this.isHopping || this.isSurfing || this.isFlipping || this.isChangingCostume) return;
        const clamped = Math.max(220, Math.min(1300, targetX || (this.x + 220)));
        this.isFlipping = true;
        this.state = 'FLIPPING';
        this.direction = clamped > this.x ? 1 : -1;
        this.hopStartX = this.x;
        this.hopTargetX = clamped;
        this.flipProgress = 0;
        this.sound.playHopSound();
    }

    startZeroGFloat(duration = 3500) {
        if (this.isZeroG || this.isChangingCostume) return;
        this.isZeroG = true;
        this.state = 'ZERO_G';
        this.zeroGTimer = 0;
        this.zeroGDuration = duration;
        this.setPose('jump');
    }

    startHypeDance(duration = 3200) {
        this.isDancing = true;
        this.state = 'DANCING';
        this.danceTimer = 0;
        this.danceDuration = duration;
    }

    setSpeaking(speaking, text = '', autoHideMs = null) {
        this.isSpeaking = Boolean(speaking);

        if (this.speechBubbleHideTimer) {
            clearTimeout(this.speechBubbleHideTimer);
            this.speechBubbleHideTimer = null;
        }

        if (this.speechBubble) {
            if (this.isSpeaking && text) {
                this.speechBubble.textContent = text;
                this.speechBubble.classList.add('visible');
                this.updateSpeechBubblePosition();

                // Keep speech bubble visible for at least 7.5 seconds (or custom autoHideMs)
                const duration = autoHideMs || 7500;
                this.speechBubbleHideTimer = setTimeout(() => {
                    this.isSpeaking = false;
                    if (this.speechBubble) {
                        this.speechBubble.classList.remove('visible');
                    }
                }, duration);
            } else if (!this.isSpeaking) {
                // When speaking ends via audio event, gracefully hold bubble for 5 seconds before fade
                this.speechBubbleHideTimer = setTimeout(() => {
                    if (!this.isSpeaking && this.speechBubble) {
                        this.speechBubble.classList.remove('visible');
                    }
                }, 5000);
            }
        }
    }

    updateSpeechBubblePosition(curY = this.groundY) {
        if (this.speechBubble) {
            const screenX = Math.max(60, Math.min(1320, this.x - 140));
            const screenY = Math.max(50, curY - this.baseHeight - 80);
            this.speechBubble.style.left = `${screenX}px`;
            this.speechBubble.style.top = `${screenY}px`;
        }
    }

    reactToWin(multiplier = 2.0) {
        if (this.isChangingCostume) return;
        this.isHopping = false;
        this.isSurfing = false;
        this.isFlipping = false;
        this.isSpecialPose = false;

        this.sound.playWinSound(multiplier);
        this.triggerConfetti();

        this.state = 'CELEBRATING';
        this.setPose('celebrate');
        if (multiplier >= 2.5) {
            this.startHypeDance(3600);
        } else {
            setTimeout(() => {
                if (this.state === 'CELEBRATING') {
                    this.state = 'IDLE';
                    this.setPose('stand');
                }
            }, 3800);
        }
    }

    reactToLoss() {
        if (this.isChangingCostume) return;
        this.state = 'LOSS_REACTION';
        this.setPose('scared');
        this.isHopping = false;
        this.isSurfing = false;
        this.isFlipping = false;
        this.isSpecialPose = false;

        setTimeout(() => {
            if (this.state === 'LOSS_REACTION') {
                this.setPose('fall');
                this.splashFx = {
                    active: true,
                    timer: 0,
                    maxTime: 750,
                    x: this.x,
                    y: this.groundY
                };

                this.hatFly = {
                    active: true,
                    x: this.x + (this.direction === 1 ? -25 : 25),
                    y: this.groundY - 330,
                    vx: -this.direction * 5.2,
                    vy: -14.0,
                    rot: 0,
                    vrot: -this.direction * 24
                };
            }
        }, 450);

        setTimeout(() => {
            if (this.state === 'LOSS_REACTION') {
                this.state = 'IDLE';
                this.setPose('stand');
                this.hatFly.active = false;
                this.splashFx.active = false;
            }
        }, 2800);
    }

    reactToChat(username) {
        if (this.isChangingCostume) return;
        // Physical locomotion towards the live stream chat overlay (right side: x=1050 to 1250)
        const chatTargetX = 1050 + Math.random() * 150;
        this.moveTo(chatTargetX);
        this.direction = 1;

        // Visual gratitude with floating neon hearts and audio chime
        this.addHearts(this.x, this.groundY, 12);
        this.sound.playWinSound(1.2);

        // Responsive mascot greeting speech bubble
        const greetings = [
            `Hey @${username}! Sloth squad is live! 🌴`,
            `Appreciate you chatting @${username}! Let's hunt these multipliers! 🚀`,
            `Much love @${username}! Thanks for riding with Hubie today! 💕`,
            `Yooo @${username}! Welcome to the 24/7 stream! 🔥`
        ];
        const line = greetings[Math.floor(Math.random() * greetings.length)];
        this.setSpeaking(true, line);
    }

    triggerConfetti() {
        this.confettiParticles = [];
        const colors = ['#00ffcc', '#ff007f', '#ffd700', '#00e5ff', '#ff5722', '#a855f7', '#ffffff'];

        for (let i = 0; i < 160; i++) {
            const isCoin = i % 5 === 0;
            const isRibbon = i % 2 === 0;
            this.confettiParticles.push({
                type: isCoin ? 'coin' : isRibbon ? 'ribbon' : 'star',
                x: this.x + (Math.random() * 220 - 110),
                y: this.groundY - 240,
                vx: (Math.random() - 0.5) * 24,
                vy: -(Math.random() * 20 + 12),
                size: isCoin ? Math.random() * 8 + 12 : Math.random() * 12 + 6,
                color: isCoin ? '#ffd700' : colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vr: (Math.random() - 0.5) * 22,
                rot3D: Math.random() * Math.PI,
                vrot3D: (Math.random() - 0.5) * 0.25,
                swayPhase: Math.random() * Math.PI * 2,
                life: 1.0
            });
        }
    }

    addWaterRipple(x, y, maxR = 90) {
        this.waterRipples.push({
            x,
            y,
            radius: 12,
            maxRadius: maxR,
            alpha: 0.85
        });
    }

    addSurfSpray(x, y) {
        for (let i = 0; i < 3; i++) {
            this.surfSprayParticles.push({
                x: x - this.direction * 40 + (Math.random() * 20 - 10),
                y: y - (Math.random() * 20),
                vx: -this.direction * (Math.random() * 4 + 2),
                vy: -(Math.random() * 4 + 2),
                size: Math.random() * 6 + 3,
                alpha: 0.85
            });
        }
    }

    addSpaceThruster(x, y) {
        for (let i = 0; i < 3; i++) {
            this.spaceThrusterParticles.push({
                x: x + (Math.random() * 20 - 10),
                y: y + (Math.random() * 12),
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 7 + 4,
                size: Math.random() * 6 + 3,
                alpha: 0.95
            });
        }
    }

    update(dt) {
        // Update Dressing Room Door
        this.dressingRoom.update(dt);
        this.updateCostumeRoutine(dt);

        // 1. Update Pose Crossfade Progress
        if (this.poseBlend < 1.0) {
            this.poseBlend = Math.min(1.0, this.poseBlend + dt / this.poseBlendDuration);
        }

        // 2. Locomotion Kinematics
        let targetScaleX = 1.0;
        let targetScaleY = 1.0;
        let targetRotation = 0;
        let targetHopOffset = 0;

        if (this.isHopping) {
            this.hopProgress += dt / this.hopDuration;
            if (this.hopProgress >= 1.0) {
                this.hopProgress = 1.0;
                this.x = this.hopTargetX;
                this.addWaterRipple(this.x, this.groundY, 110);
                if (Math.abs(this.targetX - this.x) > 20) {
                    this.startNextHop();
                } else {
                    this.isHopping = false;
                    this.setPose('stand');
                    if (this.state === 'HOPPING') this.state = 'IDLE';
                }
            } else {
                if (this.hopProgress < 0.18) {
                    this.hopStage = 'crouch';
                    this.setPose('crouch');
                    targetScaleX = 1.05;
                    targetScaleY = 0.94;
                } else if (this.hopProgress < 0.80) {
                    this.hopStage = 'jump';
                    this.setPose('jump');
                    const flightP = (this.hopProgress - 0.18) / (0.80 - 0.18);
                    this.x = this.hopStartX + (this.hopTargetX - this.hopStartX) * flightP;
                    targetHopOffset = Math.sin(flightP * Math.PI) * this.hopHeight;
                    targetRotation = this.direction * 0.10;
                    targetScaleX = 0.96;
                    targetScaleY = 1.04;
                } else {
                    this.hopStage = 'land';
                    this.setPose('land');
                    this.x = this.hopTargetX;
                    targetScaleX = 1.08;
                    targetScaleY = 0.92;
                }
            }
        } else if (this.isFlipping) {
            this.flipProgress += dt / this.flipDuration;
            if (this.flipProgress >= 1.0) {
                this.isFlipping = false;
                this.x = this.hopTargetX;
                this.setPose('land');
                this.addWaterRipple(this.x, this.groundY, 120);
                setTimeout(() => {
                    this.setPose('stand');
                    if (this.state === 'FLIPPING') this.state = 'IDLE';
                }, 180);
            } else {
                this.setPose('jump');
                const p = this.flipProgress;
                this.x = this.hopStartX + (this.hopTargetX - this.hopStartX) * p;
                targetHopOffset = Math.sin(p * Math.PI) * 190;
                targetRotation = this.direction * p * Math.PI * 2;
            }
        } else if (this.isZeroG) {
            this.zeroGTimer += dt;
            if (this.zeroGTimer >= this.zeroGDuration) {
                this.isZeroG = false;
                this.setPose('land');
                setTimeout(() => {
                    this.setPose('stand');
                    if (this.state === 'ZERO_G') this.state = 'IDLE';
                }, 250);
            } else {
                this.setPose('jump');
                const t = this.zeroGTimer * 0.003;
                targetHopOffset = 60 + Math.sin(t) * 35;
                targetRotation = Math.sin(t * 0.8) * 0.15;
                this.x += Math.cos(t * 0.5) * 1.5;
                this.addSpaceThruster(this.x - this.direction * 22, this.groundY - targetHopOffset + 40);
            }
        } else if (this.isDancing) {
            this.danceTimer += dt;
            if (this.danceTimer >= this.danceDuration) {
                this.isDancing = false;
                this.state = 'IDLE';
                this.setPose('stand');
            } else {
                this.setPose('celebrate');
                const t = this.danceTimer * 0.012;
                targetRotation = Math.sin(t) * 0.18;
                targetHopOffset = Math.abs(Math.sin(t * 2)) * 52;
                targetScaleX = 1.0 + Math.sin(t) * 0.08;
            }
        } else if (this.isSurfing) {
            const dist = this.targetX - this.x;
            this.direction = Math.sign(dist);

            if (Math.abs(dist) <= 15) {
                this.isSurfing = false;
                this.setPose('land');
                this.addWaterRipple(this.x, this.groundY, 130);
                setTimeout(() => {
                    this.setPose('stand');
                    if (this.state === 'SURFING') this.state = 'IDLE';
                }, 160);
            } else {
                this.setPose('crouch');
                this.x += this.direction * this.surfSpeed;
                this.surfWaveProgress += dt * 0.007;
                targetHopOffset = Math.sin(this.surfWaveProgress) * 14;
                targetRotation = this.direction * 0.12;
                targetScaleX = 1.04;
                targetScaleY = 0.96;

                this.addSurfSpray(this.x, this.groundY);
                if (Math.random() < 0.25) {
                    this.addWaterRipple(this.x, this.groundY, 70);
                }
            }
        } else if (this.state === 'CELEBRATING') {
            const bounce = Math.abs(Math.sin(performance.now() * 0.008)) * 48;
            targetHopOffset = bounce;
        } else if (this.state === 'LOSS_REACTION') {
            if (this.currentPose === 'scared') {
                this.x += Math.sin(performance.now() * 0.08) * 3.5;
            } else if (this.currentPose === 'fall') {
                targetRotation = -this.direction * 0.32;
                targetHopOffset = -12;
            }
        } else if (!this.isHopping && !this.isSurfing && !this.isFlipping) {
            const breath = Math.sin(performance.now() * 0.0035) * 4;
            targetHopOffset = -breath;
        }

        // Smooth Transform Lerping
        const lerpSpeed = Math.min(1.0, dt * 0.016);
        this.curScaleX += (targetScaleX - this.curScaleX) * lerpSpeed;
        this.curScaleY += (targetScaleY - this.curScaleY) * lerpSpeed;
        this.curRotation += (targetRotation - this.curRotation) * lerpSpeed;
        this.curHopOffset += (targetHopOffset - this.curHopOffset) * Math.min(1.0, dt * 0.024);

        // 4. Smooth Speech Lip-Sync Lerping
        if (this.isSpeaking) {
            const t = performance.now() * 0.001;
            const wave = (Math.sin(t * 14) + Math.sin(t * 24) * 0.5 + 1.2) * 0.4;
            this.targetMouthOpenness = Math.max(0.12, Math.min(0.92, wave));
            this.targetMouthAlpha = 1.0;
        } else {
            this.targetMouthOpenness = 0.0;
            this.targetMouthAlpha = 0.0;
        }

        this.mouthOpenness += (this.targetMouthOpenness - this.mouthOpenness) * Math.min(1.0, dt * 0.015);
        this.mouthAlpha += (this.targetMouthAlpha - this.mouthAlpha) * Math.min(1.0, dt * 0.012);

        // Face tracking across blended poses
        const blendFactor = this.easeInOutQuad(this.poseBlend);
        const curMouth = this.getPoseMouthCoords(this.currentPose);
        const prevMouth = this.getPoseMouthCoords(this.prevPose);

        this.mouthCurX = prevMouth.x + (curMouth.x - prevMouth.x) * blendFactor;
        this.mouthCurY = prevMouth.y + (curMouth.y - prevMouth.y) * blendFactor;

        // 5. Update Confetti Particles
        for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
            const p = this.confettiParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.40;
            p.vx *= 0.99;
            p.rotation += p.vr;
            p.rot3D += p.vrot3D;
            p.swayPhase += dt * 0.005;
            p.x += Math.sin(p.swayPhase) * 0.8;
            p.life -= dt * 0.00075;
            if (p.life <= 0) this.confettiParticles.splice(i, 1);
        }

        // 6. Update Space Thruster Particles
        for (let i = this.spaceThrusterParticles.length - 1; i >= 0; i--) {
            const p = this.spaceThrusterParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= dt * 0.0035;
            p.size = Math.max(0.5, p.size - dt * 0.006);
            if (p.alpha <= 0) this.spaceThrusterParticles.splice(i, 1);
        }

        // 7. Update Water Ripples
        for (let i = this.waterRipples.length - 1; i >= 0; i--) {
            const r = this.waterRipples[i];
            r.radius += dt * 0.08;
            r.alpha -= dt * 0.0014;
            if (r.alpha <= 0) this.waterRipples.splice(i, 1);
        }

        // 8. Update Surf Spray
        for (let i = this.surfSprayParticles.length - 1; i >= 0; i--) {
            const sp = this.surfSprayParticles[i];
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.vy += 0.2;
            sp.alpha -= dt * 0.003;
            if (sp.alpha <= 0) this.surfSprayParticles.splice(i, 1);
        }

        // 9. Update Flying Hat
        if (this.hatFly.active) {
            this.hatFly.x += this.hatFly.vx;
            this.hatFly.y += this.hatFly.vy;
            this.hatFly.vy += 0.48;
            this.hatFly.rot += this.hatFly.vrot;
            if (this.hatFly.y > this.groundY - 15) {
                this.hatFly.y = this.groundY - 15;
                this.hatFly.vx *= 0.55;
                this.hatFly.vy = -this.hatFly.vy * 0.35;
            }
        }

        // 10. Update Splash FX
        if (this.splashFx.active) {
            this.splashFx.timer += dt;
            if (this.splashFx.timer > this.splashFx.maxTime) {
                this.splashFx.active = false;
            }
        }

        // 11. Update Special Pose Timer
        if (this.isSpecialPose) {
            this.specialPoseTimer += dt;
            if (this.specialPoseTimer >= this.specialPoseDuration) {
                this.isSpecialPose = false;
                if (this.state === 'SPECIAL_POSE') {
                    this.state = 'IDLE';
                    this.setPose('stand');
                }
            }
        }

        // 12. Update Floating Symbol Particles (Hearts, Music Notes, Sparkles)
        for (let i = this.floatingSymbolParticles.length - 1; i >= 0; i--) {
            const p = this.floatingSymbolParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.floatingSymbolParticles.splice(i, 1);
            }
        }
    }

    render(time) {
        const dt = Math.min(50, time - this.lastTime);
        this.lastTime = time;
        this.update(dt);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Water Ripples
        for (const r of this.waterRipples) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.35, 0, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(0, 255, 204, ${Math.max(0, r.alpha)})`;
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();
            this.ctx.restore();
        }

        // 2. Draw Surf Spray Particles
        for (const sp of this.surfSprayParticles) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 229, 255, ${Math.max(0, sp.alpha)})`;
            this.ctx.fill();
            this.ctx.restore();
        }

        // 3. Draw Space Thruster Plasma
        for (const tp of this.spaceThrusterParticles) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(tp.x, tp.y, tp.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 255, 204, ${Math.max(0, tp.alpha)})`;
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.restore();
        }

        // 4. Draw Dressing Room Interior (Back layer behind character)
        this.dressingRoom.drawInterior(this.ctx);

        // 5. Draw Confetti behind Hubie
        this.drawConfetti();

        const curY = this.groundY - this.curHopOffset;

        // Keep speech bubble anchored smoothly above Hubie
        this.updateSpeechBubblePosition(curY);

        // 6. Draw Hubie Mascot
        if (this.characterAlpha > 0.01) {
            if (this.inDressingRoom) {
                // When Hubie is stepping inside the wardrobe room, clip inside door aperture
                // and scale slightly for 3D perspective depth, rendered BEHIND the door frame & swinging door!
                this.ctx.save();
                const door = this.dressingRoom;
                const apHalfW = door.apertureW / 2;
                this.ctx.beginPath();
                this.ctx.rect(door.x + door.shakeX - apHalfW, door.y - door.apertureH, door.apertureW, door.apertureH);
                this.ctx.clip();
                this.drawCharacterMascot(curY, this.dressingScale);
                this.ctx.restore();
            } else {
                // Normal stage drawing outside wardrobe
                this.drawCharacterMascot(curY, 1.0);
            }
        }

        // 7. Draw Dressing Room Architectural Casing & 3D Swinging Door (Foreground layer in front of interior & Hubie)
        this.dressingRoom.drawFrameAndDoor(this.ctx);

        // 7b. Draw Floating Symbols (Hearts, Music Notes, Sparkles) in front
        this.drawFloatingSymbols();

        // 7. Flying Hat on Loss
        const hatImg = this.currentCostume === 'halloween'
            ? this.costumeSprites.halloween.hat
            : this.costumeSprites.classic.hat;

        if (this.hatFly.active && hatImg) {
            this.ctx.save();
            this.ctx.translate(this.hatFly.x, this.hatFly.y);
            this.ctx.rotate((this.hatFly.rot * Math.PI) / 180);
            this.ctx.drawImage(hatImg, -55, -45, 110, 90);
            this.ctx.restore();
        }

        // 8. Water Splash on Loss
        const splashImg = this.costumeSprites.classic.splash;
        if (this.splashFx.active && splashImg) {
            this.ctx.save();
            const alpha = 1.0 - (this.splashFx.timer / this.splashFx.maxTime);
            this.ctx.globalAlpha = Math.max(0, alpha);
            this.ctx.drawImage(splashImg, this.splashFx.x - 170, this.splashFx.y - 180, 340, 230);
            this.ctx.restore();
        }

        requestAnimationFrame((t) => this.render(t));
    }

    drawCharacterMascot(curY, extraScale = 1.0) {
        // Ground Shadow
        this.ctx.save();
        this.ctx.translate(this.x, this.groundY);
        this.ctx.globalAlpha = this.characterAlpha;
        this.drawGroundShadow(curY);
        this.ctx.restore();

        // Hubie Mascot with Smooth Blended Pose Crossfading
        this.ctx.save();
        this.ctx.translate(this.x, curY);
        this.ctx.globalAlpha = this.characterAlpha;

        if (this.direction === -1) {
            this.ctx.scale(-1, 1);
        }

        this.ctx.rotate(this.curRotation);
        this.ctx.scale(this.curScaleX * extraScale, this.curScaleY * extraScale);

        // Draw Base Character Pose Sprites
        this.drawSmoothHubieSprite();

        // Draw Lip-Sync Overlay
        if (this.mouthAlpha > 0.02 && this.mouthOpenness > 0.03) {
            this.drawPrecisionLipSync();
        }

        this.ctx.restore();

        // Name Tag Badge (only when on stage outside wardrobe)
        if (!this.inDressingRoom) {
            this.drawBadge(this.x, this.groundY + 24);
        }
    }

    drawConfetti() {
        for (const p of this.confettiParticles) {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = Math.max(0, p.life);

            if (p.type === 'coin') {
                const flipX = Math.cos(p.rot3D);
                this.ctx.scale(flipX, 1.0);
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fill();

                this.ctx.lineWidth = 1.5;
                this.ctx.strokeStyle = '#fff275';
                this.ctx.stroke();

                this.ctx.fillStyle = '#b8860b';
                this.ctx.fillRect(-2, -2, 4, 4);
            } else if (p.type === 'ribbon') {
                const flipY = Math.cos(p.rot3D);
                this.ctx.scale(1.0, flipY);
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 2);
            } else {
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        }
    }

    drawGroundShadow(curY) {
        const heightOffGround = Math.max(0, this.groundY - curY);
        const shadowScale = Math.max(0.35, 1.0 - heightOffGround / 220);
        const shadowAlpha = Math.max(0.12, 0.48 - heightOffGround / 350);

        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 110 * shadowScale, 26 * shadowScale, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        this.ctx.fill();
    }

    drawSinglePose(pose, alpha = 1.0) {
        const img = this.getActiveSprite(pose);
        const isLoaded = this.isSpriteLoaded(pose);
        if (!img || !isLoaded) return;

        const m = this.getActiveMetrics();
        const rawSize = m.spriteSizes[pose] || [458, 562];
        const anchorRatio = m.anchors[pose] !== undefined ? m.anchors[pose] : 0.45;
        const scale = this.baseHeight / 562;

        const drawW = rawSize[0] * scale;
        const drawH = rawSize[1] * scale;
        const drawX = -drawW * anchorRatio;
        const drawY = -drawH;

        this.ctx.save();
        this.ctx.globalAlpha *= alpha;

        if (this.state === 'CELEBRATING') {
            this.ctx.shadowColor = '#00ffcc';
            this.ctx.shadowBlur = 40;
        }

        this.ctx.drawImage(img, drawX, drawY, drawW, drawH);
        this.ctx.restore();
    }

    drawSmoothHubieSprite() {
        if (!this.allLoaded) {
            this.drawProceduralFallback();
            return;
        }

        const blendFactor = this.easeInOutQuad(this.poseBlend);

        if (this.poseBlend < 1.0 && this.prevPose && this.prevPose !== this.currentPose) {
            this.drawSinglePose(this.prevPose, 1.0 - blendFactor);
            this.drawSinglePose(this.currentPose, blendFactor);
        } else {
            this.drawSinglePose(this.currentPose, 1.0);
        }
    }

    drawPrecisionLipSync() {
        const m = this.getActiveMetrics();
        const scale = this.baseHeight / 562;
        const blendFactor = this.easeInOutQuad(this.poseBlend);

        const prevSmileW = (m.smileWidths[this.prevPose] || 54) * scale;
        const curSmileW = (m.smileWidths[this.currentPose] || 54) * scale;
        const mouthW = prevSmileW + (curSmileW - prevSmileW) * blendFactor;
        const mouthH = (2 + this.mouthOpenness * 12) * scale;

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, Math.min(1.0, this.mouthAlpha));
        this.ctx.translate(this.mouthCurX, this.mouthCurY);

        this.ctx.beginPath();
        this.ctx.ellipse(0, mouthH * 0.15, mouthW * 0.48, mouthH * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#220b0d';
        this.ctx.fill();
        this.ctx.lineWidth = 1.8 * scale;
        this.ctx.strokeStyle = '#2d1214';
        this.ctx.stroke();

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(-mouthW * 0.42, -mouthH * 0.5, mouthW * 0.84, mouthH * 0.42);
        this.ctx.clip();
        this.ctx.beginPath();
        this.ctx.ellipse(0, -mouthH * 0.25, mouthW * 0.38, mouthH * 0.32, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fill();
        this.ctx.restore();

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.ellipse(0, mouthH * 0.15, mouthW * 0.44, mouthH * 0.45, 0, 0, Math.PI * 2);
        this.ctx.clip();
        this.ctx.beginPath();
        this.ctx.ellipse(0, mouthH * 0.28, mouthW * 0.32, mouthH * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ff4365';
        this.ctx.fill();
        this.ctx.restore();

        this.ctx.restore();
    }

    drawFloatingSymbols() {
        if (!this.floatingSymbolParticles || this.floatingSymbolParticles.length === 0) return;
        this.ctx.save();
        for (const p of this.floatingSymbolParticles) {
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, Math.min(1.0, p.alpha));
            this.ctx.font = `bold ${Math.round(p.size)}px "Segoe UI Emoji", "Inter", sans-serif`;
            this.ctx.fillStyle = p.color;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 12;
            this.ctx.fillText(p.char, p.x, p.y);
            this.ctx.restore();
        }
        this.ctx.restore();
    }

    drawBadge(x, y) {
        this.ctx.save();
        this.ctx.font = 'bold 15px "Inter", sans-serif';
        const costumeTag = this.currentCostume === 'halloween' ? '🎃 SPOOKY HUBIE'
            : this.currentCostume === 'boss' ? '💼 HIGH-ROLLER HUBIE'
            : this.currentCostume === 'surfer' ? '🏄 SURFER HUBIE'
            : '⭐ HUBIE';
        this.ctx.fillStyle = this.state === 'CELEBRATING' ? '#ffd700' : '#00ffcc';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(costumeTag, x, y);
        this.ctx.restore();
    }

    drawProceduralFallback() {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.ellipse(0, -150, 80, 110, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#7a6048';
        ctx.fill();
    }
}

window.HubieAvatar = HubieAvatar;
window.HubieSoundEffects = HubieSoundEffects;
window.DressingRoomDoor = DressingRoomDoor;
