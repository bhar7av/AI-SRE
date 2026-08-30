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

        The LLM is used for analysis only.
        It does not directly execute remediation actions.
        """

        token = os.getenv("HF_TOKEN")

        if not token:
            raise RuntimeError(
                "HF_TOKEN is not configured."
            )

        client = InferenceClient(
            api_key=token
        )

        prompt = f"""
You are an expert Site Reliability Engineer.

Analyze this production incident.

Task:
{context.get("task", "incident_analysis")}

Use ONLY the evidence provided below.

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
- requires_human_approval must be true for remediation.
- Do NOT return Markdown.
- Do NOT return headings.
- Do NOT return ```json.
- Do NOT explain your answer.
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
            # Keep the original error visible to the caller.
            # RemediationService can provide a safe fallback.
            raise RuntimeError(
                f"LLM request failed: {exc}"
            ) from exc

        text = response.choices[0].message.content

        if not text:
            raise RuntimeError(
                "LLM returned an empty response."
            )

        text = text.strip()

        # Remove Markdown fences if the model ignores instructions.
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

        # First attempt: direct JSON.
        try:
            result = json.loads(text)

        except json.JSONDecodeError:

            # Second attempt:
            # extract the first JSON object.
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

        missing = required_fields - result.keys()

        if missing:
            raise RuntimeError(
                "LLM response missing fields: "
                f"{sorted(missing)}"
            )

        return result