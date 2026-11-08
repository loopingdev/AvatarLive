import path from 'path';
import { chromium } from 'playwright';
import { CONFIG } from '../config.js';

export class HousebetsPlayer {
  constructor({ aiBrain, ttsEngine, chatManager, supervisor, onGameUpdate = null, onFrame = null }) {
    this.ai = aiBrain;
    this.tts = ttsEngine;
    this.chat = chatManager;
    this.supervisor = supervisor;
    this.onGameUpdate = onGameUpdate;
    this.onFrame = onFrame;

    this.browserContext = null;
    this.page = null;
    this.cdp = null;
    this.running = false;
    this.currentGameIndex = 0;
    this.roundsInCurrentGame = 0;
    this.totalRounds = 0;
    this.totalWins = 0;
    this.totalLosses = 0;
    this.streak = 0;
    this.lastMultiplier = 1.0;
    this.lastOutcome = null;
    this.lastLiveOutcome = null;
    this.cashedOutOutcome = null;
    this.lastSafetyTime = Date.now();
    this.lastFrameBase64 = null;
    this.lastFrameReceivedTime = 0;
    this.frameWatchdogInterval = null;
  }

  get currentGame() {
    return CONFIG.HOUSE_GAMES[this.currentGameIndex];
  }

  async start() {
    this.running = true;
    try {
      await this.initBrowser();
      this.playLoop();
      console.log('[HousebetsPlayer] Live Housebets Player & Real-time Screencast active.');
    } catch (err) {
      console.error('[HousebetsPlayer] Startup error:', err.message);
      this.supervisor.recordRecovery('housebets_browser', err.message);
    }
  }

  stop() {
    this.running = false;
    if (this.frameWatchdogInterval) {
      clearInterval(this.frameWatchdogInterval);
      this.frameWatchdogInterval = null;
    }
    if (this.browserContext) {
      this.browserContext.close().catch(() => {});
    }
  }

  async initBrowser() {
    const userDataDir = path.join(CONFIG.BASE_DIR, 'chrome_data');
    console.log(`[HousebetsPlayer] Launching persistent Chrome profile: ${userDataDir}`);

    const launchOptions = {
      headless: CONFIG.HEADLESS_BROWSER,
      viewport: { width: 1280, height: 720 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--start-maximized',
        '--ignore-gpu-blocklist',
        '--enable-webgl',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-accelerated-2d-canvas',
        '--autoplay-policy=no-user-gesture-required'
      ]
    };
    if (CONFIG.ENABLE_RTMP_BROADCAST && process.platform !== 'win32') {
      launchOptions.args.push('--window-position=-2500,-2500');
    }
    if (process.platform === 'win32') {
      launchOptions.channel = 'chrome';
    }

    this.browserContext = await chromium.launchPersistentContext(userDataDir, launchOptions);

    const pages = this.browserContext.pages();
    this.page = pages.length > 0 ? pages[0] : await this.browserContext.newPage();

    // Attach CDP Screencast for real-time live preview
    await this.setupScreencast();

    // Attach Real-Time Housebets Game Engine API Interceptor
    this.currentActiveMultiplier = 1.0;
    this.page.on('response', async (res) => {
      const url = res.url();
      if ((url.includes('games.housebets.com') || url.includes('housebets.com')) &&
          (url.includes('/bet') || url.includes('/action') || url.includes('/cashout') ||
           url.includes('/step') || url.includes('/play') || url.includes('/spin') ||
           url.includes('/roll') || url.includes('/deal') || url.includes('/take') ||
           url.includes('/claim') || url.includes('/game'))) {
        try {
          const text = await res.text();
          const json = JSON.parse(text);
          const g = json.game?.game || json.game || json.state?.game || json;
          const round = json.round || {};

          let mult = 0;
          if (typeof g.multiplier === 'number') mult = g.multiplier;
          else if (typeof json.multiplier === 'number') mult = json.multiplier;
          else if (typeof g.payoutMultiplier === 'number') mult = g.payoutMultiplier;
          else if (typeof json.payoutMultiplier === 'number') mult = json.payoutMultiplier;
          else if (typeof g.payout === 'number' && typeof g.stake === 'number' && g.stake > 0) mult = g.payout / g.stake;
          else if (typeof round.payout === 'number' && typeof round.stake === 'number' && round.stake > 0) mult = round.payout / round.stake;
          else if (typeof json.payout === 'number' && typeof json.stake === 'number' && json.stake > 0) mult = json.payout / json.stake;

          const isTrapOrBust = g.outcome === 'trap' || g.outcome === 'bust' || g.outcome === 'loss' || json.outcome === 'trap' || g.won === false || json.won === false || (g.active === false && !isCashoutOrWin);
          const isCashoutOrWin = g.outcome === 'cashout' || g.outcome === 'castle' || g.outcome === 'win' || json.outcome === 'cashout' || json.outcome === 'win';

          let won = false;
          if (isTrapOrBust) {
            won = false;
            mult = 0.0;
          } else if (isCashoutOrWin) {
            if (mult <= 0 && g.payout && g.stake) mult = g.payout / g.stake;
            won = mult > 1.0;
          } else {
            won = mult > 1.0;
          }

          if (g.active) {
            this.currentActiveMultiplier = mult > 0 ? mult : this.currentActiveMultiplier;
          } else {
            this.currentActiveMultiplier = 1.0;
          }

          if (isCashoutOrWin && mult > 0) {
            this.cashedOutOutcome = {
              won: true,
              multiplier: mult
            };
          }

          this.lastLiveOutcome = {
            game: g.name || this.currentGame.id,
            displayName: this.currentGame.name,
            multiplier: mult,
            won: Boolean(won),
            active: Boolean(g.active),
            outcome: isTrapOrBust ? 'trap' : (isCashoutOrWin ? 'cashout' : (g.outcome || json.outcome || 'step')),
            timestamp: Date.now()
          };
          console.log(`[HousebetsPlayer API Live] Game: ${this.lastLiveOutcome.displayName} | Won: ${this.lastLiveOutcome.won} | Multiplier: ${mult.toFixed(2)}x | Active: ${g.active} | Outcome: ${g.outcome || 'step'}`);
        } catch {}
      }
    });

    // Navigate to House Games
    console.log('[HousebetsPlayer] Navigating to https://www.housebets.com/house-games...');
    await this.page.goto(CONFIG.HOUSEBETS_BASE_URL, { timeout: 45000 }).catch(e => console.warn(e.message));
    await this.page.waitForTimeout(4000);

    // Accept cookies if banner appears
    await this.acceptCookieBanner();

    // Auto-Login if credentials exist
    await this.ensureLoggedIn();
  }

