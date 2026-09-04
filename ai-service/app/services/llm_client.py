import os
import httpx
import requests
import logging
import re
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger("businessmind.llm")

# Provider configs
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
DEFAULT_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:4b")
DEFAULT_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "qwen3-embedding:0.6b")

# Thread pool for running sync requests in async context
_executor = ThreadPoolExecutor(max_workers=4)


class MultiProviderLLMClient:
    def __init__(self):
        self.ollama_base_url = OLLAMA_BASE_URL
        # Separate light-weight client for health checks (fast, short timeout)
        self.http_client = httpx.AsyncClient(timeout=5.0)
        self.openai_quota_exhausted = False
        self.gemini_invalid_key = False

    def get_configured_provider(self) -> str:
        return os.getenv("LLM_PROVIDER", "ollama").lower()

    async def get_active_provider(self) -> str:
        """Determine the active LLM provider based on config and available keys/servers."""
        provider = self.get_configured_provider()

        # Check if local Ollama is responding
        ollama_online = False
        try:
            res = await self.http_client.get(f"{self.ollama_base_url}/api/tags", timeout=2.0)
            if res.status_code == 200:
                ollama_online = True
        except Exception:
            pass

        if provider == "ollama" and ollama_online:
            return "ollama"

        if ollama_online:
            return "ollama"

        if OPENAI_API_KEY and not self.openai_quota_exhausted:
            return "openai"

        if GEMINI_API_KEY and not self.gemini_invalid_key:
            return "gemini"

        return "contextual_synthesis"

    async def check_health(self) -> Dict[str, Any]:
        """Check status of all LLM providers."""
        ollama_status = {"online": False, "models": []}
        try:
            res = await self.http_client.get(f"{self.ollama_base_url}/api/tags", timeout=2.0)
            if res.status_code == 200:
                data = res.json()
                models = [m.get("name") for m in data.get("models", [])]
                ollama_status = {"online": True, "models": models}
        except Exception as e:
            logger.debug(f"Ollama health check: {e}")

        active = await self.get_active_provider()
        return {
            "online": bool(ollama_status["online"] or (OPENAI_API_KEY and not self.openai_quota_exhausted)),
            "active_provider": active,
            "providers": {
                "ollama": {
                    "online": ollama_status["online"],
                    "models": ollama_status["models"],
                    "target_model": DEFAULT_OLLAMA_MODEL
                },
                "openai": {
                    "configured": bool(OPENAI_API_KEY),
                    "model": OPENAI_MODEL,
                    "quota_exhausted": self.openai_quota_exhausted
                },
                "gemini": {
                    "configured": bool(GEMINI_API_KEY),
                    "model": GEMINI_MODEL
                }
            }
        }

    async def generate_chat(self, prompt: str, system_prompt: Optional[str] = None, model: Optional[str] = None) -> str:
        """
        Generate chat response across multi-LLM providers with automatic fallback cascade:
        1. Local Ollama (Qwen 3.5 / Qwen3 8B) - fast, local, GPU-accelerated
        2. OpenAI (if key valid and quota active)
        3. Gemini (if configured)
        4. Smart Contextual Synthesis fallback
        """
        provider = self.get_configured_provider()

        if provider == "openai" and OPENAI_API_KEY and not self.openai_quota_exhausted:
            provider_preference = ["openai", "ollama", "gemini"]
        elif provider == "gemini" and GEMINI_API_KEY and not self.gemini_invalid_key:
            provider_preference = ["gemini", "ollama", "openai"]
        else:
            provider_preference = ["ollama", "openai", "gemini"]

        for prov in provider_preference:
            if prov == "ollama":
                result = await self._call_ollama(prompt, system_prompt, model or DEFAULT_OLLAMA_MODEL)
                if result:
                    return result

            elif prov == "openai" and OPENAI_API_KEY and not self.openai_quota_exhausted:
                result = await self._call_openai(prompt, system_prompt, model or OPENAI_MODEL)
                if result:
                    return result

            elif prov == "gemini" and GEMINI_API_KEY and not self.gemini_invalid_key:
                result = await self._call_gemini(prompt, system_prompt, model or GEMINI_MODEL)
                if result:
                    return result

        return ""

    def _clean_response(self, text: str) -> str:
        """Remove reasoning tokens/tags like <think>...</think> from models."""
        if not text:
            return ""
        cleaned = re.sub(r'<think>[\s\S]*?</think>', '', text, flags=re.IGNORECASE).strip()
        return cleaned

    def _call_ollama_sync(self, payload: dict) -> str:
        """
        Synchronous Ollama call using requests with streaming to avoid httpx ReadTimeout.
        Streams tokens progressively so we don't wait for the full response before reading.
        """
        import json as _json
        url = f"{self.ollama_base_url}/api/chat"
        full_content = []
        try:
            with requests.post(url, json=payload, stream=True, timeout=90) as resp:
                if resp.status_code != 200:
                    logger.warning(f"Ollama returned status {resp.status_code}: {resp.text[:200]}")
                    return ""
                for line in resp.iter_lines():
                    if not line:
                        continue
                    try:
                        chunk = _json.loads(line)
                        token = chunk.get("message", {}).get("content", "")
                        if token:
                            full_content.append(token)
                        if chunk.get("done"):
                            break
                    except _json.JSONDecodeError:
                        continue
            return "".join(full_content)
        except requests.exceptions.Timeout:
            logger.warning("Ollama streaming request timed out after 90s")
            # Return whatever was accumulated before timeout
            partial = "".join(full_content)
            if partial.strip():
                logger.info(f"Returning partial Ollama response ({len(partial)} chars)")
                return partial
            return ""
        except Exception as e:
            logger.warning(f"Ollama sync call error: {e}")
            return ""

    async def _call_ollama(self, prompt: str, system_prompt: Optional[str] = None, model: str = DEFAULT_OLLAMA_MODEL) -> str:
        """Call local Ollama via streaming in a thread executor to prevent asyncio event loop blocking."""
        messages = []
        if system_prompt:
            # Append /no_think to disable Qwen3 thinking mode via prompt-level flag
            no_think_prompt = system_prompt if "/no_think" in system_prompt else system_prompt + " /no_think"
            messages.append({"role": "system", "content": no_think_prompt})
        else:
            messages.append({"role": "system", "content": "/no_think"})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "stream": True,   # Use streaming to avoid read-timeout on large responses
            "think": False,   # Disable thinking/reasoning mode — prevents 1000+ token <think> preambles
            "options": {
                "temperature": 0.1,
                "top_p": 0.9,
                "num_ctx": 2048,
                "num_predict": 450
            }
        }

        try:
            loop = asyncio.get_event_loop()
            content = await loop.run_in_executor(
                _executor,
                self._call_ollama_sync,
                payload
            )
            if content:
                cleaned = self._clean_response(content)
                logger.info(f"Ollama ({model}) generated {len(cleaned)} chars successfully")
                return cleaned
        except Exception as e:
            logger.warning(f"Ollama executor call error: {e}")

        return ""

    async def _call_openai(self, prompt: str, system_prompt: Optional[str] = None, model: str = OPENAI_MODEL) -> str:
        """Call OpenAI REST API."""
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            payload = {
                "model": model,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 512
            }

            response = await self.http_client.post(url, headers=headers, json=payload, timeout=12.0)
            if response.status_code == 200:
                data = response.json()
                choices = data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "").strip()
                    if content:
                        return self._clean_response(content)
            elif response.status_code == 429:
                self.openai_quota_exhausted = True
                logger.warning("OpenAI API quota exhausted (status 429).")
            else:
                logger.warning(f"OpenAI API error ({response.status_code}): {response.text}")
        except Exception as e:
            logger.warning(f"OpenAI API call failed: {e}")
        return ""

    async def _call_gemini(self, prompt: str, system_prompt: Optional[str] = None, model: str = GEMINI_MODEL) -> str:
        """Call Google Gemini REST API."""
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
            combined_prompt = f"System Instructions: {system_prompt}\n\nUser Question:\n{prompt}" if system_prompt else prompt
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": combined_prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "topP": 0.9,
                    "maxOutputTokens": 512
                }
            }

            response = await self.http_client.post(url, json=payload, timeout=12.0)
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "").strip()
                        if text:
                            return self._clean_response(text)
            else:
                self.gemini_invalid_key = True
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}")
        return ""

    async def get_embedding(self, text: str, model: str = DEFAULT_EMBED_MODEL) -> List[float]:
        """Generate text vector embeddings using Ollama /api/embed or fast vectorizer."""
        try:
            payload = {"model": model, "input": text}
            response = await self.http_client.post(f"{self.ollama_base_url}/api/embed", json=payload, timeout=6.0)
            if response.status_code == 200:
                data = response.json()
                embeddings = data.get("embeddings", [])
                if embeddings and len(embeddings) > 0:
                    return embeddings[0]
        except Exception:
            pass

        return self._fallback_text_to_vector(text)

    def _fallback_text_to_vector(self, text: str, dim: int = 384) -> List[float]:
        """Deterministic hash-based normalized pseudo-embedding when embedding model is offline."""
        import numpy as np
        vec = np.zeros(dim, dtype=np.float32)
        words = text.lower().split()
        for idx, word in enumerate(words):
            hash_val = hash(word)
            pos = abs(hash_val) % dim
            vec[pos] += (hash_val % 100) / 100.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()


llm_client = MultiProviderLLMClient()
