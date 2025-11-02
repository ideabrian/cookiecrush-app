// CookieCrush™ - Popup Logic

let currentUrl = '';
let currentDomain = '';
let cookies = [];
let killCount = 0;

// Load kill count from storage
chrome.storage.local.get(['killCount'], (result) => {
  killCount = result.killCount || 0;
  updateKillCounter();
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url) {
    currentUrl = tab.url;
    currentDomain = new URL(tab.url).hostname;
  }

  // Set up event listeners
  document.getElementById('scan-btn').addEventListener('click', scanCookies);
  document.getElementById('crush-all-btn').addEventListener('click', crushAllCookies);
  document.getElementById('view-dashboard-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://cookiecrush-dashboard.b-9f2.workers.dev' });
  });
});

// Scan cookies from current site
async function scanCookies() {
  const scanBtn = document.getElementById('scan-btn');
  scanBtn.textContent = '🔄 Scanning...';
  scanBtn.disabled = true;

  try {
    // Get all cookies for current domain
    cookies = await chrome.cookies.getAll({ domain: currentDomain });

    // Also get cookies for parent domain (e.g., .example.com)
    if (!currentDomain.startsWith('.')) {
      const parentDomainCookies = await chrome.cookies.getAll({ domain: '.' + currentDomain });
      cookies = [...cookies, ...parentDomainCookies];
    }

    // Remove duplicates
    cookies = cookies.filter((cookie, index, self) =>
      index === self.findIndex((c) => c.name === cookie.name && c.domain === cookie.domain)
    );

    // Update UI
    updateCookieList();
    updateStats();
    updatePrivacyScore();

    scanBtn.textContent = '✅ Scanned!';
    setTimeout(() => {
      scanBtn.textContent = '🔍 Scan This Site';
      scanBtn.disabled = false;
    }, 1000);

  } catch (error) {
    console.error('Scan failed:', error);
    scanBtn.textContent = '❌ Scan Failed';
    setTimeout(() => {
      scanBtn.textContent = '🔍 Scan This Site';
      scanBtn.disabled = false;
    }, 2000);
  }
}

// Determine cookie purpose from name and domain
function getCookiePurpose(cookie) {
  const name = cookie.name.toLowerCase();
  const domain = cookie.domain.toLowerCase();

  // Analytics
  if (name.match(/^(_ga|_gid|__utm|_gat)/)) return 'analytics';

  // Advertising
  if (name.match(/(ad|advert|campaign|conversion)/)) return 'advertising';
  if (domain.match(/(doubleclick|googlesyndication|adnxs|pubmatic)/)) return 'advertising';

  // Identifier
  if (name.match(/(id|uuid|guid|uid|_hjid)/)) return 'identifier';

  // Session
  if (name.match(/(session|sess|sid)/)) return 'session';

  // Authentication
  if (name.match(/(auth|token|login|csrf)/)) return 'authentication';

  // Preferences
  if (name.match(/(pref|settings|config|locale)/)) return 'preferences';

  return 'unknown';
}

// Update cookie list display
function updateCookieList() {
  const cookieList = document.getElementById('cookie-list');

  if (cookies.length === 0) {
    cookieList.innerHTML = '<p class="empty-state">✨ No trackers found on this site!</p>';
    document.getElementById('crush-all-btn').disabled = true;
    return;
  }

  cookieList.innerHTML = cookies.map((cookie, index) => {
    const purpose = getCookiePurpose(cookie);
    const isThirdParty = cookie.domain.startsWith('.');

    return `
      <div class="cookie-item" id="cookie-${index}">
        <div class="cookie-info">
          <div class="cookie-domain">${cookie.domain}</div>
          <div class="cookie-name">${cookie.name}</div>
          <span class="cookie-purpose ${purpose}">${purpose}</span>
        </div>
        <button class="crush-btn" onclick="crushCookie(${index})">
          🔨 CRUSH
        </button>
      </div>
    `;
  }).join('');

  document.getElementById('crush-all-btn').disabled = false;
}

// Update stats
function updateStats() {
  document.getElementById('total-cookies').textContent = cookies.length;
}

// Update kill counter
function updateKillCounter() {
  document.getElementById('kill-count').textContent = `🔨 ${killCount}`;
}

// Update privacy score (0-100%)
function updatePrivacyScore() {
  // Score is inverse of cookie count (fewer cookies = higher score)
  // Max 50 cookies = 0%, 0 cookies = 100%
  const maxCookies = 50;
  const score = Math.max(0, Math.min(100, 100 - (cookies.length / maxCookies * 100)));

  document.getElementById('privacy-score-value').textContent = `${Math.round(score)}%`;
  document.getElementById('privacy-score-fill').style.width = `${score}%`;
}

// Crush a single cookie
window.crushCookie = async function(index) {
  try {
    const cookie = cookies[index];
    if (!cookie) {
      console.error('Cookie not found at index:', index);
      return;
    }

    const cookieElement = document.getElementById(`cookie-${index}`);
    if (!cookieElement) {
      console.error('Cookie element not found:', index);
      return;
    }

    // Add crushing animation
    cookieElement.classList.add('crushing');

    // Remove cookie
    await chrome.cookies.remove({
      url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
      name: cookie.name
    });

    // Play crush sound (simple beep)
    playCrushSound();

    // Increment kill counter
    killCount++;
    chrome.storage.local.set({ killCount });
    updateKillCounter();

    // Remove from array and update UI
    setTimeout(() => {
      cookies.splice(index, 1);
      updateCookieList();
      updateStats();
      updatePrivacyScore();
    }, 300);

  } catch (error) {
    console.error('Failed to crush cookie:', error);
    const cookieElement = document.getElementById(`cookie-${index}`);
    if (cookieElement) {
      cookieElement.classList.remove('crushing');
    }
  }
};

// Crush all cookies
async function crushAllCookies() {
  try {
    const crushAllBtn = document.getElementById('crush-all-btn');
    crushAllBtn.textContent = '💥 CRUSHING...';
    crushAllBtn.disabled = true;

    let crushedCount = 0;

    for (const cookie of [...cookies]) {
      try {
        await chrome.cookies.remove({
          url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
          name: cookie.name
        });
        crushedCount++;
      } catch (error) {
        console.error('Failed to crush cookie:', cookie.name, error);
      }
    }

    // Update kill counter
    killCount += crushedCount;
    chrome.storage.local.set({ killCount });
    updateKillCounter();

    // Play victory sound
    playVictorySound();

    // Clear cookies and update UI
    cookies = [];
    updateCookieList();
    updateStats();
    updatePrivacyScore();

    crushAllBtn.textContent = `✨ Crushed ${crushedCount}!`;
    setTimeout(() => {
      crushAllBtn.textContent = '💥 CRUSH ALL';
      crushAllBtn.disabled = true;
    }, 2000);
  } catch (error) {
    console.error('Crush all failed:', error);
  }
}

// Simple crush sound (beep)
function playCrushSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 300;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    // Audio might fail due to browser policies, but that's OK
    console.log('Sound disabled:', error.message);
  }
}

// Victory sound
function playVictorySound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Play ascending notes
    [400, 500, 600].forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = audioContext.currentTime + (i * 0.1);
      gainNode.gain.setValueAtTime(0.1, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    });
  } catch (error) {
    // Audio might fail due to browser policies, but that's OK
    console.log('Sound disabled:', error.message);
  }
}
