# Database Schema Design (MongoDB & Mongoose)

## Schemas

### 1. Document Schema (`documents`)
Stores registered rulebooks, playing condition guides, and amendments.
- `title`: String (required)
- `issuingOrganisation`: String (enum: `['MCC', 'ICC', 'BCCI', 'ECB', 'CA', 'OTHER']`)
- `documentType`: String (enum: `['LAWS_OF_CRICKET', 'PLAYING_CONDITIONS', 'TOURNAMENT_REGULATION', 'EXPLANATORY_MEMO']`)
- `sourceUrl`: String (URL to official publication)
- `storageKey`: String (local file path or S3 key)
- `originalFilename`: String
- `version`: String (e.g., `2017 Code 3rd Edition - 2022`)
- `edition`: String
- `publishedAt`: Date
- `effectiveFrom`: Date
- `effectiveTo`: Date (nullable)
- `applicableFormats`: Array of Strings (`['TEST', 'ODI', 'T20I', 'T20', 'THE_HUNDRED', 'ALL']`)
- `applicableCompetitions`: Array of Strings
- `language`: String (default: `'en'`)
- `contentHash`: String (SHA-256 of original file for deduplication)
- `status`: String (enum: `['draft', 'processing', 'review', 'published', 'failed', 'superseded']`)
- `supersedesDocumentId`: ObjectId (ref: `Document`)
- `ingestionMetadata`: Object
- `createdBy`: ObjectId (ref: `User`)
- `reviewedBy`: ObjectId (ref: `User`)
- Timestamps (`createdAt`, `updatedAt`)

### 2. DocumentChunk Schema (`document_chunks`)
Stores granular, law-aware passages for semantic and lexical retrieval.
- `documentId`: ObjectId (ref: `Document`, indexed)
- `chunkIndex`: Number
- `text`: String (verbatim clause or rule section)
- `embedding`: Array of Numbers (e.g. 768 or 1536 dimensions)
- `lawNumber`: Number (1 to 42, nullable for playing conditions)
- `lawTitle`: String (e.g. "Law 28 - The Fielder")
- `clauseNumber`: String (e.g. "28.3.2" or "Appendix A")
- `pageStart`: Number
- `pageEnd`: Number
- `sectionHeading`: String
- `documentVersion`: String
- `issuingOrganisation`: String
- `applicableFormats`: Array of Strings
- `applicableCompetitions`: Array of Strings
- `effectiveFrom`: Date
- `effectiveTo`: Date
- `contentHash`: String
- Timestamps (`createdAt`, `updatedAt`)

### 3. User Schema (`users`)
- `name`: String
- `email`: String (unique)
- `passwordHash`: String
- `role`: String (enum: `['user', 'admin']`, default: `'user'`)
- Timestamps

### 4. Conversation & Message Schemas (`conversations`, `messages`)
- `userId`: ObjectId (ref: `User`, nullable for guest sessions)
- `title`: String
- `role`: enum `['user', 'assistant']`
- `content`: String
- `citations`: Array of validated chunk references
- `applicableContext`: Object (format, competition, authority)

### 5. Quiz, QuizQuestion & QuizAttempt Schemas (`quizzes`, `quiz_questions`, `quiz_attempts`)
- Server-side validation of scores
- Correct answers remain hidden from clients prior to submission
- Explanations anchored to verified `DocumentChunk` IDs
