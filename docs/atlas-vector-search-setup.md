# MongoDB Atlas Vector Search Setup

## Overview
AI Cricket Laws Assistant uses **MongoDB Atlas Vector Search** for semantic clause retrieval alongside text/exact-match indexes.

## Creating the Atlas Vector Index

1. Log into **MongoDB Atlas** and navigate to your cluster.
2. Select **Search** -> **Create Search Index**.
3. Choose **Atlas Vector Search** (JSON Editor).
4. Select the database `cricket_laws_assistant` and collection `documentchunks`.
5. Enter index name: `cricket_vector_index`.
6. Paste the following index definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "documentId"
    },
    {
      "type": "filter",
      "path": "lawNumber"
    },
    {
      "type": "filter",
      "path": "issuingOrganisation"
    }
  ]
}
```

7. Click **Create Vector Index**.

## Local Development Fallback
When running on local standalone MongoDB instances (without the Atlas Search daemon `mongot`), the backend automatically detects this and activates an exact in-memory cosine similarity fallback over candidate documents. This ensures 100% development and testing capability offline without external dependencies.
