import asyncio
import json
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

from fastapi import HTTPException

from app.config import settings
from app.routes.assistant import (
    MAX_RESPONSE_BYTES,
    AssistantQuestion,
    _request_answer,
    ask_assistant,
)


class MockResponse:
    def __init__(self, content: bytes):
        self.content = content

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self, _size: int) -> bytes:
        return self.content


class AssistantProviderTests(unittest.TestCase):
    def test_unconfigured_assistant_returns_service_unavailable(self):
        with (
            patch.object(settings, "AI_API_KEY", ""),
            patch("app.routes.assistant.urlopen") as mocked_urlopen,
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(ask_assistant(AssistantQuestion(question="General question"), object()))

        self.assertEqual(raised.exception.status_code, 503)
        mocked_urlopen.assert_not_called()

    def test_sends_only_question_and_returns_provider_answer(self):
        provider_response = json.dumps({
            "choices": [{"message": {"content": "Check your employee handbook."}}],
        }).encode()
        with (
            patch.object(settings, "AI_API_URL", "https://provider.example/v1/chat/completions"),
            patch.object(settings, "AI_API_KEY", "test-key"),
            patch.object(settings, "AI_MODEL", "test-model"),
            patch("app.routes.assistant.urlopen", return_value=MockResponse(provider_response)) as mocked_urlopen,
        ):
            answer = _request_answer("How do I request leave?")

        self.assertEqual(answer, "Check your employee handbook.")
        request = mocked_urlopen.call_args.args[0]
        body = json.loads(request.data)
        self.assertEqual(body["model"], "test-model")
        self.assertEqual(body["messages"][-1], {"role": "user", "content": "How do I request leave?"})
        self.assertEqual(len(body["messages"]), 2)

    def test_provider_error_does_not_expose_provider_body(self):
        provider_error = HTTPError(
            "https://provider.example",
            429,
            "rate limit",
            None,
            None,
        )
        with (
            patch.object(settings, "AI_API_URL", "https://provider.example/v1/chat/completions"),
            patch.object(settings, "AI_API_KEY", "test-key"),
            patch.object(settings, "AI_MODEL", "test-model"),
            patch("app.routes.assistant.urlopen", side_effect=provider_error),
        ):
            with self.assertRaises(HTTPException) as raised:
                _request_answer("Question")

        self.assertEqual(raised.exception.status_code, 502)
        self.assertNotIn("provider.example", raised.exception.detail)

    def test_oversized_provider_response_is_rejected(self):
        with (
            patch.object(settings, "AI_API_URL", "https://provider.example/v1/chat/completions"),
            patch.object(settings, "AI_API_KEY", "test-key"),
            patch.object(settings, "AI_MODEL", "test-model"),
            patch(
                "app.routes.assistant.urlopen",
                return_value=MockResponse(b"x" * (MAX_RESPONSE_BYTES + 1)),
            ),
        ):
            with self.assertRaises(HTTPException) as raised:
                _request_answer("Question")

        self.assertEqual(raised.exception.status_code, 502)


if __name__ == "__main__":
    unittest.main()
