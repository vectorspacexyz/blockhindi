# YouTube block hindi videos
The extension determines if Hindi is spoken in a video through YouTube's caption track metadata (not the actual audio analysis).

API:
```
curl -X POST "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8" -H "Content-Type: application/json" -d '{
    "context": {
      "client": {
        "hl": "en",
        "clientName": "WEB",
        "clientVersion": "2.20240401.00.00"
      }
    },
    "videoId": "Doa7Jk9ngKk"
  }'
```

Here's the detailed logic:

## 1. Fetching Caption Information
The extension makes a request to YouTube's internal API endpoint (used by the web player):

```javascript
POST https://www.youtube.com/youtubei/v1/player
```

With payload:

```json
{
  "context": { "client": { "hl": "en", "clientName": "WEB", ... } },
  "videoId": "VIDEO_ID"
}
```

This returns a JSON response containing:

```json
{
  "captions": {
    "playerCaptionsTracklistRenderer": {
      "captionTracks": [
        {
          "languageCode": "hi",
          "kind": "asr",  // "asr" = auto-generated captions
          "baseUrl": "..."
        },
        {
          "languageCode": "en",
          // No "kind" = human-uploaded captions
        }
      ]
    }
  }
}
```

## 2. Language Detection Logic
The extension checks if any caption track matches Hindi (hi):

```javascript
const isHindi = captionTracks.some(track => track.languageCode === "hi");
```

What This Actually Detects:
* true (Hindi exists) when either:
    * The video has auto-generated Hindi captions ("kind": "asr"), meaning YouTube's speech recognition detected Hindi.
    * The uploader added manual Hindi subtitles (no "kind" field).
* false (No Hindi) when:
    * No Hindi captions exist (regardless of the actual spoken language).

## 3. Key Limitations
| Scenario                                      | Detection Accuracy                     |
|-----------------------------------------------|----------------------------------------|
| Video with Hindi speech + auto-captions       | ✅ Correctly detected                  |
| Video with Hindi speech but no captions       | ❌ False negative (missed)             |
| Non-Hindi video with incorrect auto-captions  | ❌ False positive (wrongly flagged)    |
| Hindi subtitles added manually                | ✅ Correctly detected                  |


## 4. Why This Works (Despite Limitations)
### 1. Auto-captions imply spoken language:
YouTube only generates ASR (auto-captions) if it detects clear speech in that language.

### 2. Manual subtitles imply relevance:
If a creator added Hindi subtitles, the content is likely relevant to Hindi speakers.

### 3. Efficiency over perfection:
This method avoids expensive audio analysis while catching most Hindi content.

## 5. Edge Cases Handled
Multiple languages: Only checks for presence of Hindi (ignores others).

Failed requests: Returns false by default (fails safe).

Cache: Avoids re-checking the same video during a session.

For a more accurate solution, you'd need actual audio analysis (e.g., speech-to-text APIs), but this balances simplicity and effectiveness for a browser extension.
