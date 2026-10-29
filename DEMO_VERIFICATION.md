# Local demonstration verification — 2026-10-12

Production app is running at http://127.0.0.1:3000 from `/private/tmp/restory-demo`. The tested app/lib files match the workspace source byte for byte. Restart from source with `npm run local`; its local mirror materializes cloud-offloaded files using explicit reads.

## Passed

- Production compilation, TypeScript validation and static page generation.
- Existing writing, passage-revision and world-memory checks, including SQLite reopen and backup validation. Provider response checks use an offline stub.
- Headless Chrome: new multilingual manuscript input preserved exactly; edit/read/focus; separate branch drafts; manual timeline events; draft recovery after reload.
- UTF-8 Markdown imported as context and reference without generated facts.
- Downloaded JSON backup inspected for all three test workspaces and exact original draft content.
- Unsupported PDF and invalid UTF-8 rejected while retaining current input.
- 390-pixel layout checked for horizontal overflow; no browser page errors.

## Limits

AI status reports configured=false. No Gemini request was sent or live-qualified. AI research, Director, generation and AI revision require a valid server API key. Manual workflows remain usable.

Inputs: pasted text or UTF-8 .txt/.md/.markdown; at most 100,000 characters, file size at most 400 KB. PDF, Word, images, audio and binary input are unsupported. Workspaces save in the current browser; use JSON backups to move or retain them. This local demonstration does not establish full production acceptance.
