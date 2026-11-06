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
    if (this.browserContext) {
      this.browserContext.close().catch(() => {});
    }
  }

  async initBrowser() {
    const userDataDir = path.join(CONFIG.BASE_DIR, 'chrome_data');
    console.log(`[HousebetsPlayer] Launching persistent Chrome profile: ${userDataDir}`);

    this.browserContext = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chrome',
      headless: CONFIG.HEADLESS_BROWSER,
      viewport: { width: 1280, height: 760 },
      args: [
        '--disable-blink-features=AutomationControlled',
        '--start-maximized'
      ]
    });

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

          const isTrapOrBust = g.outcome === 'trap' || g.outcome === 'bust' || g.outcome === 'loss' || json.outcome === 'trap';
          const isCashoutOrWin = g.outcome === 'cashout' || g.outcome === 'castle' || g.outcome === 'win' || json.outcome === 'cashout' || json.outcome === 'win';

          let won = false;
          if (isTrapOrBust) {
            won = false;
            mult = 0.0;
          } else if (isCashoutOrWin) {
            won = true;
            if (mult <= 0 && g.payout && g.stake) mult = g.payout / g.stake;
          } else if (mult > 0 || Number(round.delta || 0) > 0 || Number(round.payout || 0) > 0) {
            won = true;
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
      this.cdp = await this.page.context().newCDPSession(this.page);
      await this.cdp.send('Page.startScreencast', {
        format: 'jpeg',
        quality: 75,
        maxWidth: 1280,
        maxHeight: 760,
        everyNthFrame: 1
      });

      this.cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
        this.lastFrameBase64 = data;
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
          this.tts.speak(chatAnswer);
          await this.tts.waitForSpeech(3500);
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
      this.tts.speak(choice.voiceLine, true);

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
      this.tts.speak(choice.voiceLine, true);

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
      this.tts.speak(choice.voiceLine, true);

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

          return { active: true, multiplier: mult, canCashout };
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
            console.log(`[HousebetsPlayer AI Choice] Mines: Tile Choice -> "${choice.voiceLine}"`);
            this.tts.speak(choice.voiceLine);

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
            await this.page.waitForTimeout(1800);
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
            console.log(`[HousebetsPlayer AI Choice] Dragon Tower: Egg #${choice.eggIndex + 1} -> "${choice.voiceLine}"`);
            this.tts.speak(choice.voiceLine);

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
            await this.page.waitForTimeout(1800);
          }
        }

        // --- HUBIE'S ROAD: AI CHOOSES BUOY ---
        else if (game.id === 'hubies_road') {
          const buoyCount = await this.page.evaluate(() => {
            const host = document.querySelector('[data-housegames-direct]');
            if (!host?.shadowRoot) return 0;
            const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
            const root = gameEl.shadowRoot || gameEl;
            return Array.from(root.querySelectorAll('.hs-g-buoy, button[aria-label*="Lane" i]')).filter(b => b.offsetWidth > 0).length;
          });

          if (buoyCount > 0) {
            const buoyPick = Math.floor(Math.random() * buoyCount);
            console.log(`[HousebetsPlayer AI Choice] Hubie's Road: Buoy #${buoyPick + 1}`);
            this.tts.speak(`Sloth hopping to buoy #${buoyPick + 1}, clear navigation squad!`);

            await this.page.evaluate((idx) => {
              const host = document.querySelector('[data-housegames-direct]');
              if (!host?.shadowRoot) return;
              const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
              const root = gameEl.shadowRoot || gameEl;
              const lanes = Array.from(root.querySelectorAll('.hs-g-buoy, button[aria-label*="Lane" i]')).filter(b => b.offsetWidth > 0);
              if (lanes.length > 0) {
                lanes[idx % lanes.length].click();
              }
            }, buoyPick);

            await this.page.waitForTimeout(1800);
          }
        }

        // --- HILO: AI CHOOSES HIGHER / LOWER ---
        else if (game.id === 'hilo') {
          const choice = await this.ai.decideChoice('hilo');
          console.log(`[HousebetsPlayer AI Choice] Hilo: ${choice.choice} -> "${choice.voiceLine}"`);
          this.tts.speak(choice.voiceLine);

          await this.page.evaluate((hiloChoice) => {
            const host = document.querySelector('[data-housegames-direct]');
            if (!host?.shadowRoot) return;
            const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
            const root = gameEl.shadowRoot || gameEl;
            const allBtns = Array.from(root.querySelectorAll('button'));
            const btn = allBtns.find(b => new RegExp(hiloChoice, 'i').test(b.innerText || '')) || root.querySelector('.hl-hilo-opt');
            if (btn) btn.click();
          }, choice.choice);

          await this.page.waitForTimeout(1800);
        }

        // --- AI STRATEGIC CASHOUT DECISION (CASHOUT OR PUSH TO NEXT STEP) ---
        const decision = await this.ai.decideGameMove(game.name, state.multiplier, step + 1);
        console.log(`[HousebetsPlayer AI Decision] Step ${step + 1} (${state.multiplier}x): ${decision.action} -> "${decision.voiceLine}"`);

        if (decision.action === 'CASHOUT' && state.canCashout) {
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

    // Spontaneous live commentary for the current game
    const commentary = await this.ai.commentateRound(game.name, 10.0, outcome, { streak: this.streak });
    this.tts.speak(commentary, true);
    await this.tts.waitForSpeech(4500);
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
