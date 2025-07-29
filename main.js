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
    console.log('Starting speech recognition from popup context');
    
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in popup context');
      sendCaptionToMeet('Speech recognition not supported in this browser');
      return;
    }

    // Check if online
    if (!navigator.onLine) {
      sendCaptionToMeet('No internet connection - speech recognition requires internet');
      return;
    }

    console.log('webkitSpeechRecognition available:', 'webkitSpeechRecognition' in window);
    console.log('SpeechRecognition available:', 'SpeechRecognition' in window);

    // Show a message that we're requesting permission
    sendCaptionToMeet('🎤 Click "Allow" when prompted for microphone access...');

    // Request microphone permission explicitly first
    requestMicrophonePermission();
  }

  function requestMicrophonePermission() {
    console.log('Requesting microphone permission explicitly');
    
    // Use getUserMedia to request microphone permission
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(stream) {
        console.log('Microphone permission granted');
        sendCaptionToMeet('✅ Microphone access granted - starting speech recognition...');
        
        // Stop the stream immediately as we just needed permission
        stream.getTracks().forEach(track => track.stop());
        
        // Now start speech recognition
        setTimeout(() => {
          initializeSpeechRecognition();
        }, 500);
      })
      .catch(function(error) {
        console.error('Microphone permission denied:', error);
        checkbox.checked = false;
        
        if (error.name === 'NotAllowedError') {
          sendCaptionToMeet('❌ Microphone access denied. Please click "Allow" and try again.');
        } else if (error.name === 'NotFoundError') {
          sendCaptionToMeet('❌ No microphone found. Please check your microphone.');
        } else {
          sendCaptionToMeet('❌ Microphone error: ' + error.message);
        }
      });
  }

  function initializeSpeechRecognition() {
    console.log('Initializing speech recognition in popup context');
    
    // Stop any existing recognition
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.log('Previous recognition already stopped');
      }
      recognition = null;
    }

    // Create speech recognition instance - explicitly use webkitSpeechRecognition
    let SpeechRecognition;
    if ('webkitSpeechRecognition' in window) {
      SpeechRecognition = window.webkitSpeechRecognition;
      console.log('Using webkitSpeechRecognition');
    } else if ('SpeechRecognition' in window) {
      SpeechRecognition = window.SpeechRecognition;
      console.log('Using SpeechRecognition');
    } else {
      console.error('No speech recognition API available');
      sendCaptionToMeet('Speech recognition not available in popup context');
      return;
    }
    
    try {
      recognition = new SpeechRecognition();
      console.log('Speech recognition instance created successfully');
    } catch (error) {
      console.error('Error creating speech recognition instance:', error);
      sendCaptionToMeet('Error creating speech recognition: ' + error.message);
      return;
    }
    
    // Configure speech recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    sendCaptionToMeet('Initializing speech recognition...');
    console.log('Speech recognition configured, setting up event handlers');
    
    // Handle speech recognition results
    recognition.onresult = function(event) {
      console.log('Speech recognition result received');
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
      console.log('Speech recognition started successfully in popup');
      isListening = true;
      sendCaptionToMeet('🎤 Listening... (speak now)');
    };

    // Handle speech recognition end
    recognition.onend = function() {
      console.log('Speech recognition ended in popup');
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
      console.error('Speech recognition error in popup:', event.error);
      
      switch(event.error) {
        case 'no-speech':
          sendCaptionToMeet('No speech detected - try speaking louder');
          break;
        case 'audio-capture':
          sendCaptionToMeet('❌ Microphone access lost. Please allow microphone access and try again.');
          checkbox.checked = false; // Uncheck the box
          break;
        case 'not-allowed':
          sendCaptionToMeet('❌ Microphone permission denied. Please allow microphone access in your browser.');
          checkbox.checked = false; // Uncheck the box
          break;
        case 'network':
          sendCaptionToMeet('Network error - checking connection and retrying...');
          setTimeout(() => {
            if (checkbox.checked && !isListening) {
              console.log('Retrying after network error...');
              try {
                requestMicrophonePermission();
              } catch (e) {
                console.error('Failed to restart after network error:', e);
                sendCaptionToMeet('Network error persists - please check connection');
              }
            }
          }, 3000);
          break;
        case 'service-not-allowed':
          sendCaptionToMeet('❌ Speech service blocked. Please check your browser microphone settings.');
          checkbox.checked = false; // Uncheck the box
          break;
        default:
          sendCaptionToMeet('Speech recognition error: ' + event.error);
      }
      
      isListening = false;
    };

    // Start recognition
    try {
      console.log('Attempting to start speech recognition...');
      recognition.start();
      console.log('Speech recognition start() called successfully');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      sendCaptionToMeet('Error starting speech recognition: ' + error.message);
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
