from __future__ import annotations

import re
from pathlib import Path


class KnowledgeService:
    """
    Lightweight local RAG retriever.

    The service loads operational runbooks from backend/knowledge
    and retrieves the most relevant documents using token overlap.

    No external vector database is required.
    """

    KNOWLEDGE_DIR = (
        Path(__file__).resolve().parents[2] / "knowledge"
    )

    @staticmethod
    def _tokenize(text: str) -> set[str]:
        """
        Convert text into normalized tokens.
        """
        return {
            token
            for token in re.findall(
                r"[a-zA-Z0-9_]+",
                text.lower(),
            )
            if len(token) > 2
        }

    @classmethod
    def _load_documents(cls) -> list[dict]:
        """
        Load Markdown runbooks from the local knowledge base.
        """

        if not cls.KNOWLEDGE_DIR.exists():
            return []

        documents = []

        for path in sorted(
            cls.KNOWLEDGE_DIR.glob("*.md")
        ):
            try:
                content = path.read_text(
                    encoding="utf-8"
                )
            except OSError:
                continue

            documents.append(
                {
                    "source": path.name,
                    "content": content,
                }
            )

        return documents

    @classmethod
    def retrieve(
        cls,
        query: str,
        top_k: int = 3,
    ) -> list[dict]:
        """
        Retrieve the most relevant operational runbooks.
        """

        query_tokens = cls._tokenize(query)

        if not query_tokens:
            return []

        documents = cls._load_documents()

        ranked = []

        for document in documents:
            document_tokens = cls._tokenize(
                document["content"]
            )

            overlap = query_tokens & document_tokens

            if not overlap:
                continue

            # Basic normalized relevance score.
            score = len(overlap) / max(
                len(query_tokens),
                1,
            )

            ranked.append(
                {
                    "source": document["source"],
                    "content": document["content"],
                    "score": round(score, 4),
                    "matched_terms": sorted(overlap),
                }
            )

        ranked.sort(
            key=lambda item: item["score"],
            reverse=True,
        )

        return ranked[:top_k]

    @classmethod
    def retrieve_for_incident(
        cls,
        context: dict,
        top_k: int = 3,
    ) -> list[dict]:
        """
        Build a retrieval query from incident,
        telemetry and logs.
        """

        incident = context.get(
            "incident",
            {},
        )

        query_parts = [
            incident.get("title", ""),
            incident.get("description", ""),
            incident.get("severity", ""),
        ]

        for metric in context.get(
            "metrics",
            [],
        ):
            query_parts.extend(
                [
                    str(metric.get("name", "")),
                    str(metric.get("value", "")),
                ]
            )

        for log in context.get(
            "logs",
            [],
        ):
            query_parts.extend(
                [
                    str(log.get("level", "")),
                    str(log.get("message", "")),
                ]
            )

        query = " ".join(query_parts)

        return cls.retrieve(
            query,
            top_k=top_k,
        )
