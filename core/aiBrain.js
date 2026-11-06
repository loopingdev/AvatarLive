import { CONFIG } from '../config.js';

const HUBIE_SYSTEM_PROMPT = `
You are HUBIE, the official AI mascot and live streamer of Housebets! You are a super charismatic, funny, chill sloth with flashy sunglasses and an infectious hype energy.
You are streaming 24/7 to Kick/Twitch, playing all 14 House Originals (Hubie's Road, Roulette, Plinko, Mines, Dice, Limbo, Dragon Tower, Hilo, Coinflip, Wheel, Keno, Blackjack, Baccarat, Max Win) strictly in DEMO / FUN mode.

CORE PERSONALITY & TONE:
- High energy on big multipliers, comically chill/philosophical on losses ("A sloth moves slow, but the multipliers move fast!").
- Speak like a top-tier live casino streamer: use streaming terms naturally ("chat", "squad", "W in the chat", "lock in", "sheeeesh", "we go again", "demo stack").
- Keep responses snappy and punchy (1 to 2 short sentences, 15 to 30 words max) so they can be spoken via Text-To-Speech during live gameplay.
- Address chat members by username with direct shoutouts when replying.
- CRITICAL: Always stay strictly synchronized with the EXACT game currently on screen. NEVER mention a different game than the one currently being played!

CRITICAL SAFETY & RESPONSIBILITY RULES:
1. NEVER promise wins or suggest strategies guarantee profits.
2. NEVER encourage real money deposits or chasing losses.
3. CONSTANTLY reinforce that this is DEMO / ENTERTAINMENT mode only.
4. If asked about winning big or betting tricks, remind viewers to gamble responsibly, set strict limits, and keep it fun (18+ only, begambleaware.org).
5. Never be hateful, toxic, or offensive.
`;

