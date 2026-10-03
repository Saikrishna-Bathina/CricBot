# Official Cricket Document Ingestion Guide

## Overview
The ingestion pipeline converts official cricket rulebooks (MCC Laws of Cricket, ICC Playing Conditions, tournament regulations) into structured, law-aware database chunks with verifiable metadata and vector embeddings.

## Pipeline Stages

```
[Official PDF / Text]
         |
         v
[PDF Extractor] ----------> Injects [[ PAGE X ]] boundary markers
         |
         v
[Law-Aware Chunker] ------> Identifies "LAW X - NAME", clauses (e.g. 28.3.2, 41.16)
         |                  Preserves Law #, Clause #, Section Title, Page Range
         v
[Embedding Service] ------> Generates 768-dim normalized semantic vectors
         |
         v
[MongoDB Persistence] ----> DocumentChunk records created with status='review'
         |
         v
[Admin Review & Publish] -> Verified by administrator; promoted to status='published'
```

## Supported Source Documents
1. **MCC Laws of Cricket**: Universal foundation (2017 Code 3rd Edition - 2022).
2. **ICC Playing Conditions**: Men's & Women's Test, ODI, and T20I playing conditions.
3. **Tournament Regulations**: Competition-specific rule sets (e.g., IPL, The Hundred, Big Bash).

## Ingestion Rules
- Never split across complete clauses when possible.
- Retain parent document version and effective date.
- Documents default to `draft` or `review` status; only `published` documents are retrieved for standard queries.
- Superseded documents are retained for historical queries but excluded from current match reasoning.
