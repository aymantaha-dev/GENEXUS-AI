# GENEXUS-AI v1.1.0 Update Notes

## Overview
Version **1.1.0** focuses on stability, endpoint correctness, and operational readiness.

## What Was Fixed

### 1) Model endpoints are now functional
- Fixed image models endpoint by adding `getImageModels()` in `pollinationsService`.
- Fixed video models endpoint by adding `getVideoModels()` in `pollinationsService`.
- Fixed chat models endpoint alignment by using `chat` models consistently.

### 2) Image editing flow repaired
- Added missing `formatError` import to avoid runtime `ReferenceError`.
- Implemented missing file service helpers:
  - `saveTempFile()`
  - `readFile()`
  - `deleteFile()`
- Implemented `editImage()` in `pollinationsService` and normalized support for Buffer input.

### 3) Metrics endpoint implemented
- Added `GET /metrics` endpoint with process and memory details.

### 4) Test reliability improvements
- Refactored endpoint test script:
  - Keeps strict validation for local endpoints.
  - Treats external provider/API-key limitations (401/403/429) as warnings by default.
  - Added explicit coverage for `/metrics` and edit endpoint validation.

### 5) Project setup and consistency
- Added `.env.example` for reproducible setup.
- Added `.gitignore` to prevent large/generated files from polluting git status.
- Bumped service version to **1.1.0** in both package manifests.
- Added a `build` script placeholder for tooling compatibility.

## Notes
- External generation endpoints depend on Pollinations availability and credentials.
- For strict external verification in CI, run tests with:

```bash
STRICT_EXTERNAL_TESTS=true npm test
```
