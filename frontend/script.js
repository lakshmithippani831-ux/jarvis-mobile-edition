class JarvisMobile {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isListening = false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.updateStatus("Speech API not supported on this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.initListeners();
  }

  speak(text) {
    this.updateStatus(text);

    if (this.synth.speaking) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.9;
    utterance.rate = 1.0;

    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Daniel') || 
      v.lang.startsWith('en')
    );

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      if (this.isListening) {
        setTimeout(() => this.safeStart(), 400);
      }
    };

    this.synth.speak(utterance);
  }

  toggleListening() {
    if (this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      this.updateHUD(false);
      this.speak("Standby mode engaged.");
    } else {
      this.isListening = true;
      this.updateHUD(true);
      this.speak("Systems online. Listening.");
    }
  }

  safeStart() {
    try {
      this.recognition.start();
    } catch (e) {}
  }

  initListeners() {
    this.recognition.onstart = () => {
      this.updateStatus("Listening...");
    };

    this.recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.trim().toLowerCase();
      this.processCommand(command);
    };

    this.recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        this.updateStatus(`Error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening && !this.synth.speaking) {
        this.safeStart();
      }
    };
  }

  processCommand(command) {
    if (command.includes('hello') || command.includes('hey jarvis')) {
      this.speak("Greetings, boss.");
    } 
    else if (command.includes('time')) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.speak(`The current time is ${now}.`);
    } 
    else if (command.includes('date')) {
      const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      this.speak(`Today is ${today}.`);
    } 
    else if (command.includes('open google')) {
      this.speak("Redirecting to Google.");
      window.open('https://www.google.com', '_blank');
    } 
    else if (command.includes('open youtube')) {
      this.speak("Redirecting to YouTube.");
      window.open('https://www.youtube.com', '_blank');
    } 
    else {
      this.speak(`Processed query: "${command}"`);
    }
  }

  updateHUD(active) {
    const voiceStatus = document.getElementById('voiceStatus');
    const coreStatus = document.getElementById('coreStatus');
    
    if (active) {
      if (voiceStatus) {
        voiceStatus.innerText = "• ACTIVE";
        voiceStatus.className = "status-val green";
      }
      if (coreStatus) coreStatus.innerText = "CORE LISTENING";
    } else {
      if (voiceStatus) {
        voiceStatus.innerText = "LOCKED";
        voiceStatus.className = "status-val red";
      }
      if (coreStatus) coreStatus.innerText = "CORE ACTIVE";
    }
  }

  updateStatus(message) {
    const statusLog = document.getElementById('statusLog');
    if (statusLog) {
      statusLog.innerText = message;
      statusLog.scrollTop = statusLog.scrollHeight;
    }
  }
}

const jarvis = new JarvisMobile();



