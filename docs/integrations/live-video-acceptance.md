# Live video acceptance — 2026-10-26

Submitted one authorized request through the local Re:Story API using gemini-omni-1.1-flash: a continuous forward shot along an empty rainy street at night, target 4 seconds, 16:9, 720p. The local owner-code gate accepted the configured code. Creation returned one ticket; status polling progressed from pending to ready; authenticated download returned an MP4. No creation retries.

Actual output: 2,355,330 bytes, 1280×720, container duration 4.011 seconds. Browser decoded it and played through to 4.01 seconds with ended=true, readyState=4, no media error. The visible frame shows the requested wet night street and warm street lamps. The test covers server submission, status, download and standalone playback; it does not certify the entire product composer UI, character consistency, multi-shot editing, universal prompt adherence, sustained service reliability or text AI quality.

The application estimate approved for this run was $1.10. Actual billing has not been read or verified; this is not a hard provider spending cap. No additional paid generation was submitted.

Evidence: output/live-video-2026-10-26/verification.json, restory-video.mp4 and playback.png. The private submission record retains the resumable ticket locally and is excluded from Git.
