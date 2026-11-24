import asyncio
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..config import settings
from ..models import User

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

MAX_RESPONSE_BYTES = 64 * 1024


class AssistantQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=1200)


class AssistantAnswer(BaseModel):
    answer: str


class AssistantStatus(BaseModel):
    enabled: bool


@router.get("/status", response_model=AssistantStatus)
async def get_assistant_status(current_user: User = Depends(get_current_user)):
    return {"enabled": bool(settings.AI_API_KEY)}


def _request_answer(question: str) -> str:
    payload = json.dumps({
        "model": settings.AI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an employee self-service assistant. Give concise, practical "
                    "general HR guidance. Do not claim to know this employer's policies; "
                    "encourage the employee to check their handbook or contact HR for "
                    "official answers. Do not make employment, legal, medical, payroll, "
                    "or benefits decisions. Never ask for passwords, bank details, or "
                    "other sensitive personal information."
                ),
            },
            {"role": "user", "content": question},
        ],
        "temperature": 0.3,
        "max_tokens": 700,
    }).encode("utf-8")
    request = Request(
        settings.AI_API_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {settings.AI_API_KEY}",
            "Content-Type": "application/json",
        },
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
        answer = result["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
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


@router.post("/ask", response_model=AssistantAnswer)
async def ask_assistant(
    request: AssistantQuestion,
    current_user: User = Depends(get_current_user),
):
    if not settings.AI_API_KEY:
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

    answer = await asyncio.to_thread(_request_answer, question)
    return {"answer": answer}
