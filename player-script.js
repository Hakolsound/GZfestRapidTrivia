let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 7.5;
let timerInterval = null;
const MAX_TIME = 7.5;
let currentMaxTime = 7.5; // Can be overridden per question

// Store original question text to restore after wrong answer
let originalQuestionText = '';
let wrongAnswerTimeout = null;

// Audio context for sound effects
let audioContext;

// Text-to-Speech
let speechSynth = window.speechSynthesis;
let currentVoice = null;
let ttsReady = false;

// Initialize TTS
function initTTS() {
    if (!speechSynth) {
        console.log('Speech synthesis not supported');
        return;
    }

    // Wait for voices to load
    const loadVoices = () => {
        const voices = speechSynth.getVoices();
        if (voices.length > 0) {
            selectVoice();
            ttsReady = true;
            console.log('TTS initialized with', voices.length, 'voices');
        }
    };

    // Try immediately
    loadVoices();

    // Also listen for voiceschanged event (needed on some browsers)
    if (speechSynth.onvoiceschanged !== undefined) {
        speechSynth.onvoiceschanged = loadVoices;
    }
}

function selectVoice() {
    const voices = speechSynth.getVoices();
    console.log('Available voices:', voices.map(v => v.name));

    // Prefer English voices (US, then GB, then any English)
    currentVoice = voices.find(voice => voice.lang === 'en-US') ||
                   voices.find(voice => voice.lang === 'en-GB') ||
                   voices.find(voice => voice.lang.startsWith('en')) ||
                   voices[0];

    console.log('Selected voice:', currentVoice?.name, currentVoice?.lang);
}

let ttsKeepAliveInterval = null;

function speakText(text, rate = 1.2) {
    if (!speechSynth || !ttsReady) {
        console.log('⚠️ TTS not ready');
        return;
    }

    try {
        const utterance = new SpeechSynthesisUtterance(text);

        if (currentVoice) {
            utterance.voice = currentVoice;
        }

        utterance.rate = rate;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            console.log('🗣️ Speaking:', text);
        };

        utterance.onend = () => {
            console.log('✅ Finished:', text);

            // Safari TTS keepalive: resume after each utterance to prevent timeout
            if (speechSynth.paused) {
                speechSynth.resume();
            }
        };

        utterance.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
                console.error('❌ Speech error:', e.error);
            }
        };

        console.log('🎤 Queueing:', text);
        speechSynth.speak(utterance);

        // Safari workaround: Force resume immediately after speak
        setTimeout(() => {
            if (speechSynth.paused) {
                speechSynth.resume();
            }
        }, 100);
    } catch (e) {
        console.error('❌ Exception:', e);
    }
}

// Start TTS keepalive when audio is unlocked
function startTTSKeepAlive() {
    if (ttsKeepAliveInterval) {
        clearInterval(ttsKeepAliveInterval);
    }

    // Safari TTS keepalive: call resume every 5 seconds to prevent timeout
    ttsKeepAliveInterval = setInterval(() => {
        if (speechSynth && speechSynth.paused) {
            console.log('🔄 TTS keepalive: resuming');
            speechSynth.resume();
        }
    }, 5000);

    console.log('✅ TTS keepalive started');
}

function stopTTSKeepAlive() {
    if (ttsKeepAliveInterval) {
        clearInterval(ttsKeepAliveInterval);
        ttsKeepAliveInterval = null;
        console.log('⏹️ TTS keepalive stopped');
    }
}

// Initialize TTS on load
initTTS();

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playTick() {
    // Don't play tick if speech is ongoing or queued
    if (speechSynth && speechSynth.speaking) {
        return;
    }
    if (!audioContext) {
        console.log('No audioContext for tick');
        return;
    }
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(e => console.error('Resume failed:', e));
        }
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 900;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.08);
    } catch (e) {
        console.error('Tick sound failed:', e);
    }
}

function playUrgentTick() {
    // Don't play tick if speech is ongoing or queued
    if (speechSynth && speechSynth.speaking) {
        return;
    }
    if (!audioContext) {
        console.log('No audioContext for urgent tick');
        return;
    }
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(e => console.error('Resume failed:', e));
        }
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 1400;
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.error('Urgent tick sound failed:', e);
    }
}

function playCorrect() {
    if (!audioContext) {
        console.log('No audioContext for correct sound');
        return;
    }
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(e => console.error('Resume failed:', e));
        }
        console.log('Playing correct sound');
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = freq;

            const startTime = audioContext.currentTime + (i * 0.08);
            gainNode.gain.setValueAtTime(0.35, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.2);
        });
    } catch (e) {
        console.error('Correct sound failed:', e);
    }
}

function playWrong() {
    if (!audioContext) {
        console.log('No audioContext for wrong sound');
        return;
    }
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(e => console.error('Resume failed:', e));
        }
        console.log('Playing wrong sound');
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 180;

        gainNode.gain.setValueAtTime(0.35, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.type = 'square';
        oscillator2.frequency.value = 90;

        gainNode2.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.error('Wrong sound failed:', e);
    }
}

