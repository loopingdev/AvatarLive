import { CONFIG } from '../config.js';

const HUBIE_SYSTEM_PROMPT = `
You are HUBIE, the official AI mascot and live streamer of Housebets! You are a super charismatic, funny, chill sloth with flashy sunglasses and an infectious hype energy.
You are streaming 24/7 to Kick/Twitch, playing House Originals (Hubie's Road, Plinko, Mines, Dice, Limbo, Crash) strictly in DEMO / FUN mode.

CORE PERSONALITY & TONE:
- High energy on big multipliers, comically chill/philosophical on losses ("A sloth moves slow, but the multipliers move fast!").
- Speak like a top-tier live streamer: use streaming terms naturally ("chat", "squad", "W in the chat", "lock in", "sheeeesh", "we go again").
- Keep responses snappy and punchy (1 to 2 short sentences, 15 to 35 words max) so they can be spoken via Text-To-Speech during fast gameplay.
- Address chat members by username with direct shoutouts when replying.

CRITICAL SAFETY & RESPONSIBILITY RULES:
1. NEVER promise wins or suggest strategies guarantee profits.
2. NEVER encourage real money deposits or chasing losses.
3. CONSTANTLY reinforce that this is DEMO / ENTERTAINMENT mode only.
4. If asked about winning big, remind viewers to gamble responsibly, set strict limits, and keep it fun (18+ only).
5. Never be hateful, toxic, or offensive.
`;

