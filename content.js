console.log('Meet Extension content script loaded');

let captionElement = null;

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
  
  // Style the caption like YouTube captions
  captionElement.style.cssText = `
    position: fixed !important;
    bottom: 120px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background: rgba(0, 0, 0, 0.8) !important;
    color: white !important;
    padding: 8px 12px !important;
    font-family: "YouTube Noto", Roboto, "Arial Unicode MS", Arial, Helvetica, Verdana, "PT Sans Caption", sans-serif !important;
    font-size: 18px !important;
    font-weight: 400 !important;
    line-height: 1.3 !important;
    text-align: center !important;
    border-radius: 0px !important;
    border: none !important;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.5) !important;
    z-index: 999999 !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: none !important;
    max-width: 80% !important;
    word-wrap: break-word !important;
    text-shadow: 
      1px 1px 0 #000,
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      0 1px 0 #000,
      1px 0 0 #000,
      0 -1px 0 #000,
      -1px 0 0 #000 !important;
    letter-spacing: 0px !important;
    white-space: nowrap !important;
  `;
  
  // Add to the page
  document.body.appendChild(captionElement);
  
  // Log element details for debugging
  console.log('YouTube-style captions shown');
  console.log('Caption element:', captionElement);
  console.log('Element position:', captionElement.getBoundingClientRect());
  
  // Add some animation for smooth appearance
  captionElement.style.animation = 'captionFadeIn 0.3s ease-out';
  
  // Add the animation keyframes
  if (!document.getElementById('caption-styles')) {
    const style = document.createElement('style');
    style.id = 'caption-styles';
    style.textContent = `
      @keyframes captionFadeIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
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
  
  console.log('adjustCaptionPosition called but disabled for debugging');
  // Temporarily disabled to test basic positioning
  return;
  
  console.log('Adjusting caption position...');
  
  // Try to find the meeting controls bar
  const controlsSelectors = [
    '[data-meeting-controls]',
    '[role="toolbar"]',
    '.VfPpkd-Bz112c-LgbsSe',
    '[jsname="A5il2e"]',
    '[aria-label*="meeting controls"]',
    '.crqnQb' // Another common Meet controls selector
  ];
  
  let controlsBar = null;
  for (const selector of controlsSelectors) {
    controlsBar = document.querySelector(selector);
    if (controlsBar) {
      console.log('Found controls with selector:', selector);
      break;
    }
  }
  
  if (controlsBar) {
    const rect = controlsBar.getBoundingClientRect();
    console.log('Controls position:', rect);
    
    // Position above controls with some padding
    const newBottom = window.innerHeight - rect.top + 30; // 30px above controls
    captionElement.style.position = 'fixed';
    captionElement.style.bottom = newBottom + 'px';
    captionElement.style.left = '50%';
    captionElement.style.transform = 'translateX(-50%)';
    captionElement.style.top = 'auto'; // Clear any top positioning
    
    console.log('Caption positioned at bottom:', newBottom + 'px');
  } else {
    // Fallback positioning - center of screen
    console.log('Controls not found, using center positioning');
    captionElement.style.position = 'fixed';
    captionElement.style.bottom = '150px';
    captionElement.style.left = '50%';
    captionElement.style.transform = 'translateX(-50%)';
    captionElement.style.top = 'auto';
  }
  
  // Make sure it's still styled properly
  captionElement.style.background = 'rgba(0, 0, 0, 0.8)';
  captionElement.style.border = '2px solid #4285f4'; // Blue border for visibility
  console.log('Caption position adjusted');
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