class JarvisAssistant {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isListening = false;

    // Initialize Web Speech API Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.updateStatus("Speech Recognition API is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.setupEventListeners();
  }

  // --- SPEAKING FUNCTIONALITY ---
  speak(text) {
    this.updateStatus(text);

    // Cancel any ongoing speech before speaking new text
    if (this.synth.speaking) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.95;
    utterance.rate = 1.0;

    // Pick a natural-sounding voice if available
    const voices = this.synth.getVoices();
    const selectedVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Natural') || 
      v.lang.startsWith('en')
    );
    if (selectedVoice) utterance.voice = selectedVoice;

    // Automatically resume listening after finished speaking (if still active)
    utterance.onend = () => {
      if (this.isListening) {
        setTimeout(() => this.startListening(), 500);
      }
    };

    this.synth.speak(utterance);
  }

  // --- LISTENING CONTROLS ---
  toggleListening() {
    if (this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      this.updateHUD(false);
      this.speak("Standby mode activated.");
    } else {
      this.isListening = true;
      this.updateHUD(true);
      this.speak("JARVIS online. Listening for your command.");
    }
  }

  startListening() {
    try {
      this.recognition.start();
    } catch (e) {
      // Handles cases where recognition is already active
    }
  }

  // --- SPEECH RECOGNITION LISTENERS ---
  setupEventListeners() {
    this.recognition.onstart = () => {
      this.updateStatus("Listening...");
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.updateStatus(`You: "${transcript}"`);
      this.processQuery(transcript);
    };

    this.recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        this.updateStatus(`Audio error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening && !this.synth.speaking) {
        this.startListening();
      }
    };

    // Attach click listener to arc core or mic element if present
    const coreElement = document.getElementById('arcCore') || document.body;
    coreElement.addEventListener('click', () => this.toggleListening());
  }

  // --- COMMAND PROCESSING & VOICE RESPONSES ---
  async processQuery(command) {
    const cmd = command.toLowerCase().trim();

    if (cmd.includes('hello') || cmd.includes('hi') || cmd.includes('hey')) {
      this.speak("Greetings! All core systems are running smoothly.");
    } 
    else if (cmd.includes('time')) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.speak(`The current time is ${timeStr}.`);
    } 
    else if (cmd.includes('date') || cmd.includes('day')) {
      const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      this.speak(`Today is ${dateStr}.`);
    } 
    else if (cmd.includes('open google')) {
      this.speak("Opening Google search.");
      window.open('https://www.google.com', '_blank');
    } 
    else if (cmd.includes('open youtube')) {
      this.speak("Opening YouTube.");
      window.open('https://www.youtube.com', '_blank');
    } 
    else {
      // Query Wikipedia for dynamic speech answers
      this.updateStatus(`Searching information for: ${command}...`);
      try {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cmd)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.extract) {
            const shortExtract = data.extract.split('. ').slice(0, 2).join('. ');
            this.speak(shortExtract);
            return;
          }
        }
      } catch (err) {
        // Fallback to web search
      }

      this.speak(`Searching Google for ${command}.`);
      window.open(`https://www.google.com/search?q=${encodeURIComponent(command)}`, '_blank');
    }
  }

  // --- UI UPDATES ---
  updateHUD(active) {
    const coreStatus = document.getElementById('coreStatus');
    const voiceStatus = document.getElementById('voiceStatus');

    if (active) {
      if (coreStatus) coreStatus.innerText = "CORE LISTENING";
      if (voiceStatus) {
        voiceStatus.innerText = "• ACTIVE";
        voiceStatus.className = "status-val green";
      }
    } else {
      if (coreStatus) coreStatus.innerText = "CORE STANDBY";
      if (voiceStatus) {
        voiceStatus.innerText = "STANDBY";
        voiceStatus.className = "status-val red";
      }
    }
  }

  updateStatus(message) {
    const statusLog = document.getElementById('statusLog');
    if (statusLog) {
      statusLog.innerText = message;
    }
  }
}

// Initialize JARVIS
const jarvis = new JarvisAssistant();





