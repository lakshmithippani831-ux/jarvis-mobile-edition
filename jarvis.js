class JarvisAssistant {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isListening = false;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.setupSpeechListeners();
    }
  }

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

  toggleListening() {
    if (this.isListening) {
      this.isListening = false;
      if (this.recognition) this.recognition.stop();
      this.updateHUD(false);
      this.speak("Standby mode engaged.");
    } else {
      this.isListening = true;
      this.updateHUD(true);
      this.speak("JARVIS online. Listening.");
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

  async processCommand(command) {
    const cmd = command.toLowerCase().trim();

    // Direct Website / App Launchers (Bypasses Google Search)
    if (cmd.includes('play store')) {
      this.speak("Opening Play Store.");
      window.location.href = 'https://play.google.com/store';
      return;
    }
    if (cmd.includes('youtube')) {
      this.speak("Opening YouTube.");
      window.location.href = 'https://www.youtube.com';
      return;
    }
    if (cmd.includes('google') && !cmd.includes('search')) {
      this.speak("Opening Google.");
      window.location.href = 'https://www.google.com';
      return;
    }

    // AI Core Processing (Gemini API)
    const keyInput = document.getElementById('apiKeySlot') || document.getElementById('apiKeyInput');
    const apiKey = keyInput ? keyInput.value.trim() : (localStorage.getItem('JARVIS_API_KEY') || '');

    if (!apiKey) {
      this.speak("Please enter your Gemini API key.");
      return;
    }

    this.updateStatus("Processing with AI...");
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are J.A.R.V.I.S., a direct voice assistant. Respond concisely in 1 sentence. Command: ${command}` }] }]
          })
        }
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]) {
        const aiReply = data.candidates[0].content.parts[0].text;
        this.speak(aiReply);
      } else {
        this.speak("API Key Error. Please check your key.");
      }
    } catch (err) {
      this.speak("Connection error.");
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








