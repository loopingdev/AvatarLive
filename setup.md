# 🚀 24/7 VPS Deployment & Headless Streaming Guide (Linux & Windows)

This comprehensive guide details how to deploy **Hubie Live 24/7** to a Virtual Private Server (VPS) and broadcast continuously to **Kick** or **Twitch** in a **headless (non-GUI)** environment without a physical monitor or sound card.

---

## 📋 Table of Contents
1. [VPS Hardware & Architecture Overview](#1-vps-hardware--architecture-overview)
2. [Headless Streaming Methods: Comparison](#2-headless-streaming-methods-comparison)
3. [Method A: Linux VPS (Ubuntu 22.04 / 24.04 LTS) with Headless OBS](#3-method-a-linux-vps-ubuntu-2204--2404-lts-with-headless-obs)
4. [Method B: Linux VPS with Built-in Ultralight FFmpeg Broadcaster (No OBS)](#4-method-b-linux-vps-with-built-in-ultralight-ffmpeg-broadcaster-no-obs)
5. [Method C: Windows Server VPS Setup](#5-method-c-windows-server-vps-setup)
6. [Headless Audio Configuration (PulseAudio Virtual Sink)](#6-headless-audio-configuration-pulseaudio-virtual-sink)
7. [Automating 24/7 Autostart via Systemd (Linux)](#7-automating-247-autostart-via-systemd-linux)
8. [Automating 24/7 Autostart via NSSM (Windows Server)](#8-automating-247-autostart-via-nssm-windows-server)
9. [Remote Dashboard Access & Telemetry](#9-remote-dashboard-access--telemetry)
10. [Troubleshooting & FAQs](#10-troubleshooting--faqs)

---

## 1. VPS Hardware & Architecture Overview

### Recommended Specifications
| Component | Minimum | Recommended |
| :--- | :--- | :--- |
| **vCPU** | 2 Cores | 4 Cores (x86_64) |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 25 GB SSD/NVMe | 40 GB NVMe |
| **OS** | Ubuntu 22.04/24.04 LTS or Debian 12 | Ubuntu 24.04 LTS / Windows Server 2022 |
| **Network** | 100 Mbps uplink | 1 Gbps uplink (unmetered) |

### How It Works Headless
```
┌────────────────────────────────────────────────────────────────────────┐
│                        HEADLESS VPS ENVIRONMENT                       │
│                                                                        │
│  [Xvfb / Virtual Display :99] ◄── PulseAudio (Virtual Null Sink)      │
│         │                                                              │
│         ▼                                                              │
│  [Playwright / Chromium (Headless)]                                    │
│         │ (Interacts with housebets.com/house-games)                   │
│         ▼                                                              │
│  [Node.js Engine (server.js)] ─── WebSockets / HTTP (:8080)            │
│         │                                                              │
│         ├─► [Overlay: http://localhost:8080/overlay (1080p)]           │
│         │                                                              │
│         ▼                                                              │
│  [BROADCAST LAYER]                                                     │
│    Option 1: Built-in FFmpeg Broadcaster (Native, zero GUI)            │
│    Option 2: OBS Studio CLI (via Xvfb: obs --startstreaming --headless)│
│         │                                                              │
│         ▼                                                              │
│  [RTMP Video Stream: 1920x1080 @ 60fps] ──► Kick / Twitch RTMP Ingest   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Headless Streaming Methods: Comparison

| Feature | Method 1: Built-in FFmpeg Broadcaster | Method 2: Headless OBS Studio (`Xvfb`) |
| :--- | :--- | :--- |
| **RAM Usage** | ~350 MB | ~1.2 GB - 1.8 GB |
| **CPU Overhead** | Very Low | Moderate to High |
| **Dependencies** | Node.js + FFmpeg only | Node.js + OBS Studio + Xvfb + PulseAudio |
| **OBS Plugins** | None required | Full OBS browser source support |
| **Ease of Setup** | ⚡ 1 click (`ENABLE_RTMP_BROADCAST=true`) | Requires virtual display configuration |
| **Best For** | Budget VPS / Low CPU instances | Advanced stream scenes & overlay filters |

---

## 3. Method A: Linux VPS (Ubuntu 22.04 / 24.04 LTS) with Headless OBS

This method uses **OBS Studio** inside a virtual display buffer (**Xvfb**) so OBS can capture the web overlay without a physical screen.

### Step 1: Update System & Install Core Packages
Connect to your VPS via SSH and run:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ffmpeg xvfb pulseaudio socat jq
```

### Step 2: Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # Should output v20.x or higher
npm -v
```

### Step 3: Install OBS Studio on Ubuntu
```bash
sudo add-apt-repository ppa:obsproject/obs-studio -y
sudo apt update
sudo apt install -y obs-studio
```

Verify OBS installation:
```bash
obs --version
```

### Step 4: Clone the Repository & Install Dependencies
```bash
cd /opt
sudo git clone https://github.com/your-username/hubie-streamer.git hubie
sudo chown -R $USER:$USER /opt/hubie
cd /opt/hubie

npm install
```

### Step 5: Install Playwright & Linux Browser Dependencies
```bash
npx playwright install --with-deps chromium
```

### Step 6: Configure `.env`
Create your production `.env`:
```bash
cp .env.example .env
nano .env
```
Ensure the following are set:
```ini
# Housebets Account Credentials
HOUSEBETS_EMAIL=your_email@example.com
HOUSEBETS_PASSWORD=your_password_here

# OpenRouter AI Credentials
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=google/gemini-2.0-flash-001

# Headless mode for VPS
HEADLESS_BROWSER=true

# Keep built-in RTMP false if using OBS Studio
ENABLE_RTMP_BROADCAST=false

# Real Stream Chat
KICK_CHANNEL=housebets

# Mascot Voice
VOICE_NAME=en-US-EricNeural
VOICE_RATE=+6%
VOICE_PITCH=+3Hz
```

### Step 7: Configure OBS Headless Scene Profile
OBS stores configuration in `~/.config/obs-studio/`. Create the scene collection with the Hubie browser overlay:

```bash
mkdir -p ~/.config/obs-studio/basic/scenes/
mkdir -p ~/.config/obs-studio/basic/profiles/HubieStream/
```

Create `~/.config/obs-studio/basic/profiles/HubieStream/service.json` (replace with your Kick/Twitch stream key):
```json
{
    "type": "rtmp_custom",
    "settings": {
        "server": "rtmp://fa7237973e61.global-contribute.live-video.net/app",
        "key": "your_kick_stream_key_here",
        "use_auth": false
    }
}
```

Create `~/.config/obs-studio/basic/scenes/HubieScene.json`:
```json
{
    "current_scene": "HubieLive",
    "current_program_scene": "HubieLive",
    "scene_order": [{"name": "HubieLive"}],
    "name": "HubieScene",
    "sources": [
        {
            "id": "browser_source",
            "name": "HubieOverlay",
            "settings": {
                "url": "http://127.0.0.1:8080/overlay",
                "width": 1920,
                "height": 1080,
                "fps": 60,
                "restart_when_active": true,
                "shutdown": false,
                "reroute_audio": true
            }
        },
        {
            "id": "scene",
            "name": "HubieLive",
            "settings": {
                "items": [
                    {
                        "name": "HubieOverlay",
                        "visible": true
                    }
                ]
            }
        }
    ]
}
```

### Step 8: Start Headless OBS via `xvfb-run`
Test running OBS in the virtual framebuffer:
```bash
xvfb-run -s "-screen 0 1920x1080x24" obs --collection HubieScene --profile HubieStream --startstreaming --headless
```

---

## 4. Method B: Linux VPS with Built-in Ultralight FFmpeg Broadcaster (No OBS)

If your VPS has limited RAM (e.g. 2GB–4GB) and you do **NOT** want to install OBS Studio, you can use the **built-in FFmpeg Broadcaster** included in this repository.

### Why this is the easiest & most efficient method:
- Requires **ZERO GUI software** and **ZERO virtual display libraries**.
- Consumes **80% less memory** than OBS.
- Directly streams 1080p60 to Kick or Twitch using native FFmpeg.

### Step-by-Step:
1. Follow Steps 1, 2, 4, and 5 from Method A (Install Node.js, clone repo, install Playwright).
2. Edit `.env`:
   ```ini
   # Enable native RTMP broadcaster
   ENABLE_RTMP_BROADCAST=true
   STREAM_PLATFORM=kick
   STREAM_KEY=your_kick_stream_key_here
   KICK_RTMP_URL=rtmp://fa7237973e61.global-contribute.live-video.net/app

   # Headless browser on Linux
   HEADLESS_BROWSER=true
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. The system will start Chrome headlessly, begin playing Housebets games, and broadcast the RTMP stream directly to Kick/Twitch!

---

## 5. Method C: Windows Server VPS Setup

If you are using a **Windows Server 2019 / 2022 VPS**:

### Step 1: Install Software
1. Download and install **Node.js 20 LTS** from [nodejs.org](https://nodejs.org/).
2. Download and install **Git for Windows** from [git-scm.com](https://git-scm.com/).
3. Download and install **Google Chrome** or let Playwright manage Chromium.
4. (Optional) Install **OBS Studio** from [obsproject.com](https://obsproject.com/).

### Step 2: Clone & Configure
Open PowerShell as Administrator:
```powershell
cd C:\
git clone https://github.com/your-username/hubie-streamer.git AvatarLive
cd C:\AvatarLive

npm install
npx playwright install chromium
Copy-Item .env.example .env
notepad .env
```

### Step 3: Stream via OBS Studio (Windows)
1. Launch OBS Studio.
2. In **Settings -> Stream**, choose **Custom...**:
   - **Server:** `rtmp://fa7237973e61.global-contribute.live-video.net/app`
   - **Stream Key:** Your Kick stream key.
3. In **Settings -> Video**:
   - Base & Output Resolution: `1920x1080`
   - Common FPS: `60`
4. Add a **Browser Source**:
   - URL: `http://localhost:8080/overlay`
   - Width: `1920`
   - Height: `1080`
   - Check: `Control audio via OBS`
5. You can launch OBS minimized from PowerShell:
   ```powershell
   & "C:\Program Files\obs-studio\bin\64bit\obs64.exe" --startstreaming --minimize-to-tray
   ```

---

## 6. Headless Audio Configuration (PulseAudio Virtual Sink)

On headless Linux VPS servers, applications that generate audio (TTS and browser media) need a virtual audio sink so they do not crash or stall when no physical sound device is present.

### Configure PulseAudio Dummy Audio Device (Linux):
```bash
# Start pulseaudio daemon with a virtual null sink
pulseaudio -D --exit-idle-time=-1
pactl load-module module-null-sink sink_name=DummyOutput sink_properties=device.description="Virtual_Sink"
pactl set-default-sink DummyOutput
```

To make this persist across reboots, add to `~/.config/pulse/default.pa`:
```ini
.include /etc/pulse/default.pa
load-module module-null-sink sink_name=DummyOutput sink_properties=device.description="Virtual_Sink"
set-default-sink DummyOutput
```

---

## 7. Automating 24/7 Autostart via Systemd (Linux)

To ensure Hubie automatically starts on boot and recovers if the server reboots:

### Step 1: Create the Hubie Node.js Service
Create `/etc/systemd/system/hubie.service`:
```bash
sudo nano /etc/systemd/system/hubie.service
```

Paste the following configuration:
```ini
[Unit]
Description=Hubie Live 24/7 Autonomous AI Streamer
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/hubie
Environment=NODE_ENV=production
Environment=PULSE_SERVER=unix:/tmp/pulse-socket
ExecStartPre=/usr/bin/pulseaudio --start --exit-idle-time=-1
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Step 2 (Optional): Create OBS Headless Service (If Using Method A)
Create `/etc/systemd/system/hubie-obs.service`:
```bash
sudo nano /etc/systemd/system/hubie-obs.service
```

```ini
[Unit]
Description=OBS Studio Headless 24/7 Streamer
After=hubie.service
Wants=hubie.service

[Service]
Type=simple
User=root
Environment=DISPLAY=:99
ExecStartPre=/usr/bin/xvfb-run -n 99 -s "-screen 0 1920x1080x24" -a true
ExecStart=/usr/bin/xvfb-run -n 99 -s "-screen 0 1920x1080x24" /usr/bin/obs --collection HubieScene --profile HubieStream --startstreaming --headless
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Step 3: Enable and Start Services
```bash
sudo systemctl daemon-reload
sudo systemctl enable hubie
sudo systemctl start hubie

# Check status
sudo systemctl status hubie
```

### Viewing Logs in Real Time:
```bash
sudo journalctl -u hubie -f
```

---

## 8. Automating 24/7 Autostart via NSSM (Windows Server)

On Windows Server, you can turn Hubie into a true Windows Service using **NSSM** (Non-Sucking Service Manager):

1. Download NSSM from [nssm.cc](https://nssm.cc/download) and place `nssm.exe` in `C:\Windows\System32\`.
2. Open PowerShell as Administrator and run:
   ```powershell
   nssm install HubieStreamer "C:\Program Files\nodejs\node.exe" "server.js"
   nssm set HubieStreamer AppDirectory "C:\AvatarLive"
   nssm set HubieStreamer AppStdout "C:\AvatarLive\service_out.log"
   nssm set HubieStreamer AppStderr "C:\AvatarLive\service_err.log"
   nssm set HubieStreamer Start SERVICE_AUTO_START
   ```
3. Start the service:
   ```powershell
   Start-Service HubieStreamer
   ```

---

## 9. Remote Dashboard Access & Telemetry

### Option A: SSH Local Port Forwarding (Most Secure)
You do not need to expose port 8080 to the public internet. Connect from your local machine with port forwarding:
```bash
ssh -L 8080:localhost:8080 root@your-vps-ip
```
Then open your local browser to:
- **Studio Dashboard:** `http://localhost:8080`
- **Stream Overlay:** `http://localhost:8080/overlay`
- **Status Telemetry:** `http://localhost:8080/api/status`

### Option B: Nginx Reverse Proxy with HTTPS & Password Protection
Install Nginx and certbot:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```
Create `/etc/nginx/sites-available/hubie`:
```nginx
server {
    server_name stream.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        auth_basic "Hubie Studio Protected";
        auth_basic_user_file /etc/nginx/.htpasswd;
    }

    # Overlay accessible for OBS without password
    location /overlay {
        proxy_pass http://127.0.0.1:8080/overlay;
        auth_basic off;
    }
}
```
Enable site and generate SSL:
```bash
sudo ln -s /etc/nginx/sites-available/hubie /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d stream.yourdomain.com
```

---

## 10. Troubleshooting & FAQs

### Q1: Chrome does not start on Linux VPS ("Running as root without --no-sandbox")
Playwright handles sandboxing, but if you run as `root`, ensure the Playwright Chrome flags in `browser/housebetsPlayer.js` include `'--no-sandbox'`.

### Q2: Housebets triggers a Cloudflare challenge or Captcha
- **Recommended Solution:** Use a residential or non-datacenter proxy, or perform initial login once locally, then copy the `./chrome_data` session directory to `/opt/hubie/chrome_data` on your VPS. The session tokens will persist!

### Q3: Audio is silent on Kick / Twitch
- **If using Built-in FFmpeg Broadcaster:** Verify FFmpeg audio flags.
- **If using OBS Studio:** Ensure the Browser Source has **"Control audio via OBS"** checked, and the source is not muted in OBS Audio Mixer.

### Q4: How do I verify the stream history for audit purposes?
Check [`stream_audit.json`](file:///i:/0xElephant/AvatarLive/stream_audit.json). The autonomous supervisor writes every round result, timestamp, multiplier, and recovery event continuously.

