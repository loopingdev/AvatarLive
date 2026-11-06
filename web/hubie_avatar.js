/**
 * Hubie Avatar Engine
 * Animated, interactive, talkative mascot that moves along the screen,
 * reacts to game events, speaks with lip-sync, and answers chat!
 */

class HubieAvatar {
    constructor(canvasId, speechBubbleId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.speechBubble = document.getElementById(speechBubbleId);

        // Position & Movement
        this.x = 800;
        this.y = 120;
        this.targetX = 800;
        this.baseY = 120;
        this.speed = 3.5;
        this.direction = 1; // 1 = right, -1 = left

        // Animation States
        this.state = 'IDLE'; // IDLE, TALKING, CELEBRATING, SHOCKED, WALKING
        this.isSpeaking = false;
        this.mouthOpenness = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.hopOffset = 0;
        this.armAngle = 0;
        this.walkCycle = 0;
        this.confettiParticles = [];

        // Waypoints along screen
        this.waypoints = [
            { name: 'center', x: 800 },
            { name: 'game_inspect', x: 450 },
            { name: 'chat_greet', x: 1100 },
            { name: 'roam_left', x: 250 },
            { name: 'roam_right', x: 1050 }
        ];
        this.roamInterval = setInterval(() => this.autonomousRoam(), 14000);

        // Load official Hubie image if available
        this.officialImg = new Image();
        this.officialImg.src = '/assets/hubie_avatar_official.png';
        this.officialImgLoaded = false;
        this.officialImg.onload = () => { this.officialImgLoaded = true; };

        // Start render loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.render(t));
    }

    autonomousRoam() {
        if (this.state === 'IDLE' && !this.isSpeaking) {
            const nextWaypoint = this.waypoints[Math.floor(Math.random() * this.waypoints.length)];
            this.moveTo(nextWaypoint.x);
        }
    }

    moveTo(targetX) {
        this.targetX = Math.max(150, Math.min(1150, targetX));
        this.direction = this.targetX > this.x ? 1 : -1;
    }

    setSpeaking(speaking, text = '') {
        this.isSpeaking = speaking;
        if (speaking) {
            this.state = 'TALKING';
            if (this.speechBubble) {
                this.speechBubble.textContent = text;
                this.speechBubble.classList.add('visible');
                this.speechBubble.style.left = `${this.x - 120}px`;
            }
        } else {
            this.state = 'IDLE';
            if (this.speechBubble) {
                setTimeout(() => {
                    if (!this.isSpeaking) {
                        this.speechBubble.classList.remove('visible');
                    }
                }, 2500);
            }
        }
    }

    reactToWin(multiplier) {
        this.state = 'CELEBRATING';
        this.hopOffset = -45;
        this.triggerConfetti();
        if (multiplier >= 5.0) {
            this.moveTo(500); // Walk over to show off
        }
        setTimeout(() => {
            if (this.state === 'CELEBRATING') this.state = 'IDLE';
        }, 3500);
    }

    reactToLoss() {
        this.state = 'SHOCKED';
        this.hopOffset = 10;
        setTimeout(() => {
            if (this.state === 'SHOCKED') this.state = 'IDLE';
        }, 2200);
    }

    reactToChat(username) {
        // Move towards chat panel on the right
        this.moveTo(1050);
    }

    triggerConfetti() {
        this.confettiParticles = [];
        const colors = ['#00ffcc', '#ff007f', '#ffd700', '#00e5ff', '#ff5722'];
        for (let i = 0; i < 60; i++) {
            this.confettiParticles.push({
                x: this.x + (Math.random() * 80 - 40),
                y: this.y - 40,
                vx: (Math.random() - 0.5) * 12,
                vy: -(Math.random() * 10 + 4),
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vr: (Math.random() - 0.5) * 15,
                life: 1.0
            });
        }
    }

