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
      this.speak("Systems online. How can I assist you, boss?");
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

  async processCommand(command) {
    const cmd = command.toLowerCase().trim();

    // 1. Identity & Greetings
    if (cmd.includes('hello') || cmd.includes('hey') || cmd.includes('hi jarvis')) {
      this.speak("Hello boss. All systems are operating at peak performance.");
    } 
    else if (cmd.includes('who are you') || cmd.includes('your name')) {
      this.speak("I am J.A.R.V.I.S., your natural language voice assistant.");
    }

    // 2. Time and Date
    else if (cmd.includes('time')) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.speak(`The current time is ${now}.`);
    } 
    else if (cmd.includes('date') || cmd.includes('day')) {
      const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      this.speak(`Today is ${today}.`);
    }

    // 3. Web Navigation Triggers
    else if (cmd.includes('open google')) {
      this.speak("Opening Google now.");
      window.open('https://www.google.com', '_blank');
    }
    else if (cmd.includes('open youtube')) {
      this.speak("Opening YouTube.");
      window.open('https://www.youtube.com', '_blank');
    }
    else if (cmd.includes('search for') || cmd.startsWith('search ')) {
      const query = cmd.replace('search for', '').replace('search', '').trim();
      this.speak(`Searching Google for ${query}.`);
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }

    // 4. Basic Math Calculations
    else if (cmd.includes('+') || cmd.includes('-') || cmd.includes('x') || cmd.includes('/') || cmd.includes('plus') || cmd.includes('minus') || cmd.includes('times') || cmd.includes('divided by')) {
      try {
        let MathQuery = cmd
          .replace(/plus/g, '+')
          .replace(/minus/g, '-')
          .replace(/times/g, '*')
          .replace(/x/g, '*')
          .replace(/divided by/g, '/');
        
        // Sanitize to math expression only
        let expression = MathQuery.match(/[0-9\+\-\*\/\.\s\(\)]+/g).join('');
        let result = eval(expression);
        this.speak(`The calculation equals ${result}.`);
      } catch (err) {
        this.speak("I couldn't solve that math problem, boss.");
      }
    }

    // 5. Smart General Knowledge Fallback (Wikipedia API)
    else {
      this.updateStatus(`Searching database for: "${command}"...`);
      try {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(command)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.extract) {
            // Read first 2 sentences of Wikipedia summary
            let summary = data.extract.split('. ').slice(0, 2).join('. ');
            this.speak(summary);
            return;
          }
        }
      } catch (e) {
        // Fallback if network/API fails
      }
      
      this.speak(`I found no direct local matches for ${command}. Redirecting query to Google.`);
      window.open(`https://www.google.com/search?q=${encodeURIComponent(command)}`, '_blank');
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




