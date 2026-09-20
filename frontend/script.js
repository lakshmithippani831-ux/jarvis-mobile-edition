class Jarvis {
  constructor() {
    // Initialize Speech Synthesis (JARVIS Speaking)
    this.synth = window.speechSynthesis;
    
    // Initialize Speech Recognition (JARVIS Listening)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech Recognition API is not supported in this browser. Use Chrome or Edge.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;

    this.initListeners();
  }

  // Text-To-Speech Output
  speak(text) {
    if (this.synth.speaking) {
      console.error('JARVIS is already speaking...');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice properties
    utterance.pitch = 0.9; // Slightly lower pitch
    utterance.rate = 1.0;  // Standard speed

    // Attempt to select a clear English voice
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Natural'));
    if (preferredVoice) utterance.voice = preferredVoice;

    this.synth.speak(utterance);
  }

  // Listen for speech inputs
  startListening() {
    this.recognition.start();
    this.speak("Systems online, boss. Listening for commands.");
  }

  stopListening() {
    this.recognition.stop();
    this.speak("Going standby.");
  }

  // Handle incoming speech results
  initListeners() {
    this.recognition.onresult = (event) => {
      const lastIndex = event.results.length - 1;
      const command = event.results[lastIndex][0].transcript.trim().toLowerCase();
      
      console.log(`Received command: "${command}"`);
      this.processCommand(command);
    };

    this.recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
  }

  // Process voice logic
  processCommand(command) {
    if (command.includes('hello') || command.includes('hey jarvis')) {
      this.speak("Hello boss, how can I assist you today?");
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
      this.speak("Opening Google now.");
      window.open('https://www.google.com', '_blank');
    } 
    else if (command.includes('open youtube')) {
      this.speak("Opening YouTube.");
      window.open('https://www.youtube.com', '_blank');
    } 
    else if (command.includes('system status')) {
      this.speak("All core modules operational. Memory usage within normal parameters.");
    } 
    else {
      this.speak("I heard you, but I don't have a command mapped for that yet.");
    }
  }
}

// Instantiate JARVIS
const jarvis = new Jarvis();

