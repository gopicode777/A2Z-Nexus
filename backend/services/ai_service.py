"""
Abstract AI service layer.

Supports:
  - openai   → OpenAI Chat Completions API
  - anthropic → Anthropic Messages API
  - watsonx   → IBM watsonx.ai (via REST)
  - groq      → Groq API via OpenAI-compatible API
  - mock      → Deterministic offline responses for development/testing

Select the provider via AI_PROVIDER in .env.
Never expose credentials outside this module.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class Message:
    """A single chat message."""

    def __init__(self, role: str, content: str) -> None:
        self.role = role
        self.content = content

    def to_dict(self) -> dict[str, str]:
        return {"role": self.role, "content": self.content}


class AIResponse:
    """Normalized response from any AI provider."""

    def __init__(
        self,
        content: str,
        model: str,
        provider: str,
        usage: dict[str, int] | None = None,
    ) -> None:
        self.content = content
        self.model = model
        self.provider = provider
        self.usage = usage or {}


class BaseAIProvider(ABC):
    """All provider adapters implement this interface."""

    @abstractmethod
    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AIResponse:
        ...

    @abstractmethod
    def is_available(self) -> bool:
        ...


# ---------------------------------------------------------------------------
# Mock provider  (development / testing, no external calls)
# ---------------------------------------------------------------------------

class MockAIProvider(BaseAIProvider):
    """Returns deterministic responses for offline development."""

    def is_available(self) -> bool:
        return True

    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AIResponse:
        last_user = next(
            (m.content for m in reversed(messages) if m.role == "user"),
            "",
        )

        content = self._mock_response(last_user)

        return AIResponse(
            content=content,
            model="mock",
            provider="mock",
        )

    def _mock_response(self, user_message: str) -> str:
        msg = user_message.lower()

        if any(w in msg for w in ["analyze", "analysis", "project", "code"]):
            return (
                "**[Mock — Code Analysis]**\n\n"
                "This is a mock analysis response.\n"
                "- Project structure: detected\n"
                "- Languages: Python, TypeScript\n"
                "- Issues found: 0 (mock)\n\n"
                "_Set AI_PROVIDER=openai or AI_PROVIDER=anthropic for real analysis._"
            )

        if any(w in msg for w in ["test", "testing", "pytest"]):
            return (
                "**[Mock — Testing]**\n\n"
                "Mock test report: 5 tests detected, 5 passed.\n\n"
                "_Set AI_PROVIDER to a real provider for actual test execution._"
            )

        if any(w in msg for w in ["recommend", "improve", "better"]):
            return (
                "**[Mock — Recommendations]**\n\n"
                "Mock recommendations:\n"
                "- HIGH: Add unit tests\n"
                "- MEDIUM: Improve documentation\n"
                "- LOW: Add input validation\n\n"
                "_Set AI_PROVIDER to a real provider for project-specific recommendations._"
            )

        if any(w in msg for w in ["readme", "doc", "documentation"]):
            return (
                "**[Mock — Documentation]**\n\n"
                "# Project Name\n\n"
                "A mock README was generated.\n\n"
                "## Setup\n\n"
                "```bash\n"
                "npm install\n"
                "```\n\n"
                "_Set AI_PROVIDER to a real provider for real documentation._"
            )

        if any(w in msg for w in ["reminder", "deadline", "submit", "friday"]):
            return (
                "**[Mock — Reminder]**\n\n"
                "I detected a deadline in your message. "
                "Would you like me to create a reminder?\n\n"
                "_Set AI_PROVIDER to a real provider for intelligent deadline detection._"
            )

        return (
            f"**[Mock AI Response]**\n\n"
            f"You said: *\"{user_message[:200]}\"*\n\n"
            f"This is a mock response. The AI Orchestrator will route your request "
            f"to the appropriate specialized agent once the orchestrator is connected (Phase 13).\n\n"
            f"Set `AI_PROVIDER=openai` (or `anthropic` / `watsonx` / `groq`) in `.env` "
            f"and provide an API key for real AI responses."
        )


# ---------------------------------------------------------------------------
# OpenAI provider
# ---------------------------------------------------------------------------

class OpenAIProvider(BaseAIProvider):
    """OpenAI Chat Completions."""

    def __init__(self) -> None:
        self._client: Any = None

    def _get_client(self) -> Any:
        if self._client is None:
            try:
                from openai import AsyncOpenAI  # type: ignore[import]

                self._client = AsyncOpenAI(
                    api_key=settings.AI_API_KEY
                )

            except ImportError:
                raise RuntimeError("openai package not installed.")

        return self._client

    def is_available(self) -> bool:
        return bool(settings.AI_API_KEY)

    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AIResponse:

        client = self._get_client()

        openai_messages = []

        if system_prompt:
            openai_messages.append(
                {
                    "role": "system",
                    "content": system_prompt,
                }
            )

        openai_messages.extend(
            [m.to_dict() for m in messages]
        )

        response = await client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=openai_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        content = response.choices[0].message.content or ""

        usage = {
            "prompt_tokens": (
                response.usage.prompt_tokens
                if response.usage
                else 0
            ),
            "completion_tokens": (
                response.usage.completion_tokens
                if response.usage
                else 0
            ),
        }

        return AIResponse(
            content=content,
            model=settings.AI_MODEL,
            provider="openai",
            usage=usage,
        )


# ---------------------------------------------------------------------------
# Groq provider
# ---------------------------------------------------------------------------

class GroqProvider(BaseAIProvider):
    """
    Groq Chat Completions API.

    Groq provides an OpenAI-compatible API, so the existing
    openai package can be used with Groq's base URL.
    """

    GROQ_BASE_URL = "https://api.groq.com/openai/v1"

    def __init__(self) -> None:
        self._client: Any = None

    def _get_client(self) -> Any:
        if self._client is None:
            try:
                from openai import AsyncOpenAI  # type: ignore[import]

                self._client = AsyncOpenAI(
                    api_key=settings.AI_API_KEY,
                    base_url=self.GROQ_BASE_URL,
                )

            except ImportError:
                raise RuntimeError("openai package not installed.")

        return self._client

    def is_available(self) -> bool:
        return bool(settings.AI_API_KEY)

    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AIResponse:

        client = self._get_client()

        groq_messages = []

        if system_prompt:
            groq_messages.append(
                {
                    "role": "system",
                    "content": system_prompt,
                }
            )

        groq_messages.extend(
            [m.to_dict() for m in messages]
        )

        response = await client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=groq_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        content = response.choices[0].message.content or ""

        usage = {
            "prompt_tokens": (
                response.usage.prompt_tokens
                if response.usage
                else 0
            ),
            "completion_tokens": (
                response.usage.completion_tokens
                if response.usage
                else 0
            ),
        }

        return AIResponse(
            content=content,
            model=settings.AI_MODEL,
            provider="groq",
            usage=usage,
        )


# ---------------------------------------------------------------------------
# Anthropic provider
# ---------------------------------------------------------------------------

class AnthropicProvider(BaseAIProvider):
    """Anthropic Claude."""

    def __init__(self) -> None:
        self._client: Any = None

    def _get_client(self) -> Any:
        if self._client is None:
            try:
                import anthropic as _anthropic  # type: ignore[import]

                self._client = _anthropic.AsyncAnthropic(
                    api_key=settings.AI_API_KEY
                )

            except ImportError:
                raise RuntimeError(
                    "anthropic package not installed."
                )

        return self._client

    def is_available(self) -> bool:
        return bool(settings.AI_API_KEY)

    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AIResponse:

        client = self._get_client()

        anthropic_messages = [
            m.to_dict()
            for m in messages
            if m.role != "system"
        ]

        kwargs: dict[str, Any] = dict(
            model=settings.AI_MODEL,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=anthropic_messages,
        )

        if system_prompt:
            kwargs["system"] = system_prompt

        response = await client.messages.create(
            **kwargs
        )

        content = (
            response.content[0].text
            if response.content
            else ""
        )

        return AIResponse(
            content=content,
            model=settings.AI_MODEL,
            provider="anthropic",
        )


# ---------------------------------------------------------------------------
# WatsonX provider  (IBM watsonx.ai REST API)
# ---------------------------------------------------------------------------

class WatsonXProvider(BaseAIProvider):
    """IBM watsonx.ai text generation via REST API."""

    def is_available(self) -> bool:
        return bool(
            settings.AI_API_KEY
            and settings.WATSONX_PROJECT_ID
        )

    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AIResponse:

        import httpx

        parts: list[str] = []

        if system_prompt:
            parts.append(
                f"[SYSTEM]\n{system_prompt}\n"
            )

        for m in messages:
            prefix = (
                "User:"
                if m.role == "user"
                else "Assistant:"
            )

            parts.append(
                f"{prefix} {m.content}"
            )

        parts.append("Assistant:")

        prompt = "\n".join(parts)

        model_id = (
            settings.AI_MODEL
            or "ibm/granite-13b-chat-v2"
        )

        url = (
            f"{settings.WATSONX_URL}"
            "/ml/v1/text/generation"
            "?version=2023-05-29"
        )

        headers = {
            "Authorization": (
                f"Bearer {settings.AI_API_KEY}"
            ),
            "Content-Type": "application/json",
        }

        payload = {
            "model_id": model_id,
            "input": prompt,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": temperature,
            },
            "project_id": settings.WATSONX_PROJECT_ID,
        }

        async with httpx.AsyncClient(
            timeout=60
        ) as client:

            resp = await client.post(
                url,
                json=payload,
                headers=headers,
            )

            resp.raise_for_status()

            data = resp.json()

        content = (
            data.get("results", [{}])[0]
            .get("generated_text", "")
        )

        return AIResponse(
            content=content.strip(),
            model=model_id,
            provider="watsonx",
        )


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

def get_ai_provider() -> BaseAIProvider:
    """Return the configured AI provider instance."""

    provider = settings.AI_PROVIDER.lower()

    if provider == "openai":
        p = OpenAIProvider()

    elif provider == "groq":
        p = GroqProvider()

    elif provider == "anthropic":
        p = AnthropicProvider()

    elif provider == "watsonx":
        p = WatsonXProvider()

    else:
        p = MockAIProvider()

    # Preserve existing fallback behavior.
    if (
        not isinstance(p, MockAIProvider)
        and not p.is_available()
    ):
        logger.warning(
            "AI provider '%s' selected but API key/config is missing. "
            "Falling back to mock.",
            provider,
        )

        return MockAIProvider()

    logger.info(
        "AI provider: %s",
        provider,
    )

    return p


# ---------------------------------------------------------------------------
# Singleton — one instance per process
# ---------------------------------------------------------------------------

_provider: BaseAIProvider | None = None


def ai_provider() -> BaseAIProvider:
    global _provider

    if _provider is None:
        _provider = get_ai_provider()

    return _provider