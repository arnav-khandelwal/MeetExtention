# Meet Extension

A basic Chrome extension for Google Meet with functionality to control mute, video, and view meeting information.

## Features

- **Toggle Mute**: Quickly mute/unmute your microphone
- **Toggle Video**: Turn your camera on/off
- **Meeting Info**: Display current meeting details
- **Auto-actions**: Optional auto-mute when joining meetings

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select this extension folder
4. The Meet Extension icon should appear in your Chrome toolbar

## Usage

1. Join a Google Meet call
2. Click the Meet Extension icon in your Chrome toolbar
3. Use the buttons to:
   - Toggle your microphone mute status
   - Toggle your camera on/off
   - View meeting information

## File Structure

```
meetextention/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup interface
├── popup.js           # Popup functionality
├── content.js         # Scripts that run on Google Meet pages
├── background.js      # Background service worker
├── icons/            # Extension icons (placeholder)
└── README.md         # This file
```

## Permissions

- `activeTab`: Access to the current active tab
- `storage`: Store user preferences

## Development

This is a Manifest V3 Chrome extension. To modify:

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension card to reload changes

## Notes

- The extension only works on Google Meet pages (`https://meet.google.com/*`)
- Icon files are referenced but not included (you'll need to add your own icons)
- Some functionality may need adjustment as Google Meet's interface changes

## Future Enhancements

- Custom keyboard shortcuts
- Meeting recording controls
- Participant management features
- Settings page for user preferences
