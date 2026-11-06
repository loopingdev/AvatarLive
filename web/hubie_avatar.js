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
 * Dressing Room Wardrobe Door on Stream Canvas
 */
class DressingRoomDoor {
    constructor(groundY = 1030) {
        this.active = false;
        this.groundY = groundY;
        this.x = 380;
        this.y = groundY;
        this.width = 180;
        this.height = 490;
        this.doorAngle = 0; // 0 = closed, Math.PI * 0.48 = wide open
        this.targetDoorAngle = 0;
        this.slideProgress = 0; // 0 = offscreen, 1 = fully on stage
        this.targetSlide = 0;
        this.shakeX = 0;
        this.shakeTimer = 0;
        this.interiorGlow = 0;
        this.stars = [];
    }

    triggerAppearance(x = 380) {
        this.x = x;
        this.active = true;
        this.targetSlide = 1.0;
        this.doorAngle = 0;
        this.targetDoorAngle = 0;
        this.shakeX = 0;
        this.shakeTimer = 0;
        this.interiorGlow = 0;
        this.stars = [];
    }

    openDoor() {
        this.targetDoorAngle = Math.PI * 0.46; // ~83 degrees open
    }

    closeDoor() {
        this.targetDoorAngle = 0;
    }

    startShaking(duration = 1400) {
        this.shakeTimer = duration;
        // Spawn changing particles from door seams
        for (let i = 0; i < 25; i++) {
            this.stars.push({
                x: this.x + (Math.random() * this.width - this.width / 2),
                y: this.y - Math.random() * (this.height * 0.8),
                vx: (Math.random() - 0.5) * 8,
                vy: -(Math.random() * 6 + 2),
                size: Math.random() * 6 + 4,
                color: ['#00ffcc', '#ffd700', '#ff007f', '#00e5ff'][Math.floor(Math.random() * 4)],
                life: 1.0
            });
        }
    }

    triggerDismiss() {
        this.targetDoorAngle = 0;
        this.targetSlide = 0;
    }

    update(dt) {
        if (!this.active) return;

        // Slide transition
        this.slideProgress += (this.targetSlide - this.slideProgress) * Math.min(1.0, dt * 0.008);
        if (this.targetSlide === 0 && this.slideProgress < 0.02) {
            this.active = false;
            return;
        }

        // Door angle smooth swing
        this.doorAngle += (this.targetDoorAngle - this.doorAngle) * Math.min(1.0, dt * 0.012);

        // Interior glow matches door aperture
        this.interiorGlow = Math.sin(this.doorAngle);

        // Shake wobble while Hubie changes inside
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            this.shakeX = Math.sin(performance.now() * 0.035) * 6.5;
            if (Math.random() < 0.25) {
                this.stars.push({
                    x: this.x + (Math.random() * this.width - this.width / 2),
                    y: this.y - Math.random() * this.height,
                    vx: (Math.random() - 0.5) * 6,
                    vy: -(Math.random() * 5 + 2),
                    size: Math.random() * 5 + 3,
                    color: '#ffd700',
                    life: 1.0
                });
            }
        } else {
            this.shakeX = 0;
        }

