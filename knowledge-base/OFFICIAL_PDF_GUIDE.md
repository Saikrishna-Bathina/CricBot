# CricBot — Official Cricket PDF Knowledge Base Guide

**Target Scope:** Core MCC Laws + ICC International (Test, ODI, T20I) + IPL Playing Conditions  
**Folder to place PDFs:** `D:\CricBot\knowledge-base\incoming\`

---

## 1. Official Documents to Download

To ensure umpire-grade accuracy and prevent hallucinations, place the official PDFs into `D:\CricBot\knowledge-base\incoming\`. The ingestion CLI will automatically verify their SHA-256 hashes, detect editions, extract clauses page-by-page, and build the verified vector knowledge base.

### 1. MCC Laws of Cricket (Foundational)
- **Governing Body:** Marylebone Cricket Club (MCC)
- **Document:** MCC Laws of Cricket (2017 Code 3rd Edition - 2022 or latest official release)
- **Where to Download:**
  - Official MCC Page: [https://www.lords.org/mcc/the-laws-of-cricket](https://www.lords.org/mcc/the-laws-of-cricket)
  - Direct PDF downloads are hosted on the Lord's MCC portal under Laws resources.
- **Recommended Filename:** `mcc_laws_of_cricket.pdf`

---

### 2. ICC Men's Playing Conditions (International)
The ICC issues separate Playing Conditions that incorporate and modify the MCC Laws for international matches.

- **Governing Body:** International Cricket Council (ICC)
- **Official Portal:** [https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions](https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions)

**Download the following 3 PDFs from that portal:**
1. **ICC Men's Test Match Playing Conditions**  
   - Recommended Filename: `icc_mens_test_playing_conditions.pdf`
2. **ICC Men's One Day International (ODI) Playing Conditions**  
   - Recommended Filename: `icc_mens_odi_playing_conditions.pdf`
3. **ICC Men's Twenty20 International (T20I) Playing Conditions**  
   - Recommended Filename: `icc_mens_t20i_playing_conditions.pdf`

---

### 3. IPL Match Playing Conditions (Franchise Tournament)
The Indian Premier League includes specific playing condition variations (such as the Impact Player regulation, DRS review for Wides and No-balls, and 2 bouncers per over).

- **Governing Body:** BCCI / IPL Governing Council
- **Where to Download:**
  - IPL Official Portal: [https://www.iplt20.com/about/match-playing-conditions](https://www.iplt20.com/about/match-playing-conditions)
  - Alternatively, BCCI official publications portal ([https://www.bcci.tv/documents](https://www.bcci.tv/documents)).
- **Recommended Filename:** `ipl_match_playing_conditions.pdf`

---

## 2. Directory Workflow

```text
D:\CricBot\knowledge-base\
├── incoming/        <-- Place your downloaded PDFs here
├── approved/        <-- Verified and approved PDFs ready for production RAG
├── rejected/        <-- PDFs with corrupt pages or missing clauses
├── manifests/       <-- Tracking source URLs, SHA-256 hashes, editions, and dates
├── reports/         <-- Inspection and extraction reports per document
└── fixtures/        <-- Synthetic unit-test fixtures (never published to production)
```

---

## 3. Ingestion Commands

Once you have placed any of the PDFs in `knowledge-base/incoming/`, you can run:

```bash
# 1. Inspect incoming files (calculates hashes, checks metadata and scanned pages)
python -m app.ingestion.cli inspect --input ../knowledge-base/incoming

# 2. Dry run extraction and chunking (checks page counts, clauses, and hierarchy)
python -m app.ingestion.cli ingest --input ../knowledge-base/incoming --dry-run

# 3. Publish to verified Atlas knowledge base
python -m app.ingestion.cli ingest --input ../knowledge-base/incoming
```