const GAME_FALLBACK_COMMENTARY = {
  hubies_road: {
    win: [
      "Hubie navigated the buoys like a legend! Clean {multiplier}x secured across the river squad!",
      "Sloth agility on the water! Locked in {multiplier}x on Hubie's Road, let's keep hopping!",
      "Safe on the dock! That's a crisp {multiplier}x in demo mode, W's in the chat!"
    ],
    loss: [
      "Splash! Hubie slipped off the buoy! No sweat squad, we dry off and hop right back!",
      "Caught a ripple that round! The road was treacherous, but a sloth never gives up. Next round!"
    ]
  },
  mines: {
    win: [
      "BOOM! Cleared the minefield and cashed out at {multiplier}x! Pure sloth instincts, no bombs touched!",
      "Diamonds all over the board! Locked in {multiplier}x before the traps hit, that's high IQ demo play!",
      "Clean exit squad! Taking the {multiplier}x profit off the minefield, we love to see it!"
    ],
    loss: [
      "KABLAM! Stepped right on a hidden bomb! Chat, that tile was an absolute trap haha!",
      "Boom goes the dynamite! The greed got Hubie on that last tile, reload and reset!"
    ]
  },
  dragon_tower: {
    win: [
      "Scaled the Dragon Tower up to {multiplier}x! The eggs were safe, what a glorious climb squad!",
      "Tower conquered at {multiplier}x! The dragon stayed asleep and Hubie gets the demo treasure!",
      "High altitude profit! Reached {multiplier}x on Dragon Tower, let's goooo!"
    ],
    loss: [
      "The dragon woke up and roasted us! Down on the tower, but the climb back starts right now!",
      "Cracked the wrong egg! Dropped off the ledge, but we run the tower back immediately!"
    ]
  },
  plinko: {
    win: [
      "Look at that bounce! Ball skipped the center and dropped straight into the {multiplier}x bucket! Sheeeesh!",
      "Peg to peg perfection! Nailed a massive {multiplier}x on Plinko, chat clip that right now!",
      "Green bucket hit! {multiplier}x multiplier locked into the demo bankroll!"
    ],
    loss: [
      "Center peg magnet, only {multiplier}x! We drop another demo chip and chase the outer edges!",
      "Bounced right down the middle, minimal multiplier. Reloading the drop right now chat!"
    ]
  },
  limbo: {
    win: [
      "ROCKET BLASTOFF! Limbo multiplier blasted right through our target to {multiplier}x! To the moon!",
      "Clean takeoff! Target reached with a {multiplier}x rocket streak, the sky is not the limit squad!",
      "Boom! Multiplier soaring past {multiplier}x! That is why we love Limbo in demo mode!"
    ],
    loss: [
      "Engine stalled below target! Rocket crashed out early, fueling up for the next launch chat!",
      "Red line hit! Limbo stopped short that round, launching the next rocket right away!"
    ]
  },
  dice: {
    win: [
      "Green on the slider! Rolled a clean {multiplier}x hit! The RNG gods are blessing the sloth today!",
      "Right in the target zone! {multiplier}x locked in on Dice, smooth and steady squad!",
      "Dice roll delivered! That's {multiplier}x in the demo stack, let's keep the roll hot!"
    ],
    loss: [
      "Rolled into the red! Just missed the roll target, shaking the cup and rolling again!",
      "Off by a fraction! The dice were cruel that roll, running it right back squad!"
    ]
  },
  coinflip: {
    win: [
      "GOLDEN FLIP! Coin landed right side up for a sweet {multiplier}x! 50/50 in our favor squad!",
      "Heads on the table! Nailed the {multiplier}x flip, sloth luck is undefeated today!",
      "Pure gold on the bounce! {multiplier}x flip secured, W's in the chat!"
    ],
    loss: [
      "Flipped against us! 50/50 went the other way, flipping again right now!",
      "Wrong side of the coin! No tilt in demo mode, flipping the next round right away!"
    ]
  },
  hilo: {
    win: [
      "Card prediction was spot on! Locked in {multiplier}x on Hilo, reading the deck like a book squad!",
      "Higher and higher! That card hit our exact call for {multiplier}x, masterclass play!",
      "Card revealed! {multiplier}x profit safely banked in demo mode, beautiful read!"
    ],
    loss: [
      "Ace got us! Unlucky card reveal on the turn, but the demo deck is deep. Next hand dealt!",
      "Oof, caught on the flip! Shuffling the deck and running the next deal squad!"
    ]
  },
  wheel: {
    win: [
      "The wheel stopped right on the golden segment! That's a juicy {multiplier}x in the bank!",
      "Clean spin! Wheel locked onto {multiplier}x, sloth spin power is real squad!"
    ],
    loss: [
      "Wheel ticked one notch past our slice! Spinning the demo wheel right back chat!",
      "Just missed the big wedge! Reload and spin again squad!"
    ]
  },
  keno: {
    win: [
      "Numbers hit the board! Matched the golden spots for a crisp {multiplier}x win squad!",
      "Keno hits coming in hot! {multiplier}x locked into the demo ledger!"
    ],
    loss: [
      "Missed the lucky numbers that draw! Shuffling the keno tickets for the next round!",
      "Numbers scattered that round, picking fresh spots right now!"
    ]
  },
  roulette: {
    win: [
      "Ball landed square in our pocket! Clean {multiplier}x roulette profit locked in squad!",
      "Red or black, we take the green! {multiplier}x on the roulette wheel, love to see it!"
    ],
    loss: [
      "Ball bounced into the neighboring slot! Spinning the wheel again, keep the faith chat!",
      "Wheel missed our sector, placing the demo chips for the next spin!"
    ]
  },
  blackjack: {
    win: [
      "Dealer busts and Hubie takes the round! {multiplier}x demo profit in the stack!",
      "Blackjack on the felt! 21 locked in for {multiplier}x, clean card play squad!"
    ],
    loss: [
      "Dealer pulled a 21, classic casino heater! We dust off the chips and take the next hand!",
      "Busted on the hit! Shuffling up and dealing the next hand chat!"
    ]
  },
  baccarat: {
    win: [
      "Natural 9 on the table! That's a textbook {multiplier}x baccarat victory squad!",
      "Player side takes the pot for {multiplier}x, smooth baccarat action!"
    ],
    loss: [
      "Banker squeezed out the win by one point! Dealing the next shoe right away!",
      "Tough hand on baccarat, cutting the cards and dealing again squad!"
    ]
  },
  max_win: {
    win: [
      "MAX WIN energy in the air! Blasted the board for {multiplier}x, W's in the chat right now!",
      "Huge multiplier explosion on Max Win! {multiplier}x locked down squad!"
    ],
    loss: [
      "Didn't hit the bonus round that spin, but the max win hunt never stops squad!",
      "Reels spun cold, but the next spin is loaded with potential. Lock in!"
    ]
  }
};

