import asyncio
import logging
import random
import re
from typing import Dict, Any, List, Optional, Callable

logger = logging.getLogger("HubieChat")

# Inappropriate or toxic keywords to moderate
BLOCKED_PATTERNS = [
    r"\b(nigg|fag|retard|cunt|slut|whore|kill\s*yourself|kys)\w*",
    r"(http://|https://|www\.)\S+",
    r"\b(free\s*crypto|send\s*me\s*eth|send\s*btc|airdrop\s*now|double\s*your\s*money)\b",
    r"\b(hack|rigged|cheat\s*code|deposit\s*now|guaranteed\s*win)\b"
]

SIMULATED_COMMUNITY_USERS = [
    "SlothFanatic", "NeonRoller", "LuckyPaws", "CryptoVibe99", "PlinkoGod",
    "HouseKing", "ChillVibesOnly", "DiamondHands_7", "TurboWhale", "JungleJumper",
    "GigaMultiplier", "BananaPeel", "AlphaDegenerate", "MetaSloth", "PixelBettor"
]

SIMULATED_CHAT_MESSAGES = [
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
]

class ChatManager:
    def __init__(self, on_new_chat: Optional[Callable] = None, on_moderated: Optional[Callable] = None):
        self.on_new_chat = on_new_chat
        self.on_moderated = on_moderated
        self.chat_history: List[Dict[str, Any]] = []
        self.pending_questions: asyncio.Queue = asyncio.Queue()
        self._running = False
        self._simulator_task: Optional[asyncio.Task] = None

    def start(self):
        if not self._running:
            self._running = True
            self._simulator_task = asyncio.create_task(self._chat_simulator_loop())
            logger.info("Hubie Chat Manager & Moderator active.")

    def stop(self):
        self._running = False
        if self._simulator_task:
            self._simulator_task.cancel()

    def moderate_message(self, text: str) -> bool:
        """Return True if message passes moderation, False if flagged/toxic."""
        text_lower = text.lower()
        for pattern in BLOCKED_PATTERNS:
            if re.search(pattern, text_lower):
                return False
        return True

    async def ingest_message(self, username: str, text: str, is_simulated: bool = False):
        """Process an incoming chat message through moderation and routing."""
        clean_text = text.strip()
        passed = self.moderate_message(clean_text)

        msg_obj = {
            "id": f"msg_{len(self.chat_history) + 1}",
            "user": username,
            "text": clean_text,
            "passed": passed,
            "is_simulated": is_simulated
        }

        self.chat_history.append(msg_obj)
        if len(self.chat_history) > 100:
            self.chat_history.pop(0)

        if not passed:
            logger.warning(f"[MODERATED] Removed toxic message from @{username}: {clean_text}")
            if self.on_moderated:
                await self.on_moderated(msg_obj)
            return

        if self.on_new_chat:
            await self.on_new_chat(msg_obj)

        # Enqueue for potential Hubie answer if it's a question or addresses Hubie
        if "?" in clean_text or "hubie" in clean_text.lower():
            # Keep queue modest
            if self.pending_questions.qsize() < 10:
                await self.pending_questions.put((username, clean_text))

    async def get_next_question_to_answer(self) -> Optional[tuple[str, str]]:
        """Retrieve the next chat message Hubie should respond to."""
        if not self.pending_questions.empty():
            return await self.pending_questions.get()
        return None

    async def _chat_simulator_loop(self):
        """Simulate realistic chat activity so the stream is perpetually lively."""
        while self._running:
            try:
                # Random interval between 8 and 22 seconds
                delay = random.uniform(8.0, 22.0)
                await asyncio.sleep(delay)

                user = random.choice(SIMULATED_COMMUNITY_USERS)
                text = random.choice(SIMULATED_CHAT_MESSAGES)
                await self.ingest_message(user, text, is_simulated=True)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in chat simulator: {e}")
                await asyncio.sleep(5.0)