        // Update stars
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const s = this.stars[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life -= dt * 0.0018;
            if (s.life <= 0) this.stars.splice(i, 1);
        }
    }

    draw(ctx) {
        if (!this.active || this.slideProgress <= 0.01) return;

        ctx.save();
        const curY = this.y - (1.0 - this.slideProgress) * 550;
        ctx.translate(this.x + this.shakeX, curY);

        const halfW = this.width / 2;
        const h = this.height;

        // 1. Drop shadow beneath booth
        ctx.beginPath();
        ctx.ellipse(0, 0, halfW * 1.15, 24, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fill();

        // 2. Booth Outer Frame (Dark Mahogany with Gold Edging)
        ctx.fillStyle = '#1e1112';
        ctx.fillRect(-halfW, -h, this.width, h);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#c68a4c';
        ctx.strokeRect(-halfW, -h, this.width, h);

        // 3. Interior Glow & Dressing Mirror (visible when door is open)
        if (this.doorAngle > 0.02) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(-halfW + 8, -h + 8, this.width - 16, h - 16);
            ctx.clip();

            // Warm golden dressing room interior
            const interiorGrad = ctx.createLinearGradient(0, -h, 0, 0);
            interiorGrad.addColorStop(0, '#fef3c7');
            interiorGrad.addColorStop(0.5, '#fde68a');
            interiorGrad.addColorStop(1, '#b45309');
            ctx.fillStyle = interiorGrad;
            ctx.fillRect(-halfW + 8, -h + 8, this.width - 16, h - 16);

            // Illuminated dressing mirror with bulb glow
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-halfW + 28, -h + 60, this.width - 56, h - 120);

            // Light spill beam onto stage floor
            ctx.beginPath();
            ctx.moveTo(-halfW + 8, 0);
            ctx.lineTo(-halfW - 80 * this.interiorGlow, 50 * this.interiorGlow);
            ctx.lineTo(halfW + 120 * this.interiorGlow, 50 * this.interiorGlow);
            ctx.lineTo(halfW - 8, 0);
            ctx.closePath();
            ctx.fillStyle = `rgba(254, 240, 138, ${0.35 * this.interiorGlow})`;
            ctx.fill();

            ctx.restore();
        }

        // 4. 3D Swing Door Panel
        ctx.save();
        const hingeX = -halfW + 6;
        ctx.translate(hingeX, 0);
        // Perspective scale along X creates 3D swing
        const doorProj = Math.cos(this.doorAngle);
        ctx.scale(doorProj, 1.0);

        // Door surface
        ctx.fillStyle = '#2d1810';
        ctx.fillRect(0, -h + 6, this.width - 12, h - 12);
        ctx.strokeStyle = '#df9b54';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, -h + 6, this.width - 12, h - 12);

        // Inner wood bevel panels
        ctx.strokeStyle = '#854d0e';
        ctx.strokeRect(12, -h + 30, this.width - 36, h * 0.4);
        ctx.strokeRect(12, -h * 0.52, this.width - 36, h * 0.44);

        // Polished Brass Door Handle
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.width - 32, -h * 0.5, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 5. Glowing Neon Header Sign
        ctx.save();
        ctx.translate(0, -h - 24);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-halfW - 14, -18, this.width + 28, 36, 10);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#00ffcc';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 15;
        ctx.stroke();

        ctx.font = 'bold 13px "Inter", sans-serif';
        ctx.fillStyle = '#00ffcc';
        ctx.textAlign = 'center';
        ctx.fillText('🚪 DRESSING ROOM', 0, 6);
        ctx.restore();

        // 6. Changing Dust Stars & Sparks
        for (const s of this.stars) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = Math.max(0, s.life);
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }
}

