# How to Open Browser Console

## 🖥️ Desktop (Chrome/Edge/Firefox)

**Method 1: Keyboard Shortcut**
- **Windows/Linux:** Press `F12` or `Ctrl + Shift + I`
- **Mac:** Press `Cmd + Option + I`

**Method 2: Right-Click Menu**
1. Right-click anywhere on the page
2. Select "Inspect" or "Inspect Element"
3. Click the "Console" tab at the top

**Method 3: Menu**
- **Chrome/Edge:** Menu (3 dots) → More Tools → Developer Tools → Console tab
- **Firefox:** Menu (3 lines) → More Tools → Web Developer Tools → Console tab

## 📱 Mobile (Chrome/Safari)

**Chrome (Android):**
- Not easily accessible, use desktop method

**Safari (iOS):**
1. Settings → Safari → Advanced → Enable "Web Inspector"
2. Connect iPhone to Mac
3. On Mac: Safari → Develop → [Your iPhone] → [Page Name]

## ✅ What You'll See

Once console is open, you'll see:
- Logs from the application
- Errors (in red)
- Warnings (in yellow)
- Info logs (in white/blue)

Look for logs starting with:
- `🔍 PlayerGameStatsService:`
- `🏢 Creating Enterprise Supabase Client...`
- `📊 Player Profile Modal`

## 🎯 Quick Test

Once console is open, type this and press Enter:
```javascript
console.log('Console is working!');
```

You should see "Console is working!" printed below.

