chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ filterHindi: true });
});
