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
        Analyze a production incident using:

        1. Live incident evidence
        2. Telemetry
        3. Logs
        4. Retrieved operational knowledge (RAG)

        The LLM only performs analysis.
        It does not approve or execute remediation.
        """

        token = os.getenv("HF_TOKEN")

        if not token:
            raise RuntimeError(
                "HF_TOKEN is not configured."
            )

        client = InferenceClient(
            api_key=token
        )

        # ---------------------------------------------------------
        # Separate live evidence from retrieved knowledge
        # ---------------------------------------------------------

        incident_evidence = {
            "incident": context.get(
                "incident",
                {}
            ),
            "metrics": context.get(
                "metrics",
                []
            ),
            "logs": context.get(
                "logs",
                []
            ),
        }

        knowledge = context.get(
            "knowledge",
            []
        )

        # ---------------------------------------------------------
        # Prepare RAG knowledge
        # ---------------------------------------------------------

        retrieved_knowledge = []

        for item in knowledge:
            retrieved_knowledge.append(
                {
                    "source": item.get(
                        "source",
                        "unknown"
                    ),
                    "score": item.get(
                        "score",
                        0
                    ),
                    "content": item.get(
                        "content",
                        ""
                    ),
                }
            )

        # ---------------------------------------------------------
        # Prompt
        # ---------------------------------------------------------

        prompt = f"""
You are an expert Site Reliability Engineer.

Analyze the following production incident.

You have two types of information:

1. INCIDENT EVIDENCE
   - This contains the actual current incident data.
   - This information is authoritative for the incident.

2. RETRIEVED OPERATIONAL KNOWLEDGE
   - This comes from internal SRE runbooks.
   - It provides general operational guidance.
   - It must NOT be treated as evidence that an event actually
     occurred in this incident.

Use the retrieved knowledge to improve your reasoning and
recommendations.

Use ONLY the provided incident evidence when describing facts
about the current incident.

Do not invent:
- metrics
- logs
- deployments
- infrastructure
- commands
- system details
- events
- errors
- dependencies
- causes not supported by the evidence

If the exact root cause cannot be proven from the evidence,
state the most likely cause and keep the confidence appropriately
low.

Return ONE valid JSON object.

The JSON MUST contain exactly these fields:

{{
    "root_cause": "string",
    "confidence": 0,
    "evidence": ["string"],
    "impact": "string",
    "recommendation": "string",
    "requires_human_approval": true,
    "knowledge_sources": ["string"]
}}

Rules:

- confidence must be an integer from 0 to 100.
- evidence must contain ONLY facts supported by INCIDENT EVIDENCE.
- recommendations may use RETRIEVED OPERATIONAL KNOWLEDGE.
- root_cause must be based on the available incident evidence.
- impact must be based on the available incident evidence.
- knowledge_sources must contain the filenames of the retrieved
  runbooks used for the recommendation.
- requires_human_approval must ALWAYS be true.
- Do not return Markdown.
- Do not return headings.
- Do not return code fences.
- Do not explain your answer.
- Return JSON only.

============================================================
INCIDENT EVIDENCE
============================================================

{json.dumps(
    incident_evidence,
    indent=2,
    default=str
)}

============================================================
RETRIEVED OPERATIONAL KNOWLEDGE
============================================================

{json.dumps(
    retrieved_knowledge,
    indent=2,
    default=str
)}
"""

        # ---------------------------------------------------------
        # Call Hugging Face
        # ---------------------------------------------------------

        try:
            response = client.chat.completions.create(
                model=LLMService.MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an SRE incident analysis "
                            "assistant. "
                            "Use incident evidence as the "
                            "authoritative source of facts. "
                            "Use retrieved runbooks as guidance. "
                            "Return ONLY valid JSON. "
                            "Never return Markdown."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                max_tokens=900,
                temperature=0.0,
            )

        except Exception as exc:
            raise RuntimeError(
                f"LLM request failed: {exc}"
            ) from exc

        # ---------------------------------------------------------
        # Validate response
        # ---------------------------------------------------------

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

        text = text.strip()

        # ---------------------------------------------------------
        # Remove Markdown fences if model ignores instructions
        # ---------------------------------------------------------

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

        # ---------------------------------------------------------
        # Parse JSON
        # ---------------------------------------------------------

        try:
            result = json.loads(text)

        except json.JSONDecodeError:

            # Attempt to locate JSON object inside response.
            start = text.find("{")
            end = text.rfind("}")

            if (
                start == -1
                or end == -1
                or end <= start
            ):
                raise RuntimeError(
                    "LLM returned invalid JSON.\n"
                    f"Raw response:\n{text}"
                )

            json_text = text[
                start:end + 1
            ]

            try:
                result = json.loads(
                    json_text
                )

            except json.JSONDecodeError as exc:
                raise RuntimeError(
                    "LLM returned invalid JSON.\n"
                    f"Raw response:\n{text}"
                ) from exc

        # ---------------------------------------------------------
        # Validate JSON object
        # ---------------------------------------------------------

        if not isinstance(
            result,
            dict
        ):
            raise RuntimeError(
                "LLM response must be a JSON object."
            )

        # ---------------------------------------------------------
        # Required fields
        # ---------------------------------------------------------

        required_fields = {
            "root_cause",
            "confidence",
            "evidence",
            "impact",
            "recommendation",
            "requires_human_approval",
            "knowledge_sources",
        }

        missing = (
            required_fields
            - set(result.keys())
        )

        if missing:
            raise RuntimeError(
                "LLM response missing fields: "
                f"{sorted(missing)}"
            )

        # ---------------------------------------------------------
        # Normalize confidence
        # ---------------------------------------------------------

        try:
            result["confidence"] = int(
                result["confidence"]
            )

        except (
            TypeError,
            ValueError,
        ):
            result["confidence"] = 0

        result["confidence"] = max(
            0,
            min(
                100,
                result["confidence"]
            )
        )

        # ---------------------------------------------------------
        # Normalize evidence
        # ---------------------------------------------------------

        if not isinstance(
            result["evidence"],
            list,
        ):
            result["evidence"] = [
                str(
                    result["evidence"]
                )
            ]

        result["evidence"] = [
            str(item)
            for item in result["evidence"]
        ]

        # ---------------------------------------------------------
        # Normalize knowledge sources
        # ---------------------------------------------------------

        if not isinstance(
            result["knowledge_sources"],
            list,
        ):
            result["knowledge_sources"] = [
                str(
                    result["knowledge_sources"]
                )
            ]

        result["knowledge_sources"] = [
            str(item)
            for item in result[
                "knowledge_sources"
            ]
        ]

        # ---------------------------------------------------------
        # Safety invariant
        # ---------------------------------------------------------

        # The LLM NEVER gets authority to approve remediation.
        # The application always requires human approval.
        result[
            "requires_human_approval"
        ] = True

        # ---------------------------------------------------------
        # Return validated analysis
        # ---------------------------------------------------------

        return result