  async setupScreencast() {
    try {
      if (this.cdp) {
        try { await this.cdp.detach(); } catch {}
      }
      this.cdp = await this.page.context().newCDPSession(this.page);
      await this.cdp.send('Page.startScreencast', {
        format: 'jpeg',
        quality: 75,
        maxWidth: 1280,
        maxHeight: 720,
        everyNthFrame: 1
      });

      this.cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
        this.lastFrameBase64 = data;
        this.lastFrameReceivedTime = Date.now();
        if (this.onFrame) {
          this.onFrame(data);
        }
        try {
          await this.cdp.send('Page.screencastFrameAck', { sessionId });
        } catch {}
      });
      console.log('[HousebetsPlayer] Real-time CDP Screencast stream linked to live preview.');
    } catch (e) {
      console.warn('[HousebetsPlayer] Could not attach CDP screencast:', e.message);
    }

    this.startFrameWatchdog();
  }

  startFrameWatchdog() {
    if (this.frameWatchdogInterval) clearInterval(this.frameWatchdogInterval);
    this.frameWatchdogInterval = setInterval(async () => {
      if (!this.running || !this.page || this.page.isClosed()) return;
      const now = Date.now();
      // If no frame received via CDP for more than 1.5s, capture directly to keep stream responsive
      if (now - this.lastFrameReceivedTime > 1500) {
        try {
          const buffer = await this.page.screenshot({
            type: 'jpeg',
            quality: 70,
            scale: 'css',
            timeout: 2500
          });
          const base64 = buffer.toString('base64');
          this.lastFrameBase64 = base64;
          this.lastFrameReceivedTime = now;
          if (this.onFrame) {
            this.onFrame(base64);
          }
        } catch {}
      }
    }, 500);
  }

  async acceptCookieBanner() {
    const cookieSelectors = [
      'button:has-text("Accept all")',
      'button:has-text("Accept All")',
      'button:has-text("Accept Cookies")',
      'button:has-text("Allow all")',
      'button:has-text("Allow All")',
      'button:has-text("Accept")',
      'button:has-text("I agree")',
      'button:has-text("Got it")',
      '#onetrust-accept-btn-handler',
      '.cookie-accept-btn'
    ];

    for (const selector of cookieSelectors) {
      try {
        const btn = await this.page.$(selector);
        if (btn && await btn.isVisible()) {
          console.log(`[HousebetsPlayer] Accepting cookie banner via: ${selector}`);
          await btn.click({ force: true });
          await this.page.waitForTimeout(1000);
          break;
        }
      } catch {}
    }
  }

  async ensureLoggedIn() {
    if (!CONFIG.HOUSEBETS_EMAIL || !CONFIG.HOUSEBETS_PASSWORD) {
      console.log('[HousebetsPlayer] No credentials set in .env. Playing in guest/demo mode.');
      return;
    }

    try {
      const loginBtn = await this.page.$('button:has-text("Log In")');
      if (loginBtn && await loginBtn.isVisible()) {
        console.log(`[HousebetsPlayer] Logging in as: ${CONFIG.HOUSEBETS_EMAIL}`);
        await loginBtn.click({ force: true });
        await this.page.waitForTimeout(2000);

        const emailInput = await this.page.waitForSelector('input[name="identifier"], input[placeholder*="email" i]', { timeout: 8000 });
        if (emailInput) {
          await emailInput.fill(CONFIG.HOUSEBETS_EMAIL);
        }

        const passwordInput = await this.page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 8000 });
        if (passwordInput) {
          await passwordInput.fill(CONFIG.HOUSEBETS_PASSWORD);
        }

        const submitBtn = await this.page.$('button:has-text("Log In"), button:has-text("Continue")');
        if (submitBtn) {
          await submitBtn.click({ force: true });
          console.log('[HousebetsPlayer] Login submitted, waiting for authentication...');
          await this.page.waitForTimeout(5000);
        }
      } else {
        console.log('[HousebetsPlayer] Session already authenticated.');
      }
    } catch (err) {
      console.warn('[HousebetsPlayer] Login check notice:', err.message);
    }
  }

  async dismissModals() {
    await this.acceptCookieBanner();
    await this.page.evaluate(() => window.scrollTo(0, 0));

    try {
      const keepPlaying = await this.page.$('button:has-text("Keep playing")');
      if (keepPlaying && await keepPlaying.isVisible()) await keepPlaying.click({ force: true });

      const switchLaunch = await this.page.$('button:has-text("Switch and launch")');
      if (switchLaunch && await switchLaunch.isVisible()) await switchLaunch.click({ force: true });
    } catch {}
  }

  async playLoop() {
    await new Promise(r => setTimeout(r, 2000));
    const intro = "Yo what is up squad! Hubie is LIVE on housebets.com playing the official House Games! Let's get these multipliers!";
    this.tts.speak(intro, true);
    await this.tts.waitForSpeech(4000);

    // Navigate to first game
    await this.navigateToGame(this.currentGame);

    while (this.running) {
      try {
        this.supervisor.heartbeat('game_engine');

        // 1. Check Game Rotation across all 14 House Games
        if (this.roundsInCurrentGame >= CONFIG.ROUNDS_PER_GAME) {
          const oldName = this.currentGame.name;
          this.currentGameIndex = (this.currentGameIndex + 1) % CONFIG.HOUSE_GAMES.length;
          this.roundsInCurrentGame = 0;
          const newGame = this.currentGame;

          // Clear any leftover speech from old game!
          this.tts.clearQueue();
          this.lastLiveOutcome = null;

          const switchSpeech = await this.ai.announceGameSwitch(oldName, newGame.name);
          this.tts.speak(switchSpeech, true);
          await this.tts.waitForSpeech(4000);

          await this.navigateToGame(newGame);
          await new Promise(r => setTimeout(r, 4000));
        }

        // 2. Safety reminder check
        if (Date.now() - this.lastSafetyTime >= CONFIG.SAFETY_REMINDER_INTERVAL_SECONDS * 1000) {
          this.lastSafetyTime = Date.now();
          const safetyText = await this.ai.speakSafetyReminder();
          this.tts.speak(safetyText, true);
          await this.tts.waitForSpeech(4000);
        }

        // 3. Answer Chat Viewer with live screen & game context
        const q = this.chat.getNextQuestionToAnswer();
        if (q) {
          const gameContext = {
            gameName: this.currentGame.name,
            gameId: this.currentGame.id,
            multiplier: this.lastMultiplier,
            won: this.lastOutcome ? this.lastOutcome.won : null,
            streak: this.streak,
            totalRounds: this.totalRounds,
            totalWins: this.totalWins,
            totalLosses: this.totalLosses,
            platform: q.platform || 'stream'
          };
          const chatAnswer = await this.ai.answerChat(q.user, q.text, gameContext);
          this.tts.speak(chatAnswer, { priority: true, isChat: true });
          await this.tts.waitForSpeech(4500);
        }

        // 4. Play Round with AI Strategic Decisions & Choice Making
        await this.dismissModals();
        await this.executeRoundOnPage();

        await new Promise(r => setTimeout(r, 2000));

      } catch (err) {
        console.error('[HousebetsPlayer] Error in game loop:', err.message);
        this.supervisor.recordRecovery('housebets_browser', err.message);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  async navigateToGame(game) {
    console.log(`[HousebetsPlayer] Loading game: ${game.name} (${game.url})`);
    try {
      this.tts.clearQueue();
      this.lastLiveOutcome = null;
      await this.page.goto(game.url, { timeout: 35000 });
      await this.page.waitForTimeout(5000);
      await this.dismissModals();

      if (this.onGameUpdate) {
        this.onGameUpdate({
          type: 'game_switched',
          game_state: {
            game_name: game.id,
            display_name: game.name,
            game_url: game.url,
            total_rounds: this.totalRounds
          }
        });
      }
    } catch (e) {
      console.warn(`[HousebetsPlayer] Navigation error to ${game.name}:`, e.message);
    }
  }

  async executeRoundOnPage() {
    const game = this.currentGame;
    this.lastLiveOutcome = null;
    this.cashedOutOutcome = null;

    if (this.onGameUpdate) {
      this.onGameUpdate({
        type: 'round_starting',
        game_state: {
          game_name: game.id,
          display_name: game.name,
          game_url: game.url,
          total_rounds: this.totalRounds
        },
        event_data: { bet: 'demo' }
      });
    }

    // Keep viewport locked at top
    await this.page.evaluate(() => window.scrollTo(0, 0));

    // =========================================================================
    // 1. PRE-BET DECISIONS (AI DECIDES BUTTONS / NUMBERS / SIDES BEFORE BETTING)
    // =========================================================================

    // --- KENO ---
    if (game.id === 'keno') {
      const choice = await this.ai.decideChoice('keno');
      console.log(`[HousebetsPlayer AI Choice] Keno: ${choice.numbers.join(', ')} -> "${choice.voiceLine}"`);

      await this.page.evaluate((numbers) => {
        window.scrollTo(0, 0);
        const host = document.querySelector('[data-housegames-direct]');
        if (!host?.shadowRoot) return;
        const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
        const root = gameEl.shadowRoot || gameEl;

        // Clear previous table spots if clear button is active
        const clearBtn = Array.from(root.querySelectorAll('button')).find(b => /clear/i.test(b.innerText || '') && !b.disabled);
        if (clearBtn) clearBtn.click();

        // Click AI's chosen numbers
        const tiles = Array.from(root.querySelectorAll('button.hl-g-tile')).filter(b => /^\d+$/.test(b.innerText.trim()));
        for (const num of numbers) {
          const t = tiles.find(b => b.innerText.trim() === String(num));
          if (t) t.click();
        }

        // If Bet button is still disabled, click Auto pick to ensure playability
        const betBtn = root.querySelector('.hl-p-betbtn, button.hl-btn-primary');
        if (betBtn && betBtn.disabled) {
          const autoPick = Array.from(root.querySelectorAll('button')).find(b => /auto\s*pick/i.test(b.innerText || ''));
          if (autoPick) autoPick.click();
        }
      }, choice.numbers);

      await this.page.waitForTimeout(800);
    }

    // --- COINFLIP ---
    if (game.id === 'coinflip') {
      const choice = await this.ai.decideChoice('coinflip');
      console.log(`[HousebetsPlayer AI Choice] Coinflip: ${choice.choice} -> "${choice.voiceLine}"`);

      await this.page.evaluate((sideChoice) => {
        const host = document.querySelector('[data-housegames-direct]');
        if (!host?.shadowRoot) return;
        const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
        const root = gameEl.shadowRoot || gameEl;

        const sideBtns = Array.from(root.querySelectorAll('button')).filter(b => /heads|tails|side/i.test(b.className + ' ' + b.innerText));
        const target = sideBtns.find(b => new RegExp(sideChoice, 'i').test(b.innerText || b.className)) || sideBtns[0];
        if (target) target.click();
      }, choice.choice);

      await this.page.waitForTimeout(600);
    }

    // --- ROULETTE ---
    if (game.id === 'roulette') {
      const choice = await this.ai.decideChoice('roulette');
      console.log(`[HousebetsPlayer AI Choice] Roulette: ${choice.choice} -> "${choice.voiceLine}"`);

      await this.page.evaluate(() => {
        const host = document.querySelector('[data-housegames-direct]');
        if (!host?.shadowRoot) return;
        const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
        const root = gameEl.shadowRoot || gameEl;

        const allBtns = Array.from(root.querySelectorAll('button'));
        const chip = allBtns.find(b => /^(0\.1|0\.5|1|2\.5|10)$/.test(b.innerText.trim()));
        if (chip) chip.click();

        const boardEl = root.querySelector('.hr-p-well, .hr-p-board, [class*="board"], svg');
        if (boardEl) boardEl.click();
      });

      await this.page.waitForTimeout(600);
    }

    // --- BACCARAT ---
    if (game.id === 'baccarat') {
      await this.page.evaluate(() => {
        const host = document.querySelector('[data-housegames-direct]');
        if (!host?.shadowRoot) return;
        const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
        const root = gameEl.shadowRoot || gameEl;
        const allBtns = Array.from(root.querySelectorAll('button'));
        const side = allBtns.find(b => /player|banker/i.test(b.innerText || ''));
        if (side) side.click();
      });
      await this.page.waitForTimeout(600);
    }

    // =========================================================================
    // 2. PACING DELAY (3 to 6 SECONDS RANDOM INTERVAL BEFORE BETTING)
    // =========================================================================
    const betDelay = Math.floor(3000 + Math.random() * 3000);
    console.log(`[HousebetsPlayer] Pacing delay: waiting ${(betDelay / 1000).toFixed(1)}s before betting on ${game.name}...`);
    await this.page.waitForTimeout(betDelay);

    // =========================================================================
    // 3. PRIMARY ACTION BUTTON (BET / PLAY / SPIN / ROLL / DEAL / LAUNCH)
    // =========================================================================
    this.lastLiveOutcome = null;
    this.cashedOutOutcome = null;
    this.currentActiveMultiplier = 1.0;

    const playResult = await this.page.evaluate((gameId) => {
      window.scrollTo(0, 0);
      const host = document.querySelector('[data-housegames-direct]');
      if (!host?.shadowRoot) return { success: false, reason: 'no host shadow' };

      const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
      const root = gameEl.shadowRoot || gameEl;

      const allBtns = Array.from(root.querySelectorAll('button')).filter(b => b.offsetWidth > 0 && !b.disabled);
      const findBtn = (regex) => allBtns.find(b => regex.test((b.innerText || '').trim()));

      const selectors = ['.hl-p-betbtn', '.hp-p-betbtn', '.hs-p-mainbtn', '.hr-p-betbtn', 'button.hl-btn-primary'];
      for (const sel of selectors) {
        const btn = root.querySelector(sel);
        if (btn && btn.offsetWidth > 0 && !btn.disabled) {
          const text = btn.innerText?.trim();
          btn.click();
          return { success: true, text };
        }
      }

      const betBtn = findBtn(/^(bet|go|play|roll|drop|spin|deal|flip|draw|launch)$/i);
      if (betBtn) {
        const t = betBtn.innerText.trim();
        betBtn.click();
        return { success: true, text: t };
      }

      return { success: false, reason: 'no primary action button' };
    }, game.id);

    if (playResult.success) {
      console.log(`[HousebetsPlayer] ${game.name}: Round started ("${playResult.text}")`);
    }

    await this.page.waitForTimeout(2000);
    await this.page.evaluate(() => window.scrollTo(0, 0));

    // =========================================================================
    // 3. IN-ROUND INTERACTIVE CHOICES & STRATEGIC CASHOUT LOOP
    // =========================================================================
    const isMultiStepGame = ['hubies_road', 'mines', 'dragon_tower', 'hilo'].includes(game.id);

    if (isMultiStepGame) {
      let step = 0;
      const maxSteps = game.id === 'mines' ? 4 : 5;

      while (step < maxSteps) {
        // Read live state inside game shadow DOM
        const state = await this.page.evaluate(() => {
          const host = document.querySelector('[data-housegames-direct]');
          if (!host?.shadowRoot) return { active: false, multiplier: 1.0, canCashout: false };
          const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
          const root = gameEl.shadowRoot || gameEl;

          const allBtns = Array.from(root.querySelectorAll('button'));
          const cashoutBtn = allBtns.find(b => /cash\s*out|take|retirar|bozdur|kiszáll/i.test(b.innerText || ''));
          const canCashout = Boolean(cashoutBtn && cashoutBtn.offsetWidth > 0 && !cashoutBtn.disabled);
          const betBtn = allBtns.find(b => /^(bet|go|play)$/i.test((b.innerText || '').trim()));
          const betActive = Boolean(betBtn && betBtn.offsetWidth > 0 && !betBtn.disabled);

          let mult = 1.0;
          if (cashoutBtn) {
            const btnText = cashoutBtn.innerText || '';
            const m = btnText.match(/(\d+(\.\d+)?)\s*[x×]/i);
            if (m) mult = parseFloat(m[1]);
          }

          if (mult === 1.0) {
            const multBadge = root.querySelector('.hs-g-mult, .hl-mult, [class*="multiplier"], .current-mult, .hl-rc-head b');
            if (multBadge) {
              const m = (multBadge.innerText || '').match(/(\d+(\.\d+)?)\s*[x×]/i);
              if (m) mult = parseFloat(m[1]);
            }
          }

          return { active: !betActive || canCashout, multiplier: mult, canCashout };
        });

        // Use authoritative live backend multiplier if present
        if (this.currentActiveMultiplier > 1.0) {
          state.multiplier = this.currentActiveMultiplier;
        }

        if (!state.active) break;

        // --- MINES: AI CHOOSES TILE ---
        if (game.id === 'mines') {
          const availableTilesCount = await this.page.evaluate(() => {
            const host = document.querySelector('[data-housegames-direct]');
            if (!host?.shadowRoot) return 0;
            const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
            const root = gameEl.shadowRoot || gameEl;
            return Array.from(root.querySelectorAll('button.hl-g-tile')).filter(b => b.offsetWidth > 0 && !b.disabled).length;
          });

          if (availableTilesCount > 0) {
            const choice = await this.ai.decideChoice('mines', { step: step + 1, totalTiles: availableTilesCount });
            console.log(`[HousebetsPlayer AI Choice] Mines: Picking tile #${choice.tileIndex + 1}...`);

            const clicked = await this.page.evaluate((pickIdx) => {
              const host = document.querySelector('[data-housegames-direct]');
              if (!host?.shadowRoot) return false;
              const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
              const root = gameEl.shadowRoot || gameEl;
              const tiles = Array.from(root.querySelectorAll('button.hl-g-tile')).filter(b => b.offsetWidth > 0 && !b.disabled);
              if (tiles.length === 0) return false;
              const chosen = tiles[pickIdx % tiles.length];
              if (chosen) {
                chosen.click();
                return true;
              }
              return false;
            }, choice.tileIndex);

            if (!clicked) break;

            // Outcome delay: wait for animation & server outcome before speaking
            await this.page.waitForTimeout(1300);

            const minesOutcome = await this.page.evaluate(() => {
              const host = document.querySelector('[data-housegames-direct]');
              if (!host?.shadowRoot) return { isTrap: false, canCashout: false, mult: 1.0 };
              const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
              const root = gameEl.shadowRoot || gameEl;
              const lossBadge = root.querySelector('.hl-rc-loss, .hl-loss, .hs-g-loss, .loss, [class*="trap" i], [class*="busted" i], [class*="bomb" i]');
              const allBtns = Array.from(root.querySelectorAll('button'));
              const cashoutBtn = allBtns.find(b => /cash\s*out|take/i.test(b.innerText || ''));
              const canCashout = Boolean(cashoutBtn && cashoutBtn.offsetWidth > 0 && !cashoutBtn.disabled);
              const betBtn = allBtns.find(b => /^(bet|go|play)$/i.test((b.innerText || '').trim()));
              const betActive = Boolean(betBtn && betBtn.offsetWidth > 0 && !betBtn.disabled);

              let mult = 1.0;
              if (cashoutBtn) {
                const m = (cashoutBtn.innerText || '').match(/(\d+(\.\d+)?)\s*[x×]/i);
                if (m) mult = parseFloat(m[1]);
              }
              return { hasLossBadge: Boolean(lossBadge), canCashout, betActive, mult };
            });

            const isBomb = (this.lastLiveOutcome && (
              this.lastLiveOutcome.outcome === 'trap' ||
              this.lastLiveOutcome.outcome === 'bust' ||
              this.lastLiveOutcome.outcome === 'loss' ||
              this.lastLiveOutcome.won === false ||
              (!this.lastLiveOutcome.active && !this.lastLiveOutcome.won)
            )) || minesOutcome.hasLossBadge || (!minesOutcome.canCashout && minesOutcome.betActive);

            if (isBomb) {
              console.log(`[HousebetsPlayer] Mines: Bomb hit on tile #${choice.tileIndex + 1}!`);
              this.tts.speak(`Boom! Hit a mine on tile #${choice.tileIndex + 1}! Hubie took the blast, unlucky squad!`);
              await this.page.waitForTimeout(1500);
              break;
            }

            const currentMult = (this.currentActiveMultiplier > 1.0 ? this.currentActiveMultiplier : minesOutcome.mult) || 1.20;
            console.log(`[HousebetsPlayer AI Choice] Mines: Tile SAFE at ${currentMult.toFixed(2)}x!`);
            state.canCashout = minesOutcome.canCashout;
            state.multiplier = currentMult;
            await this.page.waitForTimeout(800);
          }
        }

        // --- DRAGON TOWER: AI CHOOSES EGG ON CURRENT FLOOR ---
        else if (game.id === 'dragon_tower') {
          const eggCount = await this.page.evaluate(() => {
            const host = document.querySelector('[data-housegames-direct]');
            if (!host?.shadowRoot) return 0;
            const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
            const root = gameEl.shadowRoot || gameEl;
            return Array.from(root.querySelectorAll('button.tw-tile, button[class*="tile"], button[class*="egg"]'))
              .filter(b => b.offsetWidth > 0 && !b.disabled).length;
          });

          if (eggCount > 0) {
            const choice = await this.ai.decideChoice('dragon_tower', { floor: step + 1, eggCount });
            console.log(`[HousebetsPlayer AI Choice] Dragon Tower: Picking Egg #${choice.eggIndex + 1} on floor ${step + 1}`);

            const clicked = await this.page.evaluate((eggIdx) => {
              const host = document.querySelector('[data-housegames-direct]');
              if (!host?.shadowRoot) return false;
              const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
              const root = gameEl.shadowRoot || gameEl;
              const activeEggs = Array.from(root.querySelectorAll('button.tw-tile, button[class*="tile"], button[class*="egg"]'))
                .filter(b => b.offsetWidth > 0 && !b.disabled);
              if (activeEggs.length > 0) {
                const pick = activeEggs[eggIdx % activeEggs.length];
                if (pick) {
                  pick.click();
                  return true;
                }
              }
              return false;
            }, choice.eggIndex);

            if (!clicked) break;

            // Outcome delay: wait for animation & server outcome before speaking
            await this.page.waitForTimeout(1300);

            const towerOutcome = await this.page.evaluate(() => {
              const host = document.querySelector('[data-housegames-direct]');
              if (!host?.shadowRoot) return { isTrap: false, canCashout: false, mult: 1.0 };
              const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
              const root = gameEl.shadowRoot || gameEl;
              const lossBadge = root.querySelector('.hl-rc-loss, .hl-loss, .hs-g-loss, .loss, [class*="trap" i], [class*="busted" i]');
              const allBtns = Array.from(root.querySelectorAll('button'));
              const cashoutBtn = allBtns.find(b => /cash\s*out|take/i.test(b.innerText || ''));
              const canCashout = Boolean(cashoutBtn && cashoutBtn.offsetWidth > 0 && !cashoutBtn.disabled);
              const betBtn = allBtns.find(b => /^(bet|go|play)$/i.test((b.innerText || '').trim()));
              const betActive = Boolean(betBtn && betBtn.offsetWidth > 0 && !betBtn.disabled);

              let mult = 1.0;
              if (cashoutBtn) {
                const m = (cashoutBtn.innerText || '').match(/(\d+(\.\d+)?)\s*[x×]/i);
                if (m) mult = parseFloat(m[1]);
              }
              return { hasLossBadge: Boolean(lossBadge), canCashout, betActive, mult };
            });

            const isDragonAwake = (this.lastLiveOutcome && (
              this.lastLiveOutcome.outcome === 'trap' ||
              this.lastLiveOutcome.outcome === 'bust' ||
              this.lastLiveOutcome.outcome === 'loss' ||
              this.lastLiveOutcome.won === false ||
              (!this.lastLiveOutcome.active && !this.lastLiveOutcome.won)
            )) || towerOutcome.hasLossBadge || (!towerOutcome.canCashout && towerOutcome.betActive);

            if (isDragonAwake) {
              console.log(`[HousebetsPlayer] Dragon Tower: Dragon woke up on floor ${step + 1}!`);
              this.tts.speak(`Dragon woke up on floor ${step + 1}! Fire blast, unlucky squad!`);
              await this.page.waitForTimeout(1500);
              break;
            }

            const currentMult = (this.currentActiveMultiplier > 1.0 ? this.currentActiveMultiplier : towerOutcome.mult) || 1.35;
            console.log(`[HousebetsPlayer AI Choice] Dragon Tower: Floor ${step + 1} SAFE at ${currentMult.toFixed(2)}x!`);
            state.canCashout = towerOutcome.canCashout;
            state.multiplier = currentMult;
            await this.page.waitForTimeout(800);
          }
        }

        // --- HUBIE'S ROAD: VERIFIED HOP TO NEXT BUOY / LANE ---
        else if (game.id === 'hubies_road') {
          const clickRes = await this.page.evaluate(() => {
            const host = document.querySelector('[data-housegames-direct]');
            if (!host?.shadowRoot) return { success: false, reason: 'no host shadow' };
            const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
            const root = gameEl.shadowRoot || gameEl;

            // Search multi-tier selectors for Hubie's Road interactive stepping buoys/lanes
            const buoySelectors = [
              '.hs-g-buoy', '.hr-g-buoy', '.hl-g-buoy',
              'button[class*="buoy" i]', 'button[class*="lane" i]', 'button[class*="step" i]', 'button[class*="tile" i]',
              'button[aria-label*="Lane" i]', 'button[aria-label*="Buoy" i]', 'button[aria-label*="Step" i]',
              '.hs-lane button', '.hr-lane button', '.buoy', '.lane'
            ];

            let candidates = [];
            for (const sel of buoySelectors) {
              const els = Array.from(root.querySelectorAll(sel)).filter(b => b.offsetWidth > 0 && !b.disabled);
              if (els.length > 0) {
                candidates = els;
                break;
              }
            }

            // Universal fallback: any interactive button in game arena that is not a control button
            if (candidates.length === 0) {
              const all = Array.from(root.querySelectorAll('button, [role="button"]')).filter(b => {
                if (b.offsetWidth <= 0 || b.disabled) return false;
                const txt = (b.innerText || '').trim().toLowerCase();
                const aria = (b.getAttribute('aria-label') || '').toLowerCase();
                if (/^(manual|auto|advanced|bet|play|cash\s*out|take|½|1\/2|2x|2×|max|min)$/i.test(txt)) return false;
                if (/cashout|difficulty|settings|help|mute|volume/i.test(aria)) return false;
                return true;
              });
              if (all.length > 0) candidates = all;
            }

            if (candidates.length === 0) return { success: false, reason: 'no buoys/lanes found' };

            const pickIdx = Math.floor(Math.random() * candidates.length);
            const chosen = candidates[pickIdx];
            chosen.click();
            return { success: true, pickIdx, total: candidates.length };
          });

          // Only proceed if Hubie actually hopped to the buoy!
          if (!clickRes || !clickRes.success) {
            console.warn(`[HousebetsPlayer] Hubie's Road: No active buoy/lane found to hop at step ${step + 1}. Ending step sequence.`);
            break;
          }

          console.log(`[HousebetsPlayer] Hubie's Road: Hopped to Buoy #${clickRes.pickIdx + 1} of ${clickRes.total}, awaiting outcome delay...`);

          // CRITICAL FIX: Delay to let the hop land, server response arrive, and animations settle BEFORE speaking!
          await this.page.waitForTimeout(1400);

          // Verify live post-hop state from DOM and backend API
          const hopOutcome = await this.page.evaluate(() => {
            const host = document.querySelector('[data-housegames-direct]');
            if (!host?.shadowRoot) return { hasLossBadge: false, canCashout: false, betActive: false, mult: 1.0 };
            const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
            const root = gameEl.shadowRoot || gameEl;

            const lossBadge = root.querySelector('.hl-rc-loss, .hl-loss, .hs-g-loss, .loss, [class*="trap" i], [class*="busted" i], [class*="payout--loss"]');
            const allBtns = Array.from(root.querySelectorAll('button'));
            const cashoutBtn = allBtns.find(b => /cash\s*out|take/i.test(b.innerText || ''));
            const canCashout = Boolean(cashoutBtn && cashoutBtn.offsetWidth > 0 && !cashoutBtn.disabled);
            const betBtn = allBtns.find(b => /^(bet|go|play)$/i.test((b.innerText || '').trim()));
            const betActive = Boolean(betBtn && betBtn.offsetWidth > 0 && !betBtn.disabled);

            let mult = 1.0;
            if (cashoutBtn) {
              const m = (cashoutBtn.innerText || '').match(/(\d+(\.\d+)?)\s*[x×]/i);
              if (m) mult = parseFloat(m[1]);
            }
            if (mult === 1.0) {
              const multBadge = root.querySelector('.hs-g-mult, .hl-mult, [class*="multiplier"], .current-mult');
              if (multBadge) {
                const m = (multBadge.innerText || '').match(/(\d+(\.\d+)?)\s*[x×]/i);
                if (m) mult = parseFloat(m[1]);
              }
            }

            return {
              hasLossBadge: Boolean(lossBadge),
              canCashout,
              betActive,
              mult
            };
          });

          // Check both authoritative API outcome and DOM trap state
          const isTrap = (this.lastLiveOutcome && (
            this.lastLiveOutcome.outcome === 'trap' ||
            this.lastLiveOutcome.outcome === 'bust' ||
            this.lastLiveOutcome.outcome === 'loss' ||
            this.lastLiveOutcome.won === false ||
            (!this.lastLiveOutcome.active && !this.lastLiveOutcome.won)
          )) || hopOutcome.hasLossBadge || (!hopOutcome.canCashout && hopOutcome.betActive);

          if (isTrap) {
            console.log(`[HousebetsPlayer] Hubie's Road: Shark ambush/trap triggered on buoy #${clickRes.pickIdx + 1}!`);
            const lossLines = [
              `Shark ambush on buoy #${clickRes.pickIdx + 1}! Hubie took a splash, unlucky squad!`,
              `Oh no, that buoy had a shark! Hubie took a splash, unlucky squad!`,
              `Splash! Trap on buoy #${clickRes.pickIdx + 1}! We will bounce back squad!`
            ];
            const chosenLossLine = lossLines[Math.floor(Math.random() * lossLines.length)];
            this.tts.speak(chosenLossLine);
            await this.page.waitForTimeout(1500);
            break;
          }

          // Confirmed Safe Hop! Only announce navigation clear after verification
          const currentMult = (this.currentActiveMultiplier > 1.0 ? this.currentActiveMultiplier : hopOutcome.mult) || 1.25;
          console.log(`[HousebetsPlayer AI Choice] Hubie's Road: Buoy #${clickRes.pickIdx + 1} SAFE at ${currentMult.toFixed(2)}x!`);
          state.canCashout = hopOutcome.canCashout;
          state.multiplier = currentMult;
          await this.page.waitForTimeout(800);
        }

        // --- HILO: VERIFIED HIGHER / LOWER CHOICE ---
        else if (game.id === 'hilo') {
          const choice = await this.ai.decideChoice('hilo');

          const clickRes = await this.page.evaluate((hiloChoice) => {
            const host = document.querySelector('[data-housegames-direct]');
            if (!host?.shadowRoot) return { success: false, reason: 'no host shadow' };
            const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
            const root = gameEl.shadowRoot || gameEl;

            const isHigher = /high|above|\bhi\b|▲|↑/i.test(hiloChoice);
            const allBtns = Array.from(root.querySelectorAll('button, [role="button"]')).filter(b => b.offsetWidth > 0 && !b.disabled);

            // Filter out non-play buttons
            const playBtns = allBtns.filter(b => {
              const txt = (b.innerText || '').trim().toLowerCase();
              return !/^(manual|auto|cash\s*out|take|½|1\/2|2x|2×|max|min)$/i.test(txt);
            });

            let targetBtn = null;
            if (isHigher) {
              targetBtn = playBtns.find(b => {
                const t = (b.innerText || '') + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.className || '');
                return /high|above|\bhi\b|▲|↑/i.test(t);
              }) || root.querySelector('.hl-hilo-opt:first-child, [class*="higher" i], button[aria-label*="High" i]');
            } else {
              targetBtn = playBtns.find(b => {
                const t = (b.innerText || '') + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.className || '');
                return /low|below|\blo\b|▼|↓/i.test(t);
              }) || root.querySelector('.hl-hilo-opt:last-child, [class*="lower" i], button[aria-label*="Low" i]');
            }

            // Fallback: If 2 option buttons exist in game arena, first is Higher, second is Lower
            if (!targetBtn && playBtns.length >= 2) {
              targetBtn = isHigher ? playBtns[0] : playBtns[1];
            }

            if (targetBtn) {
              targetBtn.click();
              return { success: true, chosen: isHigher ? 'HIGHER' : 'LOWER', text: targetBtn.innerText };
            }
            return { success: false, reason: 'higher/lower button not found' };
          }, choice.choice);

          // Only proceed and announce if Higher/Lower was physically clicked!
          if (!clickRes || !clickRes.success) {
            console.warn(`[HousebetsPlayer] Hilo: Could not find ${choice.choice} button at step ${step + 1}. Ending step sequence.`);
            break;
          }

          console.log(`[HousebetsPlayer AI Choice] Hilo: Picked ${clickRes.chosen}, awaiting card outcome delay...`);

          // Outcome delay: wait for card flip animation & server response
          await this.page.waitForTimeout(1400);

          const hiloOutcome = await this.page.evaluate(() => {
            const host = document.querySelector('[data-housegames-direct]');
            if (!host?.shadowRoot) return { isTrap: false, canCashout: false, mult: 1.0 };
            const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
            const root = gameEl.shadowRoot || gameEl;
            const lossBadge = root.querySelector('.hl-rc-loss, .hl-loss, .hs-g-loss, .loss, [class*="trap" i], [class*="busted" i]');
            const allBtns = Array.from(root.querySelectorAll('button'));
            const cashoutBtn = allBtns.find(b => /cash\s*out|take/i.test(b.innerText || ''));
            const canCashout = Boolean(cashoutBtn && cashoutBtn.offsetWidth > 0 && !cashoutBtn.disabled);
            const betBtn = allBtns.find(b => /^(bet|go|play)$/i.test((b.innerText || '').trim()));
            const betActive = Boolean(betBtn && betBtn.offsetWidth > 0 && !betBtn.disabled);

            let mult = 1.0;
            if (cashoutBtn) {
              const m = (cashoutBtn.innerText || '').match(/(\d+(\.\d+)?)\s*[x×]/i);
              if (m) mult = parseFloat(m[1]);
            }
            return { hasLossBadge: Boolean(lossBadge), canCashout, betActive, mult };
          });

          const isWrongGuess = (this.lastLiveOutcome && (
            this.lastLiveOutcome.outcome === 'trap' ||
            this.lastLiveOutcome.outcome === 'bust' ||
            this.lastLiveOutcome.outcome === 'loss' ||
            this.lastLiveOutcome.won === false ||
            (!this.lastLiveOutcome.active && !this.lastLiveOutcome.won)
          )) || hiloOutcome.hasLossBadge || (!hiloOutcome.canCashout && hiloOutcome.betActive);

          if (isWrongGuess) {
            console.log(`[HousebetsPlayer] Hilo: Wrong card guessed on ${clickRes.chosen}!`);
            this.tts.speak(`Oof, wrong card! Read missed on ${clickRes.chosen}, unlucky squad!`);
            await this.page.waitForTimeout(1500);
            break;
          }

          const currentMult = (this.currentActiveMultiplier > 1.0 ? this.currentActiveMultiplier : hiloOutcome.mult) || 1.25;
          console.log(`[HousebetsPlayer AI Choice] Hilo: Correct card at ${currentMult.toFixed(2)}x!`);
          state.canCashout = hiloOutcome.canCashout;
          state.multiplier = currentMult;
          await this.page.waitForTimeout(800);
        }

        // --- AI STRATEGIC CASHOUT DECISION (ONLY IF CASHOUT IS ACTIVELY AVAILABLE) ---
        if (state.canCashout) {
          const decision = await this.ai.decideGameMove(game.name, state.multiplier, step + 1);
          console.log(`[HousebetsPlayer AI Decision] Step ${step + 1} (${state.multiplier}x): ${decision.action} -> "${decision.voiceLine}"`);

          if (decision.action === 'CASHOUT') {
            const actualCashoutMult = this.currentActiveMultiplier > 1.0 ? this.currentActiveMultiplier : (state.multiplier || 1.25);
            this.cashedOutOutcome = {
              won: true,
              multiplier: actualCashoutMult
            };
            this.tts.speak(decision.voiceLine, true);

            await this.page.evaluate(() => {
              const host = document.querySelector('[data-housegames-direct]');
              if (!host?.shadowRoot) return;
              const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
              const root = gameEl.shadowRoot || gameEl;
              const allBtns = Array.from(root.querySelectorAll('button'));
              const cashoutBtn = allBtns.find(b => /cash\s*out|take/i.test(b.innerText || ''));
              if (cashoutBtn) cashoutBtn.click();
            });
            console.log(`[HousebetsPlayer] Successfully CASHOUT at ${actualCashoutMult}x!`);
            await this.page.waitForTimeout(800);
            if (this.lastLiveOutcome?.won && this.lastLiveOutcome.multiplier > 0) {
              this.cashedOutOutcome.multiplier = this.lastLiveOutcome.multiplier;
            }
            break;
          }
        }

        step++;
        await this.page.waitForTimeout(1200);
      }
    }

    // Wait for round settlement
    await this.page.waitForTimeout(2200);
    await this.page.evaluate(() => window.scrollTo(0, 0));

    // =========================================================================
    // 4. EXTRACT AUTHORITATIVE OUTCOME & LIVE COMMENTARY
    // =========================================================================
    const outcome = await this.extractOutcomeFromPage(game);

    this.totalRounds++;
    this.roundsInCurrentGame++;

    // Strict win/loss multiplier rule: Win is ONLY when multiplier > 1.0x, Lose is <= 1.0x
    const rawMult = typeof outcome.multiplier === 'number' ? outcome.multiplier : (outcome.won ? 1.5 : 0.0);
    outcome.multiplier = rawMult;
    outcome.won = rawMult > 1.0;
    const isSuperWin = rawMult > 1.6;

    this.lastOutcome = outcome;
    this.lastMultiplier = outcome.multiplier;
    this.supervisor.recordRoundCompletion();

    if (outcome.won) {
      this.totalWins++;
      this.streak = this.streak > 0 ? this.streak + 1 : 1;
    } else {
      this.totalLosses++;
      this.streak = this.streak < 0 ? this.streak - 1 : -1;
    }

    if (this.onGameUpdate) {
      this.onGameUpdate({
        type: 'round_result',
        game_state: {
          game_name: game.id,
          display_name: game.name,
          game_url: game.url,
          total_rounds: this.totalRounds,
          total_wins: this.totalWins,
          total_losses: this.totalLosses,
          streak: this.streak
        },
        event_data: outcome
      });
    }

    // Prioritizing chat interaction:
    // If multiplier > 1.6, it's a SUPER CRAZY WIN — scream like crazy and celebrate with top priority!
    const hasRecentChat = this.chat.hasRecentViewerActivity(14000);
    const isNotable = isSuperWin || (!hasRecentChat && (outcome.won || this.streak <= -3 || (this.totalRounds % 3 === 0)));

    if (isNotable) {
      const commentary = await this.ai.commentateRound(game.name, 10.0, outcome, { streak: this.streak });
      this.tts.speak(commentary, { priority: isSuperWin, isChat: false });
      await this.tts.waitForSpeech(isSuperWin ? 5000 : 3500);
    } else if (hasRecentChat) {
      console.log(`[HousebetsPlayer] Prioritizing viewer interaction: routine round commentary silenced.`);
    }
  }

  async extractOutcomeFromPage(game) {
    // 1. If round was successfully cashed out by AI
    if (this.cashedOutOutcome) {
      const res = this.cashedOutOutcome;
      this.cashedOutOutcome = null;
      console.log(`[HousebetsPlayer] Using CASHOUT outcome for ${game.name}: Won=true, Mult=${res.multiplier.toFixed(2)}x`);
      return {
        game: game.id,
        displayName: game.name,
        won: true,
        multiplier: res.multiplier,
        profit: (res.multiplier - 1.0) * 10,
        detail: `Cashed out at ${res.multiplier.toFixed(2)}x on ${game.name}!`
      };
    }

    // 2. Authoritative: Use live API response captured from games.housebets.com
    if (this.lastLiveOutcome && (Date.now() - this.lastLiveOutcome.timestamp < 10000)) {
      const { won, multiplier } = this.lastLiveOutcome;
      console.log(`[HousebetsPlayer] Using authoritative API result for ${game.name}: Won=${won}, Mult=${multiplier.toFixed(2)}x`);
      return {
        game: game.id,
        displayName: game.name,
        won,
        multiplier,
        profit: won ? (multiplier - 1.0) * 10 : -10,
        detail: won ? `Hit ${multiplier.toFixed(2)}x on ${game.name}!` : `Busted round on ${game.name}!`
      };
    }

    // 3. DOM inspection for actual win/loss badges
    try {
      const domResult = await this.page.evaluate(() => {
        const host = document.querySelector('[data-housegames-direct]');
        if (!host?.shadowRoot) return null;
        const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
        const root = gameEl.shadowRoot || gameEl;

        const winBadge = root.querySelector('.hl-rc-win, .hl-win, .hs-g-win, .win, [class*="won"], [class*="payout--win"]');
        const lossBadge = root.querySelector('.hl-rc-loss, .hl-loss, .hs-g-loss, .loss, [class*="payout--loss"]');

        if (winBadge) {
          const m = (winBadge.innerText || '').match(/(\d+(\.\d+)?)\s*[x×]/i) ||
                    (root.innerText || '').match(/(\d+(\.\d+)?)\s*[x×]/i);
          const mult = m ? parseFloat(m[1]) : 1.25;
          return { won: true, mult };
        }
        if (lossBadge) return { won: false, mult: 0.0 };

        return null;
      });

      if (domResult) {
        return {
          game: game.id,
          displayName: game.name,
          won: domResult.won,
          multiplier: domResult.mult,
          profit: domResult.won ? (domResult.mult - 1.0) * 10 : -10,
          detail: domResult.won ? `Hit ${domResult.mult.toFixed(2)}x on ${game.name}!` : `Round lost on ${game.name}!`
        };
      }
    } catch {}

    // 4. Truthful fallback: never fabricate fake high wins
    return {
      game: game.id,
      displayName: game.name,
      won: false,
      multiplier: 0.0,
      profit: -10,
      detail: `Round completed on ${game.name}!`
    };
  }
}
