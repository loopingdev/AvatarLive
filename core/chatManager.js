import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

const BLOCKED_PATTERNS = [
  /\b(nigg|fag|retard|cunt|slut|whore|kill\s*yourself|kys)\w*/i,
  /(http:\/\/|https:\/\/|www\.)\S+/i,
  /\b(free\s*crypto|send\s*me\s*eth|send\s*btc|airdrop\s*now|double\s*your\s*money)\b/i,
  /\b(hack|rigged|cheat\s*code|deposit\s*now|guaranteed\s*win)\b/i
];

const SIMULATED_COMMUNITY_USERS = [
  "SlothFanatic", "NeonRoller", "LuckyPaws", "CryptoVibe99", "PlinkoGod",
  "HouseKing", "ChillVibesOnly", "DiamondHands_7", "TurboWhale", "JungleJumper",
  "GigaMultiplier", "BananaPeel", "AlphaDegenerate", "MetaSloth", "PixelBettor"
];

const SIMULATED_CHAT_MESSAGES = [
  "HUBIE! What game are we hitting next?",
  "Can you hit a 100x on Plinko for the squad?",
  "Hubie's Road is the greatest house original hands down 🔥",
  "Yooo looking fresh today Hubie!",
  "!flex",
  "!dance",
  "!surf",
  "!flag",
  "!snack",
  "!blush",
  "!commands",
  "Is it true that sloths never tilt?",
  "Drop another chip! W in the chat for Hubie!",
  "What multiplier are we chasing right now Hubie?",
  "Mines game is so intense, don't step on a bomb haha",
  "Hubie streamer of the year 2026 let's goooo!",
  "Can we see some Limbo rockets next?",
  "Slow and steady Hubie! Remember to keep it chill in demo mode!",
  "That last round was so close omg!",
  "Shoutout to the 24/7 grind, this sloth never sleeps!",
  "Housebets originals hit different with Hubie commentating"
];

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class ChatManager {
  constructor({ onNewChat = null, onModerated = null } = {}) {
    this.onNewChat = onNewChat;
    this.onModerated = onModerated;
    this.chatHistory = [];
    this.pendingQuestions = [];
    this.running = false;

    this.kickWs = null;
    this.twitchWs = null;
    this.kickReconnectTimer = null;
    this.twitchReconnectTimer = null;
    this.twitchPingTimer = null;
    this.isKickConnected = false;
    this.isTwitchConnected = false;
  }

  start() {
    if (this.running) return;
    this.running = true;

    console.log('[HubieChat] Chat Manager & Autonomous Moderator starting up...');

    // 1. Connect to Kick Live Chat if configured
    if (CONFIG.KICK_CHANNEL && CONFIG.KICK_CHANNEL.trim().length > 0) {
      this.connectKickChat(CONFIG.KICK_CHANNEL.trim());
    }

    // 2. Connect to Twitch Live Chat if configured
    if (CONFIG.TWITCH_CHANNEL && CONFIG.TWITCH_CHANNEL.trim().length > 0) {
      this.connectTwitchChat(CONFIG.TWITCH_CHANNEL.trim());
    } else if (CONFIG.STREAM_PLATFORM === 'twitch') {
      console.warn('[HubieChat WARNING] STREAM_PLATFORM is set to "twitch", but TWITCH_CHANNEL is empty in .env! Set TWITCH_CHANNEL=your_channel_username in .env so Hubie connects to your Twitch chat.');
    }

    // Dynamic .env file watcher: auto-reloads and reconnects if channel is edited live
    try {
      const envPath = path.join(CONFIG.BASE_DIR, '.env');
      if (fs.existsSync(envPath)) {
        fs.watch(envPath, (eventType) => {
          if (eventType === 'change') {
            try {
              const content = fs.readFileSync(envPath, 'utf8');
              const twitchMatch = content.match(/^TWITCH_CHANNEL\s*=\s*(.+)$/m);
              const kickMatch = content.match(/^KICK_CHANNEL\s*=\s*(.+)$/m);
              const newTwitch = twitchMatch ? twitchMatch[1].trim() : '';
              const newKick = kickMatch ? kickMatch[1].trim() : '';
              if (newTwitch && newTwitch !== CONFIG.TWITCH_CHANNEL) {
                console.log(`[HubieChat] Detected updated TWITCH_CHANNEL in .env: ${newTwitch}. Reconnecting Twitch IRC...`);
                CONFIG.TWITCH_CHANNEL = newTwitch;
                if (this.twitchWs) {
                  try { this.twitchWs.close(); } catch {}
                }
                this.connectTwitchChat(newTwitch);
              }
              if (newKick && newKick !== CONFIG.KICK_CHANNEL) {
                console.log(`[HubieChat] Detected updated KICK_CHANNEL in .env: ${newKick}. Reconnecting Kick chat...`);
                CONFIG.KICK_CHANNEL = newKick;
                if (this.kickWs) {
                  try { this.kickWs.close(); } catch {}
                }
                this.connectKickChat(newKick);
              }
            } catch {}
          }
        });
      }
    } catch {}

    // 3. Fallback simulated chat ONLY if explicitly enabled and no real channels
    if (CONFIG.ENABLE_SIMULATED_CHAT || (!CONFIG.KICK_CHANNEL && !CONFIG.TWITCH_CHANNEL)) {
      this.runSimulator();
    } else {
      console.log('[HubieChat] Real live stream chat active. Dummy/artificial chat is MUTED.');
    }
  }

  stop() {
    this.running = false;
    if (this.kickReconnectTimer) clearTimeout(this.kickReconnectTimer);
    if (this.twitchReconnectTimer) clearTimeout(this.twitchReconnectTimer);
    if (this.twitchPingTimer) clearInterval(this.twitchPingTimer);

    if (this.kickWs) {
      try { this.kickWs.close(); } catch {}
      this.kickWs = null;
    }
    if (this.twitchWs) {
      try { this.twitchWs.close(); } catch {}
      this.twitchWs = null;
    }
  }

  /**
   * Connect to real Kick stream chat via Pusher WebSocket
   */
  async connectKickChat(channel) {
    if (!this.running) return;
    console.log(`[HubieChat Kick] Resolving chatroom ID for Kick channel: ${channel}...`);

    let chatroomId = null;
    try {
      const res = await fetch(`https://kick.com/api/v2/channels/${channel}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (res.ok) {
        const data = await res.json();
        chatroomId = data.chatroom?.id;
        console.log(`[HubieChat Kick] Resolved chatroom ID: ${chatroomId}`);
      }
    } catch (err) {
      console.warn(`[HubieChat Kick] Failed to resolve channel API (${err.message}). Retrying...`);
    }

    if (!chatroomId) {
      // Retry resolution after 10s
      this.kickReconnectTimer = setTimeout(() => this.connectKickChat(channel), 10000);
      return;
    }

    const pusherUrl = 'wss://ws-us2.pusher.com/app/34bf7a0ff419a2a775b9?protocol=7&client=js&version=8.4.0-rc2&flash=false';
    try {
      this.kickWs = new WebSocket(pusherUrl);

      this.kickWs.on('open', () => {
        console.log(`[HubieChat Kick] WebSocket connected to Pusher for #${channel}!`);
        this.isKickConnected = true;
      });

      this.kickWs.on('message', async (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.event === 'pusher:connection_established') {
            // Subscribe to channel chatroom
            const subPayload = {
              event: 'pusher:subscribe',
              data: { auth: '', channel: `chatrooms.${chatroomId}.v2` }
            };
            this.kickWs.send(JSON.stringify(subPayload));
            console.log(`[HubieChat Kick] Subscribed to chatrooms.${chatroomId}.v2`);
          } else if (msg.event === 'pusher:ping') {
            this.kickWs.send(JSON.stringify({ event: 'pusher:pong', data: {} }));
          } else if (msg.event === 'App\\Events\\ChatMessageEvent' || msg.event === 'ChatMessageSentEvent') {
            const payload = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
            const sender = payload.sender?.username || 'KickViewer';
            const content = payload.content || '';
            if (content) {
              console.log(`[HubieChat Kick LIVE] @${sender}: "${content}"`);
              await this.ingestMessage(sender, content, false, 'kick');
            }
          }
        } catch (e) {
          // Non-critical parsing notice
        }
      });

      this.kickWs.on('close', () => {
        this.isKickConnected = false;
        console.warn(`[HubieChat Kick] WebSocket disconnected. Reconnecting in 6s...`);
        if (this.running) {
          this.kickReconnectTimer = setTimeout(() => this.connectKickChat(channel), 6000);
        }
      });

      this.kickWs.on('error', (err) => {
        console.warn(`[HubieChat Kick] Error: ${err.message}`);
      });

    } catch (err) {
      console.error(`[HubieChat Kick] Setup error: ${err.message}`);
      if (this.running) {
        this.kickReconnectTimer = setTimeout(() => this.connectKickChat(channel), 10000);
      }
    }
  }

  /**
   * Connect to real Twitch stream chat via IRC WebSocket
   */
  async connectTwitchChat(channel) {
    if (!this.running) return;
    const cleanChan = channel.toLowerCase().replace(/^#/, '');
    console.log(`[HubieChat Twitch] Connecting to IRC for #${cleanChan}...`);

    try {
      this.twitchWs = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

      this.twitchWs.on('open', () => {
        console.log(`[HubieChat Twitch] WebSocket open, authenticating anonymously for #${cleanChan}...`);
        this.isTwitchConnected = true;
        // Request Twitch IRC capabilities (tags, commands, membership)
        this.twitchWs.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership\r\n');
        this.twitchWs.send('PASS SCHMOOPIIE\r\n');
        this.twitchWs.send(`NICK justinfan${Math.floor(Math.random() * 80000 + 10000)}\r\n`);
        this.twitchWs.send(`JOIN #${cleanChan}\r\n`);
        console.log(`[HubieChat Twitch] Joined chatroom #${cleanChan}! Ready for live viewer comments.`);

        // Keep connection alive with periodic PING
        if (this.twitchPingTimer) clearInterval(this.twitchPingTimer);
        this.twitchPingTimer = setInterval(() => {
          if (this.twitchWs && this.twitchWs.readyState === 1) {
            this.twitchWs.send('PING :tmi.twitch.tv\r\n');
          }
        }, 30000);
      });

      this.twitchWs.on('message', async (data) => {
        const raw = data.toString();
        const lines = raw.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith('PING')) {
            this.twitchWs.send('PONG :tmi.twitch.tv\r\n');
            continue;
          }

          // Robust PRIVMSG parsing: handles IRCv3 tags, display names, and standard messages
          const privmsgIdx = trimmed.indexOf(' PRIVMSG ');
          if (privmsgIdx !== -1) {
            const afterPrivmsg = trimmed.substring(privmsgIdx + 9);
            const colonIdx = afterPrivmsg.indexOf(' :');
            if (colonIdx !== -1) {
              const content = afterPrivmsg.substring(colonIdx + 2).trim();

              // Extract username from prefix :user!user@ or from display-name tag
              let sender = 'TwitchViewer';
              const displayNameMatch = trimmed.match(/display-name=([a-zA-Z0-9_]+)/);
              const userPrefixMatch = trimmed.match(/:([a-zA-Z0-9_]+)![a-zA-Z0-9_]+@/);

              if (displayNameMatch && displayNameMatch[1]) {
                sender = displayNameMatch[1];
              } else if (userPrefixMatch && userPrefixMatch[1]) {
                sender = userPrefixMatch[1];
              }

              if (content) {
                console.log(`[HubieChat Twitch LIVE] @${sender}: "${content}"`);
                await this.ingestMessage(sender, content, false, 'twitch');
              }
            }
          }
        }
      });

      this.twitchWs.on('close', () => {
        this.isTwitchConnected = false;
        if (this.twitchPingTimer) clearInterval(this.twitchPingTimer);
        console.warn(`[HubieChat Twitch] Disconnected. Reconnecting in 6s...`);
        if (this.running) {
          this.twitchReconnectTimer = setTimeout(() => this.connectTwitchChat(channel), 6000);
        }
      });

      this.twitchWs.on('error', (err) => {
        console.warn(`[HubieChat Twitch] Error: ${err.message}`);
      });

    } catch (err) {
      console.error(`[HubieChat Twitch] Setup error: ${err.message}`);
      if (this.running) {
        this.twitchReconnectTimer = setTimeout(() => this.connectTwitchChat(channel), 10000);
      }
    }
  }

  moderateMessage(text) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(text)) {
        return false;
      }
    }
    return true;
  }

  async ingestMessage(username, text, isSimulated = false, platform = 'stream') {
    const cleanText = (text || '').trim();
    if (!cleanText) return;

    const passed = this.moderateMessage(cleanText);
    const msgObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user: username,
      text: cleanText,
      passed,
      isSimulated,
      platform,
      timestamp: Date.now()
    };

    this.chatHistory.push(msgObj);
    if (this.chatHistory.length > 100) {
      this.chatHistory.shift();
    }

    if (!passed) {
      console.warn(`[HubieChat MODERATED] Removed toxic/unsafe message from @${username}: "${cleanText}"`);
      if (this.onModerated) {
        await this.onModerated(msgObj);
      }
      return;
    }

    if (this.onNewChat) {
      await this.onNewChat(msgObj);
    }

    // Queue real messages / viewer questions for Hubie to answer live
    if (cleanText.includes('?') || cleanText.toLowerCase().includes('hubie') || !isSimulated) {
      if (this.pendingQuestions.length < 20) {
        this.pendingQuestions.push({
          user: username,
          text: cleanText,
          isSimulated,
          platform
        });
      }
    }
  }

  getNextQuestionToAnswer() {
    // Prioritize real viewers first!
    const realIdx = this.pendingQuestions.findIndex(q => !q.isSimulated);
    if (realIdx !== -1) {
      return this.pendingQuestions.splice(realIdx, 1)[0];
    }
    if (this.pendingQuestions.length > 0) {
      return this.pendingQuestions.shift();
    }
    return null;
  }

  async runSimulator() {
    while (this.running) {
      const delay = Math.random() * 16000 + 10000;
      await new Promise(r => setTimeout(r, delay));
      if (!this.running) break;

      // If real chat is actively connected and simulated chat is not explicitly forced, skip
      if (!CONFIG.ENABLE_SIMULATED_CHAT && (this.isKickConnected || this.isTwitchConnected)) {
        continue;
      }

      const user = sample(SIMULATED_COMMUNITY_USERS);
      const text = sample(SIMULATED_CHAT_MESSAGES);
      await this.ingestMessage(user, text, true, 'simulated');
    }
  }
}
