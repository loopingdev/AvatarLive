# 🌴 HUBIE LIVE 24/7 — Autonomous AI Streamer for Housebets

> **Bring Hubie to life as a live streamer that never goes offline.**
> Built 100% in modern **JavaScript / Node.js** with Playwright browser automation on [`https://www.housebets.com/house-games`](https://www.housebets.com/house-games), OpenRouter AI commentary, live neural voice, animated roaming mascot, and 24/7 autonomous watchdog recovery!

---

## 🌟 How It Works

### 1. Plays Live on Housebets (`housebets.com/house-games`)
- **Direct Browser Automation:** The AI launches Google Chrome (with persistent session storage in `./chrome_data`).
- **Auto-Login:** Reads `HOUSEBETS_EMAIL` and `HOUSEBETS_PASSWORD` from `.env`, fills the login modal, and keeps the session active.
- **Plays the Games:** Clicks into house games, presses Bet / Play / Cashout, and captures real outcomes.
- **Rotates Models:** Automatically rotates between:
  - 🌴 **Hubie's Road** (`/games/housegames-hubie-s-road`)
  - 🎲 **Dice** (`/games/housegames-dice`)
  - 💣 **Mines** (`/games/housegames-mines`)
  - 🚀 **Limbo** (`/games/housegames-limbo`)
  - 🎡 **Wheel** (`/games/housegames-wheel`)
  - 🐉 **Dragon Tower** (`/games/housegames-dragon-tower`)

### 2. Hubie on Screen (Interactive & Roaming Mascot)
- **Moves Along Screen:** Hubie dynamically roams across the broadcast stage, patrolled between waypoints.
- **Lip-Sync & Live Voice:** Speaks in real-time with Edge-TTS neural voice (`en-US-GuyNeural`), mouth opens/closes synchronized with dialogue.
- **Game & Chat Reactions:** Jumps and triggers confetti on big multipliers, shrugs on close misses, and walks to the chat panel to answer viewers.

### 3. OpenRouter AI Brain
- Powered by **OpenRouter** (`google/gemini-2.0-flash`, `anthropic/claude-3.5-sonnet`, `meta-llama/llama-3.3-70b-instruct`).
- **Commentates every round** played on the live site.
- **Answers chat viewers by name** (`@username`).
- **Zero-downtime fallback:** If API key is pending or network drops, a procedural mascot generator ensures Hubie never stops speaking.

### 4. Runs Itself (24/7 Self-Healing & Zero Human Touch)
- Automatic crash recovery intercepts and restarts any stalled process in seconds.
- Writes continuous session proofs to [`stream_audit.json`](file:///i:/0xElephant/AvatarLive/stream_audit.json) for judges to verify hours against your stream history.

### 5. Stays Safe
- Persistent banner: `🔞 18+ ONLY | PLAY RESPONSIBLY | DEMO MODE ONLY | begambleaware.org`.
- Auto-moderator filters out toxic language, slurs, and scam links.
- Strictly never promises wins or pushes deposits.

---

## 🚀 Quick Setup

### 1. Configure `.env`
Create or edit your `.env` file:
```ini
# Housebets Login Credentials
HOUSEBETS_EMAIL=your_email@example.com
HOUSEBETS_PASSWORD=your_password_here

# OpenRouter AI Credentials
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=google/gemini-2.0-flash-001

# Stream Settings (Kick or Twitch)
STREAM_PLATFORM=kick
STREAM_KEY=
ENABLE_RTMP_BROADCAST=false

# Browser Mode (set false so you can see Chrome playing!)
HEADLESS_BROWSER=false
```

### 2. Start the Streamer
```bash
npm start
```

### 3. View the Studio & OBS Overlay
- **Stream Overlay for OBS:** `http://localhost:8080/overlay` (Add as Browser Source in OBS: 1920x1080)
- **Live Studio Dashboard:** `http://localhost:8080`
- **Telemetry & Uptime Status:** `http://localhost:8080/api/status`
