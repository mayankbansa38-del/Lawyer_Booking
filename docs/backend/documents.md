# Documents Module Documentation

## 1. Overview
The Documents module handles file uploads, secure storage, and access control. It uses **Supabase Storage** (S3-compatible) for the actual files and Postgres for metadata.

-   **Purpose**: Securely store and share legal documents.
-   **Key Features**:
    -   Supabase Integration (Blob Storage).
    -   Signed URLs (Time-limited access).
    -   Soft Deletes (Recoverable files).
-   **Dependencies**: `multer` (multipart/form-data), `@supabase/supabase-js`.

## 2. Architecture & Data Models

### Database Schema
| Model | Purpose | Key Fields | Relationships |
|:------|:--------|:-----------|:--------------|
| `Document` | File Metadata | `storagePath`, `mimeType`, `size`, `sharedWith` | `User`, `Case` (via `CaseDocument` - theoretical) |

### Storage Strategy
-   **Bucket**: `documents`
-   **Path**: `userId/documents/timestamp-random-filename.ext`
-   **Security**: Bucket should be **Private**. Access via Signed URLs only.

## 3. Module Deep Dive (Amateur to Pro)

### `POST /api/v1/documents` (Upload Pipeline)
**Goal**: Intake a file stream, upload to Cloud, and save metadata.

#### Logic Flow
1.  **Multer Middleware**: `uploadDocument` intercepts `multipart/form-data` and buffers the file in memory.
2.  **Supabase Upload**: Sends the buffer to Supabase Storage.
    -   *Retries*: Not implemented in route, but Supabase SDK handles some network blips.
3.  **DB Record**: Creates entry with `storagePath` (key to find it later).

#### Code Analysis
```javascript
// routes.js Line 47
const { url } = await uploadFile({
    bucket: BUCKETS.DOCUMENTS,
    path: storagePath,
    file: file.buffer, // RAM usage alert!
    contentType: file.mimetype,
});
```

> [!WARNING]
> **RAM Usage**:
> `file.buffer` means the *entire* file is loaded into Node.js Heap memory. If 100 users upload 10MB PDFs simultaneously, you need 1GB RAM just for buffers.
> **Fix**: Stream directly from Request -> Supabase (`stream.pipe`).

### `GET /:id/download` (Secure Access)
**Goal**: Allow a user to view a private file.
-   **Mechanism**: **Pre-signed URL**.
-   **Why**: We don't want to proxy the file *through* our API (bandwidth cost). We give the client a "Key" to fetch it directly from Supabase for the next 60 minutes.

## 4. API Specification

| Method | Endpoint | Description | Query Params |
|:-------|:---------|:------------|:-------------|
| `POST` | `/documents` | Upload (Multipart) | `type`, `description` |
| `GET` | `/documents` | List files | `type` |
| `GET` | `/documents/:id/download` | Get Signed URL | - |
| `POST` | `/documents/:id/share` | Add users to access list | - |
| `DELETE` | `/documents/:id` | Soft delete | - |

## 5. Frontend Integration

### specific Service (`Frontend/src/services/api/index.js`)
Uses `FormData` for uploads.

```javascript
// services/api/index.js
async upload(file, metadata) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', metadata.type);
    return apiClient.post('/documents', formData);
}
```

## 6. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **Memory Buffer**: As noted above, `file.buffer` is a scalability killer.
-   **Orphaned Files on Failure**: If `Supabase.upload` succeeds but `prisma.create` fails (DB down), you have a "Ghost File" in storage that costs money but isn't linked to anyone.
    -   *Fix*: Use a cleanup cron job or robust "Saga" pattern (Compensation action: delete file if DB fails).

### ⚠️ Maintainability
-   **Mime Type Validation**: Relies on `file.mimetype` from the client header (spoofable).
    -   *Fix*: Use `file-type` or `mmmagic` to inspect the magic bytes of the buffer to verify it's *actually* a PDF.

### 🏆 Top 1% Tip
**Virus Scanning**:
Never trust user uploads. Trigger a **background lambda** (AWS Lambda / Supabase Edge Function) on upload to scan the file with ClamAV. Only mark the document as `UserVisible: true` after the scan passes.
