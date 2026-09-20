class JarvisMobile {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isListening = false;

    // Detect Web Speech API across Android and iOS Safari
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.updateStatus("Speech API not supported. Use Mobile Chrome or Safari.");
      return;
    }

    this.recognition = new SpeechRecognition();
    
    // Mobile Chrome performs best with continuous false to prevent aggressive socket timeouts
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.initListeners();
  }

  // --- VOICE SYNTHESIS (OUTPUT) ---
  speak(text) {
    this.updateStatus(text);

    if (this.synth.speaking) {
      this.synth.cancel(); // Stop active speech for new prompt
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.95;
    utterance.rate = 1.0;

    // Select mobile voice (iOS Siri voice or Google UK/US Male on Android)
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Samantha') || 
      v.name.includes('Daniel') ||
      v.lang.startsWith('en')
    );

    if (preferredVoice) utterance.voice = preferredVoice;

    // Resume recognition automatically after JARVIS finishes speaking on mobile
    utterance.onend = () => {
      if (this.isListening) {
        setTimeout(() => this.safeStart(), 400);
      }
    };

    this.synth.speak(utterance);
  }

  // --- MOBILE MICROPHONE CONTROLS ---
  toggleListening() {
    if (this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      this.speak("Standby mode activated.");
    } else {
      this.isListening = true;
      this.speak("Systems online. Listening.");
    }
  }

  safeStart() {
    try {
      this.recognition.start();
    } catch (e) {
      // Handles mobile edge-cases where recognition is already active
    }
  }

  // --- EVENT LISTENERS ---
  initListeners() {
    this.recognition.onstart = () => {
      this.updateStatus("Listening... (Speak now)");
    };

    this.recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.trim().toLowerCase();
      console.log(`Mobile input received: "${command}"`);
      this.processCommand(command);
    };

    this.recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        console.log("No speech detected on mobile.");
      } else {
        console.error("Mobile Speech Error:", event.error);
        this.updateStatus(`Error: ${event.error}`);
      }
    };

    // Auto-restart loop when recognition stops while active
    this.recognition.onend = () => {
      if (this.isListening && !this.synth.speaking) {
        this.safeStart();
      }
    };
  }

  // --- COMMAND INTERPRETER ---
  processCommand(command) {
    if (command.includes('hello') || command.includes('hey jarvis')) {
      this.speak("Hello boss. Mobile systems ready.");
    } 
    else if (command.includes('time')) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.speak(`It is currently ${now}.`);
    } 
    else if (command.includes('date')) {
      const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      this.speak(`Today is ${today}.`);
    } 
    else if (command.includes('open google')) {
      this.speak("Opening Google.");
      window.open('https://www.google.com', '_blank');
    } 
    else if (command.includes('open youtube')) {
      this.speak("Opening YouTube.");
      window.open('https://www.youtube.com', '_blank');
    } 
    else if (command.includes('status')) {
      this.speak("Mobile core online. Battery and network optimal.");
    } 
    else {
      this.speak(`I heard "${command}", but no command is linked yet.`);
    }
  }

  // Visual text logger for screen
  updateStatus(message) {
    const statusLog = document.getElementById('statusLog');
    if (statusLog) statusLog.innerText = message;
  }
}

// Global instance for HTML binding
const jarvis = new JarvisMobile();


