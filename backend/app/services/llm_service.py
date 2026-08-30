import json
import os
import re

from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()


class LLMService:
    MODEL = "deepseek-ai/DeepSeek-V3-0324"

    @staticmethod
    def analyze(context: dict) -> dict:
        """
        Analyze an incident using the configured Hugging Face LLM.

        The LLM only performs analysis.
        It does not approve or execute remediation.
        """

        token = os.getenv("HF_TOKEN")

        if not token:
            raise RuntimeError("HF_TOKEN is not configured.")

        client = InferenceClient(
            api_key=token
        )

        prompt = f"""
You are an expert Site Reliability Engineer.

Analyze the following production incident.

Use ONLY the evidence provided in the incident context.

Do not invent:
- metrics
- logs
- deployments
- infrastructure
- commands
- system details

Return ONE valid JSON object.

The JSON MUST contain exactly these fields:

{{
    "root_cause": "string",
    "confidence": 0,
    "evidence": ["string"],
    "impact": "string",
    "recommendation": "string",
    "requires_human_approval": true
}}

Rules:

- confidence must be an integer from 0 to 100.
- evidence must contain only facts from the provided context.
- requires_human_approval must always be true.
- Do not return Markdown.
- Do not return headings.
- Do not return code fences.
- Do not explain your answer.
- Return JSON only.

Incident context:

{json.dumps(context, indent=2, default=str)}
"""

        try:
            response = client.chat.completions.create(
                model=LLMService.MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an SRE incident analysis assistant. "
                            "Return ONLY valid JSON. "
                            "Never return Markdown."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                max_tokens=700,
                temperature=0.0,
            )

        except Exception as exc:
            raise RuntimeError(
                f"LLM request failed: {exc}"
            ) from exc

        if not response.choices:
            raise RuntimeError(
                "LLM returned no choices."
            )

        message = response.choices[0].message
        text = message.content

        if not text:
            raise RuntimeError(
                "LLM returned an empty response."
            )

        # Hugging Face responses can occasionally contain
        # surrounding whitespace or Markdown fences.
        text = text.strip()

        text = re.sub(
            r"^```(?:json)?\s*",
            "",
            text,
            flags=re.IGNORECASE,
        )

        text = re.sub(
            r"\s*```$",
            "",
            text,
        )

        text = text.strip()

        # First attempt: direct JSON parsing.
        try:
            result = json.loads(text)

        except json.JSONDecodeError:

            # Second attempt: locate the first JSON object.
            start = text.find("{")
            end = text.rfind("}")

            if start == -1 or end == -1 or end <= start:
                raise RuntimeError(
                    "LLM returned invalid JSON.\n"
                    f"Raw response:\n{text}"
                )

            json_text = text[start:end + 1]

            try:
                result = json.loads(json_text)

            except json.JSONDecodeError as exc:
                raise RuntimeError(
                    "LLM returned invalid JSON.\n"
                    f"Raw response:\n{text}"
                ) from exc

        if not isinstance(result, dict):
            raise RuntimeError(
                "LLM response must be a JSON object."
            )

        required_fields = {
            "root_cause",
            "confidence",
            "evidence",
            "impact",
            "recommendation",
            "requires_human_approval",
        }

        missing = required_fields - set(result.keys())

        if missing:
            raise RuntimeError(
                "LLM response missing fields: "
                f"{sorted(missing)}"
            )

        # Normalize confidence.
        try:
            result["confidence"] = int(result["confidence"])
        except (TypeError, ValueError):
            result["confidence"] = 0

        result["confidence"] = max(
            0,
            min(100, result["confidence"])
        )

        # Ensure evidence is always a list.
        if not isinstance(result["evidence"], list):
            result["evidence"] = [
                str(result["evidence"])
            ]

        # Safety invariant:
        # remediation always requires human approval.
        result["requires_human_approval"] = True

        return result