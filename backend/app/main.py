from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.websocket.manager import manager
from app.core.scheduler import start_scheduler

app = FastAPI(
    title="Trading Intelligence System",
    description="AI-powered market scanner and trade signal generator",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.websocket("/ws")
async def websocket_endpoint(websocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        manager.disconnect(websocket)


@app.on_event("startup")
async def startup():
    start_scheduler()


@app.get("/api/health")
async def health():
    return {"status": "running", "mode": "autonomous"}
