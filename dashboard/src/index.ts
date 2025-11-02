/**
 * CookieCrush™ Dashboard
 * Real-time cookie tracking and crushing leaderboard
 */

interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // POST /api/cookies - Log a cookie detection
      if (path === '/api/cookies' && request.method === 'POST') {
        const data = await request.json() as any;

        await env.DB.prepare(
          `INSERT INTO cookies (timestamp, domain, cookie_name, cookie_type, purpose, is_secure, is_httponly, samesite, has_value, machine)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          data.timestamp || new Date().toISOString(),
          data.domain,
          data.cookie_name,
          data.cookie_type || 'unknown',
          data.purpose || 'unknown',
          data.is_secure ? 1 : 0,
          data.is_httponly ? 1 : 0,
          data.samesite || 0,
          data.has_value ? 1 : 0,
          data.machine || 'unknown'
        ).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // POST /api/crushes - Log a cookie crush
      if (path === '/api/crushes' && request.method === 'POST') {
        const data = await request.json() as any;

        await env.DB.prepare(
          `INSERT INTO crushes (timestamp, domain, cookie_name, machine)
           VALUES (?, ?, ?, ?)`
        ).bind(
          data.timestamp || new Date().toISOString(),
          data.domain,
          data.cookie_name,
          data.machine || 'unknown'
        ).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /api/stats - Get overall statistics
      if (path === '/api/stats' && request.method === 'GET') {
        const { results: cookieStats } = await env.DB.prepare(
          `SELECT
            COUNT(*) as total_cookies,
            COUNT(DISTINCT domain) as unique_domains,
            COUNT(CASE WHEN cookie_type = 'third-party' THEN 1 END) as third_party,
            COUNT(CASE WHEN cookie_type = 'first-party' THEN 1 END) as first_party
           FROM cookies`
        ).all();

        const { results: crushStats } = await env.DB.prepare(
          `SELECT COUNT(*) as total_crushes FROM crushes`
        ).all();

        return new Response(JSON.stringify({
          cookies: cookieStats[0] || {},
          crushes: crushStats[0] || {}
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /api/leaderboard - Get top trackers
      if (path === '/api/leaderboard' && request.method === 'GET') {
        const limit = url.searchParams.get('limit') || '50';

        const { results: topTrackers } = await env.DB.prepare(
          `SELECT
            domain,
            cookie_name,
            COUNT(*) as count,
            MAX(purpose) as purpose,
            MAX(cookie_type) as cookie_type
           FROM cookies
           GROUP BY domain, cookie_name
           ORDER BY count DESC
           LIMIT ?`
        ).bind(parseInt(limit)).all();

        return new Response(JSON.stringify({ trackers: topTrackers }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /api/recent - Get recent cookies
      if (path === '/api/recent' && request.method === 'GET') {
        const limit = url.searchParams.get('limit') || '20';

        const { results: recentCookies } = await env.DB.prepare(
          `SELECT * FROM cookies
           ORDER BY created_at DESC
           LIMIT ?`
        ).bind(parseInt(limit)).all();

        return new Response(JSON.stringify({ cookies: recentCookies }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET / - Serve dashboard HTML
      if (path === '/' && request.method === 'GET') {
        return new Response(getDashboardHTML(), {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CookieCrush™ Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #FAFAFA;
      color: #000;
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      background: #FFF;
      border: 3px solid #000;
      padding: 2rem;
      margin-bottom: 2rem;
      text-align: center;
    }

    h1 {
      font-size: 3rem;
      font-weight: 900;
      margin-bottom: 0.5rem;
    }

    .tagline {
      font-size: 1.25rem;
      color: #666;
      font-weight: 600;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: #FFF;
      border: 3px solid #000;
      padding: 1.5rem;
      text-align: center;
    }

    .stat-card.highlight {
      background: #00D9FF;
    }

    .stat-card.danger {
      background: #FF4444;
      color: #FFF;
    }

    .stat-value {
      font-size: 3rem;
      font-weight: 900;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      text-transform: uppercase;
      font-weight: 700;
      margin-top: 0.5rem;
    }

    .card {
      background: #FFF;
      border: 3px solid #000;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    h2 {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 1rem;
      text-transform: uppercase;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 0.75rem;
      text-align: left;
      border: 2px solid #000;
    }

    th {
      background: #000;
      color: #FFF;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 0.75rem;
    }

    tr:nth-child(even) {
      background: #FAFAFA;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      border: 2px solid #000;
    }

    .badge-analytics { background: #FFD700; }
    .badge-advertising { background: #FF6B6B; color: #FFF; }
    .badge-identifier { background: #FF8C00; color: #FFF; }
    .badge-session { background: #00D9FF; }
    .badge-authentication { background: #10b981; color: #FFF; }
    .badge-unknown { background: #CCC; }

    .empty-state {
      text-align: center;
      color: #666;
      padding: 3rem 1rem;
    }

    .footer {
      text-align: center;
      padding: 2rem;
      color: #666;
      font-size: 0.875rem;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .loading {
      animation: pulse 2s infinite;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍪 CookieCrush™</h1>
      <p class="tagline">Real-time cookie tracking dashboard</p>
      <p style="font-size: 0.875rem; margin-top: 0.5rem; color: #666;">
        Last updated: <span id="last-updated">Loading...</span>
      </p>
    </div>

    <div class="stats-grid" id="stats">
      <div class="stat-card loading">
        <div class="stat-value">...</div>
        <div class="stat-label">Total Cookies</div>
      </div>
      <div class="stat-card loading">
        <div class="stat-value">...</div>
        <div class="stat-label">Unique Domains</div>
      </div>
      <div class="stat-card danger loading">
        <div class="stat-value">...</div>
        <div class="stat-label">Third-Party Trackers</div>
      </div>
      <div class="stat-card highlight loading">
        <div class="stat-value">🔨 ...</div>
        <div class="stat-label">Cookies Crushed</div>
      </div>
    </div>

    <div class="card">
      <h2>🏆 Tracker Leaderboard</h2>
      <div id="leaderboard">
        <p class="empty-state">Loading tracker data...</p>
      </div>
    </div>

    <div class="card">
      <h2>📊 Recent Cookie Activity</h2>
      <div id="recent">
        <p class="empty-state">Loading recent activity...</p>
      </div>
    </div>

    <div class="footer">
      <p>CookieCrush™ - Turn privacy into a game</p>
      <p>© 2025 - All Rights Reserved</p>
    </div>
  </div>

  <script>
    let previousData = {
      stats: null,
      leaderboard: [],
      recent: []
    };

    async function loadData() {
      try {
        document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();

        // Load stats
        const statsRes = await fetch('/api/stats');
        const stats = await statsRes.json();

        // Update stats
        const statsHTML = \`
          <div class="stat-card">
            <div class="stat-value">\${stats.cookies.total_cookies || 0}</div>
            <div class="stat-label">Total Cookies</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">\${stats.cookies.unique_domains || 0}</div>
            <div class="stat-label">Unique Domains</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">\${stats.cookies.third_party || 0}</div>
            <div class="stat-label">Third-Party Trackers</div>
          </div>
          <div class="stat-card highlight">
            <div class="stat-value">🔨 \${stats.crushes.total_crushes || 0}</div>
            <div class="stat-label">Cookies Crushed</div>
          </div>
        \`;
        document.getElementById('stats').innerHTML = statsHTML;

        // Load leaderboard
        const leaderboardRes = await fetch('/api/leaderboard?limit=50');
        const leaderboard = await leaderboardRes.json();

        const leaderboardIds = (leaderboard.trackers || []).map(t => t.domain + t.cookie_name).join(',');
        const previousIds = previousData.leaderboard.map(t => t.domain + t.cookie_name).join(',');

        if (leaderboardIds !== previousIds) {
          if (!leaderboard.trackers || leaderboard.trackers.length === 0) {
            document.getElementById('leaderboard').innerHTML = '<p class="empty-state">No trackers detected yet</p>';
          } else {
            const leaderboardHTML = \`
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Domain</th>
                    <th>Cookie</th>
                    <th>Purpose</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  \${leaderboard.trackers.map((tracker, index) => \`
                    <tr>
                      <td style="font-weight: 900; font-size: 1.5rem;">\${index + 1}</td>
                      <td>\${tracker.domain}</td>
                      <td><code>\${tracker.cookie_name}</code></td>
                      <td><span class="badge badge-\${tracker.purpose}">\${tracker.purpose}</span></td>
                      <td style="font-weight: 700;">\${tracker.count}</td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            \`;
            document.getElementById('leaderboard').innerHTML = leaderboardHTML;
          }
          previousData.leaderboard = leaderboard.trackers || [];
        }

        // Load recent
        const recentRes = await fetch('/api/recent?limit=20');
        const recent = await recentRes.json();

        const recentIds = (recent.cookies || []).map(c => c.id).join(',');
        const previousRecentIds = previousData.recent.map(c => c.id).join(',');

        if (recentIds !== previousRecentIds) {
          if (!recent.cookies || recent.cookies.length === 0) {
            document.getElementById('recent').innerHTML = '<p class="empty-state">No recent activity</p>';
          } else {
            const recentHTML = \`
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Domain</th>
                    <th>Cookie</th>
                    <th>Type</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  \${recent.cookies.map(cookie => \`
                    <tr>
                      <td>\${new Date(cookie.timestamp).toLocaleString()}</td>
                      <td>\${cookie.domain}</td>
                      <td><code>\${cookie.cookie_name}</code></td>
                      <td>\${cookie.cookie_type}</td>
                      <td><span class="badge badge-\${cookie.purpose}">\${cookie.purpose}</span></td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            \`;
            document.getElementById('recent').innerHTML = recentHTML;
          }
          previousData.recent = recent.cookies || [];
        }

      } catch (error) {
        console.error('Failed to load data:', error);
      }
    }

    // Load data on page load
    loadData();

    // Auto-refresh every 5 seconds
    setInterval(loadData, 5000);
  </script>
</body>
</html>
`;
}
