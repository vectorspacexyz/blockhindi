// Add to top of content.js
chrome.storage.sync.get(['filterHindi'], (result) => {
  if (result.filterHindi !== false) {
    processVideoElements();
  }
});

// Listen for toggle changes
chrome.runtime.onMessage.addListener((request) => {
  if (request.filterHindi === false) {
    // Show all videos if disabled
    document.querySelectorAll('ytd-video-renderer, ytd-compact-video-renderer').forEach(el => {
      el.style.display = '';
    });
  } else {
    processVideoElements();
  }
});

// ======================
// Caching + Throttling
// ======================
const REQUEST_DELAY = 1500; // 1.5 seconds between requests
const cache = new Map();    // Simple in-memory cache
let lastRequestTime = 0;

async function checkVideoLanguage(videoId) {
  // Check cache first
  if (cache.has(videoId)) {
    return cache.get(videoId);
  }

  // Throttle requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  try {
    const response = await fetch(
      "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: {
            client: {
              hl: "en",
              clientName: "WEB",
              clientVersion: "2.20240401.00.00"
            }
          },
          videoId: videoId
        })
      }
    );
    
    const data = await response.json();
    const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    const isHindi = captionTracks.some(track => track.languageCode === "hi");
    
    cache.set(videoId, isHindi); // Cache result
    return isHindi;
  } catch (error) {
    console.error('Error checking video language:', error);
    return false;
  }
}

// ======================
// Video Processing
// ======================
async function processVideoElements() {
  const videoElements = document.querySelectorAll(`
    ytd-video-renderer, 
    ytd-compact-video-renderer,
    ytd-reel-item-renderer,
    ytd-rich-item-renderer
  `);
  
  // Process videos sequentially to maintain throttling
  for (const element of videoElements) {
    const videoId = 
      element.querySelector('a#thumbnail')?.href?.match(/v=([^&]+)/)?.[1] || 
      element.querySelector('a[href^="/shorts/"]')?.href?.match(/\/shorts\/([^/?]+)/)?.[1] ||
      element.querySelector('a[href*="m.youtube.com/watch"]')?.href?.match(/v=([^&]+)/)?.[1] ||
      element.querySelector('a[href*="m.youtube.com/shorts"]')?.href?.match(/\/shorts\/([^/?]+)/)?.[1];

    if (!videoId) continue;
    
    const isHindi = await checkVideoLanguage(videoId);
    if (isHindi) {
      element.style.display = 'none';
    }
  }
}

// Run initially and observe DOM changes
processVideoElements();
const observer = new MutationObserver(() => {
  // Debounce to avoid rapid repeated processing
  clearTimeout(window.processDebounce);
  window.processDebounce = setTimeout(processVideoElements, 500);
});
observer.observe(document.body, { childList: true, subtree: true });