class HubieAvatar {
    constructor(canvasId, speechBubbleId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.speechBubble = document.getElementById(speechBubbleId);

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

        // Costume System ('classic' | 'halloween' | 'astronaut')
        this.currentCostume = 'classic';

        // Classic Gent Costume Metrics
        this.classicMetrics = {
            spriteSizes: {
                stand: [458, 562],
                crouch: [431, 502],
                jump: [530, 562],
                land: [450, 509],
                celebrate: [390, 580],
                scared: [272, 462],
                fall: [505, 572]
            },
            anchors: {
                stand: 0.3809,
                crouch: 0.4380,
                jump: 0.4631,
                land: 0.4241,
                celebrate: 0.5228,
                scared: 0.4984,
                fall: 0.4719
            },
            mouthOffsets: {
                stand:     [217, 193],
                crouch:    [288, 202],
                jump:      [313, 190],
                land:      [266, 193],
                celebrate: [222, 205],
                scared:    [136, 115],
                fall:      [232, 196]
            },
            smileWidths: {
                stand: 54, crouch: 58, jump: 56, land: 54, celebrate: 52, scared: 38, fall: 50
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
                fall: [461, 485]
            },
            anchors: {
                stand: 0.4334,
                crouch: 0.4578,
                jump: 0.4217,
                land: 0.4697,
                celebrate: 0.4911,
                scared: 0.4938,
                fall: 0.4334
            },
            mouthOffsets: {
                stand:     [184, 198],
                crouch:    [248, 206],
                jump:      [275, 185],
                land:      [215, 192],
                celebrate: [208, 204],
                scared:    [168, 120],
                fall:      [212, 188]
            },
            smileWidths: {
                stand: 52, crouch: 56, jump: 54, land: 52, celebrate: 50, scared: 36, fall: 48
            }
        };

        // Precision Anatomical Tracking for Astronaut Suit
        this.astronautPoseAnchors = {
            stand: {
                head: [217, 142],
                headRadius: 74,
                neck: [217, 215],
                backpack: [155, 230],
                backpackAngle: -0.05,
                chest: [217, 260],
                thrusters: [155, 290]
            },
            crouch: {
                head: [288, 150],
                headRadius: 72,
                neck: [288, 225],
                backpack: [205, 250],
                backpackAngle: -0.35,
                chest: [290, 275],
                thrusters: [195, 310]
            },
            jump: {
                head: [313, 138],
                headRadius: 76,
                neck: [313, 210],
                backpack: [225, 240],
                backpackAngle: -0.28,
                chest: [315, 260],
                thrusters: [215, 310]
            },
            land: {
                head: [266, 145],
                headRadius: 73,
                neck: [266, 218],
                backpack: [195, 245],
                backpackAngle: -0.20,
                chest: [268, 265],
                thrusters: [185, 305]
            },
            celebrate: {
                head: [222, 150],
                headRadius: 74,
                neck: [222, 225],
                backpack: [155, 235],
                backpackAngle: 0.05,
                chest: [222, 270],
                thrusters: [155, 295]
            },
            scared: {
                head: [136, 85],
                headRadius: 58,
                neck: [136, 130],
                backpack: [90, 140],
                backpackAngle: -0.15,
                chest: [136, 160],
                thrusters: [90, 180]
            },
            fall: {
                head: [232, 150],
                headRadius: 72,
                neck: [232, 220],
                backpack: [160, 240],
                backpackAngle: -0.40,
                chest: [235, 265],
                thrusters: [150, 295]
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
        this.hatFly = { active: false, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vrot: 0 };
        this.splashFx = { active: false, timer: 0, maxTime: 750, x: 0, y: 0 };

        // Roaming Waypoints
        this.waypoints = [
            { name: 'center', x: 880 },
            { name: 'game_inspect', x: 420 },
            { name: 'chat_greet', x: 1220 },
            { name: 'roam_left', x: 260 },
            { name: 'roam_right', x: 1140 }
        ];
        this.roamInterval = setInterval(() => this.autonomousRoam(), 11000);

        // Autonomous Costume Change Interval (Every 5 to 7 minutes)
        this.costumeInterval = setInterval(() => {
            if (this.state === 'IDLE' && !this.isChangingCostume) {
                this.triggerCostumeChangeRoutine();
            }
        }, 300000 + Math.random() * 120000);

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
            hat: '/assets/hubie_road/hat-solo.webp'
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
            hat: '/assets/hubie_halloween/hat-solo.webp'
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

    /**
     * Autonomous Dressing Room Door Routine
     * Hubie walks to the changing room door, enters, changes style inside the wobbling booth,
     * and bursts out with golden light and celebratory sound effects!
     */
    triggerCostumeChangeRoutine(targetCostume = null) {
        if (this.isChangingCostume) return;
        this.isChangingCostume = true;
        this.state = 'CHANGING_COSTUME';

        const sequence = ['classic', 'halloween', 'astronaut'];
        let next = targetCostume;
        if (!next || !sequence.includes(next)) {
            const nextIdx = (sequence.indexOf(this.currentCostume) + 1) % sequence.length;
            next = sequence[nextIdx];
        }

        // Place dressing room on stage away from Hubie's current position
        const doorX = this.x > 700 ? 380 : 1080;
        this.dressingRoom.triggerAppearance(doorX);
        this.sound.playDoorOpenSound();

        // 1. Move to Dressing Room Door
        setTimeout(() => {
            this.setSpeaking(true, "Hold up chat, heading to the dressing room for fresh drip!");
            this.moveTo(doorX + (doorX > this.x ? -60 : 60));
        }, 500);

        // 2. Door Opens as Hubie approaches
        setTimeout(() => {
            this.dressingRoom.openDoor();
            this.sound.playDoorOpenSound();
        }, 1800);

        // 3. Hubie Steps Inside Door
        setTimeout(() => {
            this.setPose('crouch');
            this.targetX = doorX;
            // Fade Hubie into the doorway
            const fadeInterval = setInterval(() => {
                this.characterAlpha = Math.max(0, this.characterAlpha - 0.1);
                if (this.characterAlpha <= 0) clearInterval(fadeInterval);
            }, 30);
        }, 2400);

        // 4. Door Closes Firmly
        setTimeout(() => {
            this.dressingRoom.closeDoor();
            this.sound.playDoorCloseSound();
            this.setSpeaking(false);
        }, 3000);

        // 5. Wardrobe Wobbles Comically While Changing
        setTimeout(() => {
            this.dressingRoom.startShaking(1400);
            this.sound.playWardrobeShuffleSound();
            // Switch costume under the hood
            this.currentCostume = next;
        }, 3200);

        // 6. Door Bursts Open & Golden Reveal Fanfare
        setTimeout(() => {
            this.dressingRoom.openDoor();
            this.sound.playRevealSound();
            this.sound.playWinSound(3.0);
            this.triggerConfetti();

            // Hubie leaps out into the spotlight
            this.characterAlpha = 1.0;
            this.direction = doorX > 600 ? -1 : 1;
            this.x = doorX + (this.direction * 70);
            this.targetX = this.x + (this.direction * 90);
            this.setPose('celebrate');

            // Hype shoutout for the new style
            let line = "Back in the gentleman sloth top hat and waistcoat! Clean drip secured!";
            if (next === 'halloween') {
                line = "Spooky wizard cape equipped! Multiplying magic is unlocked squad!";
            } else if (next === 'astronaut') {
                line = "Houston, Hubie is suited up for the cosmos! Zero-gravity mode active!";
                setTimeout(() => this.startZeroGFloat(3500), 800);
            }
            this.setSpeaking(true, line);
        }, 4700);

        // 7. Dressing Room Dismissal
        setTimeout(() => {
            this.dressingRoom.triggerDismiss();
            this.sound.playDoorCloseSound();
        }, 7000);

        // 8. Restore Normal State
        setTimeout(() => {
            this.isChangingCostume = false;
            this.state = 'IDLE';
            this.setPose('stand');
            this.setSpeaking(false);
        }, 8200);
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
        if (this.state === 'IDLE' && !this.isSpeaking && !this.isHopping && !this.isSurfing && !this.isChangingCostume) {
            const rand = Math.random();
            if (rand < 0.20 && this.currentCostume === 'astronaut') {
                this.startZeroGFloat(4000);
            } else if (rand < 0.35) {
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

            if (this.currentCostume === 'astronaut' && Math.random() < 0.5 && !this.isChangingCostume) {
                this.startZeroGFloat(3500);
            } else if (Math.abs(dist) >= 340 && !this.isSurfing && !this.isHopping && !this.isChangingCostume) {
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

    setSpeaking(speaking, text = '') {
        this.isSpeaking = Boolean(speaking);

        if (this.speechBubble) {
            if (this.isSpeaking && text) {
                this.speechBubble.textContent = text;
                this.speechBubble.classList.add('visible');
                this.updateSpeechBubblePosition();
            } else if (!this.isSpeaking) {
                setTimeout(() => {
                    if (!this.isSpeaking) {
                        this.speechBubble.classList.remove('visible');
                    }
                }, 2200);
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
        this.state = 'CELEBRATING';
        this.setPose('celebrate');
        this.isHopping = false;
        this.isSurfing = false;
        this.isFlipping = false;

        this.sound.playWinSound(multiplier);
        this.triggerConfetti();

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
        if (!this.isChangingCostume) {
            this.moveTo(1200);
        }
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

                    if (this.currentCostume === 'astronaut') {
                        this.addSpaceThruster(this.x - this.direction * 20, this.groundY - targetHopOffset + 30);
                    }
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
                if (this.currentCostume === 'astronaut') {
                    this.addSpaceThruster(this.x, this.groundY - targetHopOffset + 20);
                }
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

        // 4. Draw Dressing Room Door behind/alongside character
        this.dressingRoom.draw(this.ctx);

        // 5. Draw Confetti behind Hubie
        this.drawConfetti();

        const curY = this.groundY - this.curHopOffset;

        // Keep speech bubble anchored smoothly above Hubie
        this.updateSpeechBubblePosition(curY);

        // 6. Draw Hubie Mascot (only if characterAlpha > 0)
        if (this.characterAlpha > 0.01) {
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
            this.ctx.scale(this.curScaleX, this.curScaleY);

            // Draw Base Character Pose Sprites
            this.drawSmoothHubieSprite();

            // Draw Precision-Tracked Astronaut Space Suit & Crystal Glass Bubble Helmet
            if (this.currentCostume === 'astronaut') {
                this.drawPrecisionAstronautSuit();
            }

            // Draw Lip-Sync Overlay
            if (this.mouthAlpha > 0.02 && this.mouthOpenness > 0.03) {
                this.drawPrecisionLipSync();
            }

            this.ctx.restore();

            // Name Tag Badge
            this.drawBadge(this.x, this.groundY + 24);
        }

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
                this.ctx.shadowColor = '#ffe600';
                this.ctx.shadowBlur = 8;
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

    /**
     * Precision-Tracked Astronaut Space Suit & Crystal Glass Bubble Helmet
     * Rigidly locked to Hubie's actual anatomical head and torso across every pose!
     */
    drawPrecisionAstronautSuit() {
        const s = this.baseHeight / 562;
        const blendFactor = this.easeInOutQuad(this.poseBlend);

        const curAnchor = this.astronautPoseAnchors[this.currentPose] || this.astronautPoseAnchors.stand;
        const prevAnchor = this.astronautPoseAnchors[this.prevPose] || this.astronautPoseAnchors.stand;

        const curMetrics = this.classicMetrics;
        const curSize = curMetrics.spriteSizes[this.currentPose] || [458, 562];
        const curAnchorRatio = curMetrics.anchors[this.currentPose] || 0.45;
        const prevSize = curMetrics.spriteSizes[this.prevPose] || [458, 562];
        const prevAnchorRatio = curMetrics.anchors[this.prevPose] || 0.45;

        // Current pose local coordinates
        const curDX = -(curSize[0] * s) * curAnchorRatio;
        const curDY = -(curSize[1] * s);
        const curHeadX = curDX + curAnchor.head[0] * s;
        const curHeadY = curDY + curAnchor.head[1] * s;
        const curNeckX = curDX + curAnchor.neck[0] * s;
        const curNeckY = curDY + curAnchor.neck[1] * s;
        const curBackpackX = curDX + curAnchor.backpack[0] * s;
        const curBackpackY = curDY + curAnchor.backpack[1] * s;
        const curChestX = curDX + curAnchor.chest[0] * s;
        const curChestY = curDY + curAnchor.chest[1] * s;

        // Previous pose local coordinates
        const prevDX = -(prevSize[0] * s) * prevAnchorRatio;
        const prevDY = -(prevSize[1] * s);
        const prevHeadX = prevDX + prevAnchor.head[0] * s;
        const prevHeadY = prevDY + prevAnchor.head[1] * s;
        const prevNeckX = prevDX + prevAnchor.neck[0] * s;
        const prevNeckY = prevDY + prevAnchor.neck[1] * s;
        const prevBackpackX = prevDX + prevAnchor.backpack[0] * s;
        const prevBackpackY = prevDY + prevAnchor.backpack[1] * s;
        const prevChestX = prevDX + prevAnchor.chest[0] * s;
        const prevChestY = prevDY + prevAnchor.chest[1] * s;

        // Smoothly interpolate all coordinates across pose transitions
        const headX = prevHeadX + (curHeadX - prevHeadX) * blendFactor;
        const headY = prevHeadY + (curHeadY - prevHeadY) * blendFactor;
        const headRadius = (prevAnchor.headRadius + (curAnchor.headRadius - prevAnchor.headRadius) * blendFactor) * s;
        const neckX = prevNeckX + (curNeckX - prevNeckX) * blendFactor;
        const neckY = prevNeckY + (curNeckY - prevNeckY) * blendFactor;
        const backpackX = prevBackpackX + (curBackpackX - prevBackpackX) * blendFactor;
        const backpackY = prevBackpackY + (curBackpackY - prevBackpackY) * blendFactor;
        const backpackAngle = prevAnchor.backpackAngle + (curAnchor.backpackAngle - prevAnchor.backpackAngle) * blendFactor;
        const chestX = prevChestX + (curChestX - prevChestX) * blendFactor;
        const chestY = prevChestY + (curChestY - prevChestY) * blendFactor;

        this.ctx.save();

        // 1. Dual Oxygen Life-Support Backpack (behind torso)
        this.ctx.save();
        this.ctx.translate(backpackX, backpackY);
        this.ctx.rotate(backpackAngle);

        // Oxygen tank casing
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.strokeStyle = '#475569';
        this.ctx.lineWidth = 2.5 * s;
        this.ctx.beginPath();
        this.ctx.roundRect(-22 * s, -45 * s, 44 * s, 90 * s, 10 * s);
        this.ctx.fill();
        this.ctx.stroke();

        // Cyan safety valves
        this.ctx.fillStyle = '#00e5ff';
        this.ctx.beginPath();
        this.ctx.arc(0, -50 * s, 7 * s, 0, Math.PI * 2);
        this.ctx.fill();

        // Rocket thruster nozzles at bottom
        this.ctx.fillStyle = '#334155';
        this.ctx.fillRect(-14 * s, 45 * s, 28 * s, 12 * s);
        this.ctx.restore();

        // 2. White Pressurized EVA Chest Mission Pack
        this.ctx.save();
        this.ctx.translate(chestX, chestY);
        this.ctx.fillStyle = 'rgba(248, 250, 252, 0.95)';
        this.ctx.strokeStyle = '#0284c7';
        this.ctx.lineWidth = 2 * s;
        this.ctx.beginPath();
        this.ctx.roundRect(-34 * s, -20 * s, 68 * s, 40 * s, 8 * s);
        this.ctx.fill();
        this.ctx.stroke();

        // High-tech digital mission readout
        this.ctx.font = `bold ${Math.round(8 * s)}px "Courier New", monospace`;
        this.ctx.fillStyle = '#0369a1';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('HB-24/7', 0, -4 * s);

        // Blinking telemetry status LEDs
        const t = performance.now() * 0.005;
        const led1 = Math.sin(t) > 0 ? '#10b981' : '#064e3b';
        const led2 = Math.sin(t + 2) > 0 ? '#38bdf8' : '#0369a1';
        const led3 = Math.sin(t + 4) > 0 ? '#f59e0b' : '#78350f';

        this.ctx.fillStyle = led1;
        this.ctx.beginPath();
        this.ctx.arc(-18 * s, 10 * s, 3.5 * s, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = led2;
        this.ctx.beginPath();
        this.ctx.arc(0, 10 * s, 3.5 * s, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = led3;
        this.ctx.beginPath();
        this.ctx.arc(18 * s, 10 * s, 3.5 * s, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // 3. Metallic Neck Collar Ring Seal
        this.ctx.save();
        this.ctx.translate(neckX, neckY);
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, headRadius * 0.88, 14 * s, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#cbd5e1';
        this.ctx.fill();
        this.ctx.lineWidth = 3 * s;
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.stroke();
        this.ctx.restore();

        // 4. Crystal-Clear Transparent Glass Space Bubble Helmet
        // (Hubie's cute sloth face, sunglasses, and smile are 100% visible inside!)
        this.ctx.save();
        this.ctx.translate(headX, headY);

        // Outer Glass Sphere
        this.ctx.beginPath();
        this.ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
        // Soft crystal glass tint
        this.ctx.fillStyle = 'rgba(224, 242, 254, 0.12)';
        this.ctx.fill();
        this.ctx.lineWidth = 3.5 * s;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        this.ctx.stroke();

        // Curved Glass Glare Specular Highlights (Upper Left)
        this.ctx.beginPath();
        this.ctx.ellipse(-headRadius * 0.38, -headRadius * 0.38, headRadius * 0.32, headRadius * 0.14, -0.42, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        this.ctx.fill();

        // Secondary small glass glare dot
        this.ctx.beginPath();
        this.ctx.arc(-headRadius * 0.52, -headRadius * 0.18, 4 * s, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fill();

        // Antenna on Top of Helmet with Pulsing Cyan Beacon
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 2.5 * s;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -headRadius);
        this.ctx.lineTo(0, -headRadius - 22 * s);
        this.ctx.stroke();

        this.ctx.fillStyle = '#00ffcc';
        this.ctx.shadowColor = '#00ffcc';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(0, -headRadius - 24 * s, 4.5 * s, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
        this.ctx.restore();
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

    drawBadge(x, y) {
        this.ctx.save();
        this.ctx.font = 'bold 15px "Inter", sans-serif';
        const costumeTag = this.currentCostume === 'astronaut' ? '🚀 ASTRO-HUBIE' : this.currentCostume === 'halloween' ? '🎃 SPOOKY HUBIE' : '⭐ HUBIE';
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
