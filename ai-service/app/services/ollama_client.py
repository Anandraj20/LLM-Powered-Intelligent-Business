from app.services.llm_client import llm_client, MultiProviderLLMClient

# Alias for backward compatibility
OllamaClient = MultiProviderLLMClient
ollama_client = llm_client