    update(dt) {
        // Move towards targetX smoothly
        const dx = this.targetX - this.x;
        if (Math.abs(dx) > 3) {
            this.x += Math.sign(dx) * Math.min(Math.abs(dx), this.speed);
            this.walkCycle += dt * 0.012;
            this.direction = dx > 0 ? 1 : -1;
            if (this.speechBubble && this.isSpeaking) {
                this.speechBubble.style.left = `${this.x - 120}px`;
            }
        } else {
            this.walkCycle = 0;
        }

        // Blinking
        this.blinkTimer += dt;
        if (this.blinkTimer > 3500) {
            this.isBlinking = true;
            if (this.blinkTimer > 3700) {
                this.isBlinking = false;
                this.blinkTimer = 0;
            }
        }

        // Talking mouth flapping
        if (this.isSpeaking) {
            this.mouthOpenness = (Math.sin(performance.now() * 0.02) + 1) * 0.5;
            this.armAngle = Math.sin(performance.now() * 0.01) * 0.3;
        } else {
            this.mouthOpenness = 0;
            this.armAngle = 0;
        }

        // Hop dampening
        if (this.hopOffset < 0) {
            this.hopOffset += dt * 0.08;
            if (this.hopOffset > 0) this.hopOffset = 0;
        } else if (this.hopOffset > 0) {
            this.hopOffset -= dt * 0.04;
            if (this.hopOffset < 0) this.hopOffset = 0;
        }

        // Update Confetti
        for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
            const p = this.confettiParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.35; // Gravity
            p.rotation += p.vr;
            p.life -= dt * 0.0008;
            if (p.life <= 0) {
                this.confettiParticles.splice(i, 1);
            }
        }
    }

    render(time) {
        const dt = Math.min(50, time - this.lastTime);
        this.lastTime = time;
        this.update(dt);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Confetti behind/around Hubie
        for (const p of this.confettiParticles) {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
            this.ctx.restore();
        }

        // Draw Hubie Mascot
        this.ctx.save();
        const walkBob = Math.abs(Math.sin(this.walkCycle)) * 8;
        const currentY = this.y + this.hopOffset - walkBob;

        this.ctx.translate(this.x, currentY);
        // Face moving direction
        if (this.direction === -1) {
            this.ctx.scale(-1, 1);
        }

        this.drawHubieBody();
        this.ctx.restore();

        requestAnimationFrame((t) => this.render(t));
    }

    drawHubieBody() {
        const ctx = this.ctx;

        // Ground shadow
        ctx.beginPath();
        ctx.ellipse(0, 85, 55, 14, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();

        // If official art is loaded, draw official mascot framed beautifully with interactive elements
        if (this.officialImgLoaded) {
            // Mascot Base Glow
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, 62, 0, Math.PI * 2);
            ctx.fillStyle = this.state === 'CELEBRATING' ? 'rgba(0, 255, 204, 0.35)' : 'rgba(255, 215, 0, 0.2)';
            ctx.fill();
            ctx.restore();

            // Official Hubie Character Artwork
            ctx.drawImage(this.officialImg, -55, -65, 110, 145);

            // Dynamic Talking Mouth Overlay (Synchronized with TTS!)
            if (this.isSpeaking && this.mouthOpenness > 0.1) {
                ctx.save();
                ctx.beginPath();
                const mouthH = 5 + this.mouthOpenness * 12;
                ctx.ellipse(2, 6, 9, mouthH, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#2b1414';
                ctx.fill();
                // Tongue
                ctx.beginPath();
                ctx.ellipse(2, 6 + mouthH * 0.35, 6, 4, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#ff4d6d';
                ctx.fill();
                ctx.restore();
            }

            // Sunglasses lens flare on win
            if (this.state === 'CELEBRATING') {
                ctx.save();
                ctx.beginPath();
                ctx.arc(-12, -22, 10, 0, Math.PI * 2);
                ctx.arc(16, -22, 10, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                ctx.fill();
                ctx.restore();
            }

            // Name Tag Badge
            ctx.save();
            ctx.font = 'bold 12px "Inter", sans-serif';
            ctx.fillStyle = '#00ffcc';
            ctx.textAlign = 'center';
            ctx.fillText('⭐ HUBIE', 0, 95);
            ctx.restore();

            return;
        }

        // Procedural Vector Hubie fallback (Cool Sloth Mascot with Sunglasses & Chain)
        // Body / Fur
        ctx.beginPath();
        ctx.ellipse(0, 25, 45, 55, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#7a6048'; // Warm sloth brown
        ctx.fill();

        // Belly
        ctx.beginPath();
        ctx.ellipse(0, 30, 30, 40, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#d6bfa8';
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.ellipse(0, -35, 42, 36, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#8b6f55';
        ctx.fill();

        // Face mask (light sloth pattern)
        ctx.beginPath();
        ctx.ellipse(0, -32, 28, 22, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ecd8c4';
        ctx.fill();

        // Cool Neon Sunglasses
        ctx.beginPath();
        ctx.roundRect(-34, -46, 30, 20, 6);
        ctx.roundRect(4, -46, 30, 20, 6);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.state === 'CELEBRATING' ? '#00ffcc' : '#ffd700';
        ctx.stroke();

        // Bridge of glasses
        ctx.beginPath();
        ctx.moveTo(-4, -36);
        ctx.lineTo(4, -36);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffd700';
        ctx.stroke();

        // Nose
        ctx.beginPath();
        ctx.ellipse(0, -22, 7, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#2a1a12';
        ctx.fill();

        // Interactive Mouth
        ctx.beginPath();
        if (this.isSpeaking) {
            const h = 4 + this.mouthOpenness * 10;
            ctx.ellipse(0, -10, 8, h, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#3a0d14';
            ctx.fill();
        } else {
            ctx.arc(0, -14, 10, 0.2 * Math.PI, 0.8 * Math.PI, false);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#2a1a12';
            ctx.stroke();
        }

        // Gold Chain
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0.1 * Math.PI, 0.9 * Math.PI, false);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffb703';
        ctx.stroke();

        // Chain Pendant (Housebets H / Chip)
        ctx.beginPath();
        ctx.arc(0, 27, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffcc';
        ctx.fill();
    }
}

window.HubieAvatar = HubieAvatar;

