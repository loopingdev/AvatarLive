# 🌴 HUBIE LIVE 24/7 — Autonomous AI Mascot Streamer for Housebets

> **The 24/7 autonomous live streamer that never sleeps, never tilts, and brings Housebets mascot Hubie to life.**
> Built 100% in modern **Node.js (ES Modules)**, powered by **Playwright browser automation**, **OpenRouter AI reasoning**, **Edge-TTS neural character voice**, an interactive **HTML5 Canvas 2D/3D mascot engine**, real-time **CDP screencast broadcasting**, and an **autonomous self-healing watchdog**.

---

## 📸 Overview & Live Experience

Hubie Live 24/7 is a complete end-to-end autonomous live streaming system. It opens a persistent Chrome session, navigates to [`https://www.housebets.com/house-games`](https://www.housebets.com/house-games), plays the games with tactical in-round decision-making, commentates every win and near-miss, reads and responds to stream chat in real-time, and broadcasts an edge-to-edge 1080p stream to Kick or Twitch without requiring human intervention.

```
       ┌────────────────────────────────────────────────────────┐
       │             HOUSEBETS REAL GAMEPLAY SCREEN             │
       │  (Automated via Playwright CDP Screencast Stream 30fps) │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 EDGE-TO-EDGE BORDERLESS STREAM OVERLAY                      │
│                                                                             │
│  [ LIVE GAMEPLAY STREAM ]                                                   │
│                                                                             │
│                                                  [ FLOATING STREAM CHAT ]   │
│                                                   Auto-fading viewer chat   │
│                                                   with platform badges &    │
│                                                   color-coded usernames     │
│                                                                             │
│   [ HUBIE MASCOT AVATAR ]                                                   │
│   • HTML5 Canvas 2D/3D Kinematics                                           │
│   • Expressive Lip-Sync & Floating Bubbles                                  │
│   • 3D Realistic Wardrobe Door Transition                                   │
│   • Costume Switching (Classic Top-Hat ↔ Halloween)                        │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
          ┌──────────────────────────────────────────────────┐
          │        RTMP BROADCAST ENGINE (1080p @ 60FPS)     │
          │   Built-in FFmpeg Broadcaster OR Headless OBS    │
          └────────────────────────┬─────────────────────────┘
                                   │
                                   ▼
                    [ KICK.COM / TWITCH.TV STREAM ]
```

---

## 🌟 Key Capabilities & Updated Stack

### 1. Autonomous Gameplay Engine (All 14 House Games)
- **Direct Browser Automation:** Uses Playwright to drive an authentic Chrome browser session (`chrome_data` persistence) on `housebets.com/house-games`.
- **Automatic Session Management:** Auto-dismisses cookie banners, auto-handles promotional popups, and auto-logs in with credentials.
- **Coverage Across All 14 House Original Games:**
  - 🌴 **Hubie's Road** (`/games/housegames-hubie-s-road`)
  - 💣 **Mines** (`/games/housegames-mines`)
  - 🐉 **Dragon Tower** (`/games/housegames-dragon-tower`)
  - 🃏 **HiLo** (`/games/housegames-hilo`)
  - 🪙 **Coinflip** (`/games/housegames-coin-flip`)
  - 🎡 **Roulette** (`/games/housegames-roulette`)
  - ⚪ **Plinko** (`/games/housegames-plinko`)
  - 🎲 **Dice** (`/games/housegames-dice`)
  - 🚀 **Limbo** (`/games/housegames-limbo`)
  - 🎡 **Wheel** (`/games/housegames-wheel`)
  - 🃏 **Blackjack** (`/games/housegames-blackjack`)
  - 🎴 **Baccarat** (`/games/housegames-baccarat`)
  - 🔢 **Keno** (`/games/housegames-keno`)
  - 🏆 **Max Win** (`/games/housegames-max-win`)
- **Game Rotation:** Automatically rotates games after a configurable number of rounds (`ROUNDS_PER_GAME=12`), introducing fresh commentary and variety for viewers.

### 2. In-Round AI Strategic Decisions & Trap Verification
- **Tactical Step Decisions:**
  - **Hubie's Road:** Multi-tier buoy and lane discovery inside Shadow DOM. Selects and hops buoys physically on screen.
  - **Dragon Tower:** Identifies active floor levels and chooses golden dragon eggs.
  - **Mines:** Selects unrevealed tiles while calculating mine probability.
  - **HiLo:** Reads the current card and predicts higher or lower with probability-weighted calls.
- **Post-Hop Outcome Delay (`1400ms`) & Trap Protection:**
  - Enforces a delay after every action to let server physics, animations, and network payloads resolve.
  - Evaluates both backend API responses (`this.lastLiveOutcome`) and DOM loss indicators (`.hl-rc-loss`, `.trap`, `.busted`, `hasLossBadge`).
  - **Zero Premature Announcements:** Hubie never shouts *"clear navigation"* before verifying safety. On a shark ambush or trap, Hubie immediately halts the loop and drops an authentic loss line: *"Shark ambush on buoy #3! Sloth took a splash, unlucky squad!"*.
- **Dynamic Cashout Intelligence:** Inspects live multipliers inside the Shadow DOM and executes strategic cashouts based on calculated risk curves.

### 3. Canvas 2D/3D Mascot Engine (Hubie Avatar)
- **Natural Sloth Kinematics:** Procedural breathing, randomized eye blinks, ear twitches, surfboard bobbing, and waypoint roaming across the stage.
- **Speech Bubble & Lip-Sync:** Synchronized mouth movements and speech bubbles matching the exact phonemes and audio duration generated by neural TTS.
- **Realistic 3D Perspective Wardrobe Door Transition:**
  - When rotating games or receiving a chat command (`!costume`), Hubie walks to the center, knocks on a 3D wardrobe door that swings open with keystoned quad polygon perspective, solid 16px wood slab thickness, a brass latch bolt, and dynamic floor cast shadows.
  - Hubie enters, changes outfits (Classic Top-Hat ↔ Spooky Halloween), and re-emerges with confetti celebration particles.

### 4. Edge-to-Edge Borderless Overlay & Floating Stream Chat
- **100% Full-Screen Gameplay:** Clean edge-to-edge 1080p layout eliminating bulky outer borders and whitespace margins.
- **Floating Auto-Fading Chat:** Chat messages appear smoothly over the stream with platform badges (Kick / Twitch) and color-coded usernames, fading out after a few seconds to preserve gameplay visibility.
- **Live CDP Screencast:** Streams JPEG frames from Chrome DevTools Protocol at ~30 FPS over WebSockets directly onto the HTML5 stage.

### 5. Multi-Model OpenRouter AI Brain
- Powered by high-speed reasoning models via OpenRouter (`google/gemini-2.0-flash-001`, Claude 3.5 Sonnet, or Llama 3.3 70B).
- Character-driven streamer persona: witty, positive, self-deprecating sloth mascot who tracks hot/cold streaks, celebrates multipliers, and remembers viewer names.
- **Zero-Downtime Procedural Fallback:** If the API key is unconfigured or a network timeout occurs, an internal procedural engine seamlessly generates mascot dialogue so Hubie never stops entertaining.

### 6. Expressive Mascot Voice (Edge-TTS)
- Uses Microsoft Edge Neural TTS with character tuning:
  - **Voice:** `en-US-EricNeural`
  - **Speech Rate:** `+6%`
  - **Pitch Modulation:** `+3Hz`
- Provides an animated, energetic mascot timbre perfectly fitted to Hubie's comic persona.

### 7. Real Live Chat Integration & Auto-Moderation
- Connects directly to Kick channel chatroom APIs and Twitch IRC.
- Ingests real viewer messages, tags them with badges, and answers user questions by name (`@username`).
- **Autonomous Auto-Moderator:** Regex and sentiment filters automatically scrub profanity, slurs, deposit spam, and scam URLs, maintaining strict compliance.

### 8. Autonomous Watchdog Supervisor & Audit Logging
- Background watchdog checks component heartbeats (`game_engine`, `broadcaster`, `studio_websocket`).
- Auto-recovers stalled browser contexts, memory leaks, and disconnected sockets within seconds.
- Writes tamper-proof live session records to [`stream_audit.json`](file:///i:/0xElephant/AvatarLive/stream_audit.json).

---

## 🛠️ Project Structure

```
AvatarLive/
├── browser/
│   └── housebetsPlayer.js   # Autonomous Playwright player, multi-step game logic & CDP screencast
├── core/
│   ├── aiBrain.js           # OpenRouter AI integration & procedural commentary fallbacks
│   ├── chatManager.js       # Kick/Twitch chat client, viewer queue & auto-moderator
│   ├── supervisor.js        # Self-healing watchdog, heartbeat monitor & stream audit logger
│   └── ttsEngine.js         # Edge-TTS neural speech generator with queue & audio cache
├── streamer/
│   └── broadcaster.js       # Built-in FFmpeg RTMP broadcast engine (Kick & Twitch)
├── web/
│   ├── assets/              # Sprites (Hubie Road, Halloween), audio clips, and samples
│   ├── hubie_avatar.js      # HTML5 Canvas mascot engine (3D door transition, roaming, lip-sync)
│   ├── index.html           # Full-screen stream stage & overlay dashboard
│   └── style.css            # Borderless overlay styling, floating chat & animations
├── config.js                # Centralized configuration & environment loader
├── server.js                # HTTP server, WebSocket hub & master process orchestrator
├── stream_audit.json        # Live verifiable audit trail of rounds, uptime & recoveries
├── setup.md                 # Step-by-step VPS & Headless OBS streaming guide
└── .env.example             # Template for environment configuration
```

---

## ⚡ Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js:** v20.x or higher ([nodejs.org](https://nodejs.org/))
- **Google Chrome** installed on your system
- **Git**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/hubie-streamer.git
cd hubie-streamer

# Install dependencies
npm install

# Install Playwright browser dependencies
npx playwright install chromium
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your settings:
```ini
# Housebets Credentials
HOUSEBETS_EMAIL=your_email@example.com
HOUSEBETS_PASSWORD=your_password_here

# OpenRouter AI Credentials (https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxx
OPENROUTER_MODEL=google/gemini-2.0-flash-001

# Real Chat Channel (Optional)
KICK_CHANNEL=housebets

# Voice Settings
VOICE_NAME=en-US-EricNeural
VOICE_RATE=+6%
VOICE_PITCH=+3Hz

# Browser Visibility
HEADLESS_BROWSER=false
```

### 4. Launch the Streamer
```bash
npm start
```
The server will boot and display:
```
🚀 Hubie Stream Studio LIVE at: http://localhost:8080
🎥 Stream Overlay for OBS: http://localhost:8080/overlay
🌐 Autonomous Browser Target: https://www.housebets.com/house-games
📊 Status Telemetry: http://localhost:8080/api/status
🛡️ Autonomous Watchdog: ACTIVE (Audit log writing to stream_audit.json)
```

---

## 🎥 OBS Studio Integration

### Adding Hubie to OBS Studio:
1. In OBS Studio, create a new **Browser Source** in your Scene.
2. Set **URL** to: `http://localhost:8080/overlay` (or `http://<your-vps-ip>:8080/overlay`).
3. Set **Width**: `1920` and **Height**: `1080`.
4. Check **Control audio via OBS** (so Hubie's voice is routed through OBS audio mixer).
5. Check **Shutdown source when not visible** and **Refresh browser when scene becomes active**.
6. Click **OK**. The borderless game feed, floating chat, and animated Hubie mascot will appear in full 1080p.

---

## 🖥️ 24/7 VPS Deployment (Headless & Non-GUI OBS)

For streaming 24/7 from a Linux VPS (Ubuntu/Debian) or Windows Server without a physical monitor:

👉 **Read the comprehensive step-by-step guide in [setup.md](file:///i:/0xElephant/AvatarLive/setup.md)**

### What is covered in `setup.md`:
- **Headless Linux VPS Setup:** Running under Ubuntu 22.04 / 24.04 LTS.
- **Headless OBS Studio via Xvfb:** Running OBS without a desktop display (`xvfb-run obs --startstreaming --headless`).
- **Ultralight Built-in Broadcaster:** Direct streaming via native Node.js FFmpeg without installing OBS.
- **Virtual Audio Setup:** Configuring PulseAudio dummy sinks for headless sound.
- **Systemd Production Daemons:** Auto-booting on server restarts with auto-healing.
- **Windows Server VPS:** Setup via NSSM and task scheduling.

---

## 🛡️ Responsible Gaming & Compliance

Hubie Live strictly abides by responsible gaming and streaming standards:
- **18+ Disclaimer:** Periodic audio reminders and on-screen warnings reminding viewers to gamble responsibly.
- **Demo / Entertainment Purpose:** Clear messaging that gameplay is for entertainment demonstration.
- **Strict Content Moderation:** Automated filtration of toxic chat messages, harassment, predatory links, and spam.
- **Begambleaware.org:** Prominently referenced in AI reminders.

---

## 📜 License & Disclaimer

This project is built for the Housebets Creator Hackathon. All game assets, trademarks, and brand references belong to Housebets. Use in compliance with your local streaming and gaming regulations.
