import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer } from 'ws';
import { CONFIG } from './config.js';
import { AIBrain } from './core/aiBrain.js';
import { TTSEngine } from './core/ttsEngine.js';
import { ChatManager } from './core/chatManager.js';
import { StreamSupervisor } from './core/supervisor.js';
import { HousebetsPlayer } from './browser/housebetsPlayer.js';
import { Broadcaster } from './streamer/broadcaster.js';

console.log('====================================================');
console.log('  HUBIE LIVE 24/7 — LIVE HOUSEBETS SCREEN STREAMER  ');
console.log('====================================================');

// Initialize Supervisor
const supervisor = new StreamSupervisor();
supervisor.start();
supervisor.registerComponent('game_engine');
supervisor.registerComponent('broadcaster');
supervisor.registerComponent('studio_websocket');

// Initialize AI Brain (OpenRouter)
const aiBrain = new AIBrain();
if (aiBrain.isConfigured()) {
  console.log(`[Hubie] OpenRouter AI Brain active with model: ${CONFIG.OPENROUTER_MODEL}`);
} else {
  console.log('[Hubie] OpenRouter API key not detected in .env. Running procedural high-energy fallback engine.');
}

// WebSocket broadcast helper
let activeWebsockets = new Set();
function broadcast(msg) {
  const jsonStr = JSON.stringify(msg);
  for (const client of activeWebsockets) {
    if (client.readyState === 1) {
      client.send(jsonStr);
    }
  }
}

// Throttle video frame broadcast to avoid buffer bloat
let lastFrameSentTime = 0;
function broadcastFrame(base64Data) {
  const now = Date.now();
  if (now - lastFrameSentTime < 33) return; // ~30 fps cap
  lastFrameSentTime = now;
  broadcast({ type: 'screencast_frame', data: `data:image/jpeg;base64,${base64Data}` });
}

// Initialize TTS Engine
const ttsEngine = new TTSEngine({
  onSpeechStart: async (text, duration, audioUrl) => {
    broadcast({
      type: 'hubie_speaking_start',
      text,
      duration,
      audio_url: audioUrl
    });
  },
  onSpeechEnd: async () => {
    broadcast({ type: 'hubie_speaking_end' });
  }
});
ttsEngine.start();

// Initialize Chat Manager & Auto-Moderator
const chatManager = new ChatManager({
  onNewChat: async (msg) => {
    broadcast({ type: 'chat_message', message: msg });
  },
  onModerated: async (msg) => {
    broadcast({ type: 'chat_moderated', message: msg });
  }
});
chatManager.start();

// Initialize Autonomous Housebets Browser Player (plays on housebets.com/house-games)
const housebetsPlayer = new HousebetsPlayer({
  aiBrain,
  ttsEngine,
  chatManager,
  supervisor,
  onGameUpdate: (payload) => {
    broadcast({ type: 'game_update', data: payload });
  },
  onFrame: (base64) => {
    broadcastFrame(base64);
  }
});
housebetsPlayer.start();

// Initialize Broadcaster (RTMP to Kick or Twitch)
const broadcaster = new Broadcaster(supervisor);
broadcaster.start();

// Create HTTP Server for Web Studio & Stream Overlay
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // API Status Endpoint
  if (url.pathname === '/api/status') {
    const telemetry = supervisor.getTelemetry();
    telemetry.current_game = housebetsPlayer.currentGame;
    telemetry.total_rounds = housebetsPlayer.totalRounds;
    telemetry.ai_configured = aiBrain.isConfigured();
    telemetry.broadcasting = broadcaster.isBroadcasting;
    telemetry.platform = CONFIG.STREAM_PLATFORM;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(telemetry));
    return;
  }

  // API Chat Endpoint
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const user = (data.user || 'Viewer').trim();
        const text = (data.text || '').trim();
        if (text) {
          chatManager.ingestMessage(user, text, false);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
          return;
        }
      } catch {}
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid payload' }));
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(CONFIG.BASE_DIR, 'web', url.pathname === '/' ? 'index.html' : url.pathname);
  if (url.pathname === '/overlay') {
    filePath = path.join(CONFIG.BASE_DIR, 'web', 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

// Setup WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  activeWebsockets.add(ws);
  supervisor.heartbeat('studio_websocket');

  // Send initial state & latest screenshot frame immediately
  ws.send(JSON.stringify({
    type: 'init',
    game_state: {
      game_name: housebetsPlayer.currentGame.id,
      display_name: housebetsPlayer.currentGame.name,
      game_url: housebetsPlayer.currentGame.url,
      total_rounds: housebetsPlayer.totalRounds
    },
    telemetry: supervisor.getTelemetry(),
    safety_disclaimer: CONFIG.SAFETY_DISCLAIMER
  }));

  if (housebetsPlayer.lastFrameBase64) {
    ws.send(JSON.stringify({
      type: 'screencast_frame',
      data: `data:image/jpeg;base64,${housebetsPlayer.lastFrameBase64}`
    }));
  }

  ws.on('message', (data) => {
    supervisor.heartbeat('studio_websocket');
    try {
      const msg = JSON.parse(data.toString());
      if (msg.action === 'manual_chat') {
        chatManager.ingestMessage(msg.user || 'AdminViewer', msg.text || 'Let\'s go Hubie!', false);
      }
    } catch {}
  });

  ws.on('close', () => {
    activeWebsockets.delete(ws);
  });
});

server.listen(CONFIG.PORT, CONFIG.HOST, () => {
  console.log(`\n🚀 Hubie Stream Studio LIVE at: http://localhost:${CONFIG.PORT}`);
  console.log(`🎥 Stream Overlay for OBS: http://localhost:${CONFIG.PORT}/overlay`);
  console.log(`🌐 Autonomous Browser Target: https://www.housebets.com/house-games`);
  console.log(`📊 Status Telemetry: http://localhost:${CONFIG.PORT}/api/status`);
  console.log(`🛡️ Autonomous Watchdog: ACTIVE (Audit log writing to stream_audit.json)\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping Hubie Streamer cleanly...');
  housebetsPlayer.stop();
  ttsEngine.stop();
  chatManager.stop();
  broadcaster.stop();
  supervisor.stop();
  server.close(() => process.exit(0));
});
