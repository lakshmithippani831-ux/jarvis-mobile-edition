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

  // --- COMMAND PROCESSING & ACTION ROUTING ---
  async processCommand(command) {
    const cmd = command.toLowerCase().trim();

    // 1. Direct App / Website Launcher Commands
    if (cmd.includes('open play store') || cmd.includes('play store')) {
      this.speak("Opening Google Play Store.");
      window.open('https://play.google.com/store', '_blank');
      return;
    }
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
    if (cmd.includes('open whatsapp')) {
      this.speak("Opening WhatsApp.");
      window.open('https://web.whatsapp.com', '_blank');
      return;
    }

    // 2. Direct Search Action (Only triggers if explicitly asked to search)
    if (cmd.startsWith('search for') || cmd.startsWith('search ')) {
      const query = cmd.replace('search for', '').replace('search', '').trim();
      this.speak(`Searching Google for ${query}.`);
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
      return;
    }

    // 3. AI Brain (Gemini API) for general queries and tasks
    const keyInput = document.getElementById('apiKeySlot') || document.getElementById('apiKeyInput');
    const apiKey = keyInput ? keyInput.value.trim() : (localStorage.getItem('JARVIS_API_KEY') || '');

    if (!apiKey) {
      this.speak("Please enter your Gemini API key in the slot to process AI requests.");
      return;
    }

    this.updateStatus("Processing request with AI core...");
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are J.A.R.V.I.S., an intelligent AI assistant. Answer concisely in 1 to 2 sentences. User: ${command}` }] }]
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
      this.speak("Network connection error.");
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