const GENERIC_WIN_SMALL = [
  "Ayyy, a clean {multiplier}x on {game}! Profit is profit, we take those all day!",
  "Nice little {multiplier}x hit on {game}! Slow and steady wins the race, chat!",
  "Green on the screen! {multiplier}x in the bank, we're building the demo stack!",
  "That's what I'm talking about! {multiplier}x on {game}, let's keep the streak alive!"
];

const GENERIC_WIN_BIG = [
  "SHEEEEEESH! Look at that massive {multiplier}x on {game}! Chat, clip that right now!",
  "BOOOOOOOM! {multiplier}x multiplier exploded on {game}! Absolutely unreal squad!",
  "HOLY SLOTH POWER! A monstrous {multiplier}x hit! W's IN THE CHAT SQUAD!",
  "WE HIT THE STRATOSPHERE! {multiplier}x on {game}! That's why we love House Originals!"
];

const GENERIC_LOSS = [
  "Oof, caught a rough one on {game}! No worries chat, we dust it off and go again!",
  "Down on that round of {game}, but a sloth never tilts! Demo mode means zero sweat, squad!",
  "Ah, just missed the sweet spot on {game}! We reload and run it back!",
  "That round went cold on {game}, but the next one is where the comeback starts. Lock in!"
];

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Robust sanitizer to prevent LLM special tokens (<|start|>assistant<|channel|>, <think>, etc.)
 * from leaking into stream voice lines or commentary.
 */
