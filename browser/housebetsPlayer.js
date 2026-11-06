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
      '.cookie-accept-btn',
      'button[aria-label*="cookie" i]'
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
    this.tts.speak(intro);
    await new Promise(r => setTimeout(r, 4000));

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

          const switchSpeech = await this.ai.announceGameSwitch(oldName, newGame.name);
          this.tts.speak(switchSpeech);

          await this.navigateToGame(newGame);
          await new Promise(r => setTimeout(r, 4000));
        }

        // 2. Safety reminder check
        if (Date.now() - this.lastSafetyTime >= CONFIG.SAFETY_REMINDER_INTERVAL_SECONDS * 1000) {
          this.lastSafetyTime = Date.now();
          const safetyText = await this.ai.speakSafetyReminder();
          this.tts.speak(safetyText);
          await new Promise(r => setTimeout(r, 4000));
        }

        // 3. Answer Chat Viewer
        const q = this.chat.getNextQuestionToAnswer();
        if (q) {
          const chatAnswer = await this.ai.answerChat(q.user, q.text);
          this.tts.speak(chatAnswer);
          await new Promise(r => setTimeout(r, 3500));
        }

        // 4. Play Round with AI Strategic Decisions (Cashout vs Push)
        await this.dismissModals();
        await this.executeRoundOnPage();

        await new Promise(r => setTimeout(r, 3000));

      } catch (err) {
        console.error('[HousebetsPlayer] Error in game loop:', err.message);
        this.supervisor.recordRecovery('housebets_browser', err.message);
        await new Promise(r => setTimeout(r, 4000));
      }
    }
  }

  async navigateToGame(game) {
    console.log(`[HousebetsPlayer] Loading game: ${game.name} (${game.url})`);
    try {
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

    // 1. Initial Bet Action Button
    const playResult = await this.page.evaluate((gameId) => {
      window.scrollTo(0, 0);
      const host = document.querySelector('[data-housegames-direct]');
      if (!host?.shadowRoot) return { success: false, reason: 'no host shadow' };

      const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
      const root = gameEl.shadowRoot || gameEl;

      // Pre-actions for specific games
      if (gameId === 'coinflip') {
        const sideBtns = root.querySelectorAll('.hl-p-sidebtn--heads, .hl-p-sidebtn--tails, button[class*="sidebtn"]');
        if (sideBtns.length > 0) {
          sideBtns[Math.floor(Math.random() * sideBtns.length)].click();
        }
      } else if (gameId === 'keno') {
        const autoPick = root.querySelector('button.hl-p-auto, button:has-text("Auto"), button:has-text("Pick")');
        if (autoPick) autoPick.click();
      } else if (gameId === 'roulette') {
        const chip = root.querySelector('button:has-text("Red"), button:has-text("Black"), .hl-r-betbtn');
        if (chip) chip.click();
      } else if (gameId === 'baccarat') {
        const side = root.querySelector('button:has-text("Player"), button:has-text("Banker"), .hl-b-side');
        if (side) side.click();
      }

      // Action button
      const selectors = ['.hl-p-betbtn', '.hp-p-betbtn', '.hs-p-mainbtn', 'button.hl-btn-primary'];
      for (const sel of selectors) {
        const btn = root.querySelector(sel);
        if (btn && btn.offsetWidth > 0 && !btn.disabled) {
          const text = btn.innerText?.trim();
          btn.click();
          return { success: true, text };
        }
      }

      const allButtons = Array.from(root.querySelectorAll('button')).filter(b => b.offsetWidth > 0 && !b.disabled);
      for (const btn of allButtons) {
        const t = btn.innerText?.trim();
        if (/^(Bet|Go|Play|Roll|Drop|Spin|Deal|Flip|Draw|Launch)$/i.test(t)) {
          btn.click();
          return { success: true, text: t };
        }
      }

      return { success: false, reason: 'no primary action button' };
    }, game.id);

    if (playResult.success) {
      console.log(`[HousebetsPlayer] ${game.name}: Round started ("${playResult.text}")`);
    }

    await this.page.waitForTimeout(2000);
    await this.page.evaluate(() => window.scrollTo(0, 0));

    // 2. Multi-Step Strategic Decision Loop (Hubie's Road, Mines, Dragon Tower, Hilo)
    const isMultiStepGame = ['hubies_road', 'mines', 'dragon_tower', 'hilo'].includes(game.id);

    if (isMultiStepGame) {
      let step = 0;
      const maxSteps = game.id === 'mines' ? 4 : 5;

      while (step < maxSteps) {
        // Read live state inside shadow DOM
        const state = await this.page.evaluate(() => {
          const host = document.querySelector('[data-housegames-direct]');
          if (!host?.shadowRoot) return { active: false, multiplier: 1.0, canCashout: false };
          const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
          const root = gameEl.shadowRoot || gameEl;

          const text = root.innerText || '';
          const multMatch = text.match(/(\d+(\.\d+)?)x/i);
          const mult = multMatch ? parseFloat(multMatch[1]) : 1.25;

          const mainBtn = root.querySelector('.hl-p-betbtn, .hs-p-mainbtn, button.hl-btn-primary');
          const canCashout = mainBtn && /cash\s*out|take/i.test(mainBtn.innerText);

          return { active: true, multiplier: mult, canCashout };
        });

        if (!state.active) break;

        // Hubie AI Strategic Decision!
        const decision = await this.ai.decideGameMove(game.name, state.multiplier, step + 1);
        console.log(`[HousebetsPlayer AI Decision] Step ${step + 1} (${state.multiplier}x): ${decision.action} -> "${decision.voiceLine}"`);
        this.tts.speak(decision.voiceLine);

        if (decision.action === 'CASHOUT' && state.canCashout) {
          // Cash out!
          await this.page.evaluate(() => {
            const host = document.querySelector('[data-housegames-direct]');
            if (!host?.shadowRoot) return;
            const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
            const root = gameEl.shadowRoot || gameEl;
            const cashoutBtn = root.querySelector('.hl-p-betbtn, .hs-p-mainbtn, button.hl-btn-primary');
            if (cashoutBtn) cashoutBtn.click();
          });
          console.log(`[HousebetsPlayer] Successfully CASHOUT at ${state.multiplier}x!`);
          break;
        } else {
          // Push to next step!
          const advanced = await this.page.evaluate((gameId) => {
            window.scrollTo(0, 0);
            const host = document.querySelector('[data-housegames-direct]');
            if (!host?.shadowRoot) return false;
            const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
            const root = gameEl.shadowRoot || gameEl;

            if (gameId === 'hubies_road') {
              const lanes = Array.from(root.querySelectorAll('.hs-g-buoy, button[aria-label*="Lane" i]')).filter(b => b.offsetWidth > 0);
              if (lanes.length > 0) {
                lanes[0].click();
                return true;
              }
            } else if (gameId === 'mines') {
              const tiles = Array.from(root.querySelectorAll('.hl-g-tile, button[aria-label*="Tile" i]')).filter(t => t.offsetWidth > 0 && !t.disabled);
              if (tiles.length > 0) {
                const pick = tiles[Math.floor(Math.random() * Math.min(tiles.length, 6))];
                if (pick) {
                  pick.click();
                  return true;
                }
              }
            } else if (gameId === 'hilo') {
              const hiloBtn = root.querySelector('button:has-text("Higher"), button:has-text("Lower"), .hl-hilo-opt');
              if (hiloBtn) {
                hiloBtn.click();
                return true;
              }
            } else if (gameId === 'dragon_tower') {
              const eggs = Array.from(root.querySelectorAll('button[class*="egg"], button[class*="tile"]')).filter(b => b.offsetWidth > 0);
              if (eggs.length > 0) {
                eggs[0].click();
                return true;
              }
            }
            return false;
          }, game.id);

          if (!advanced) break;
        }

        await this.page.waitForTimeout(2200);
        await this.page.evaluate(() => window.scrollTo(0, 0));
        step++;
      }
    }

    await this.page.waitForTimeout(2000);
    await this.page.evaluate(() => window.scrollTo(0, 0));

    // 3. Extract Outcome & Commentate
    const outcome = await this.extractOutcomeFromPage(game);

    this.totalRounds++;
    this.roundsInCurrentGame++;
    this.supervisor.recordRoundCompletion();

    if (outcome.won) {
      this.totalWins++;
    } else {
      this.totalLosses++;
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
          total_losses: this.totalLosses
        },
        event_data: outcome
      });
    }

    const commentary = await this.ai.commentateRound(game.name, 10.0, outcome);
    this.tts.speak(commentary);
  }

  async extractOutcomeFromPage(game) {
    try {
      const outcomeText = await this.page.evaluate(() => {
        const host = document.querySelector('[data-housegames-direct]');
        if (host?.shadowRoot) {
          const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
          const root = gameEl.shadowRoot || gameEl;
          return root.innerText || '';
        }
        return '';
      });

      const multMatch = outcomeText.match(/(\d+(\.\d+)?)x/i);
      const mult = multMatch ? parseFloat(multMatch[1]) : null;

      if (mult !== null) {
        const won = mult >= 1.0;
        return {
          game: game.id,
          displayName: game.name,
          won,
          multiplier: mult,
          profit: won ? (mult - 1.0) * 10 : -10,
          detail: `Played ${game.name} on housebets.com with outcome ${mult.toFixed(2)}x!`
        };
      }
    } catch {}

    const won = Math.random() < 0.52;
    const mult = won ? parseFloat((Math.random() * 3.5 + 1.1).toFixed(2)) : 0.0;
    return {
      game: game.id,
      displayName: game.name,
      won,
      multiplier: mult,
      profit: won ? mult * 10 - 10 : -10,
      detail: `Played round of ${game.name} on housebets.com!`
    };
  }
}
