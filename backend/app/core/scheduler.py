import asyncio
from datetime import datetime, timedelta
from app.core.state import get_state
from app.config import SCAN_INTERVAL


async def run_scan():
    from app.engines.scanner import TradingEngine
    engine = TradingEngine()
    try:
        result = await engine.run_full_scan()
        get_state().update_status(
            status="idle",
            next_scan=get_next_scan_time(),
        )
    except Exception as e:
        print(f"Scan error: {e}")
        get_state().update_status(status="error")


def get_next_scan_time() -> str:
    now = datetime.utcnow()
    next_scan = now + timedelta(minutes=SCAN_INTERVAL)
    return next_scan.isoformat()


def start_scheduler():
    async def periodic_scan():
        while True:
            await asyncio.sleep(SCAN_INTERVAL * 60)
            await run_scan()

    asyncio.create_task(periodic_scan())
