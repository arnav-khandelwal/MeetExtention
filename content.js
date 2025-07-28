// Content script for Google Meet
console.log('Meet Extension content script loaded');

let captionElement = null;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Content script received message:', request);
  
  if (request.action === 'showCaptions') {
    showCaptions();
    sendResponse({success: true});
  } else if (request.action === 'hideCaptions') {
    hideCaptions();
    sendResponse({success: true});
  }
});

function showCaptions() {
  // Remove existing caption if any
  hideCaptions();
  
  // Create the caption element
  captionElement = document.createElement('div');
  captionElement.id = 'meet-extension-caption';
  captionElement.textContent = 'hi this is a sample text';
  
  // Style the caption
  captionElement.style.cssText = `
    position: fixed;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
    font-size: 16px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 80%;
    text-align: center;
    animation: fadeIn 0.3s ease-in-out;
  `;
  
  // Add fade-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);
  
  // Add to the page
  document.body.appendChild(captionElement);
  
  console.log('Captions shown');
}

function hideCaptions() {
  if (captionElement && captionElement.parentNode) {
    captionElement.parentNode.removeChild(captionElement);
    captionElement = null;
    console.log('Captions hidden');
  }
}

// Try to find meeting controls and position caption accordingly
function adjustCaptionPosition() {
  if (!captionElement) return;
  
  // Try to find the meeting controls bar
  const controlsSelectors = [
    '[data-meeting-controls]',
    '[role="toolbar"]',
    '.VfPpkd-Bz112c-LgbsSe',
    '[jsname="A5il2e"]'
  ];
  
  let controlsBar = null;
  for (const selector of controlsSelectors) {
    controlsBar = document.querySelector(selector);
    if (controlsBar) break;
  }
  
  if (controlsBar) {
    const rect = controlsBar.getBoundingClientRect();
    const newBottom = window.innerHeight - rect.top + 20; // 20px above controls
    captionElement.style.bottom = newBottom + 'px';
    console.log('Caption position adjusted based on controls');
  }
}

// Observe DOM changes to adjust position when controls move
const observer = new MutationObserver(function(mutations) {
  if (captionElement) {
    adjustCaptionPosition();
  }
});

// Start observing when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    observer.observe(document.body, { childList: true, subtree: true });
  });
} else {
  observer.observe(document.body, { childList: true, subtree: true });
}