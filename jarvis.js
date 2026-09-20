class JarvisAssistant {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isListening = false;
    
    // Web Speech API Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.setupSpeechListeners();
    } else {
      this.updateStatus("Speech Recognition not supported on this browser.");
    }
  }

  // --- SPEAK RESPONSE ---
  speak(text) {
    this.updateStatus(text);
    if (this.synth.speaking) this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.95;
    utterance.rate = 1.0;

    const voices = this.synth.getVoices();
    const voice = voices.find(v => v.name.includes('Google') || v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (this.isListening) {
        setTimeout(() => this.startListening(), 400);
      }
    };

    this.synth.speak(utterance);
  }

  // --- VOICE LISTENING CONTROLS ---
  toggleListening() {
    if (this.isListening) {
      this.isListening = false;
      if (this.recognition) this.recognition.stop();
      this.updateHUD(false);
      this.speak("Standby mode engaged.");
    } else {
      this.isListening = true;
      this.updateHUD(true);
      this.speak("JARVIS online. How can I assist you?");
    }
  }

  startListening() {
    try {
      if (this.recognition) this.recognition.start();
    } catch (e) {}
  }

  setupSpeechListeners() {
    this.recognition.onstart = () => this.updateStatus("Listening...");
    
    this.recognition.onresult = (event) => {
      const command = event.results[0][0].transcript;
      this.updateStatus(`You: "${command}"`);
      this.processCommand(command);
    };

    this.recognition.onend = () => {
      if (this.isListening && !this.synth.speaking) {
        this.startListening();
      }
    };
  }

  // --- TASK EXECUTION & AI BRAIN ---
  async processCommand(command) {
    const cmd = command.toLowerCase().trim();

    // Local Tasks (Web Actions)
    if (cmd.includes('open google')) {
      this.speak("Opening Google.");
      window.open('https://www.google.com', '_blank');
      return;
    }
    if (cmd.includes('open youtube')) {
      this.speak("Opening YouTube.");
      window.open('https://www.youtube.com', '_blank');
      return;
    }

    // Retrieve API Key from input field or local storage
    const keyInput = document.getElementById('apiKeySlot') || document.getElementById('apiKeyInput');
    const apiKey = keyInput ? keyInput.value.trim() : (localStorage.getItem('JARVIS_API_KEY') || '');

    if (!apiKey) {
      this.speak("Please enter your Gemini API key in the input field to enable full AI task processing.");
      return;
    }

    // Call Gemini API for dynamic tasks & queries
    this.updateStatus("Processing task with AI core...");
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are J.A.R.V.I.S., an AI assistant. Keep responses brief, direct, and conversational (max 2-3 sentences). User task: ${command}` }] }]
          })
        }
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]) {
        const aiReply = data.candidates[0].content.parts[0].text;
        this.speak(aiReply);
      } else {
        this.speak("API Error. Please check if your API Key is valid.");
      }
    } catch (err) {
      this.speak("Network connection error. Unable to process request.");
    }
  }

  updateHUD(active) {
    const voiceStatus = document.getElementById('voiceStatus');
    const coreStatus = document.getElementById('coreStatus');
    if (voiceStatus) {
      voiceStatus.innerText = active ? "• ACTIVE" : "LOCKED";
      voiceStatus.className = active ? "status-val green" : "status-val red";
    }
    if (coreStatus) coreStatus.innerText = active ? "CORE LISTENING" : "CORE ACTIVE";
  }

  updateStatus(msg) {
    const log = document.getElementById('statusLog') || document.getElementById('reply');
    if (log) log.innerText = msg;
  }
}

const jarvis = new JarvisAssistant();






