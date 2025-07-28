document.addEventListener('DOMContentLoaded', function() {
  const checkbox = document.getElementById('myCheckbox');
  const label = document.querySelector('label[for="myCheckbox"]');

  // Function to check if current tab is Google Meet
  function checkIfOnMeet(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const isOnMeet = currentTab.url && currentTab.url.includes('meet.google.com');
      callback(isOnMeet);
    });
  }

  checkbox.addEventListener('change', function() {
    checkIfOnMeet(function(isOnMeet) {
      if (isOnMeet) {
        // Send message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (checkbox.checked) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'showCaptions'}, function(response) {
              if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
                alert('Error: Please refresh the Google Meet page and try again');
              } else {
                console.log('Captions enabled on Meet page');
                alert('Captions feature enabled!');
              }
            });
          } else {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'hideCaptions'}, function(response) {
              if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
              } else {
                console.log('Captions disabled on Meet page');
                alert('Captions feature disabled!');
              }
            });
          }
        });
      }
    });
  });

  checkIfOnMeet(function(isOnMeet) {
    if (!isOnMeet) {
      checkbox.disabled = true;
      checkbox.title = 'Please open Google Meet first';
      label.classList.add('disabled');
      label.textContent = 'Show Captions (Open Meet first)';
      console.log('Extension loaded - Not on Google Meet, checkbox disabled');
    } else {
      checkbox.disabled = false;
      checkbox.title = 'Toggle captions';
      label.classList.remove('disabled');
      label.textContent = 'Show Captions';
      console.log('Extension loaded - On Google Meet, checkbox enabled');
    }
  });

  console.log('Extension loaded');
});
