// Popup script for Meet Extension
document.addEventListener('DOMContentLoaded', function() {
  const toggleMuteBtn = document.getElementById('toggleMute');
  const toggleVideoBtn = document.getElementById('toggleVideo');
  const showInfoBtn = document.getElementById('showInfo');
  const statusDiv = document.getElementById('status');

  // Function to show status messages
  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${isError ? 'error' : 'success'}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  // Function to execute content script commands
  function executeCommand(command) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      
      // Check if we're on a Google Meet page
      if (!currentTab.url.includes('meet.google.com')) {
        showStatus('Please navigate to a Google Meet page first', true);
        return;
      }
      
      chrome.tabs.sendMessage(currentTab.id, {action: command}, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Error: Make sure you\'re in a Google Meet call', true);
        } else if (response && response.success) {
          showStatus(response.message);
        } else {
          showStatus('Command executed', false);
        }
      });
    });
  }

  // Event listeners
  toggleMuteBtn.addEventListener('click', function() {
    executeCommand('toggleMute');
  });

  toggleVideoBtn.addEventListener('click', function() {
    executeCommand('toggleVideo');
  });

  showInfoBtn.addEventListener('click', function() {
    executeCommand('showInfo');
  });
});
