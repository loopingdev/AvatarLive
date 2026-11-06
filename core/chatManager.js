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
  "HUBIE! What game we hitting today?",
  "Can you hit a 100x on Plinko for the boys?",
  "Hubie's Road is the best house original hands down 🔥",
  "Yooo love the sunglasses Hubie! Where did you get them?",
  "Is it true that sloths never tilt?",
  "Drop another chip! W in the chat for Hubie!",
  "What's your highest multiplier today Hubie?",
  "Mines game is so intense, don't step on a bomb haha",
  "Hubie streamer of the year 2026 let's goooo!",
  "Can we see some Limbo rockets next?",
  "Slow and steady Hubie! Remember to keep it chill in demo mode!",
  "That last round was so close omg",
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
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.runSimulator();
      console.log("[HubieChat] Chat Manager & Autonomous Moderator active.");
    }
  }

  stop() {
    this.running = false;
  }

  moderateMessage(text) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(text)) {
        return false;
      }
    }
    return true;
  }

  async ingestMessage(username, text, isSimulated = false) {
    const cleanText = (text || '').trim();
    if (!cleanText) return;

    const passed = this.moderateMessage(cleanText);
    const msgObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user: username,
      text: cleanText,
      passed,
      isSimulated,
      timestamp: Date.now()
    };

    this.chatHistory.push(msgObj);
    if (this.chatHistory.length > 100) {
      this.chatHistory.shift();
    }

    if (!passed) {
      console.warn(`[HubieChat MODERATED] Removed toxic message from @${username}: "${cleanText}"`);
      if (this.onModerated) {
        await this.onModerated(msgObj);
      }
      return;
    }

    if (this.onNewChat) {
      await this.onNewChat(msgObj);
    }

    // Queue questions or direct Hubie mentions
    if (cleanText.includes('?') || cleanText.toLowerCase().includes('hubie')) {
      if (this.pendingQuestions.length < 10) {
        this.pendingQuestions.push({ user: username, text: cleanText });
      }
    }
  }

  getNextQuestionToAnswer() {
    if (this.pendingQuestions.length > 0) {
      return this.pendingQuestions.shift();
    }
    return null;
  }

  async runSimulator() {
    while (this.running) {
      const delay = Math.random() * 14000 + 8000;
      await new Promise(r => setTimeout(r, delay));
      if (!this.running) break;

      const user = sample(SIMULATED_COMMUNITY_USERS);
      const text = sample(SIMULATED_CHAT_MESSAGES);
      await this.ingestMessage(user, text, true);
    }
  }
}

