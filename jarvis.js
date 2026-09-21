class JarvisAssistant {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;

    // Google Gemini API Model Endpoint
    this.modelEndpoint = "gemini-2.5-flash";

    this.initSpeechRecognition();
  }

  // --- 1. SPEECH RECOGNITION (LISTENING) ---
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.updateStatus("ERROR: Speech recognition is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.updateHUD(true);
      this.updateStatus("Listening...");
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      this.updateStatus(`You: "${transcript}"`);
      this.processCommand(transcript);
    };

    this.recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        this.updateStatus(`Audio Error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      // Loop listening continuously if JARVIS is active and not speaking
      if (this.isListening && !this.isSpeaking) {
        setTimeout(() => this.startListening(), 300);
      } else if (!this.isListening) {
        this.updateHUD(false);
      }
    };
  }

  // --- 2. VOICE CONTROLS ---
  toggleListening() {
    if (this.isListening) {
      this.isListening = false;
      if (this.recognition) this.recognition.stop();
      if (this.synth.speaking) this.synth.cancel();
      this.updateHUD(false);
      this.speak("Standby mode engaged.");
    } else {
      this.isListening = true;
      this.speak("JARVIS online. Systems operational. How may I assist you?");
    }
  }

  startListening() {
    if (!this.recognition || this.isSpeaking) return;
    try {
      this.recognition.start();
    } catch (e) {
      // Catch instance if recognition is already running
    }
  }

  // --- 3. SPEECH SYNTHESIS (SPEAKING) ---
  speak(text) {
    if (!('speechSynthesis' in window)) {
      this.updateStatus(text);
      return;
    }

    if (this.synth.speaking) {
      this.synth.cancel();
    }

    this.isSpeaking = true;
    this.updateStatus(`JARVIS: ${text}`);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.95; // Deeper tone for JARVIS
    utterance.rate = 1.0;

    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google UK English Male') || 
      v.name.includes('Daniel') || 
      v.name.includes('Google') || 
      v.lang.startsWith('en')
    );

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.isListening) {
        setTimeout(() => this.startListening(), 400);
      }
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
    };

    this.synth.speak(utterance);
  }

  // --- 4. COMMAND PROCESSING & AI BRAIN ---
  async processCommand(command) {
    const cmd = command.toLowerCase().trim();

    // Direct Web Navigation Commands
    if (cmd.includes('open play store') || cmd.includes('play store')) {
      this.speak("Opening Google Play Store.");
      window.location.href = 'https://play.google.com/store';
      return;
    }
    if (cmd.includes('open youtube')) {
      this.speak("Opening YouTube.");
      window.location.href = 'https://www.youtube.com';
      return;
    }
    if (cmd.includes('open google') && !cmd.includes('search')) {
      this.speak("Opening Google.");
      window.location.href = 'https://www.google.com';
      return;
    }

    // Retrieve API Key from HTML input or local storage
    const keySlot = document.getElementById('apiKeySlot') || document.getElementById('apiKeyInput');
    const apiKey = keySlot ? keySlot.value.trim() : (localStorage.getItem('JARVIS_API_KEY') || '');

    if (!apiKey) {
      this.speak("API key missing. Please enter your Gemini API key in the input field above.");
      return;
    }

    this.updateStatus("Querying Gemini Core...");

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelEndpoint}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ 
                text: `You are J.A.R.V.I.S., an intelligent AI voice assistant. Give a clear, direct, and natural response in 1 to 2 short sentences. Command: ${command}` 
              }] 
            }]
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.candidates && data.candidates[0]) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        this.speak(aiResponse);
      } else {
        const errorMessage = data.error ? data.error.message : "API processing failed.";
        this.speak("API Error: " + errorMessage);
      }
    } catch (err) {
      this.speak("Network connection error. Unable to reach AI core.");
    }
  }

  // --- 5. HUD UPDATES ---
  updateHUD(active) {
    const voiceStatus = document.getElementById('voiceStatus');
    const coreStatus = document.getElementById('coreStatus');

    if (voiceStatus) {
      voiceStatus.innerText = active ? "• ACTIVE" : "LOCKED";
      voiceStatus.className = active ? "status-val green" : "status-val red";
    }
    if (coreStatus) {
      coreStatus.innerText = active ? "CORE LISTENING" : "CORE STANDBY";
    }
  }

  updateStatus(msg) {
    const log = document.getElementById('statusLog') || document.getElementById('reply');
    if (log) log.innerText = msg;
  }
}

// Initialize JARVIS
const jarvis = new JarvisAssistant();












