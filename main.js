document.addEventListener('DOMContentLoaded', function() {
  const checkbox = document.getElementById('myCheckbox');
  const label = document.querySelector('label[for="myCheckbox"]');
  
  let recognition = null;
  let isListening = false;

  // Function to check if current tab is Google Meet
  function checkIfOnMeet(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const isOnMeet = currentTab.url && currentTab.url.includes('meet.google.com');
      callback(isOnMeet);
    });
  }

  // Function to send caption to content script
  function sendCaptionToMeet(text) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateCaption',
        text: text
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error sending caption:', chrome.runtime.lastError);
        }
      });
    });
  }

  // Function to start speech recognition in popup
  function startSpeechRecognition() {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      sendCaptionToMeet('Speech recognition not supported in this browser');
      return;
    }

    // Check if online
    if (!navigator.onLine) {
      sendCaptionToMeet('No internet connection - speech recognition requires internet');
      return;
    }

    // Check microphone permissions first
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(stream) {
        console.log('Microphone access granted');
        // Stop the stream as we just needed to check permission
        stream.getTracks().forEach(track => track.stop());
        
        // Now start speech recognition
        initializeSpeechRecognition();
      })
      .catch(function(error) {
        console.error('Microphone access denied:', error);
        if (error.name === 'NotAllowedError') {
          sendCaptionToMeet('Microphone permission required - please allow and try again');
        } else if (error.name === 'NotFoundError') {
          sendCaptionToMeet('No microphone found - please check your microphone');
        } else {
          sendCaptionToMeet('Microphone error: ' + error.message);
        }
      });
  }

  function initializeSpeechRecognition() {
    // Stop any existing recognition
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.log('Previous recognition already stopped');
      }
      recognition = null;
    }

    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure speech recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    sendCaptionToMeet('Initializing speech recognition...');
    
    // Handle speech recognition results
    recognition.onresult = function(event) {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      const currentText = finalTranscript + interimTranscript;
      if (currentText.trim()) {
        sendCaptionToMeet(currentText);
      }
      
      console.log('Speech recognized:', currentText);
    };

    // Handle speech recognition start
    recognition.onstart = function() {
      console.log('Speech recognition started successfully');
      isListening = true;
      sendCaptionToMeet('🎤 Listening... (speak now)');
    };

    // Handle speech recognition end
    recognition.onend = function() {
      console.log('Speech recognition ended');
      isListening = false;
      
      // Restart recognition if checkbox is still checked
      if (checkbox.checked) {
        setTimeout(() => {
          if (checkbox.checked && !isListening) {
            console.log('Restarting speech recognition...');
            try {
              initializeSpeechRecognition();
            } catch (error) {
              console.error('Error restarting speech recognition:', error);
              sendCaptionToMeet('Error restarting speech recognition');
            }
          }
        }, 1000);
      }
    };

    // Handle speech recognition errors
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      
      switch(event.error) {
        case 'no-speech':
          sendCaptionToMeet('No speech detected - try speaking louder');
          break;
        case 'audio-capture':
          sendCaptionToMeet('Microphone access denied');
          break;
        case 'not-allowed':
          sendCaptionToMeet('Microphone permission required');
          break;
        case 'network':
          sendCaptionToMeet('Network error - checking connection and retrying...');
          setTimeout(() => {
            if (checkbox.checked && !isListening) {
              console.log('Retrying after network error...');
              try {
                initializeSpeechRecognition();
              } catch (e) {
                console.error('Failed to restart after network error:', e);
                sendCaptionToMeet('Network error persists - please check connection');
              }
            }
          }, 3000);
          break;
        case 'service-not-allowed':
          sendCaptionToMeet('Speech service not available');
          break;
        default:
          sendCaptionToMeet('Speech recognition error: ' + event.error);
      }
      
      isListening = false;
    };

    // Start recognition
    try {
      recognition.start();
      console.log('Starting speech recognition...');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      sendCaptionToMeet('Error starting speech recognition');
    }
  }

  function stopSpeechRecognition() {
    if (recognition) {
      recognition.stop();
      recognition = null;
      isListening = false;
      console.log('Speech recognition stopped');
    }
    
    // Tell content script to hide captions
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'hideCaptions'});
    });
  }

  checkbox.addEventListener('change', function() {
    checkIfOnMeet(function(isOnMeet) {
      if (isOnMeet) {
        if (checkbox.checked) {
          startSpeechRecognition();
          console.log('Starting speech recognition from popup');
        } else {
          stopSpeechRecognition();
          console.log('Stopping speech recognition from popup');
        }
      } else {
        checkbox.checked = false;
        alert('Please open Google Meet first!');
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
