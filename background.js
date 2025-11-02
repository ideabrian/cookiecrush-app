// CookieCrush™ - Background Service Worker

// Listen for cookie changes
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.removed) {
    // Cookie was removed (crushed!)
    console.log('Cookie crushed:', changeInfo.cookie.name);
  } else {
    // New cookie detected
    console.log('New tracker detected:', changeInfo.cookie.name, changeInfo.cookie.domain);
  }
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('CookieCrush™ installed! 🍪🔨');

  // Set default kill count
  chrome.storage.local.get(['killCount'], (result) => {
    if (!result.killCount) {
      chrome.storage.local.set({ killCount: 0 });
    }
  });
});

// Badge update - show number of cookies on current site
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  updateBadge(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateBadge(tabId);
  }
});

async function updateBadge(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || tab.url.startsWith('chrome://')) return;

    const url = new URL(tab.url);
    const domain = url.hostname;

    // Get cookie count for this domain
    let cookies = await chrome.cookies.getAll({ domain });

    // Also check parent domain
    if (!domain.startsWith('.')) {
      const parentDomainCookies = await chrome.cookies.getAll({ domain: '.' + domain });
      cookies = [...cookies, ...parentDomainCookies];
    }

    // Remove duplicates
    const uniqueCookies = cookies.filter((cookie, index, self) =>
      index === self.findIndex((c) => c.name === cookie.name && c.domain === cookie.domain)
    );

    // Update badge
    const count = uniqueCookies.length;
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString(), tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#FF4444', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  } catch (error) {
    console.error('Failed to update badge:', error);
  }
}