function playVictoryTune() {
    if (!audioContext) return;
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        // Epic orchestral-style victory fanfare
        const melody = [
            { freq: 523.25, time: 0, duration: 0.3, gain: 0.3 },
            { freq: 659.25, time: 0.3, duration: 0.3, gain: 0.3 },
            { freq: 783.99, time: 0.6, duration: 0.3, gain: 0.3 },
            { freq: 1046.50, time: 0.9, duration: 0.5, gain: 0.35 },
            { freq: 783.99, time: 1.4, duration: 0.2, gain: 0.3 },
            { freq: 1046.50, time: 1.6, duration: 0.2, gain: 0.3 },
            { freq: 1318.51, time: 1.8, duration: 0.6, gain: 0.4 }
        ];

        melody.forEach(note => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = note.freq;

            const startTime = audioContext.currentTime + note.time;
            gainNode.gain.setValueAtTime(note.gain, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + note.duration);

            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();

            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);

            oscillator2.type = 'triangle';
            oscillator2.frequency.value = note.freq * 2;

            gainNode2.gain.setValueAtTime(note.gain * 0.3, startTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

            oscillator2.start(startTime);
            oscillator2.stop(startTime + note.duration);
        });

        [0, 0.3, 0.6, 0.9, 1.4].forEach(time => {
            const bass = audioContext.createOscillator();
            const bassGain = audioContext.createGain();

            bass.connect(bassGain);
            bassGain.connect(audioContext.destination);

            bass.type = 'sine';
            bass.frequency.value = 65.41;

            const startTime = audioContext.currentTime + time;
            bassGain.gain.setValueAtTime(0.4, startTime);
            bassGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            bass.start(startTime);
            bass.stop(startTime + 0.3);
        });
    } catch (e) {
        console.log('Victory tune failed:', e);
    }
}

function createFirework(x, y) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700', '#ff6347'];
    const particles = 30;

    for (let i = 0; i < particles; i++) {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = x + 'px';
        firework.style.top = y + 'px';
        firework.style.background = colors[Math.floor(Math.random() * colors.length)];

        const angle = (Math.PI * 2 * i) / particles;
        const velocity = 100 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        firework.style.animation = `fireworkExplode ${1 + Math.random() * 0.5}s ease-out forwards`;
        firework.style.transform = `translate(${tx}px, ${ty}px)`;

        document.getElementById('fireworksContainer').appendChild(firework);

        setTimeout(() => firework.remove(), 2000);
    }
}

function createConfetti() {
    const colors = ['#ffd700', '#ff6347', '#4caf50', '#2196f3', '#ff00ff', '#00ffff'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (2 + Math.random() * 2) + 's';

            document.getElementById('fireworksContainer').appendChild(confetti);

            setTimeout(() => confetti.remove(), 5000);
        }, i * 30);
    }
}

function createStarBurst() {
    const stars = ['⭐', '✨', '💫', '🌟'];
    const positions = [
        { x: '20%', y: '20%' },
        { x: '80%', y: '20%' },
        { x: '20%', y: '80%' },
        { x: '80%', y: '80%' },
        { x: '50%', y: '10%' }
    ];

    positions.forEach((pos, i) => {
        setTimeout(() => {
            const star = document.createElement('div');
            star.className = 'star-burst';
            star.textContent = stars[Math.floor(Math.random() * stars.length)];
            star.style.left = pos.x;
            star.style.top = pos.y;

            document.getElementById('fireworksContainer').appendChild(star);

            setTimeout(() => star.remove(), 2000);
        }, i * 200);
    });
}

function launchFireworks() {
    const container = document.getElementById('fireworksContainer');
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const x = Math.random() * width;
            const y = Math.random() * (height * 0.6);
            createFirework(x, y);
        }, i * 400);
    }

    createConfetti();
    createStarBurst();
}

function updateTimerBar() {
    const percentage = (timeLeft / currentMaxTime) * 100;
    const timerFill = document.getElementById('timerFill');
    timerFill.style.width = percentage + '%';

    if (timeLeft <= 2.5) {
        timerFill.classList.add('critical');
        timerFill.classList.remove('warning');
    } else if (timeLeft <= 5) {
        timerFill.classList.add('warning');
        timerFill.classList.remove('critical');
    } else {
        timerFill.classList.remove('warning', 'critical');
    }
}

function updateTimerOverlay() {
    const overlay = document.getElementById('timerOverlay');
    const percentage = (timeLeft / currentMaxTime);
    overlay.style.transform = `scaleY(${1 - percentage})`;

    if (timeLeft <= 2.5) {
        overlay.classList.add('critical');
    } else {
        overlay.classList.remove('critical');
    }
}

function updatePointsDisplay() {
    const speedBonus = Math.floor((timeLeft / currentMaxTime) * 50);
    const points = 50 + speedBonus;
    const pointsDisplay = document.getElementById('pointsDisplay');
    pointsDisplay.textContent = `+${points} pts`;

    if (timeLeft > 5) {
        pointsDisplay.className = 'points-display high';
    } else if (timeLeft > 2.5) {
        pointsDisplay.className = 'points-display medium';
    } else {
        pointsDisplay.className = 'points-display low';
    }
}

