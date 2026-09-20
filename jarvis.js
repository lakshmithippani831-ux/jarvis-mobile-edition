class JarvisVoiceControl {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.speechQueue = [];

    this.initSpeechRecognition();
    this.initSpeechSynthesis();
  }

  // --- 1. SPEECH RECOGNITION SETUP ---
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.updateStatus("Speech Recognition API is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false; // Capture one command at a time
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    // Event Listeners
    this.recognition.onstart = () => {
      this.updateStatus("Listening for voice commands...");
      this.updateHUD(true);
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      this.updateStatus(`You: "${transcript}"`);
      this.processVoiceCommand(transcript);
    };

    this.recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        this.updateStatus(`Voice Error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      // Loop listening if JARVIS is active and not currently talking
      if (this.isListening && !this.isSpeaking) {
        setTimeout(() => this.startListening(), 300);
      } else if (!this.isListening) {
        this.updateHUD(false);
      }
    };
  }

  // --- 2. SPEECH SYNTHESIS SETUP ---
  initSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      // Warm up voices load
      window.speechSynthesis.onvoiceschanged = () => {
        this.synth.getVoices();
      };
    }
  }

  // --- 3. VOICE ENGINE CONTROLS ---
  toggleVoiceEngine() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startVoiceEngine();
    }
  }

  startVoiceEngine() {
    this.isListening = true;
    this.speak("JARVIS voice protocols online. Listening for your command, boss.");
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.updateHUD(false);
    this.updateStatus("Systems on standby.");
  }

  startListening() {
    if (!this.recognition || this.isSpeaking) return;
    try {
      this.recognition.start();
    } catch (e) {
      // Catch instance where recognition is already running
    }
  }

  // --- 4. NATURAL SPEECH SYNTHESIS (JARVIS VOICE) ---
  speak(text) {
    if (!('speechSynthesis' in window)) {
      this.updateStatus(text);
      return;
    }

    // Stop active speech before outputting new statement
    if (this.synth.speaking) {
      this.synth.cancel();
    }

    this.isSpeaking = true;
    this.updateStatus(`JARVIS: ${text}`);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.95; // Slightly deeper metallic tone
    utterance.rate = 1.0;   // Standard cadence

    // Voice selection priority: Natural/Google English voices
    const voices = this.synth.getVoices();
    const jarvisVoice = voices.find(v => 
      v.name.includes('Google UK English Male') || 
      v.name.includes('Daniel') || 
      v.name.includes('Google') || 
      v.lang.startsWith('en')
    );

    if (jarvisVoice) utterance.voice = jarvisVoice;

    utterance.onend = () => {
      this.isSpeaking = false;
      // Resume listening loop after speech completes
      if (this.isListening) {
        setTimeout(() => this.startListening(), 400);
      }
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
    };

    this.synth.speak(utterance);
  }

  // --- 5. VOICE COMMAND PROCESSOR ---
  async processVoiceCommand(command) {
    const cmd = command.toLowerCase().trim();

    // Direct Web & Local Actions
    if (cmd.includes('hello') || cmd.includes('hey jarvis') || cmd.includes('hi')) {
      this.speak("Greetings, boss. All primary systems are fully operational.");
      return;
    }

    if (cmd.includes('time')) {
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.speak(`The current time is ${timeString}.`);
      return;
    }

    if (cmd.includes('date') || cmd.includes('day')) {
      const dateString = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      this.speak(`Today is ${dateString}.`);
      return;
    }

    if (cmd.includes('open google')) {
      this.speak("Opening Google search.");
      window.location.href = 'https://www.google.com';
      return;
    }

    if (cmd.includes('open youtube')) {
      this.speak("Launching YouTube.");
      window.location.href = 'https://www.youtube.com';
      return;
    }

    if (cmd.includes('open play store') || cmd.includes('play store')) {
      this.speak("Accessing Google Play Store.");
      window.location.href = 'https://play.google.com/store';
      return;
    }

    // AI Query Processing (Gemini API Integration)
    const keyInput = document.getElementById('apiKeySlot') || document.getElementById('apiKeyInput');
    const apiKey = keyInput ? keyInput.value.trim() : (localStorage.getItem('JARVIS_API_KEY') || '');

    if (!apiKey) {
      this.speak("Please enter your Gemini API key into the key field to process dynamic tasks.");
      return;
    }

    this.updateStatus("Querying neural network...");
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are J.A.R.V.I.S., a voice assistant. Answer concisely in 1 to 2 short sentences suitable for text-to-speech output. User query: ${command}` }] }]
          })
        }
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]) {
        const replyText = data.candidates[0].content.parts[0].text;
        this.speak(replyText);
      } else {
        this.speak("API request failed. Please check your credentials.");
      }
    } catch (error) {
      this.speak("Network communication failure. Unable to reach AI core.");
    }
  }

  // --- 6. UI HUD UPDATES ---
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

  updateStatus(message) {
    const statusLog = document.getElementById('statusLog') || document.getElementById('reply');
    if (statusLog) {
      statusLog.innerText = message;
    }
  }
}

// Initialize Voice Control Module
const jarvis = new JarvisVoiceControl();











