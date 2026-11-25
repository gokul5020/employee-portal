import asyncio
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..config import settings
from ..models import User
from ..services.ai_service import AssistantAIService

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

MAX_RESPONSE_BYTES = 64 * 1024


class AssistantQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=1200)


class AssistantAnswer(BaseModel):
    answer: str


class AssistantStatus(BaseModel):
    enabled: bool


def _assistant_is_configured() -> bool:
    if settings.AI_PROVIDER == "anthropic":
        return bool(settings.ANTHROPIC_AUTH_TOKEN or settings.ANTHROPIC_API_KEY)
    if settings.AI_PROVIDER == "openai":
        return bool(settings.AI_API_KEY)
    return False


def _request_answer(
    question: str,
    conversation_history: list = None,
    user_context: dict = None,
) -> str:
    """Build and send request to the AI provider with optional context"""
    context_parts = []

    if user_context:
        context_parts.append(
            f"\n--- Employee Context ---\n"
            f"Department: {user_context.get('department', 'General')}\n"
            f"Position: {user_context.get('position', 'Employee')}\n"
            f"Role: {user_context.get('role', 'employee')}\n"
            "Use this context to personalize the answer, but keep it professional "
            "and do not disclose sensitive data. Do not claim to know the employer's "
            "specific policies; always advise checking official handbooks."
        )
        context_parts.append(
            f"\n--- Conversation History ---\n"
        )
        # Include last 2 turns
        if conversation_history:
            for msg in conversation_history[-2:]:
                ctx_role = "You" if msg["role"] == "user" else "Assistant"
                context_parts.append(f"{ctx_role}: {msg['content']}")

    full_question = question
    if context_parts:
        full_question = question + "".join(context_parts)

    system_prompt = (
        "You are an employee self-service assistant. Give concise, practical "
        "general HR guidance. Do not claim to know this employer's policies; "
        "encourage the employee to check their handbook or contact HR for "
        "official answers. Do not make employment, legal, medical, payroll, "
        "or benefits decisions. Never ask for passwords, bank details, or "
        "other sensitive personal information. Personalize responses using "
        "provided context (department, position, role). Format with bullet "
        "points or numbered steps when helpful."
    )

    if settings.AI_PROVIDER == "anthropic":
        payload_data = {
            "model": settings.ANTHROPIC_MODEL,
            "system": system_prompt,
            "messages": [{"role": "user", "content": full_question}],
            "temperature": 0.3,
            "max_tokens": 900,
        }
        headers = {"Content-Type": "application/json", "anthropic-version": "2023-06-01"}
        if settings.ANTHROPIC_AUTH_TOKEN:
            headers["Authorization"] = f"Bearer {settings.ANTHROPIC_AUTH_TOKEN}"
        else:
            headers["x-api-key"] = settings.ANTHROPIC_API_KEY
        url = f"{settings.ANTHROPIC_BASE_URL.rstrip('/')}/v1/messages"
    elif settings.AI_PROVIDER == "openai":
        payload_data = {
            "model": settings.AI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_question},
            ],
            "temperature": 0.3,
            "max_tokens": 900,
        }
        headers = {
            "Authorization": f"Bearer {settings.AI_API_KEY}",
            "Content-Type": "application/json",
        }
        url = settings.AI_API_URL
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The configured AI provider is not supported.",
        )

    request = Request(
        url,
        data=json.dumps(payload_data).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urlopen(request, timeout=30) as response:
            response_body = response.read(MAX_RESPONSE_BYTES + 1)
        if len(response_body) > MAX_RESPONSE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI provider returned an oversized response.",
            )
        result = json.loads(response_body)
    except HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"The AI provider request failed (HTTP {exc.code}).",
        ) from exc
    except URLError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI provider could not be reached. Please try again later.",
        ) from exc
    except TimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The AI provider took too long to respond. Please try again.",
        ) from exc
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI provider returned an invalid response.",
        ) from exc

    try:
        if settings.AI_PROVIDER == "anthropic":
            answer = "\n".join(
                block["text"]
                for block in result["content"]
                if block.get("type") == "text" and isinstance(block.get("text"), str)
            )
        else:
            answer = result["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError, AttributeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI provider returned an unexpected response.",
        ) from exc

    if not isinstance(answer, str) or not answer.strip():
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI provider returned an empty response.",
        )
    return answer.strip()


@router.get("/status", response_model=AssistantStatus)
async def get_assistant_status(current_user: User = Depends(get_current_user)):
    return {"enabled": _assistant_is_configured()}


@router.post("/ask", response_model=AssistantAnswer)
async def ask_assistant(
    request: AssistantQuestion,
    current_user: User = Depends(get_current_user),
    # We pass user_context as a dict derived from the current_user
):
    if not _assistant_is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI assistant is not configured. Ask your administrator to configure the provider.",
        )

    question = request.question.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Enter a question before sending.",
        )

    user_context = {
        "department": current_user.department,
        "position": current_user.position,
        "role": current_user.role,
    }

    # Ask with context and conversation history managed in frontend
    conversation_history: list = getattr(
        request, "conversation_history", []
    )  # will be passed if we add it

    answer = await asyncio.to_thread(
        _request_answer,
        question,
        conversation_history,
        user_context,
    )
    return {"answer": answer}