document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleFilter');
  const status = document.getElementById('status');
  
  chrome.storage.sync.get(['filterHindi'], (result) => {
    toggle.checked = result.filterHindi !== false;
    status.textContent = toggle.checked ? 'Enabled' : 'Disabled';
  });
  
  toggle.addEventListener('change', () => {
    chrome.storage.sync.set({ filterHindi: toggle.checked });
    status.textContent = toggle.checked ? 'Enabled' : 'Disabled';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { filterHindi: toggle.checked });
    });
  });
});
