# SupaCanvas — Chrome Extension (Manifest V3)

A minimal Chrome extension scaffold using Manifest V3.

## Features

- **Popup** — Shows the current tab's title and URL with a button to copy the URL.
- **Background service worker** — Handles messages from the popup.
- **Content script** — Injected into every page (currently a placeholder).

## Installation

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select this project folder.
4. The extension icon will appear in the toolbar.

## Project Structure

```
supacanvas-ext/
├── manifest.json        # Extension manifest (v3)
├── background.js        # Service worker
├── content.js           # Content script
├── popup/
│   ├── popup.html       # Popup UI
│   ├── popup.css        # Popup styles
│   └── popup.js         # Popup logic
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```
