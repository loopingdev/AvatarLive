# 🌴 HUBIE LIVE 24/7 — Autonomous AI Mascot Streamer for Housebets

> **The 24/7 autonomous live streamer that never sleeps, never tilts, and brings Housebets mascot Hubie to life.**  
> Built in modern **Node.js (ES Modules)**, powered by **Playwright browser automation**, **OpenRouter AI reasoning**, **OpenRouter GPT-Audio natural voice**, interactive **HTML5 Canvas 2D/3D mascot engine**, real-time **CDP screencast broadcasting**, and an **autonomous self-healing watchdog**.

---

## ⚡ Quick Start & Installation (Get Running in 3 Minutes)

Run Hubie locally on **Windows** or **Linux with Desktop GUI**.

### 1. Prerequisites (What You Need Installed)
Make sure you have installed on your local machine:
- **Node.js:** v20.x or higher ([nodejs.org](https://nodejs.org/))
- **Google Chrome** (or Chromium) installed locally
- **FFmpeg:** Installed and available in your system PATH (used for audio conversion and stream transcoding)
- **Git**

---

### 2. Clone & Install
Open your terminal (PowerShell on Windows, or Bash on Linux Desktop):

```bash
# 1. Clone the repository
git clone https://github.com/your-username/hubie-streamer.git
cd hubie-streamer

# 2. Install Node dependencies
npm install

# 3. Install Playwright browser binaries
npx playwright install chromium
```

---

### 3. Configure Your `.env` File
Copy the example environment template:

```bash
# Windows PowerShell:
Copy-Item .env.example .env

# Linux / macOS Bash:
cp .env.example .env
```

Open `.env` in your code editor and fill in your credentials:

```ini
# --- Housebets Credentials (Demo / Fun Mode) ---
HOUSEBETS_EMAIL=your_email@example.com
HOUSEBETS_PASSWORD=your_password_here

# --- OpenRouter AI Reasoning & Voice (https://openrouter.ai/keys) ---
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=openai/gpt-oss-20b

# --- Natural Streamer Voice Engine (OpenRouter GPT-Audio) ---
TTS_PROVIDER=openrouter
OPENROUTER_TTS_MODEL=openai/gpt-audio-mini
OPENROUTER_VOICE=onyx

# --- Live Stream Chat Channel ---
STREAM_PLATFORM=twitch
TWITCH_CHANNEL=your_twitch_username
```

---

### 4. Start the Streamer
```bash
npm start
```

Upon launching, the console will output:
```text
🚀 Hubie Stream Studio LIVE at: http://localhost:8080
🎥 Stream Overlay for OBS:      http://localhost:8080/overlay
🌐 Autonomous Browser Target:   https://www.housebets.com/house-games
📊 Status Telemetry:           http://localhost:8080/api/status
🛡️ Autonomous Watchdog:        ACTIVE (Audit logging to stream_audit.json)
```

Chrome will automatically open, log into Housebets, and Hubie will begin playing and commentating on stream!

---

### 5. Add to OBS Studio (Windows / Linux Desktop)

1. Open **OBS Studio**.
2. Under **Scenes**, click **+** to add a new scene (or use your existing scene).
3. Under **Sources**, click **+** and select **Browser**.
4. Configure the Browser Source:
   - **Name:** `Hubie Live Overlay`
   - **URL:** `http://localhost:8080/overlay` (or `http://localhost:8080/` for full studio)
   - **Width:** `1920`
   - **Height:** `1080`
   - **FPS:** `60`
   - **Control audio via OBS:** Checked ✅ (routes Hubie's voice into the OBS Audio Mixer)
   - **Shutdown source when not visible:** Checked ✅
5. Click **OK**. The borderless 1080p game screencast, floating viewer chat, and animated Hubie mascot will appear live on your canvas.

---

## 🔑 Third-Party Services & Accounts Required

| Service / Tool | Purpose | Where to Get It |
| :--- | :--- | :--- |
| **OpenRouter** | Provides both LLM text reasoning (`openai/gpt-oss-20b`) and natural human-like voice synthesis (`openai/gpt-audio-mini`). | Sign up & get API key at [openrouter.ai](https://openrouter.ai/keys). |
| **Housebets Account** | Used by Playwright to log in and play the 14 House Originals in demo/entertainment mode. | Sign up at [housebets.com](https://www.housebets.com/). |
| **Twitch / Kick Account** | Your live channel where viewers chat and watch the stream. | [twitch.tv](https://twitch.tv) or [kick.com](https://kick.com). |
| **Nightbot (Twitch Mod)** | Moderates chat and sends the command list (`!command`) directly into chat when viewers ask. | Add as mod via `/mod nightbot` on Twitch and [nightbot.tv](https://nightbot.tv). |
| **FFmpeg** | Required for PCM audio transcoding to MP3 and optional direct RTMP streaming. | Included in PATH or downloaded via [ffmpeg.org](https://ffmpeg.org/). |
| **Google Chrome** | System browser driven by Playwright with user profile persistence. | [google.com/chrome](https://google.com/chrome). |

---

## ⚙️ Environment Variables Reference (`.env`)

Every configurable setting supported by the system:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `HOUSEBETS_EMAIL` | *(Required)* | Email used to log into Housebets demo mode. |
| `HOUSEBETS_PASSWORD` | *(Required)* | Password for Housebets account. |
| `OPENROUTER_API_KEY` | *(Required)* | OpenRouter API Key for AI commentary and natural voice. |
| `OPENROUTER_MODEL` | `openai/gpt-oss-20b` | LLM model for live commentary and viewer chat Q&A. |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | OpenRouter API base URL. |
| `TTS_PROVIDER` | `openrouter` | Voice provider: `openrouter` (natural emotional voice) or `edge-tts` (offline fallback). |
| `OPENROUTER_TTS_MODEL`| `openai/gpt-audio-mini` | OpenRouter audio model for human-like emotional speech. |
| `OPENROUTER_VOICE` | `onyx` | Voice persona: `onyx` (hype male), `alloy`, `echo`, `fable`, `nova`, `shimmer`. |
| `VOICE_NAME` | `en-US-AndrewMultilingualNeural` | Edge-TTS fallback voice name if OpenRouter is unreachable. |
| `VOICE_RATE` | `+3%` | Fallback speech rate multiplier. |
| `VOICE_PITCH` | `+0Hz` | Fallback speech pitch (kept at native 0Hz for natural human tone). |
| `STREAM_PLATFORM` | `twitch` | Target stream service: `twitch` or `kick`. |
| `STREAM_KEY` | *(Optional)* | Stream key if using built-in RTMP broadcaster without OBS. |
| `ENABLE_RTMP_BROADCAST`| `false` | Set `true` only if you want Node.js to stream directly via FFmpeg without OBS. |
| `TWITCH_CHANNEL` | *(Optional)* | Twitch channel name to listen to viewer comments and commands. |
| `KICK_CHANNEL` | *(Optional)* | Kick channel slug for live chat integration. |
| `ENABLE_SIMULATED_CHAT`| `false` | Generates simulated test viewers if real chat is offline. |
| `HEADLESS_BROWSER` | `false` | `false` = visible Chrome window; `true` = hidden Chrome window. |
| `ROUNDS_PER_GAME` | `8` | Number of game rounds to play before switching to the next House Original. |
| `SAFETY_REMINDER_INTERVAL_SECONDS` | `300` | Frequency in seconds of responsible gambling reminders (18+ Begambleaware). |
| `PORT` | `8080` | Local HTTP & WebSocket server port. |

---

## 🗣️ Natural Streamer Voice & Casino Hype Behavior

Hubie talks, screams, and hypes up gameplay like an authentic top-tier slot casino streamer:

1. **Natural OpenRouter GPT-Audio (`openai/gpt-audio-mini`)**:
   - Natively renders genuine human emotion, inflection, dynamic laughter, and shouting.
   - Eliminates monotone synthetic text-to-speech.
2. **Win & Loss Multiplier Rules**:
   - **Loss ($\le$ 1.0x)**: Expresses comedic frustration or dramatic disbelief (*"NOOOOO! ARE YOU SERIOUS?! IT RIPPED! Reload the bet squad, we go again!"*).
   - **Clean Win (1.01x – 1.60x)**: Celebrates green profit with steady confidence (*"Nice little green hit! 1.35x locked in, profit in the bag squad!"*).
   - **Crazy Win (> 1.60x)**: **SCREAMS LIKE CRAZY!** Shouts with extreme hype in ALL CAPS (*"HOLY SHIT LET'S GOOOOOOO! 2.20X JUICER! BOOOOOOM! CHAT ARE YOU WATCHING THIS?! CLIIIP IT!"*) while the avatar launches confetti cannons and enters a 4.8s victory dance.
3. **Identity Rule**:
   - Always introduces and refers to himself as **Hubie** (never "the sloth"), and addresses viewers as the **Hubie Squad**.

---

## 🎮 Interactive Viewer Commands (Nightbot Setup)

To keep the stream overlay 100% clean and unobstructed during gameplay, command lists are delivered directly through **Twitch Chat via Nightbot** instead of popping up over the stream.

### 1. Add `!command` to Nightbot in Twitch Chat
In your Twitch chat (as channel owner or mod), paste this single line:

```text
!addcom !command 🎮 Hubie Stream Commands: 👕 Outfits: !costume classic | !costume halloween • ⚡ Poses: !dance • !surf • !flex • !boss • !flag • !snack • !blush • !whistle • !card • !inspect • 💬 Talk: @Hubie <message>
```

Add `!commands` as an alias:
```text
!addcom !commands -a=!command
```

### 2. Available Viewer Commands
| Command | Mascot Reaction |
| :--- | :--- |
| `!costume classic` | Walks to 3D dressing room, puts on signature top hat and waistcoat. |
| `!costume halloween`| Changes into spooky wizard cape and purple magic aura. |
| `!dance` | Starts hype disco dance party with 3D confetti celebration. |
| `!surf` | Drops onto his surfboard and cruises across the screen on neon waves. |
| `!flex` | Hits a strong bicep flex pose with sparkles (✦). |
| `!boss` | Pulls out executive sunglasses and briefcase VIP stance (💼). |
| `!flag` | Waves the official Housebets victory flag (🚩). |
| `!snack` | Sits down to eat fresh orange slices with an energy recharge line (🍊). |
| `!blush` | Blushing heart hands with floating neon hearts (💕). |
| `!whistle` | Whistling stroll across the screen with floating music notes (♪ ♫). |
| `!card` | Pulls out high-roller golden casino chip/card (🃏). |
| `!inspect` | Pulls out magnifying glass and inspects screen multipliers (🔍). |
| `@Hubie <question>`| Speaks directly to the viewer with live contextual answer and voice. |

---

## 🎰 Autonomous Gameplay Across All 14 House Games

Hubie autonomously navigates, plays, and switches between all 14 Housebets House Original games:
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

**Intelligent Trap Verification:**
- Never speaks over chat for routine micro-actions (no repetitive babbling on every single tile or button click).
- Enforces a 1400ms verification delay after every move before announcing results.
- Dynamically cashes out multi-tier games based on calculated risk curves.

---

## 🛡️ Responsible Gaming Compliance
- Periodic reminders (configurable via `SAFETY_REMINDER_INTERVAL_SECONDS`) regarding 18+ requirements, staying safe, knowing limits, and that demo gameplay is for entertainment only.
- Strict content moderation automatically scrubs toxicity, slurs, and deposit links from chat.
- Live tamper-proof audit trail recorded in [`stream_audit.json`](file:///i:/0xElephant/AvatarLive/stream_audit.json).

---

## 📜 License
Built for the Housebets Creator Community. All assets and trademarks belong to Housebets.