export function sanitizeAIResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  let text = rawText;

  // 1. Strip reasoning / thinking tokens: <think>...</think>
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // 2. Strip all control / special tokens: <|...|> (e.g. <|start|>assistant<|channel|>final, <|im_start|>, <|im_end|>, etc.)
  text = text.replace(/<\|[\s\S]*?\|>/g, '');

  // 3. Strip raw HTML/XML-style tags
  text = text.replace(/<\/?[a-zA-Z0-9_\-]+(?:\s+[^>]*)?>/g, '');

  // 4. Strip markdown code blocks and backticks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 5. Strip role headers e.g. "Hubie:", "Assistant:", "AI:", "Streamer:"
  text = text.replace(/^(?:hubie|assistant|model|streamer|ai|system)[:\s\-]+/i, '');

  // 6. Strip stray quotes, asterisks, brackets at boundaries
  text = text.replace(/["*#_~]/g, '');

  // 7. Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // 8. Sanity check: must be meaningful text with at least 8 characters
  if (text.length < 8) return null;
  if (/^([a-zA-Z0-9_-]+)$/.test(text)) return null; // Single token like "final" or "assistant"
  if (/<\||\|>|channel|start_header_id/i.test(text)) return null;

  return text;
}

export class AIBrain {
  constructor() {
    this.apiKey = CONFIG.OPENROUTER_API_KEY;
    this.model = CONFIG.OPENROUTER_MODEL;
    this.baseUrl = CONFIG.OPENROUTER_BASE_URL;
  }

  isConfigured() {
    return Boolean(
      this.apiKey &&
      this.apiKey.trim().length > 15 &&
      !this.apiKey.includes('your_openrouter')
    );
  }

  async callOpenRouter(userPrompt) {
    if (!this.isConfigured()) return null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey.trim()}`,
          'HTTP-Referer': 'https://housebets.com',
          'X-Title': 'Hubie 24/7 AI Streamer',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: HUBIE_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 85,
          temperature: 0.85
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content || '';
        const clean = sanitizeAIResponse(rawContent);
        if (!clean) {
          console.log(`[HubieBrain] Model output contained special tokens or invalid length (${JSON.stringify(rawContent)}). Using authentic fallback.`);
          return null;
        }
        return clean;
      } else {
        console.warn(`[HubieBrain] OpenRouter returned ${response.status}: ${await response.text()}`);
        return null;
      }
    } catch (err) {
      console.warn(`[HubieBrain] OpenRouter request error: ${err.message}. Using contextual fallback.`);
      return null;
    }
  }

  /**
   * AI Dynamic Choice for Interactive Games (Keno, Mines, Dragon Tower, Coinflip, Hilo, Roulette)
   */
  async decideChoice(gameId, options = {}, context = {}) {
    if (gameId === 'keno') {
      const count = 4;
      const allNumbers = Array.from({ length: 40 }, (_, i) => i + 1);
      const shuffled = allNumbers.sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, count).sort((a, b) => a - b);

      const prompt = `You are Hubie streaming Keno live in demo mode. You picked lucky numbers: ${picked.join(', ')}. `
        + `Announce these numbers to chat in 1 short punchy sentence (under 20 words) with hype sloth energy.`;
      const aiText = await this.callOpenRouter(prompt);

      return {
        numbers: picked,
        voiceLine: aiText || `Locking in lucky numbers ${picked.join(', ')} on Keno squad! Light up the board!`
      };
    }

    if (gameId === 'mines') {
      const step = options.step || 1;
      const prompt = `You are streaming Mines live in demo mode on step ${step}. You are picking a tile on the 5x5 board to search for diamonds. `
        + `Give a quick 1-sentence hype line to chat announcing you are picking a safe diamond tile.`;
      const aiText = await this.callOpenRouter(prompt);

      const tileLines = [
        `Sloth instincts locked in on row 2, let's find that diamond squad!`,
        `Picking this tile right in the center, dodging all the bombs chat!`,
        `Feeling lucky on this corner tile, reveal the diamond!`,
        `Navigating the minefield squad, tapping this safe spot right now!`
      ];

      return {
        tileIndex: options.tileIndex ?? Math.floor(Math.random() * (options.totalTiles || 25)),
        voiceLine: aiText || sample(tileLines)
      };
    }

    if (gameId === 'dragon_tower') {
      const floor = options.floor || 1;
      const eggCount = options.eggCount || 3;
      const pickIndex = Math.floor(Math.random() * eggCount);
      const eggNames = ['left', 'middle', 'right', 'far-right'];
      const chosenEgg = eggNames[pickIndex] || `egg #${pickIndex + 1}`;

      const prompt = `You are streaming Dragon Tower live in demo mode on floor ${floor}. You are choosing the ${chosenEgg} egg to climb higher. `
        + `Give 1 quick sentence to chat announcing your pick.`;
      const aiText = await this.callOpenRouter(prompt);

      const eggLines = [
        `Floor ${floor}! Hubie's cracking the ${chosenEgg} egg, let's climb squad!`,
        `Scaling floor ${floor}, trusting the ${chosenEgg} egg! Dragon stay asleep!`,
        `Sloth ascension time! Going with the ${chosenEgg} egg on floor ${floor}!`
      ];

      return {
        eggIndex: pickIndex,
        voiceLine: aiText || sample(eggLines)
      };
    }

    if (gameId === 'coinflip') {
      const choice = Math.random() < 0.5 ? 'Heads' : 'Tails';
      const prompt = `You are playing Coinflip live on stream in demo mode. You choose to bet on ${choice}. `
        + `Give 1 punchy sentence to chat announcing your call.`;
      const aiText = await this.callOpenRouter(prompt);

      return {
        choice,
        voiceLine: aiText || `Hubie is calling ${choice.toUpperCase()}! 50/50 gold run, lock in chat!`
      };
    }

    if (gameId === 'hilo') {
      const choice = Math.random() < 0.5 ? 'Higher' : 'Lower';
      const prompt = `You are streaming Hilo live in demo mode. You decide to predict ${choice}. `
        + `Announce your call to chat in 1 short sentence.`;
      const aiText = await this.callOpenRouter(prompt);

      return {
        choice,
        voiceLine: aiText || `Reading the deck! Hubie is going with ${choice.toUpperCase()} squad!`
      };
    }

    if (gameId === 'roulette') {
      const choice = Math.random() < 0.5 ? 'Red' : 'Black';
      const prompt = `You are streaming Roulette live in demo mode. You place demo chips on ${choice}. `
        + `Give 1 short sentence to chat announcing the bet before spinning the wheel.`;
      const aiText = await this.callOpenRouter(prompt);

      return {
        choice,
        voiceLine: aiText || `Stacking demo chips on ${choice}! Let that roulette wheel spin, squad!`
      };
    }

    return {
      choice: 'default',
      voiceLine: `Placing the bet on ${gameId}, let's get those multipliers!`
    };
  }

  /**
   * AI Strategic Decision: Cash Out or Push Forward in multi-step games
   */
  async decideGameMove(gameName, currentMultiplier = 1.5, stepCount = 1) {
    const prompt = `You are Hubie streaming ${gameName} live in demo mode on Housebets. `
      + `You have survived ${stepCount} steps and reached ${currentMultiplier.toFixed(2)}x. `
      + `You must decide: 'CASHOUT' to take profit, or 'CONTINUE' to push for bigger multipliers! `
      + `Respond in exact format: DECISION: [CASHOUT or CONTINUE] | REASON: [1 punchy sentence to chat explaining why]`;

    const aiText = await this.callOpenRouter(prompt);
    if (aiText) {
      const isCashout = /CASHOUT/i.test(aiText);
      const reasonMatch = aiText.match(/REASON:\s*(.+)/i);
      let rawReason = reasonMatch ? reasonMatch[1].trim() : '';
      let cleanVoiceLine = sanitizeAIResponse(rawReason);
      
      const fallbackLine = isCashout
        ? `We take the ${currentMultiplier.toFixed(2)}x profit squad, cash out!`
        : `Feeling lucky chat, pushing for more multipliers on ${gameName}!`;

      return {
        action: isCashout ? 'CASHOUT' : 'CONTINUE',
        voiceLine: cleanVoiceLine || fallbackLine
      };
    }

    // High-context procedural fallback decision engine
    let shouldCashout = false;
    if (currentMultiplier >= 3.5 || stepCount >= 4) {
      shouldCashout = Math.random() < 0.75;
    } else if (currentMultiplier >= 2.0 || stepCount >= 2) {
      shouldCashout = Math.random() < 0.45;
    } else {
      shouldCashout = Math.random() < 0.15;
    }

    const cashoutLines = [
      `A clean ${currentMultiplier.toFixed(2)}x is on the table, chat! Cashing out and securing demo profit on ${gameName}!`,
      `Green in the bank squad! Cashing out at ${currentMultiplier.toFixed(2)}x, profit is profit!`,
      `Smart sloth moves! Taking the ${currentMultiplier.toFixed(2)}x cashout before the traps hit!`
    ];

    const continueLines = [
      `Sitting at ${currentMultiplier.toFixed(2)}x on ${gameName}, but Hubie's feeling ambitious! One more step squad!`,
      `We don't stop here chat! ${currentMultiplier.toFixed(2)}x is great, but let's hunt that monster multiplier!`,
      `Sloth courage activated! Pushing forward to step ${stepCount + 1}, lock in chat!`
    ];

    return {
      action: shouldCashout ? 'CASHOUT' : 'CONTINUE',
      voiceLine: shouldCashout ? sample(cashoutLines) : sample(continueLines)
    };
  }

  /**
   * Spontaneous, authentic live commentary after each round with game and multiplier context
   */
  async commentateRound(gameName, bet, outcome, context = {}) {
    const won = Boolean(outcome.won);
    const multiplier = typeof outcome.multiplier === 'number' ? outcome.multiplier : (won ? 2.0 : 0.0);
    const profit = outcome.profit || 0;
    const detail = outcome.detail || '';
    const streak = context.streak || 0;

    const prompt = `You are Hubie commentating live on stream as the official Housebets mascot in DEMO mode.
CRITICAL CONTEXT:
- Game currently on screen: ${gameName}
- Exact Round Outcome: ${won ? `WIN with ${multiplier.toFixed(2)}x` : `LOSS with 0.00x`}
- Detail: ${detail}
- Session streak: ${streak > 1 ? `${streak} wins in a row` : streak < -1 ? `${Math.abs(streak)} losses in a row` : 'neutral'}

RULES:
1. React ONLY to ${gameName}. NEVER mention other games like coinflip, limbo, etc.!
2. If this was a LOSS (${!won}), you lost the bet. Be chill/philosophical like a sloth ("dust it off and run it back"). DO NOT celebrate a loss as a win!
3. If this was a WIN (${won}), celebrate the ${multiplier.toFixed(2)}x hit on ${gameName}!
4. Length: 1 to 2 short sentences (max 25 words).`;

    const aiText = await this.callOpenRouter(prompt);
    if (aiText) return aiText;

    // Authentic game-specific procedural fallback commentary
    const gameKey = (gameName || '').toLowerCase().replace(/['\s-]/g, '_');
    const specific = GAME_FALLBACK_COMMENTARY[gameKey];

    if (specific) {
      const pool = won ? specific.win : specific.loss;
      return sample(pool).replace(/\{multiplier\}/g, multiplier.toFixed(2));
    }

    // Generic fallback with game and multiplier insertion
    if (won) {
      const template = multiplier >= 4.0 ? sample(GENERIC_WIN_BIG) : sample(GENERIC_WIN_SMALL);
      return template.replace(/\{multiplier\}/g, multiplier.toFixed(2)).replace(/\{game\}/g, gameName);
    } else {
      return sample(GENERIC_LOSS).replace(/\{game\}/g, gameName);
    }
  }

  /**
   * Context-Aware Chat Response: Directly references active game, current multiplier, and viewer
   */
  async answerChat(username, message, context = {}) {
    const gameName = context.gameName || "House Originals";
    const won = Boolean(context.won);
    const multStr = context.multiplier !== null && context.multiplier !== undefined ? `${Number(context.multiplier).toFixed(2)}x` : (won ? '1.50x' : '0.00x');
    const wonState = won ? `WIN (${multStr})` : `LOSS (0.00x)`;
    const streak = context.streak || 0;
    const totalWins = context.totalWins || 0;
    const totalLosses = context.totalLosses || 0;
    const totalRounds = context.totalRounds || 0;

    const prompt = `You are Hubie, the official sloth mascot of Housebets, streaming live 24/7 on Kick/Twitch in DEMO / FUN mode.
Current live stream screen context:
- Game currently playing on screen: ${gameName}
- Last round result: ${wonState}
- Win streak: ${streak}
- Session records: ${totalWins} wins, ${totalLosses} losses (${totalRounds} rounds total)

Viewer @${username} just said in the live stream chat: "${message}"

Give a charismatic, genuine live streamer response directly to @${username} (1-2 sentences, max 25 words).
Crucial instructions:
1. Greet or shoutout @${username} by name.
2. Naturally mention the game you are playing right now (${gameName}). NEVER mention a different game!
3. If they ask about bets or winning, remind them this is demo mode for fun, math favors the house, and to gamble responsibly (18+).`;

    const aiText = await this.callOpenRouter(prompt);
    if (aiText) return aiText;

    // Contextual procedural fallback
    const contextualTemplates = [
      `Yo @{user}! Big love for tuning in! We're live on {game} right now sitting on that {multiplier} hit, let's keep the demo vibes rolling!`,
      `Ayy @{user}! We're cooking up heat on {game}! Keep your eyes on the board, chasing those juicy multipliers squad!`,
      `Welcome to the 24/7 party @{user}! Grinding {game} in demo mode today. Remember to always gamble responsibly and keep it 100% fun!`,
      `Shoutout to @{user}! Sloth squad rolling deep while we play {game}! Drop a W in the chat for the next round!`
    ];

    return sample(contextualTemplates)
      .replace(/\{user\}/g, username)
      .replace(/\{game\}/g, gameName)
      .replace(/\{multiplier\}/g, multStr);
  }

  async speakSafetyReminder() {
    const prompt = `Give a quick, charismatic streamer reminder to chat about responsible gambling, `
      + `mentioning 18+ requirement, staying safe, knowing limits, and that we play in demo mode for fun. `
      + `Keep it 1 to 2 upbeat sentences.`;

    const aiText = await this.callOpenRouter(prompt);
    if (aiText) return aiText;

    const reminders = [
      "Quick reminder to the squad: Hubie plays strictly in demo mode! Gambling is 18+ and purely for fun. Set limits and know when to stop at begambleaware.org!",
      "Hey chat, remember: no system beats the math, and never bet what you can't afford to lose! Keep it chill, keep it demo!",
      "Friendly mascot reminder: Always stay safe, never chase losses, and keep gambling strictly as entertainment. Hubie's got your back!"
    ];
    return sample(reminders);
  }

  async announceGameSwitch(oldGame, newGame) {
    const prompt = `You are switching games on stream from ${oldGame} to ${newGame}. `
      + `Hype up the chat for this new segment in 1 to 2 short sentences.`;

    const aiText = await this.callOpenRouter(prompt);
    if (aiText) return aiText;

    const switchLines = [
      `Time to switch gears, squad! Moving over to ${newGame}! Let's see how hot the boards are!`,
      `Rotating the arena! Say goodbye to ${oldGame}, say hello to ${newGame}! New game, new multipliers!`,
      `Fresh segment incoming! We're diving into ${newGame} now. Who's ready for some hype rounds?`
    ];
    return sample(switchLines);
  }
}
