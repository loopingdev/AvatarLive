import json
import logging
import random
import httpx
from typing import Dict, Any, Optional
import config

logger = logging.getLogger("HubieBrain")

HUBIE_SYSTEM_PROMPT = """
You are HUBIE, the official AI mascot and live streamer of Housebets! You are a super charismatic, funny, chill sloth with flashy sunglasses and an infectious hype energy.
You are streaming 24/7 to Kick/Twitch, playing House Originals (Hubie's Road, Plinko, Mines, Dice, Limbo, Crash) strictly in DEMO / FUN mode.

CORE PERSONALITY & TONE:
- High energy on big multipliers, comically chill/philosophical on losses ("A sloth moves slow, but the multipliers move fast!").
- Speak like a top-tier live streamer: use streaming terms naturally ("chat", "squad", "W in the chat", "lock in", "sheeeesh", "we go again").
- Keep responses snappy and punchy (1 to 3 sentences maximum, 15 to 40 words) so they can be spoken naturally via Text-To-Speech during fast gameplay.
- Address chat members by username with direct shoutouts when replying.

CRITICAL SAFETY & RESPONSIBILITY RULES:
1. NEVER promise wins or suggest strategies guarantee profits.
2. NEVER encourage real money deposits or chasing losses.
3. CONSTANTLY reinforce that this is DEMO / ENTERTAINMENT mode only.
4. If asked about winning big, remind viewers to gamble responsibly, set strict limits, and keep it fun (18+ only).
5. Never be hateful, toxic, or offensive.
"""

# Fallback procedural dialogue library to ensure 24/7 zero-downtime commentary
FALLBACK_COMMENTARY = {
    "round_start": [
        "Alright squad, locking in our bet! Let's see what the rng gods have for Hubie today!",
        "New round, fresh vibes. Watch this multiplier climb, chat!",
        "Bet placed! Keep your eyes on the board, this is where the magic happens!",
        "Sloth speed activated! Let's get that golden multiplier in demo mode!",
        "Dropping the chips! W's in the chat for good luck, squad!"
    ],
    "win_small": [
        "Ayyy, a clean {multiplier}x! Profit is profit, we take those all day!",
        "Nice little {multiplier}x hit right there! Slow and steady wins the race, chat!",
        "Green on the screen! {multiplier}x in the bank, we're building the demo stack!",
        "That's what I'm talking about! {multiplier}x locked in, let's keep the streak alive!"
    ],
    "win_big": [
        "SHEEEEEESH! Look at that massive {multiplier}x! Chat, clip that right now!",
        "BOOOOOOOM! {multiplier}x multiplier exploded! Hubie's road never disappoints, let's goooo!",
        "HOLY SLOTH POWER! A monstrous {multiplier}x hit! W's IN THE CHAT SQUAD!",
        "WE HIT THE STRATOSPHERE! {multiplier}x! That's why we love House Originals, absolutely unreal!"
    ],
    "loss": [
        "Oof, caught a rough one there! No worries chat, we dust it off and go again!",
        "Down on that round, but a sloth never tilts! Demo mode means zero sweat, squad!",
        "Ah, just missed the sweet spot! We reload and run it back!",
        "That round went cold, but the next one is where the comeback starts. Lock in!",
        "Classic bait by the house! Good thing Hubie has infinite patience. Next round!"
    ],
    "chat_reply": [
        "Yo @{user}, big love for tuning in! You already know Hubie is cooking up some demo heat!",
        "Great question @{user}! In Plinko we trust, but always remember to play responsibly and keep it 100% fun!",
        "Welcome into the 24/7 party @{user}! Drop a W in the chat, we're chasing multipliers all day!",
        "Shoutout to @{user}! Sloth squad rolling deep today! What game should we hit next?"
    ],
    "safety_reminder": [
        "Quick reminder to the squad: Hubie plays strictly in demo mode! Gambling is 18+ and purely for fun. Set limits and know when to stop at begambleaware.org!",
        "Hey chat, remember: no system beats the math, and never bet what you can't afford to lose! Keep it chill, keep it demo!",
        "Friendly mascot reminder: Always stay safe, never chase losses, and keep gambling strictly as entertainment. Hubie's got your back!"
    ],
    "game_switch": [
        "Time to switch gears, squad! Moving over to {new_game}! Let's see how hot the boards are!",
        "Rotating the arena! Say goodbye to {old_game}, say hello to {new_game}! New game, new multipliers!",
        "Fresh segment incoming! We're diving into {new_game} now. Who's ready for some hype rounds?"
    ]
}

