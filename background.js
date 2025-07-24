// Background script for Meet Extension
console.log('Meet Extension background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    console.log('Meet Extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
      extensionEnabled: true,
      autoMuteOnJoin: false,
      showNotifications: true
    });
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(function() {
  console.log('Meet Extension started');
});

// Listen for tab updates to detect Google Meet pages
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('meet.google.com')) {
    console.log('Google Meet page detected:', tab.url);
    
    // You can add logic here to automatically perform actions when joining a meet
    // For example, check settings and auto-mute if enabled
    chrome.storage.sync.get(['autoMuteOnJoin'], function(result) {
      if (result.autoMuteOnJoin) {
        // Send message to content script to auto-mute
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {action: 'toggleMute'});
        }, 2000); // Wait 2 seconds for the page to load
      }
    });
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Background received message:', request);
  
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['extensionEnabled', 'autoMuteOnJoin', 'showNotifications'], function(result) {
      sendResponse(result);
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'saveSettings') {
    chrome.storage.sync.set(request.settings, function() {
      sendResponse({success: true});
    });
    return true;
  }
});
