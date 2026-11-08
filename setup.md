# 🚀 Complete Setup & Streaming Guide (Windows & Linux Desktop)

This guide walks you through setting up and running **Hubie Live 24/7** on your local machine (**Windows 10/11** or **Linux with Desktop GUI**) and broadcasting to **Twitch** or **Kick** using **OBS Studio** or the built-in broadcaster.

> [!NOTE]
> This setup runs on standard local desktop environments (Windows or Linux Desktop with a visible display). It does not require headless virtual displays or complicated dummy audio sinks.

---

## 📋 Table of Contents
1. [Required Third-Party Services & Software](#1-required-third-party-services--software)
2. [Step-by-Step Local Installation](#2-step-by-step-local-installation)
3. [Environment Configuration (`.env`)](#3-environment-configuration-env)
4. [Connecting Nightbot to Twitch Chat](#4-connecting-nightbot-to-twitch-chat)
5. [OBS Studio Setup & Overlay Integration](#5-obs-studio-setup--overlay-integration)
6. [Alternative: Built-in Direct FFmpeg Broadcaster](#6-alternative-built-in-direct-ffmpeg-broadcaster-no-obs)
7. [Troubleshooting & Common Questions](#7-troubleshooting--common-questions)

---

## 1. Required Third-Party Services & Software

Before launching Hubie, ensure you have the following prerequisites ready:

### 1.1 Local Software
- **Node.js (v20.x or higher):** Download from [nodejs.org](https://nodejs.org/).
- **Google Chrome:** Installed locally (Playwright will drive your Chrome browser session).
- **FFmpeg:**
  - **Windows:** Download from [ffmpeg.org](https://ffmpeg.org/) or install via winget:
    ```powershell
    winget install Gyan.FFmpeg
    ```
  - **Linux (Ubuntu/Debian Desktop):**
    ```bash
    sudo apt update && sudo apt install -y ffmpeg
    ```

### 1.2 Cloud & Third-Party Accounts
- **OpenRouter API Key ([openrouter.ai](https://openrouter.ai/keys)):**
  - Required for both Hubie's AI commentary reasoning and the **GPT-Audio natural voice model** (`openai/gpt-audio-mini`).
- **Housebets Account ([housebets.com](https://www.housebets.com/)):**
  - Used by the automated browser to play the 14 House Original games in demo/entertainment mode.
- **Twitch or Kick Channel:**
  - Where your live stream will broadcast and where viewers chat.
- **Nightbot ([nightbot.tv](https://nightbot.tv)):**
  - Twitch moderator bot used to output the command list (`!command`) directly in chat.

---

## 2. Step-by-Step Local Installation

### Step 1: Clone the Repository
Open PowerShell (Windows) or Terminal (Linux Desktop):

```bash
git clone https://github.com/your-username/hubie-streamer.git
cd hubie-streamer
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Install Playwright Chromium
```bash
npx playwright install chromium
```

---

## 3. Environment Configuration (`.env`)

Copy the template file:

```bash
# Windows:
Copy-Item .env.example .env

# Linux:
cp .env.example .env
```

Open `.env` in your editor and configure the variables:

```ini
# ==========================================
# HUBIE 24/7 AI STREAMER CONFIGURATION
# ==========================================

# 1. Housebets Account Credentials (Demo Mode)
HOUSEBETS_EMAIL=your_email@example.com
HOUSEBETS_PASSWORD=your_password_here

# 2. OpenRouter AI Reasoning
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=openai/gpt-oss-20b
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# 3. Natural Streamer Voice Engine (OpenRouter GPT-Audio)
TTS_PROVIDER=openrouter
OPENROUTER_TTS_MODEL=openai/gpt-audio-mini
OPENROUTER_VOICE=onyx

# Edge-TTS Fallback (in case OpenRouter is offline)
VOICE_NAME=en-US-AndrewMultilingualNeural
VOICE_RATE=+3%
VOICE_PITCH=+0Hz

# 4. Stream Platform & Chat Channel
STREAM_PLATFORM=twitch
TWITCH_CHANNEL=your_twitch_username
KICK_CHANNEL=

# Set false to let OBS handle the stream broadcast
ENABLE_RTMP_BROADCAST=false
STREAM_KEY=

# 5. Browser Automation Settings
HEADLESS_BROWSER=false
ROUNDS_PER_GAME=8
SAFETY_REMINDER_INTERVAL_SECONDS=300

# 6. Web Studio Server
PORT=8080
HOST=0.0.0.0
```

### Key Models & Voice Details
- **`OPENROUTER_MODEL`:** We use `openai/gpt-oss-20b` (or `google/gemini-2.0-flash-001`), which delivers high-speed, witty slot streamer commentary with sub-second latency.
- **`TTS_PROVIDER=openrouter`:** Enables OpenAI's native audio model (`openai/gpt-audio-mini`). This model screams with intense hype when winning over 1.6x and reacts with comedic disbelief when losing, providing a true human streamer voice.
- **`OPENROUTER_VOICE=onyx`:** Delivers a deep, masculine, high-energy gaming broadcaster tone. Other voices include `alloy`, `echo`, `fable`, `nova`, and `shimmer`.

---

## 4. Connecting Nightbot to Twitch Chat

To keep your stream overlay clean, viewers type `!command` in Twitch chat to view the commands, and Nightbot replies immediately in chat:

1. **Add Nightbot as Moderator:**
   In your Twitch channel chat, type:
   ```text
   /mod nightbot
   ```
2. **Add the Hubie Command in Twitch Chat:**
   Copy and paste this exact command into your Twitch chat:
   ```text
   !addcom !command 🎮 Hubie Stream Commands: 👕 Outfits: !costume classic | !costume halloween • ⚡ Poses: !dance • !surf • !flex • !boss • !flag • !snack • !blush • !whistle • !card • !inspect • 💬 Talk: @Hubie <message>
   ```
3. **Add the Alias for `!commands`:**
   ```text
   !addcom !commands -a=!command
   ```
4. **Set Up an Automated Reminder Timer (Optional, Recommended):**
   - In your [Nightbot Timers](https://nightbot.tv/timers) dashboard, add a timer:
     - **Name:** `HubieReminder`
     - **Message:** `🎮 Control Hubie live on stream! Change his outfit or make him dance — type !command to see all actions!`
     - **Interval:** `15 minutes`
     - **Chat Lines:** `2`

---

## 5. OBS Studio Setup & Overlay Integration

This is the standard and recommended way to broadcast your stream in full 1080p 60FPS.

### Step 1: Start the Hubie Server
In your terminal, launch the server:
```bash
npm start
```
You will see:
```text
🚀 Hubie Stream Studio LIVE at: http://localhost:8080
🎥 Stream Overlay for OBS: http://localhost:8080/overlay
```

### Step 2: Configure OBS Canvas & Audio
1. Open **OBS Studio**.
2. Go to **Settings** → **Video**:
   - **Base (Canvas) Resolution:** `1920x1080`
   - **Output (Scaled) Resolution:** `1920x1080`
   - **Common FPS Values:** `60`
3. Go to **Settings** → **Stream**:
   - Select your service (**Twitch** or **Kick**).
   - Enter your **Stream Key** (from Twitch Creator Dashboard or Kick Stream settings).

### Step 3: Add the Hubie Browser Source
1. In the **Sources** dock in OBS, click the **+** (Add) button and select **Browser**.
2. Name it `Hubie Overlay`.
3. In the properties window, set:
   - **URL:** `http://localhost:8080/overlay`
   - **Width:** `1920`
   - **Height:** `1080`
   - **FPS:** `60`
   - **Control audio via OBS:** Checked ✅ *(Crucial: allows OBS to capture Hubie's voice audio)*
   - **Shutdown source when not visible:** Checked ✅
   - **Refresh browser when scene becomes active:** Checked ✅
4. Click **OK**.
5. In the OBS **Audio Mixer**, you will now see `Hubie Overlay`. Make sure the volume slider is up and unmuted.
6. Click **Start Streaming** in OBS!

---

## 6. Alternative: Built-in Direct FFmpeg Broadcaster (No OBS)

If you prefer to stream directly to Twitch or Kick without opening OBS Studio, you can use the built-in RTMP broadcaster:

1. In `.env`, set:
   ```ini
   ENABLE_RTMP_BROADCAST=true
   STREAM_PLATFORM=twitch
   STREAM_KEY=live_your_actual_twitch_stream_key
   ```
2. Start the application:
   ```bash
   npm start
   ```
3. Node.js will automatically capture the screencast and audio and pipe them directly into FFmpeg, pushing an RTMP stream straight to Twitch or Kick.

---

## 7. Troubleshooting & Common Questions

### Q: Chrome doesn't open or closes immediately
- Ensure Google Chrome is installed on your computer.
- If you want Chrome to run in the background without a window, set `HEADLESS_BROWSER=true` in `.env`.

### Q: Hubie's voice is not heard in OBS
- In OBS Studio, double-check your Browser Source properties.
- Ensure **Control audio via OBS** is checked.
- Look at the OBS Audio Mixer dock and confirm the `Hubie Overlay` slider is green and active when Hubie speaks.

### Q: OpenRouter voice says 400 or fails to synthesize
- Verify that your `OPENROUTER_API_KEY` in `.env` has active credits.
- If OpenRouter is temporarily unreachable, the system automatically falls back to Edge-TTS (`VOICE_NAME=en-US-AndrewMultilingualNeural`) with zero interruption.

### Q: Why doesn't the command list appear on the stream overlay?
- By design, the large 780px commands modal and on-screen ticker were removed so they don't block gameplay.
- Commands are sent directly to viewers in Twitch chat via Nightbot when anyone types `!command` or `!commands`.

### Q: How do win/loss screams work?
- Multipliers $\le$ 1.0x are classified as losses (Hubie groans or screams in comedic disbelief).
- Multipliers between 1.01x and 1.60x are clean green profits.
- Multipliers $> 1.60x$ trigger **insane screaming hype** in all caps, shooting confetti and starting a celebration dance!