class HubieBrain:
    def __init__(self):
        self.api_key = config.OPENROUTER_API_KEY
        self.model = config.OPENROUTER_MODEL
        self.base_url = config.OPENROUTER_BASE_URL
        self.client = httpx.AsyncClient(timeout=10.0)

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def _call_openrouter(self, user_prompt: str) -> Optional[str]:
        if not self.is_configured():
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "HTTP-Referer": "https://housebets.com",
            "X-Title": "Hubie 24/7 AI Streamer",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": HUBIE_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": 90,
            "temperature": 0.85
        }

        try:
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            if response.status_code == 200:
                data = response.json()
                text = data["choices"][0]["message"]["content"].strip()
                # Clean any markdown or quotes
                text = text.replace('"', '').replace('**', '').strip()
                return text
            else:
                logger.warning(f"OpenRouter returned status {response.status_code}: {response.text}")
                return None
        except Exception as e:
            logger.warning(f"OpenRouter API request failed: {e}. Falling back to procedural engine.")
            return None

    async def commentate_round(self, game_name: str, bet: float, outcome: Dict[str, Any]) -> str:
        """Commentate game round outcome (Win/Loss/Multiplier)."""
        won = outcome.get("won", False)
        multiplier = outcome.get("multiplier", 1.0)
        profit = outcome.get("profit", 0.0)
        detail = outcome.get("detail", "")

        prompt = (
            f"You just finished a round of {game_name} in demo mode with a bet of {bet:.1f} pts. "
            f"Result: {'WIN' if won else 'LOSS'}, Multiplier: {multiplier:.2f}x, Profit: {profit:.1f} pts. "
            f"Game details: {detail}. "
            f"Give a spontaneous, charismatic live streamer reaction in 1 to 2 short sentences."
        )

        ai_response = await self._call_openrouter(prompt)
        if ai_response:
            return ai_response

        # Fallback commentary
        if won:
            if multiplier >= 5.0:
                template = random.choice(FALLBACK_COMMENTARY["win_big"])
            else:
                template = random.choice(FALLBACK_COMMENTARY["win_small"])
            return template.format(multiplier=f"{multiplier:.2f}", game=game_name)
        else:
            template = random.choice(FALLBACK_COMMENTARY["loss"])
            return template.format(game=game_name)

    async def answer_chat(self, username: str, message: str) -> str:
        """Answer a chat viewer directly by name."""
        prompt = (
            f"Viewer @{username} said in chat: '{message}'. "
            f"Respond directly to @{username} in 1 or 2 charismatic, friendly sentences as Hubie the mascot. "
            f"If they ask for tips, remind them it's demo play and keep it responsible."
        )

        ai_response = await self._call_openrouter(prompt)
        if ai_response:
            return ai_response

        template = random.choice(FALLBACK_COMMENTARY["chat_reply"])
        return template.format(user=username)

    async def speak_safety_reminder(self) -> str:
        """Generate a natural 18+ and responsible gambling reminder."""
        prompt = (
            "Give a quick, charismatic streamer reminder to chat about responsible gambling, "
            "mentioning 18+ requirement, staying safe, knowing limits, and that we play in demo mode for fun. "
            "Keep it 1 to 2 upbeat sentences."
        )

        ai_response = await self._call_openrouter(prompt)
        if ai_response:
            return ai_response

        return random.choice(FALLBACK_COMMENTARY["safety_reminder"])

    async def announce_game_switch(self, old_game: str, new_game: str) -> str:
        """Announce transition to a new House Original."""
        prompt = (
            f"You are switching games on stream from {old_game} to {new_game}. "
            f"Hyped up the chat for this new segment in 1 to 2 short sentences."
        )

        ai_response = await self._call_openrouter(prompt)
        if ai_response:
            return ai_response

        template = random.choice(FALLBACK_COMMENTARY["game_switch"])
        return template.format(old_game=old_game.replace("_", " ").title(), new_game=new_game.replace("_", " ").title())

