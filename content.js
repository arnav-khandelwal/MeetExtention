console.log('Meet Extension content script loaded');

let captionElement = null;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Content script received message:', request);
  
  if (request.action === 'updateCaption') {
    updateCaptions(request.text);
    sendResponse({success: true});
  } else if (request.action === 'hideCaptions') {
    hideCaptions();
    sendResponse({success: true});
  }
});

function showCaptions(text = 'Initializing...') {
  // Remove existing caption if any
  hideCaptions();
  
  // Create the caption element
  captionElement = document.createElement('div');
  captionElement.id = 'meet-extension-caption';
  captionElement.textContent = text;
  
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
    white-space: pre-wrap !important;
    min-height: 24px !important;
  `;
  
  // Add to the page
  document.body.appendChild(captionElement);
  
  // Log element details for debugging
  console.log('YouTube-style captions shown with text:', text);
  
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

function updateCaptions(text) {
  if (captionElement) {
    captionElement.textContent = text;
    console.log('Caption updated:', text);
  } else {
    showCaptions(text);
  }
}

function hideCaptions() {
  if (captionElement && captionElement.parentNode) {
    captionElement.parentNode.removeChild(captionElement);
    captionElement = null;
    console.log('Captions hidden');
  }
}