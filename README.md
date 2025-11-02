# 🍪 CookieCrush™

**Turn privacy into a game. See who's tracking you. Crush them.**

A Chrome Extension that gamifies web privacy by letting you visualize and delete tracking cookies with satisfying animations.

## Features

✅ **Real-time Cookie Detection** - See all trackers on any website
✅ **One-Click Crushing** - Delete cookies with satisfying animations
✅ **Privacy Score** - Visual indicator of your privacy level
✅ **Kill Counter** - Track how many cookies you've crushed
✅ **Purpose Classification** - Know what each cookie does (analytics, ads, etc)
✅ **Neo-Brutalist Design** - Bold, high-contrast UI that stands out

## Installation (Dev Mode)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `cookiecrush-app` folder
5. The CookieCrush™ icon will appear in your extensions bar

## How to Use

1. Navigate to any website (e.g., google.com, cnn.com)
2. Click the CookieCrush™ extension icon
3. Click **🔍 Scan This Site** to see all trackers
4. Click **🔨 CRUSH** on individual cookies or **💥 CRUSH ALL** to nuke them all
5. Watch your Privacy Score improve!

## Privacy Score

- **0-30%**: 🔴 Heavily tracked (50+ cookies)
- **31-60%**: 🟡 Moderately tracked (20-50 cookies)
- **61-89%**: 🟢 Well protected (5-20 cookies)
- **90-100%**: ✨ Privacy champion (0-5 cookies)

## Cookie Purpose Types

- **Analytics**: Google Analytics, tracking pixels (_ga, _gid, __utm*)
- **Advertising**: Ad networks, conversion tracking
- **Identifier**: Unique user IDs, device fingerprints
- **Session**: Temporary session cookies
- **Authentication**: Login tokens, CSRF protection
- **Preferences**: User settings, language preferences
- **Unknown**: Unclassified cookies

## Development

Built with:
- Manifest V3 (latest Chrome Extension standard)
- Vanilla JavaScript (no frameworks)
- Neo-brutalist CSS design
- Web Audio API for crush sounds

## Roadmap

- [ ] Auto-crush mode (automatically delete third-party cookies)
- [ ] Cookie whitelist (protect important cookies)
- [ ] Global leaderboard (compare your crush count)
- [ ] Daily challenges and achievements
- [ ] Export cookie intelligence reports
- [ ] Browser storage optimization

## License

© 2025 CookieCrush™ - All Rights Reserved

---

**Note**: This extension requires cookies and storage permissions to function. All data stays local on your device. No telemetry or tracking. Ironic, right? 😉
