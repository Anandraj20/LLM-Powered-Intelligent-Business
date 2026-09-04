"""
MySQL async database client for BusinessMind AI service.
Connects to businessmind_db for live business intelligence queries.
"""

import os
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("businessmind.mysql")

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "Anand@2005")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "businessmind_db")

# Try importing aiomysql (async) with fallback to PyMySQL (sync)
try:
    import aiomysql
    AIOMYSQL_AVAILABLE = True
except ImportError:
    AIOMYSQL_AVAILABLE = False
    logger.warning("[MySQL] aiomysql not available, will try PyMySQL sync fallback")

try:
    import pymysql
    import pymysql.cursors
    PYMYSQL_AVAILABLE = True
except ImportError:
    PYMYSQL_AVAILABLE = False
    logger.warning("[MySQL] PyMySQL not available either. SQL queries will use hardcoded snapshot.")


class MySQLClient:
    def __init__(self):
        self._pool = None
        self._connected = False

    async def init_pool(self):
        """Initialize async aiomysql connection pool."""
        if not AIOMYSQL_AVAILABLE:
            logger.info("[MySQL] Skipping async pool init — aiomysql not installed.")
            return
        try:
            self._pool = await aiomysql.create_pool(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                db=MYSQL_DATABASE,
                autocommit=True,
                minsize=1,
                maxsize=5
            )
            self._connected = True
            logger.info(f"[MySQL] Async pool connected → {MYSQL_DATABASE} @ {MYSQL_HOST}:{MYSQL_PORT}")
        except Exception as e:
            logger.warning(f"[MySQL] Async pool init failed: {e}. Using sync fallback.")
            self._connected = False

    def _sync_query(self, sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Fallback: synchronous PyMySQL query."""
        if not PYMYSQL_AVAILABLE:
            return []
        try:
            conn = pymysql.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                database=MYSQL_DATABASE,
                charset="utf8mb4",
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )
            with conn:
                with conn.cursor() as cursor:
                    cursor.execute(sql, params)
                    return cursor.fetchall()
        except Exception as e:
            logger.error(f"[MySQL Sync Query Error]: {e}")
            return []

    async def query(self, sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Execute a SELECT query and return list of row dicts."""
        # Try async pool first
        if AIOMYSQL_AVAILABLE and self._pool:
            try:
                async with self._pool.acquire() as conn:
                    async with conn.cursor(aiomysql.DictCursor) as cur:
                        await cur.execute(sql, params)
                        return await cur.fetchall()
            except Exception as e:
                logger.error(f"[MySQL Async Query Error]: {e}")

        # Fallback to sync PyMySQL
        return self._sync_query(sql, params)

    async def query_one(self, sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        """Execute a query and return single row dict or None."""
        rows = await self.query(sql, params)
        return rows[0] if rows else None

    async def execute(self, sql: str, params: tuple = ()) -> int:
        """Execute an INSERT/UPDATE/DELETE statement."""
        if AIOMYSQL_AVAILABLE and self._pool:
            try:
                async with self._pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        affected = await cur.execute(sql, params)
                        return affected
            except Exception as e:
                logger.error(f"[MySQL Async Execute Error]: {e}")
        
        if PYMYSQL_AVAILABLE:
            try:
                conn = pymysql.connect(
                    host=MYSQL_HOST,
                    port=MYSQL_PORT,
                    user=MYSQL_USER,
                    password=MYSQL_PASSWORD,
                    database=MYSQL_DATABASE,
                    charset="utf8mb4",
                    autocommit=True,
                    connect_timeout=5
                )
                with conn:
                    with conn.cursor() as cursor:
                        return cursor.execute(sql, params)
            except Exception as e:
                logger.error(f"[MySQL Sync Execute Error]: {e}")
        return 0

    async def check_connection(self) -> bool:
        """Verify database connectivity."""
        try:
            res = await self.query_one("SELECT 1 as ping")
            return bool(res and res.get("ping") == 1)
        except Exception:
            return False

    @property
    def is_connected(self) -> bool:
        return self._connected or PYMYSQL_AVAILABLE

    async def close(self):
        if self._pool:
            self._pool.close()
            await self._pool.wait_closed()
            logger.info("[MySQL] Connection pool closed.")


mysql_client = MySQLClient()
