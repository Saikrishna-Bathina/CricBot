"""Answer service coordinating retrieval, LLM synthesis, and claim-level verification."""

import time
from typing import Any, Dict, List, Optional
from app.retrieval.retriever import get_hybrid_retriever
from app.generation.gemini_client import GeminiClient
from app.generation.prompts import ANSWER_SYSTEM_PROMPT, SCENARIO_SYSTEM_PROMPT
from app.generation.schemas import AnswerResponse, ScenarioAnalysisResponse, ClaimModel
from app.citations.validator import get_citation_validator
from app.core.logging import logger


class AnswerService:
    def __init__(self):
        self.retriever = get_hybrid_retriever()
        self.gemini_client = GeminiClient()
        self.citation_validator = get_citation_validator()

    def _format_evidence_context(self, chunks: List[Dict[str, Any]]) -> str:
        blocks = []
        for c in chunks:
            cid = str(c.get("id") or c.get("_id"))
            blocks.append(
                f"[CHUNK_ID: {cid}]\n"
                f"Law: {c.get('parentLaw')} | Clause: {c.get('clauseNumber')} - {c.get('title')}\n"
                f"Format: {c.get('format')} | Competition: {c.get('competition')}\n"
                f"Content: {c.get('content')}\n"
            )
        return "\n---\n".join(blocks)

    async def answer_question(
        self,
        query: str,
        format_filter: Optional[str] = None,
        competition_filter: Optional[str] = None,
    ) -> AnswerResponse:
        """Retrieves verified law evidence, prompts the LLM, and verifies claim citations."""
        start_time = time.time()

        # 1. Hybrid Retrieval
        retrieval_res = await self.retriever.retrieve(
            query=query,
            format_filter=format_filter,
            competition_filter=competition_filter,
            limit=7,
        )
        chunks = retrieval_res.get("chunks", [])

        if not chunks:
            return AnswerResponse(
                status="insufficient_evidence",
                answer="No official cricket laws or playing conditions were found in the knowledge base matching this question.",
                limitations=["Knowledge base contains no matching approved clauses."],
                diagnostics={"retrievalLatencyMs": round((time.time() - start_time) * 1000, 2)},
            )

        evidence_text = self._format_evidence_context(chunks)
        user_prompt = f"USER QUESTION:\n{query}\n\nRETRIEVED OFFICIAL EVIDENCE:\n{evidence_text}"

        # 2. LLM Call
        llm_json = await self.gemini_client.generate_json(ANSWER_SYSTEM_PROMPT, user_prompt)

        # 3. Fallback if LLM unavailable
        if not llm_json:
            primary_chunk = chunks[0]
            cid = str(primary_chunk.get("id") or primary_chunk.get("_id"))
            llm_json = {
                "status": "answered",
                "answer": f"According to {primary_chunk.get('parentLaw')}, {primary_chunk.get('clauseNumber')} ({primary_chunk.get('title')}): {primary_chunk.get('content')}",
                "claims": [
                    {
                        "text": f"{primary_chunk.get('clauseNumber')}: {primary_chunk.get('content')}",
                        "citationIds": [cid],
                    }
                ],
                "limitations": ["Generated via deterministic rule extraction fallback."],
                "clarifyingQuestions": [],
            }

        # 4. Claim-Level Citation Verification
        raw_claims = [ClaimModel(**c) for c in llm_json.get("claims", [])]
        validated_claims, citations, warnings = await self.citation_validator.validate_answer_citations(
            raw_claims,
            retrieved_chunks=chunks,
        )

        limitations = llm_json.get("limitations", [])
        if warnings:
            limitations.extend(warnings)

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return AnswerResponse(
            status=llm_json.get("status", "answered"),
            answer=llm_json.get("answer", ""),
            claims=validated_claims,
            citations=citations,
            limitations=limitations,
            clarifyingQuestions=llm_json.get("clarifyingQuestions", []),
            diagnostics={
                "totalLatencyMs": elapsed_ms,
                "retrievedChunksCount": len(chunks),
                "topAuthorityScore": chunks[0].get("authorityScore", 0.0),
            },
        )

    async def analyze_scenario(
        self,
        scenario_description: str,
        format_filter: Optional[str] = None,
        competition_filter: Optional[str] = None,
    ) -> ScenarioAnalysisResponse:
        """Performs structured match incident adjudication with evidence-backed rulings."""
        start_time = time.time()

        retrieval_res = await self.retriever.retrieve(
            query=scenario_description,
            format_filter=format_filter,
            competition_filter=competition_filter,
            limit=6,
        )
        chunks = retrieval_res.get("chunks", [])

        if not chunks:
            return ScenarioAnalysisResponse(
                status="insufficient_evidence",
                ruling="Insufficient official rule evidence to adjudicate this scenario.",
                umpireAction="Consult ground umpires and official match playing conditions handbook.",
                diagnostics={"retrievalLatencyMs": round((time.time() - start_time) * 1000, 2)},
            )

        evidence_text = self._format_evidence_context(chunks)
        user_prompt = f"SCENARIO INCIDENT:\n{scenario_description}\n\nRETRIEVED OFFICIAL EVIDENCE:\n{evidence_text}"

        llm_json = await self.gemini_client.generate_json(SCENARIO_SYSTEM_PROMPT, user_prompt)

        if not llm_json:
            primary_chunk = chunks[0]
            llm_json = {
                "status": "analyzed",
                "factsIdentified": [scenario_description[:100]],
                "missingFacts": ["Exact field positioning and batter crossing status"],
                "governingAuthority": primary_chunk.get("parentLaw", "MCC Laws of Cricket"),
                "applicableClauses": [str(primary_chunk.get("clauseNumber", ""))],
                "ruling": f"Adjudicated under {primary_chunk.get('clauseNumber')}: {primary_chunk.get('title')}",
                "umpireAction": "Apply dead ball and appropriate boundary or penalty signals.",
                "conditionalOutcomes": [],
            }

        # Resolve citations from retrieved chunks
        chunk_ids = [str(c.get("id") or c.get("_id")) for c in chunks[:3]]
        raw_claims = [ClaimModel(text=llm_json.get("ruling", ""), citationIds=chunk_ids)]
        _, citations, _ = await self.citation_validator.validate_answer_citations(raw_claims, chunks)

        return ScenarioAnalysisResponse(
            status=llm_json.get("status", "analyzed"),
            factsIdentified=llm_json.get("factsIdentified", []),
            missingFacts=llm_json.get("missingFacts", []),
            governingAuthority=llm_json.get("governingAuthority", "MCC Laws of Cricket"),
            applicableClauses=llm_json.get("applicableClauses", []),
            ruling=llm_json.get("ruling", ""),
            umpireAction=llm_json.get("umpireAction", ""),
            conditionalOutcomes=llm_json.get("conditionalOutcomes", []),
            citations=citations,
            diagnostics={"totalLatencyMs": round((time.time() - start_time) * 1000, 2)},
        )


_answer_service_instance = None


def get_answer_service() -> AnswerService:
    global _answer_service_instance
    if _answer_service_instance is None:
        _answer_service_instance = AnswerService()
    return _answer_service_instance