const FALLBACK_COMMENTARY = {
  round_start: [
    "Alright squad, locking in our bet! Let's see what the rng gods have for Hubie today!",
    "New round, fresh vibes. Watch this multiplier climb, chat!",
    "Bet placed! Keep your eyes on the board, this is where the magic happens!",
    "Sloth speed activated! Let's get that golden multiplier in demo mode!",
    "Dropping the chips! W's in the chat for good luck, squad!"
  ],
  win_small: [
    "Ayyy, a clean {multiplier}x! Profit is profit, we take those all day!",
    "Nice little {multiplier}x hit right there! Slow and steady wins the race, chat!",
    "Green on the screen! {multiplier}x in the bank, we're building the demo stack!",
    "That's what I'm talking about! {multiplier}x locked in, let's keep the streak alive!"
  ],
  win_big: [
    "SHEEEEEESH! Look at that massive {multiplier}x! Chat, clip that right now!",
    "BOOOOOOOM! {multiplier}x multiplier exploded! Hubie's road never disappoints, let's goooo!",
    "HOLY SLOTH POWER! A monstrous {multiplier}x hit! W's IN THE CHAT SQUAD!",
    "WE HIT THE STRATOSPHERE! {multiplier}x! That's why we love House Originals, absolutely unreal!"
  ],
  loss: [
    "Oof, caught a rough one there! No worries chat, we dust it off and go again!",
    "Down on that round, but a sloth never tilts! Demo mode means zero sweat, squad!",
    "Ah, just missed the sweet spot! We reload and run it back!",
    "That round went cold, but the next one is where the comeback starts. Lock in!",
    "Classic bait by the house! Good thing Hubie has infinite patience. Next round!"
  ],
  chat_reply: [
    "Yo @{user}, big love for tuning in! You already know Hubie is cooking up some demo heat!",
    "Great question @{user}! In Plinko we trust, but always remember to play responsibly and keep it 100% fun!",
    "Welcome into the 24/7 party @{user}! Drop a W in the chat, we're chasing multipliers all day!",
    "Shoutout to @{user}! Sloth squad rolling deep today! What game should we hit next?"
  ],
  safety_reminder: [
    "Quick reminder to the squad: Hubie plays strictly in demo mode! Gambling is 18+ and purely for fun. Set limits and know when to stop at begambleaware.org!",
    "Hey chat, remember: no system beats the math, and never bet what you can't afford to lose! Keep it chill, keep it demo!",
    "Friendly mascot reminder: Always stay safe, never chase losses, and keep gambling strictly as entertainment. Hubie's got your back!"
  ],
  game_switch: [
    "Time to switch gears, squad! Moving over to {new_game}! Let's see how hot the boards are!",
    "Rotating the arena! Say goodbye to {old_game}, say hello to {new_game}! New game, new multipliers!",
    "Fresh segment incoming! We're diving into {new_game} now. Who's ready for some hype rounds?"
  ]
};

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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
          max_tokens: 80,
          temperature: 0.85
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        let text = data.choices?.[0]?.message?.content?.trim() || '';
        text = text.replace(/["*]/g, '').trim();
        return text || null;
      } else {
        console.warn(`[HubieBrain] OpenRouter returned ${response.status}: ${await response.text()}`);
        return null;
      }
    } catch (err) {
      console.warn(`[HubieBrain] OpenRouter request error: ${err.message}. Using procedural fallback.`);
      return null;
    }
  }

  /**
   * AI Strategic Decision: Cash Out or Push Forward for higher multipliers!
   */
  async decideGameMove(gameName, currentMultiplier = 1.5, stepCount = 1) {
    const prompt = `You are streaming ${gameName} live in demo mode. `
      + `You have survived ${stepCount} steps and reached ${currentMultiplier.toFixed(2)}x. `
      + `You must decide: 'CASHOUT' to take profit, or 'CONTINUE' to push for bigger multipliers! `
      + `Respond in exact format: DECISION: [CASHOUT or CONTINUE] | REASON: [1 punchy sentence to chat explaining why]`;

    const aiText = await this.callOpenRouter(prompt);
    if (aiText) {
      const isCashout = /CASHOUT/i.test(aiText);
      const reasonMatch = aiText.match(/REASON:\s*(.+)/i);
      const voiceLine = reasonMatch ? reasonMatch[1].trim() : (isCashout ? `We take the ${currentMultiplier.toFixed(2)}x profit squad, cash out!` : `Feeling lucky chat, we push for more!`);
      return {
        action: isCashout ? 'CASHOUT' : 'CONTINUE',
        voiceLine
      };
    }

    // Procedural Fallback Decision Engine
    // Higher multipliers increase cashout chance
    let shouldCashout = false;
    if (currentMultiplier >= 3.5 || stepCount >= 4) {
      shouldCashout = Math.random() < 0.75;
    } else if (currentMultiplier >= 2.0 || stepCount >= 2) {
      shouldCashout = Math.random() < 0.45;
    } else {
      shouldCashout = Math.random() < 0.15;
    }

    const cashoutLines = [
      `A clean ${currentMultiplier.toFixed(2)}x is on the table, chat! We're locking it in and cashing out!`,
      `Green in the bank squad! Cashing out at ${currentMultiplier.toFixed(2)}x, profit is profit!`,
      `Smart money moves! Taking the ${currentMultiplier.toFixed(2)}x cashout before the traps hit!`
    ];

    const continueLines = [
      `Sitting at ${currentMultiplier.toFixed(2)}x, but Hubie's feeling ambitious! One more step squad!`,
      `We don't stop here chat! ${currentMultiplier.toFixed(2)}x is great, but let's hunt a monster multiplier!`,
      `Sloth power activated! Pushing forward to the next level, lock in chat!`
    ];

    return {
      action: shouldCashout ? 'CASHOUT' : 'CONTINUE',
      voiceLine: shouldCashout ? sample(cashoutLines) : sample(continueLines)
    };
  }

  async commentateRound(gameName, bet, outcome) {
    const { won, multiplier, profit, detail } = outcome;
    const prompt = `You just finished a round of ${gameName} in demo mode with a bet of ${bet.toFixed(1)} pts. `
      + `Result: ${won ? 'WIN' : 'LOSS'}, Multiplier: ${multiplier.toFixed(2)}x, Profit: ${profit.toFixed(1)} pts. `
      + `Game details: ${detail}. `
      + `Give a spontaneous, charismatic live streamer reaction in 1 to 2 short sentences.`;

    const aiText = await this.callOpenRouter(prompt);
    if (aiText) return aiText;

    if (won) {
      const template = multiplier >= 5.0 ? sample(FALLBACK_COMMENTARY.win_big) : sample(FALLBACK_COMMENTARY.win_small);
      return template.replace('{multiplier}', multiplier.toFixed(2));
    } else {
      return sample(FALLBACK_COMMENTARY.loss).replace('{game}', gameName);
    }
  }

  async answerChat(username, message) {
    const prompt = `Viewer @${username} said in chat: "${message}". `
      + `Respond directly to @${username} in 1 or 2 charismatic, friendly sentences as Hubie the mascot. `
      + `If they ask for tips, remind them it's demo play and keep it responsible.`;

    const aiText = await this.callOpenRouter(prompt);
    if (aiText) return aiText;

    return sample(FALLBACK_COMMENTARY.chat_reply).replace('{user}', username);
  }

  async speakSafetyReminder() {
    const prompt = `Give a quick, charismatic streamer reminder to chat about responsible gambling, `
      + `mentioning 18+ requirement, staying safe, knowing limits, and that we play in demo mode for fun. `
      + `Keep it 1 to 2 upbeat sentences.`;

    const aiText = await this.callOpenRouter(prompt);
    if (aiText) return aiText;

    return sample(FALLBACK_COMMENTARY.safety_reminder);
  }

  async announceGameSwitch(oldGame, newGame) {
    const prompt = `You are switching games on stream from ${oldGame} to ${newGame}. `
      + `Hype up the chat for this new segment in 1 to 2 short sentences.`;

    const aiText = await this.callOpenRouter(prompt);
    if (aiText) return aiText;

    return sample(FALLBACK_COMMENTARY.game_switch)
      .replace('{old_game}', oldGame)
      .replace('{new_game}', newGame);
  }
}
