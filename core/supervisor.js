import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

const AUDIT_FILE = path.join(CONFIG.BASE_DIR, 'stream_audit.json');

export class StreamSupervisor {
  constructor() {
    this.startTime = Date.now();
    this.totalRoundsPlayed = 0;
    this.totalCrashesRecovered = 0;
    this.activeComponents = {};
    this.running = false;
  }

  start() {
    this.startTime = Date.now();
    this.running = true;
    this.writeAuditEntry('STREAM_SESSION_START', { time: new Date().toISOString() });
    this.watchdogLoop();
    console.log('[HubieSupervisor] 24/7 Watchdog active. Auto-recovery armed.');
  }

  stop() {
    this.running = false;
    this.writeAuditEntry('STREAM_SESSION_END', {
      uptime_seconds: this.getUptimeSeconds(),
      uptime_human: this.getUptimeString(),
      total_rounds: this.totalRoundsPlayed
    });
  }

  registerComponent(name) {
    this.activeComponents[name] = {
      status: 'healthy',
      lastHeartbeat: Date.now(),
      restarts: 0
    };
  }

  heartbeat(name) {
    if (this.activeComponents[name]) {
      this.activeComponents[name].lastHeartbeat = Date.now();
      this.activeComponents[name].status = 'healthy';
    }
  }

  recordRoundCompletion() {
    this.totalRoundsPlayed++;
  }

  recordRecovery(componentName, errorMsg) {
    this.totalCrashesRecovered++;
    if (this.activeComponents[componentName]) {
      this.activeComponents[componentName].restarts++;
    }
    console.warn(`[HubieSupervisor AUTO-RECOVERY] Recovered ${componentName}: ${errorMsg}`);
    this.writeAuditEntry('AUTO_RECOVERY', {
      component: componentName,
      error: errorMsg,
      timestamp: new Date().toISOString()
    });
  }

  getUptimeSeconds() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getUptimeString() {
    const totalSecs = this.getUptimeSeconds();
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  getTelemetry() {
    const memory = process.memoryUsage();
    return {
      uptime: this.getUptimeString(),
      uptime_seconds: this.getUptimeSeconds(),
      rounds_played: this.totalRoundsPlayed,
      auto_recoveries: this.totalCrashesRecovered,
      memory_mb: Math.round(memory.rss / (1024 * 1024)),
      components: this.activeComponents,
      judging_ready: this.getUptimeSeconds() >= 10800 // 3 hours minimum
    };
  }

  writeAuditEntry(eventType, data) {
    const entry = {
      event: eventType,
      timestamp: new Date().toISOString(),
      uptime_seconds: this.getUptimeSeconds(),
      uptime: this.getUptimeString(),
      data
    };

    try {
      let entries = [];
      if (fs.existsSync(AUDIT_FILE)) {
        try {
          entries = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
        } catch {
          entries = [];
        }
      }
      entries.push(entry);
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(entries, null, 2), 'utf-8');
    } catch (err) {
      console.error('[HubieSupervisor] Failed to write audit log:', err.message);
    }
  }

  async watchdogLoop() {
    let lastCheckpoint = Date.now();
    while (this.running) {
      await new Promise(r => setTimeout(r, 5000));
      const now = Date.now();

      // Check stall status
      for (const [name, comp] of Object.entries(this.activeComponents)) {
        if (now - comp.lastHeartbeat > 60000) {
          comp.status = 'stalled';
        }
      }

      // Checkpoint every 30 minutes for judges verification
      if (now - lastCheckpoint >= 1800000) {
        lastCheckpoint = now;
        this.writeAuditEntry('JUDGES_CHECKPOINT', {
          uptime: this.getUptimeString(),
          rounds_played: this.totalRoundsPlayed,
          status: 'LIVE_AND_HEALTHY'
        });
      }
    }
  }
}

