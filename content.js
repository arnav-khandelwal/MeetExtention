// Content script for Google Meet
console.log('Meet Extension content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Received message:', request);
  
  switch(request.action) {
    case 'toggleMute':
      toggleMute();
      sendResponse({success: true, message: 'Mute toggled'});
      break;
      
    case 'toggleVideo':
      toggleVideo();
      sendResponse({success: true, message: 'Video toggled'});
      break;
      
    case 'showInfo':
      showMeetingInfo();
      sendResponse({success: true, message: 'Meeting info displayed'});
      break;
      
    default:
      sendResponse({success: false, message: 'Unknown command'});
  }
});

// Function to toggle mute
function toggleMute() {
  // Try to find the mute button using common selectors
  const muteSelectors = [
    '[data-tooltip*="microphone"]',
    '[aria-label*="microphone"]',
    '[aria-label*="Mute"]',
    '[aria-label*="Unmute"]',
    'button[data-is-muted]'
  ];
  
  for (const selector of muteSelectors) {
    const muteButton = document.querySelector(selector);
    if (muteButton) {
      muteButton.click();
      console.log('Mute button clicked');
      return;
    }
  }
  
  // Fallback: try keyboard shortcut
  document.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'd',
    ctrlKey: true,
    bubbles: true
  }));
  
  console.log('Attempted to toggle mute');
}

// Function to toggle video
function toggleVideo() {
  // Try to find the video button using common selectors
  const videoSelectors = [
    '[data-tooltip*="camera"]',
    '[aria-label*="camera"]',
    '[aria-label*="Turn on camera"]',
    '[aria-label*="Turn off camera"]'
  ];
  
  for (const selector of videoSelectors) {
    const videoButton = document.querySelector(selector);
    if (videoButton) {
      videoButton.click();
      console.log('Video button clicked');
      return;
    }
  }
  
  // Fallback: try keyboard shortcut
  document.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'e',
    ctrlKey: true,
    bubbles: true
  }));
  
  console.log('Attempted to toggle video');
}

// Function to show meeting info
function showMeetingInfo() {
  // Get meeting URL
  const meetingUrl = window.location.href;
  
  // Try to get meeting title or ID from the URL
  const meetingId = meetingUrl.match(/meet\.google\.com\/([a-z-]+)/)?.[1] || 'Unknown';
  
  // Get participant count (this might need adjustment based on current Meet UI)
  const participantElements = document.querySelectorAll('[data-participant-id]');
  const participantCount = participantElements.length || 'Unknown';
  
  // Show info in a simple alert (you could make this more sophisticated)
  const info = `Meeting Info:\nID: ${meetingId}\nParticipants: ${participantCount}\nURL: ${meetingUrl}`;
  
  // Create a temporary notification div
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 15px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 300px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;
  notification.textContent = info;
  
  document.body.appendChild(notification);
  
  // Remove notification after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
  
  console.log('Meeting info displayed');
}
