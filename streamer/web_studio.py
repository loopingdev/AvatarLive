import asyncio
import json
import logging
from pathlib import Path
from typing import Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import config

logger = logging.getLogger("HubieStudioServer")

def create_studio_app(game_engine, ai_brain, tts_engine, chat_manager, supervisor, broadcaster):
    app = FastAPI(title="Hubie 24/7 Live Stream Studio")

    # Static assets directory
    web_dir = config.BASE_DIR / "web"
    app.mount("/assets", StaticFiles(directory=str(web_dir / "assets")), name="assets")

    connected_websockets: Set[WebSocket] = set()

    async def broadcast_ws(message: dict):
        dead_sockets = set()
        for ws in connected_websockets:
            try:
                await ws.send_json(message)
            except Exception:
                dead_sockets.add(ws)
        for dead in dead_sockets:
            connected_websockets.discard(dead)

    # Wire event listeners to broadcast via WebSockets
    async def on_game_update(payload):
        await broadcast_ws({"type": "game_update", "data": payload})

    async def on_speech_start(text: str, duration: float, audio_url: str):
        await broadcast_ws({
            "type": "hubie_speaking_start",
            "text": text,
            "duration": duration,
            "audio_url": audio_url
        })

    async def on_speech_end():
        await broadcast_ws({"type": "hubie_speaking_end"})

    async def on_new_chat(msg: dict):
        await broadcast_ws({"type": "chat_message", "message": msg})

    async def on_moderated(msg: dict):
        await broadcast_ws({"type": "chat_moderated", "message": msg})

    # Hook up callbacks
    game_engine.on_game_state_update = on_game_update
    tts_engine.on_speech_start = on_speech_start
    tts_engine.on_speech_end = on_speech_end
    chat_manager.on_new_chat = on_new_chat
    chat_manager.on_moderated = on_moderated

    @app.get("/", response_class=HTMLResponse)
    async def get_index():
        index_file = web_dir / "index.html"
        return FileResponse(str(index_file))

    @app.get("/overlay", response_class=HTMLResponse)
    async def get_overlay():
        overlay_file = web_dir / "overlay.html"
        if overlay_file.exists():
            return FileResponse(str(overlay_file))
        return FileResponse(str(web_dir / "index.html"))

    @app.get("/hubie_avatar.js")
    async def get_avatar_js():
        return FileResponse(str(web_dir / "hubie_avatar.js"))

    @app.get("/game_view.js")
    async def get_game_js():
        return FileResponse(str(web_dir / "game_view.js"))

    @app.get("/style.css")
    async def get_css():
        return FileResponse(str(web_dir / "style.css"))

    @app.get("/api/status")
    async def get_status():
        telemetry = supervisor.get_system_telemetry()
        telemetry["game_state"] = game_engine.get_state()
        telemetry["ai_configured"] = ai_brain.is_configured()
        telemetry["broadcasting"] = broadcaster.is_broadcasting
        telemetry["platform"] = config.STREAM_PLATFORM
        return JSONResponse(telemetry)

    @app.post("/api/chat")
    async def post_chat(request: Request):
        data = await request.json()
        user = data.get("user", "Viewer").strip() or "Viewer"
        text = data.get("text", "").strip()
        if text:
            await chat_manager.ingest_message(user, text, is_simulated=False)
            return JSONResponse({"status": "ok", "message": "sent"})
        return JSONResponse({"status": "error", "message": "empty text"}, status_code=400)

    @app.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket):
        await websocket.accept()
        connected_websockets.add(websocket)
        supervisor.heartbeat("studio_websocket")

        # Send initial full state immediately upon connection
        try:
            init_payload = {
                "type": "init",
                "game_state": game_engine.get_state(),
                "telemetry": supervisor.get_system_telemetry(),
                "safety_disclaimer": config.SAFETY_DISCLAIMER
            }
            await websocket.send_json(init_payload)

            while True:
                # Keep socket alive and receive any client events
                data = await websocket.receive_text()
                supervisor.heartbeat("studio_websocket")
                try:
                    msg = json.loads(data)
                    if msg.get("action") == "manual_chat":
                        await chat_manager.ingest_message(
                            msg.get("user", "AdminViewer"),
                            msg.get("text", "Let's go Hubie!"),
                            is_simulated=False
                        )
                except Exception:
                    pass
        except WebSocketDisconnect:
            connected_websockets.discard(websocket)
        except Exception:
            connected_websockets.discard(websocket)

    return app

