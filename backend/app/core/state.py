from datetime import datetime
import threading


class StateManager:
    def __init__(self):
        self._lock = threading.Lock()
        self._status = {
            "status": "idle",
            "last_scan": None,
            "total_scans": 0,
            "total_signals": 0,
            "uptime": datetime.utcnow().isoformat(),
            "next_scan": None,
        }
        self._latest_sectors = []
        self._all_signals = []
        self._scan_history = []
        self._market_overview = {}
        self._news = []

    def update_status(self, **kwargs):
        with self._lock:
            self._status.update(kwargs)

    def get_status(self) -> dict:
        with self._lock:
            return dict(self._status)

    def store_sectors(self, sectors: list):
        with self._lock:
            self._latest_sectors = sectors

    def get_latest_sectors(self) -> list:
        with self._lock:
            return list(self._latest_sectors)

    def add_signals(self, signals: list):
        with self._lock:
            self._all_signals.extend(signals)
            self._status["total_signals"] += len(signals)

    def get_all_signals(self) -> list:
        with self._lock:
            return list(self._all_signals)

    def get_recent_signals(self, limit: int = 10) -> list:
        with self._lock:
            return list(self._all_signals[-limit:])

    def add_scan_result(self, result: dict):
        with self._lock:
            self._scan_history.append(result)
            self._status["total_scans"] += 1
            self._status["last_scan"] = datetime.utcnow().isoformat()

    def get_scan_history(self) -> list:
        with self._lock:
            return list(self._scan_history[-20:])

    def set_market_overview(self, data: dict):
        with self._lock:
            self._market_overview = data

    def get_market_overview(self) -> dict:
        with self._lock:
            return dict(self._market_overview)

    def set_news(self, news: list):
        with self._lock:
            self._news = news

    def get_news(self) -> list:
        with self._lock:
            return list(self._news)


_state = StateManager()


def get_state() -> StateManager:
    return _state