function showFeedback(isCorrect) {
    const overlay = document.getElementById('feedbackOverlay');
    const message = document.getElementById('feedbackMessage');

    message.textContent = isCorrect ? '✓' : '✗';
    message.className = isCorrect ? 'feedback-message feedback-correct' : 'feedback-message feedback-wrong';
    overlay.classList.remove('hidden');

    void message.offsetWidth;

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 500);
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

let celebrationInterval = null;

function showReveal() {
    // Stop any voice monitoring
    stopVoiceVisualization();

    playVictoryTune();
    launchFireworks();

    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('revealScreen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;

    // Launch fireworks continuously forever
    celebrationInterval = setInterval(() => {
        launchFireworks();
        playVictoryTune();
    }, 3000);

    // Dramatic reveal announcement with repetition
    setTimeout(() => {
        speakText("Congratulations! You're going to... Albania!", 1.0);
    }, 1000);

    // Repeat celebration messages
    setInterval(() => {
        const messages = [
            "Amazing! Get ready for an adventure!",
            "Albania awaits!",
            "Pack your bags!",
            "What an amazing score!",
            "You're incredible!",
            "This is going to be epic!",
            "Best birthday surprise ever!",
            "Time to celebrate!"
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        speakText(randomMessage, 1.1);
    }, 8000);

    // Rotating celebration emojis
    const emojiSets = [
        "🎂🎈🎁", "🎉🎊✨", "🌟💫⭐", "🎆🎇🎄",
        "🥳🎁🎈", "🎊🎉🎂", "✨🌟💖", "🎈🎁🎊"
    ];
    let emojiIndex = 0;
    setInterval(() => {
        document.getElementById('celebrationEmojis').textContent = emojiSets[emojiIndex % emojiSets.length];
        emojiIndex++;
    }, 1500);

    // Pulsing title
    const titles = [
        "🎊 Congratulations! 🎊",
        "🌟 Amazing Job! 🌟",
        "🎉 You Did It! 🎉",
        "✨ Fantastic! ✨"
    ];
    let titleIndex = 0;
    setInterval(() => {
        document.getElementById('revealTitle').textContent = titles[titleIndex % titles.length];
        titleIndex++;
    }, 3000);

    // Rotating bonus messages
    const bonusMessages = [
        "🌟 You're Amazing! 🌟",
        "💖 Absolutely Incredible! 💖",
        "🎉 What A Star! 🎉",
        "✨ Simply The Best! ✨",
        "🥳 Party Time! 🥳",
        "🎊 Celebration Mode! 🎊"
    ];
    let bonusIndex = 0;
    setInterval(() => {
        document.getElementById('bonusMessage').textContent = bonusMessages[bonusIndex % bonusMessages.length];
        bonusIndex++;
    }, 2500);

    // Random vibrations for extra excitement (if supported)
    if (navigator.vibrate) {
        setInterval(() => {
            navigator.vibrate([100, 50, 100, 50, 200]);
        }, 5000);
    }
}

// Initialize audio and TTS on any user interaction
let audioInitialized = false;

function initializeAllAudio() {
    console.log('initializeAllAudio called, already initialized:', audioInitialized);

    try {
        // Initialize Web Audio API
        if (!audioContext) {
            console.log('Creating new AudioContext');
            initAudio();
        }

        if (audioContext && audioContext.state === 'suspended') {
            console.log('Resuming suspended AudioContext');
            audioContext.resume().then(() => {
                console.log('AudioContext resumed successfully, state:', audioContext.state);

                // Test audio by playing a silent sound to truly unlock it
                if (!audioInitialized) {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    gain.gain.value = 0.01; // Very quiet test
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.start(audioContext.currentTime);
                    osc.stop(audioContext.currentTime + 0.01);
                    console.log('Test sound played to unlock audio');
                }
            }).catch(e => {
                console.error('Failed to resume AudioContext:', e);
            });
        } else if (audioContext) {
            console.log('AudioContext state:', audioContext.state);
        }

        // Wake up TTS (iOS requires this)
        if (speechSynth) {
            console.log('Waking up speech synthesis');
            console.log('✅ TTS ready');

            initTTS(); // Re-initialize voices
        }

        audioInitialized = true;
        console.log('All audio systems initialized successfully');
    } catch (e) {
        console.error('Audio initialization failed:', e);
    }
}

// Audio will be initialized by the explicit "Enable Audio" button click

// Voice monitoring variables
let micStream = null;
let audioAnalyzer = null;
let voiceAnimationInterval = null;

async function initializeMicrophone() {
    try {
        console.log('Requesting microphone access...');

        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('getUserMedia is not supported in this browser');
            return false;
        }

        // Request microphone with specific constraints to ensure we get real audio
        const constraints = {
            audio: {
                echoCancellation: false,  // Disable echo cancellation
                noiseSuppression: false,  // Disable noise suppression
                autoGainControl: false,   // Disable auto gain (might be silencing)
                channelCount: 1,
                sampleRate: 48000
            }
        };

        micStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Microphone access granted with constraints:', constraints.audio);

        // Diagnostic: Check stream tracks
        const tracks = micStream.getTracks();
        console.log('🔍 Mic stream tracks:', tracks.map(t => ({
            kind: t.kind,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
            label: t.label
        })));

        // Check if audio track is actually getting data
        const audioTrack = tracks.find(t => t.kind === 'audio');
        if (audioTrack) {
            const settings = audioTrack.getSettings();
            const capabilities = audioTrack.getCapabilities();
            console.log('🔍 Audio track settings:', settings);
            console.log('🔍 Audio track capabilities:', capabilities);

            // Try to unmute if muted
            if (audioTrack.muted) {
                console.log('⚠️ Audio track is MUTED - attempting to unmute');
                audioTrack.enabled = true;
            }

            // Apply constraints to disable audio processing that might silence the stream
            try {
                await audioTrack.applyConstraints({
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                });
                console.log('✅ Applied constraints to disable audio processing');
            } catch (e) {
                console.log('⚠️ Could not apply constraints:', e);
            }
        }

        // Create analyzer for real audio input optimized for speech
        const micContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🔍 Mic context state before resume:', micContext.state);

        // Resume audio context if suspended (required on iOS/Safari)
        if (micContext.state === 'suspended') {
            await micContext.resume();
            console.log('🔍 Mic context resumed, new state:', micContext.state);
        }

        const source = micContext.createMediaStreamSource(micStream);
        audioAnalyzer = micContext.createAnalyser();
        audioAnalyzer.fftSize = 4096; // Higher resolution for speech recognition
        audioAnalyzer.smoothingTimeConstant = 0.3; // Less smoothing for faster response
        audioAnalyzer.minDecibels = -90; // Much wider range for quiet environment
        audioAnalyzer.maxDecibels = -10; // Capture full dynamic range
        source.connect(audioAnalyzer);

        console.log('🔍 Mic context final state:', micContext.state);
        console.log('🔍 Analyzer connected - fftSize:', audioAnalyzer.fftSize, 'frequencyBinCount:', audioAnalyzer.frequencyBinCount);

        // Test: Sample data from analyzer to verify connection
        setTimeout(() => {
            const testData = new Uint8Array(audioAnalyzer.frequencyBinCount);
            audioAnalyzer.getByteFrequencyData(testData);
            const testSum = testData.reduce((a, b) => a + b, 0);
            const testAvg = testSum / testData.length;
            console.log('🔍 Test sample from analyzer - Avg:', testAvg, 'Sum:', testSum, 'First 10 values:', Array.from(testData.slice(0, 10)));
        }, 1000);

        console.log('Voice monitoring initialized');
        return true;
    } catch (err) {
        console.log('Microphone access denied or not available:', err);
        // Will fall back to simulated visualization
        return false;
    }
}

function startVoiceVisualization() {
    const voiceMonitor = document.querySelector('.voice-monitor');
    const visualizer = document.getElementById('audioVisualizer');

    // Clear any existing spheres and animation
    visualizer.innerHTML = '';
    if (voiceAnimationInterval) {
        clearInterval(voiceAnimationInterval);
    }

    // Create 60 spheres in circular pattern (like Zoom)
    const numSpheres = 60;
    const spheres = [];
    const maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.36; // Max travel distance (reduced by 20%)
    const minRadius = maxRadius * 0.05; // Start at 5% of max radius

    for (let i = 0; i < numSpheres; i++) {
        const sphere = document.createElement('div');
        sphere.className = 'audio-sphere';
        const angle = (i / numSpheres) * Math.PI * 2;

        // Start position very close to center
        const x = Math.cos(angle) * minRadius;
        const y = Math.sin(angle) * minRadius;

        sphere.style.left = `calc(50% + ${x}px)`;
        sphere.style.top = `calc(50% + ${y}px)`;
        sphere.style.transform = 'translate(-50%, -50%) scale(0.5)';

        visualizer.appendChild(sphere);
        spheres.push({ element: sphere, angle, minRadius, maxRadius, lastScale: 0.5 });
    }

    voiceMonitor.classList.add('active');

    if (audioAnalyzer) {
        console.log('🎤 REAL MICROPHONE ACTIVE - Using live audio input');
        // Use real microphone input with speech frequency focus
        const dataArray = new Uint8Array(audioAnalyzer.frequencyBinCount);
        const sampleRate = 48000;
        const nyquist = sampleRate / 2;

        // Speech frequency range: 300Hz - 3400Hz
        const minFreq = 300;
        const maxFreq = 3400;
        const minIndex = Math.floor((minFreq / nyquist) * dataArray.length);
        const maxIndex = Math.floor((maxFreq / nyquist) * dataArray.length);

        // Track moving average for better normalization and dynamic range
        let movingAvg = 0;
        let peakLevel = 0;
        let minLevel = 255; // Track minimum level
        const smoothingFactor = 0.85; // More smoothing for stability
        const peakDecay = 0.92; // Slower decay for smoother peaks
        const minDecay = 0.999; // Very slow decay for minimum level

        // Global intensity value for all spheres to move together
        let globalIntensity = 0;
        const globalSmoothing = 0.5; // More smoothing to reduce jitter

        // Individual sphere peak hold tracking (like audio equalizer)
        const spherePeaks = new Array(numSpheres).fill(0);
        const peakHoldTime = new Array(numSpheres).fill(0);
        const PEAK_HOLD_MS = 40; // Longer peak hold for smoother visualization

        // Noise gate threshold - increased to reduce sensitivity
        const NOISE_THRESHOLD = 0.15; // Higher threshold to filter background noise

        // Rolling average buffer for better smoothing
        const avgBuffer = [];
        const AVG_BUFFER_SIZE = 5;

        let frameCount = 0;
        voiceAnimationInterval = setInterval(() => {
            audioAnalyzer.getByteFrequencyData(dataArray);

            // Calculate average energy in speech range for normalization
            let sumEnergy = 0;
            let count = 0;
            for (let i = minIndex; i < maxIndex; i++) {
                sumEnergy += dataArray[i];
                count++;
            }
            const avgEnergy = count > 0 ? sumEnergy / count : 0;

            // Debug log every 30 frames (about once per second)
            frameCount++;
            if (frameCount % 30 === 0) {
                console.log('🎙️ Mic input:', Math.round(avgEnergy), '| Min:', Math.round(minLevel), '| Peak:', Math.round(peakLevel), '| Range:', Math.round(peakLevel - minLevel));
            }

            // Update rolling average buffer
            avgBuffer.push(avgEnergy);
            if (avgBuffer.length > AVG_BUFFER_SIZE) {
                avgBuffer.shift();
            }

            // Calculate smoothed average from buffer
            const smoothedAvg = avgBuffer.reduce((a, b) => a + b, 0) / avgBuffer.length;

            // Update moving average and peak/min tracking for dynamic range
            movingAvg = (smoothingFactor * movingAvg) + ((1 - smoothingFactor) * smoothedAvg);

            if (smoothedAvg > peakLevel) {
                peakLevel = smoothedAvg;
            } else {
                peakLevel *= peakDecay; // Slower decay for stability
            }

            if (smoothedAvg < minLevel && smoothedAvg > 1) {
                minLevel = smoothedAvg;
            } else {
                minLevel = minLevel * minDecay + (1 - minDecay) * smoothedAvg;
            }

            // Calculate dynamic range normalization (map minLevel to 0, peakLevel to 1)
            const range = Math.max(peakLevel - minLevel, 10); // Minimum range of 10
            const normalized = range > 5 ? (smoothedAvg - minLevel) / range : 0;
            const clamped = Math.max(0, Math.min(1, normalized));

            // Apply noise gate
            const gated = clamped > NOISE_THRESHOLD ? clamped : 0;

            // Apply less aggressive compression curve and reduced amplification
            const compressed = Math.pow(gated, 0.6); // Gentler compression (was 0.4)
            const amplified = compressed * 1.2; // 1.2x amplification (reduced from 2.0x)
            const targetIntensity = Math.min(1, amplified);

            // Smooth global intensity for stable visualization
            globalIntensity += (targetIntensity - globalIntensity) * (1 - globalSmoothing);

            const currentTime = Date.now();

            spheres.forEach((sphere, i) => {
                // Minimal phase offset for synchronized movement
                const phaseOffset = (i / numSpheres) * 0.05; // Reduced to 5% phase
                const phasedIntensity = globalIntensity * (1 - phaseOffset * 0.2);

                // Peak hold logic like audio equalizers
                if (phasedIntensity > spherePeaks[i]) {
                    spherePeaks[i] = phasedIntensity;
                    peakHoldTime[i] = currentTime;
                } else if (currentTime - peakHoldTime[i] > PEAK_HOLD_MS) {
                    // Moderate decay after hold time
                    spherePeaks[i] = Math.max(phasedIntensity, spherePeaks[i] * 0.75);
                }

                const intensity = spherePeaks[i];

                // Smooth interpolation for scale with reduced range
                const targetScale = 0.5 + (intensity * 2.5); // 0.5x to 3.0x (reduced from 4.5x)
                sphere.lastScale += (targetScale - sphere.lastScale) * 0.3; // Smooth interpolation

                // Less aggressive radius calculation for subtle movement
                const logIntensity = intensity > 0 ? Math.pow(intensity, 0.8) : 0; // More conservative curve
                const radius = sphere.minRadius + (logIntensity * (sphere.maxRadius - sphere.minRadius));

                const x = Math.cos(sphere.angle) * radius;
                const y = Math.sin(sphere.angle) * radius;

                sphere.element.style.left = `calc(50% + ${x}px)`;
                sphere.element.style.top = `calc(50% + ${y}px)`;
                sphere.element.style.transform = `translate(-50%, -50%) scale(${sphere.lastScale})`;

                // Alpha increases from center to edge: opaque at r=0 → 80% at r=max
                const radiusRatio = (radius - sphere.minRadius) / (sphere.maxRadius - sphere.minRadius);
                sphere.element.style.opacity = 0.05 + (radiusRatio * 0.6);
            });
        }, 40); // 25fps smooth like Zoom/Teams
    } else {
        console.log('⚠️ NO MICROPHONE - Visualization disabled');
        // No visualization without microphone - spheres stay static at center
        spheres.forEach(sphere => {
            sphere.element.style.opacity = 0.3;
        });
    }
}

function stopVoiceVisualization() {
    if (voiceAnimationInterval) {
        clearInterval(voiceAnimationInterval);
        voiceAnimationInterval = null;
    }

    const spheres = document.querySelectorAll('.audio-sphere');
    const voiceMonitor = document.querySelector('.voice-monitor');

    spheres.forEach(sphere => {
        sphere.style.transform = 'translate(-50%, -50%) scale(0.3)';
        sphere.style.opacity = '0.2';
    });

    if (voiceMonitor) {
        voiceMonitor.classList.remove('active');
    }
}

// WebSocket connection for cross-device communication
let ws = null;
let wsReconnectInterval = null;

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    console.log('Connecting to WebSocket:', wsUrl);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('✅ WebSocket connected');
        if (wsReconnectInterval) {
            clearInterval(wsReconnectInterval);
            wsReconnectInterval = null;
        }
        // Request sync after connection
        sendMessage({ type: 'player_sync_request' });
    };

    ws.onmessage = async (event) => {
        try {
            // Handle both text and Blob data
            let messageText = event.data;
            if (event.data instanceof Blob) {
                messageText = await event.data.text();
            }
            const data = JSON.parse(messageText);
            // Don't log timer_update messages (too frequent)
            if (data.type !== 'timer_update') {
                console.log('📨 Player received message:', data.type, data);
            }
            handleGameMessage(data);
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting...');
        if (!wsReconnectInterval) {
            wsReconnectInterval = setInterval(() => {
                if (!ws || ws.readyState === WebSocket.CLOSED) {
                    connectWebSocket();
                }
            }, 2000);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Send message via WebSocket only
function sendMessage(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

// Initialize WebSocket connection
connectWebSocket();

// Show audio unlock prompt immediately on page load
function showAudioPrompt() {
    // Hide all loading UI
    document.querySelector('.loading-spinner').style.display = 'none';
    document.querySelector('.progress-container').style.display = 'none';
    document.getElementById('loadingTitle').style.display = 'none';
    document.getElementById('loadingText').style.display = 'none';

    // Show audio unlock button immediately
    document.getElementById('audioUnlockPrompt').classList.remove('hidden');
}

// Show audio unlock prompt on page load
showAudioPrompt();

// Fullscreen toggle with 'f' key
document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
});

// Loading sequence (runs after audio is enabled)
let loadingSteps = [
    { progress: 20, text: "Loading voice recognition engine...", delay: 700 },
    { progress: 40, text: "Calibrating microphone...", delay: 300 },
    { progress: 60, text: "Analyzing voice patterns...", delay: 950 },
    { progress: 80, text: "Optimizing speech detection...", delay: 400 },
    { progress: 100, text: "Voice recognition ready!", delay: 150 }
];

let currentStep = 0;

function runLoadingSequence() {
    if (currentStep >= loadingSteps.length) {
        // Hide loading UI and show ready prompt
        document.querySelector('.loading-spinner').style.display = 'none';
        document.querySelector('.progress-container').style.display = 'none';
        document.getElementById('loadingTitle').style.display = 'none';
        document.getElementById('loadingText').style.display = 'none';
        document.getElementById('readyPrompt').classList.remove('hidden');
        return;
    }

    const step = loadingSteps[currentStep];
    document.getElementById('progressBar').style.width = step.progress + '%';
    document.getElementById('loadingText').textContent = step.text;

    currentStep++;
    setTimeout(runLoadingSequence, step.delay);
}

// Handle audio unlock button
document.getElementById('unlockAudioBtn').addEventListener('click', async () => {
    console.log('Audio unlock button clicked');

    // Hide unlock prompt and show waiting message
    document.getElementById('audioUnlockPrompt').classList.add('hidden');
    document.getElementById('loadingTitle').textContent = 'Audio Enabled';
    document.getElementById('loadingText').textContent = 'Waiting for host to start...';
    document.getElementById('loadingText').style.display = 'block';
    document.querySelector('.loading-spinner').style.display = 'none';
    document.querySelector('.progress-container').style.display = 'none';

    // Initialize all audio systems immediately
    initializeAllAudio();

    // Initialize microphone for voice monitoring
    await initializeMicrophone();

    // Start TTS keepalive to prevent Safari from timing out
    startTTSKeepAlive();

    console.log('Audio unlocked, waiting for host to press SPACE');
});

// Unified message handler for WebSocket
function handleGameMessage(data) {
    // Don't log timer_update messages (they're too frequent)
    if (data.type !== 'timer_update') {
        console.log('📨 Handling message:', data.type);
    }

    switch (data.type) {
        case 'ready_to_start':
            // Host pressed ENTER (INIT), start the loading sequence
            console.log('🎬 Host pressed ENTER - starting initialization sequence');

            // Show loading UI
            document.querySelector('.loading-spinner').style.display = 'block';
            document.querySelector('.progress-container').style.display = 'block';
            document.getElementById('loadingTitle').style.display = 'block';
            document.getElementById('loadingTitle').textContent = 'Initializing Voice Recognition...';

            // Start the loading sequence
            currentStep = 0;
            runLoadingSequence();
            break;

        case 'start_game':
            console.log('🚀 Host pressed SPACE - starting game');
            // Audio is already initialized from 'Enable Audio' button - don't re-initialize

            document.getElementById('welcomeScreen').classList.add('hidden');
            document.getElementById('gameScreen').classList.remove('hidden');
            score = 0;
            updateScore();

            // No welcome message - jump straight to questions
            break;

        case 'show_question':
            currentQuestionIndex = data.questionIndex;
            document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
            document.getElementById('totalQuestions').textContent = data.total;

            // Set custom max time if provided, otherwise use default
            currentMaxTime = data.maxTime || MAX_TIME;

            // Clear any pending wrong answer restore timeout
            if (wrongAnswerTimeout) {
                clearTimeout(wrongAnswerTimeout);
                wrongAnswerTimeout = null;
            }

            // Clean up any previous answer styling before showing new question
            const questionElement = document.getElementById('question');
            questionElement.classList.remove('answer-reveal');
            questionElement.style.color = '';
            questionElement.textContent = data.question;

            // Store original question for potential wrong answer restore
            originalQuestionText = data.question;

            document.getElementById('answerFeedback').textContent = '';
            document.getElementById('answerFeedback').style.color = '';

            // Re-show audio visualizer and timer overlay for new question
            const audioVisualizer = document.getElementById('audioVisualizer');
            const timerOverlay = document.getElementById('timerOverlay');
            if (audioVisualizer) {
                audioVisualizer.style.display = 'flex';
            }
            if (timerOverlay) {
                timerOverlay.style.display = 'block';
            }

            // Don't start timer yet - wait for mic to be ready
            timeLeft = currentMaxTime;
            updateTimerBar();
            updateTimerOverlay();
            updatePointsDisplay();

            // Wait for any previous speech to finish before speaking question
            setTimeout(() => {
                console.log('Speaking question:', data.question);
                speakText(data.question, 1.2);

                // Start voice visualization after speech begins
                setTimeout(() => {
                    startVoiceVisualization();
                    const statusText = audioAnalyzer ? 'Listening for your answer...' : '⚠️ Simulated - Microphone not enabled';
                    document.getElementById('listeningStatus').textContent = statusText;

                    // Tell host that mic is ready and timer can start
                    setTimeout(() => {
                        sendMessage({
                            type: 'mic_ready',
                            questionIndex: currentQuestionIndex
                        });
                        console.log('Mic ready - timer can start');
                    }, 300); // Extra delay to ensure visualization is running
                }, 500);
            }, 250);
            break;

        case 'timer_update':
            timeLeft = data.timeLeft;
            updateTimerBar();
            updateTimerOverlay();
            updatePointsDisplay();

            const currentSecond = Math.floor(timeLeft);
            const lastSecond = Math.floor(timeLeft + 0.1);
            if (currentSecond !== lastSecond) {
                if (timeLeft <= 2.5) {
                    playUrgentTick();
                    // Update status to show urgency
                    if (Math.floor(timeLeft) % 2 === 0) {
                        document.getElementById('listeningStatus').textContent = '⚠️ Speak louder! Processing...';
                    }
                } else if (timeLeft <= 5) {
                    playTick();
                    if (Math.floor(timeLeft) === 5) {
                        document.getElementById('listeningStatus').textContent = 'Analyzing your response...';
                    }
                } else if (timeLeft <= 7) {
                    if (Math.floor(timeLeft) === 7) {
                        document.getElementById('listeningStatus').textContent = 'Listening for your answer...';
                    }
                }
            }
            break;

        case 'wrong_try_again':
            // Player said wrong answer - show giant "No!" in center
            const questionEl = document.getElementById('question');

            // Clear any existing timeout to prevent conflicts
            if (wrongAnswerTimeout) {
                clearTimeout(wrongAnswerTimeout);
                wrongAnswerTimeout = null;
            }

            // Show giant "No!" overlay
            questionEl.textContent = `❌ NO!`;
            questionEl.classList.add('answer-reveal');
            questionEl.style.color = '#ff6b6b';

            // TikTok-style overacting happy "No!" with higher pitch
            speakText("No!", 1.4); // Higher rate for excitement

            // Quick flash
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }

            // Restore question after 500ms to allow another attempt
            wrongAnswerTimeout = setTimeout(() => {
                questionEl.textContent = originalQuestionText;
                questionEl.classList.remove('answer-reveal');
                questionEl.style.color = '';
                wrongAnswerTimeout = null;
            }, 500);
            break;

        case 'question_progression':
            // No announcements between questions
            break;

        case 'sync_state':
            // Sync with host's current game state
            console.log('Received sync from host:', data);
            if (data.gameState === 'playing') {
                // Resume game at current question
                document.getElementById('welcomeScreen').classList.add('hidden');
                document.getElementById('gameScreen').classList.remove('hidden');
                currentQuestionIndex = data.currentQuestionIndex;
                document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
                document.getElementById('totalQuestions').textContent = data.total;
                document.getElementById('question').textContent = data.question;
                timeLeft = data.timeLeft;
                updateTimerBar();
                updateTimerOverlay();
            }
            break;

        case 'answer_result':
            const gameScreen = document.getElementById('gameScreen');
            const answerFeedback = document.getElementById('answerFeedback');

            // Clear any pending wrong answer restore timeout
            if (wrongAnswerTimeout) {
                clearTimeout(wrongAnswerTimeout);
                wrongAnswerTimeout = null;
            }

            // Stop voice visualization
            stopVoiceVisualization();

            if (data.isCorrect) {
                playCorrect();
                gameScreen.classList.add('flash-correct');
                showFeedback(true);

                // Hide audio visualizer and timer overlay during correct answer display
                const audioVisualizer = document.getElementById('audioVisualizer');
                const timerOverlay = document.getElementById('timerOverlay');
                if (audioVisualizer) {
                    audioVisualizer.style.display = 'none';
                }
                if (timerOverlay) {
                    timerOverlay.style.display = 'none';
                }

                // Show big answer in the middle, replacing the question
                const questionEl = document.getElementById('question');
                questionEl.textContent = `✓ ${data.answer}`;
                questionEl.classList.add('answer-reveal');

                answerFeedback.textContent = '';
                document.getElementById('listeningStatus').textContent = 'Correct! Great job!';
                document.getElementById('listeningStatus').style.color = '#4caf50';

                // No TTS for correct answers

                const speedBonus = Math.floor((data.timeLeft / currentMaxTime) * 50);
                const points = 50 + speedBonus;
                score += points;
                updateScore();

                if (navigator.vibrate) {
                    navigator.vibrate([50, 30, 50]);
                }

                // Remove answer-reveal class after animation
                setTimeout(() => {
                    questionEl.classList.remove('answer-reveal');
                }, 2500);
            } else {
                playWrong();
                gameScreen.classList.add('flash-incorrect');
                showFeedback(false);
                answerFeedback.textContent = `✗ ${data.answer}`;
                answerFeedback.style.color = '#f44336';
                document.getElementById('listeningStatus').textContent = 'Incorrect. Moving on...';
                document.getElementById('listeningStatus').style.color = '#f44336';

                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100, 50, 100]);
                }
            }

            setTimeout(() => {
                gameScreen.classList.remove('flash-correct', 'flash-incorrect');
                document.getElementById('listeningStatus').style.color = '';
            }, 500);
            break;

        case 'show_reveal':
            showReveal();
            break;

        case 'reset_game':
            console.log('🔄 Resetting game');

            // Reset state
            currentQuestionIndex = 0;
            score = 0;
            timeLeft = MAX_TIME;

            // Cancel speech and stop keepalive
            if (speechSynth) {
                speechSynth.cancel();
            }
            stopTTSKeepAlive();

            // Stop animations and music
            stopVoiceVisualization();
            if (celebrationInterval) {
                clearInterval(celebrationInterval);
                celebrationInterval = null;
            }
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }

            // Stop any audio context sounds
            if (audioContext && audioContext.state === 'running') {
                audioContext.suspend();
                setTimeout(() => {
                    if (audioContext) audioContext.resume();
                }, 100);
            }

            // Reset ALL screens - hide reveal screen
            document.getElementById('welcomeScreen').classList.remove('hidden');
            document.getElementById('gameScreen').classList.add('hidden');
            document.getElementById('revealScreen').classList.add('hidden');
            document.getElementById('revealScreen').classList.remove('active');

            // Reset to waiting state
            document.getElementById('loadingTitle').textContent = 'Waiting for host...';
            document.getElementById('loadingTitle').style.display = 'block';
            document.getElementById('loadingText').textContent = 'The host will start the game when ready';
            document.getElementById('loadingText').style.display = 'block';
            document.querySelector('.loading-spinner').style.display = 'none';
            document.querySelector('.progress-container').style.display = 'none';
            document.getElementById('audioUnlockPrompt').classList.add('hidden');
            document.getElementById('readyPrompt').classList.add('hidden');

            console.log('✅ Player reset complete');
            break;
    }
};
