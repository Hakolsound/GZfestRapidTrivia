const questions = [
    {
        question: "What year did we meet?",
        options: ["2016", "2017", "2018", "2020"],
        correct: "2017"
    },
    {
        question: "What's Fufu's favorite color?",
        options: ["Blue", "Red", "Green", "Purple"],
        correct: "Purple"
    },
    {
        question: "From which country was the first cocktail we drank together originally?",
        options: ["Paris", "Rome", "Barcelona", "Mexico"],
        correct: "Mexico"
    },
    {
        question: "What's Leon's middle name?",
        options: ["James", "David", "Robert", "Sol"],
        correct: "Sol"
    },
    {
        question: "What month is Leon's birthday?",
        options: ["January", "June", "September", "May"],
        correct: "May"
    },
    {
        question: "What was Lua's super power?",
        options: ["Black", "Tuna", "Sit", "Ozen"],
        correct: "Black"
    },
    {
        question: "What's our favorite restaurant?",
        options: ["Sushi Bar", "Italian Corner", "Steakhouse", "Thai Palace"],
        correct: "Sushi Bar"
    },
    {
        question: "What city did we visit on our anniversary?",
        options: ["Paris", "Rome", "New York", "London"],
        correct: "Paris"
    },
    {
        question: "What's my favorite movie genre?",
        options: ["Action", "Comedy", "Horror", "Romance"],
        correct: "Action"
    },
    {
        question: "What instrument did I try to learn?",
        options: ["Piano", "Guitar", "Drums", "Violin"],
        correct: "Guitar"
    },
    {
        question: "What's my go-to coffee order?",
        options: ["Espresso", "Cappuccino", "Latte", "Americano"],
        correct: "Cappuccino"
    },
    {
        question: "What sport do I enjoy watching most?",
        options: ["Football", "Basketball", "Tennis", "Baseball"],
        correct: "Basketball"
    },
    {
        question: "What's our song?",
        options: ["Perfect", "Thinking Out Loud", "All of Me", "A Thousand Years"],
        correct: "Perfect"
    },
    {
        question: "What's my favorite season?",
        options: ["Spring", "Summer", "Autumn", "Winter"],
        correct: "Summer"
    },
    {
        question: "Where is Leon going tomorrow?",
        options: ["Kindergarden", "SabaSavta", "Sukka", "Albania"],
        correct: "Albania"
    }
];

let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 7.5;
let timerInterval = null;
let isAnswered = false;
const MAX_TIME = 7.5;

// Audio context for sound effects
let audioContext;
let tickSound;
let correctSound;
let wrongSound;
let urgentTick;

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playTick() {
    if (!audioContext) return;
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
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
        console.log('Tick sound failed:', e);
    }
}

function playUrgentTick() {
    if (!audioContext) return;
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 1400;
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.log('Urgent tick sound failed:', e);
    }
}

function playCorrect() {
    if (!audioContext) return;
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        // Play three ascending tones
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = freq;

            const startTime = audioContext.currentTime + (i * 0.08);
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.2);
        });
    } catch (e) {
        console.log('Correct sound failed:', e);
    }
}

function playWrong() {
    if (!audioContext) return;
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        // Play harsh buzzer
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 180;

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        // Add a secondary lower tone for extra harshness
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.type = 'square';
        oscillator2.frequency.value = 90;

        gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Wrong sound failed:', e);
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
            // Opening fanfare
            { freq: 523.25, time: 0, duration: 0.3, gain: 0.3 },      // C
            { freq: 659.25, time: 0.3, duration: 0.3, gain: 0.3 },    // E
            { freq: 783.99, time: 0.6, duration: 0.3, gain: 0.3 },    // G
            { freq: 1046.50, time: 0.9, duration: 0.5, gain: 0.35 },  // C (high)

            // Triumphant ending
            { freq: 783.99, time: 1.4, duration: 0.2, gain: 0.3 },    // G
            { freq: 1046.50, time: 1.6, duration: 0.2, gain: 0.3 },   // C
            { freq: 1318.51, time: 1.8, duration: 0.6, gain: 0.4 }    // E (very high, held)
        ];

        melody.forEach(note => {
            // Main tone
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

            // Add harmonic (octave higher) for richness
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

        // Add timpani-like bass hits
        [0, 0.3, 0.6, 0.9, 1.4].forEach(time => {
            const bass = audioContext.createOscillator();
            const bassGain = audioContext.createGain();

            bass.connect(bassGain);
            bassGain.connect(audioContext.destination);

            bass.type = 'sine';
            bass.frequency.value = 65.41; // C2

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

        firework.style.setProperty('--tx', tx + 'px');
        firework.style.setProperty('--ty', ty + 'px');

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

    // Launch multiple fireworks
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const x = Math.random() * width;
            const y = Math.random() * (height * 0.6);
            createFirework(x, y);
        }, i * 400);
    }

    // Add confetti
    createConfetti();

    // Add star bursts
    createStarBurst();
}

function startGame() {
    // Initialize audio on user interaction (required for mobile)
    if (!audioContext) {
        try {
            initAudio();
            // iOS requires audio context to be resumed after user gesture
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            // Play silent sound to unlock audio on iOS
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            gainNode.gain.value = 0;
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.01);
        } catch (e) {
            console.log('Audio initialization failed:', e);
        }
    }

    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    currentQuestionIndex = 0;
    score = 0;
    updateScore();
    loadQuestion();
}

function loadQuestion() {
    isAnswered = false;
    timeLeft = MAX_TIME;
    const question = questions[currentQuestionIndex];

    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = questions.length;
    document.getElementById('question').textContent = question.question;

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    question.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        btn.onclick = () => handleAnswer(option, question.correct);
        optionsContainer.appendChild(btn);
    });

    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    updateTimerBar();
    let lastSecond = Math.floor(timeLeft);

    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        updateTimerBar();
        updatePointsDisplay();
        updateTimerOverlay();

        const currentSecond = Math.floor(timeLeft);
        if (currentSecond !== lastSecond) {
            lastSecond = currentSecond;
            if (timeLeft <= 2.5) {
                playUrgentTick();
            } else if (timeLeft <= 5) {
                playTick();
            }
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (!isAnswered) {
                nextQuestion();
            }
        }
    }, 100);
}

function updateTimerBar() {
    const percentage = (timeLeft / MAX_TIME) * 100;
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
    const percentage = (timeLeft / MAX_TIME);
    overlay.style.transform = `scaleY(${1 - percentage})`;

    if (timeLeft <= 2.5) {
        overlay.classList.add('critical');
    } else {
        overlay.classList.remove('critical');
    }
}

function updatePointsDisplay() {
    const speedBonus = Math.floor((timeLeft / MAX_TIME) * 50);
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

    // Force reflow to restart animation
    void message.offsetWidth;

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 500);
}

function handleAnswer(selected, correct) {
    if (isAnswered) return;
    isAnswered = true;
    clearInterval(timerInterval);

    const gameScreen = document.getElementById('gameScreen');
    const buttons = document.querySelectorAll('.option-btn');
    const isCorrect = selected === correct;

    buttons.forEach(btn => {
        btn.onclick = null;
        const btnText = btn.textContent;

        if (btnText === correct && btnText === selected) {
            // User selected correct answer
            btn.classList.add('correct');
        } else if (btnText === correct && btnText !== selected) {
            // Show correct answer when user was wrong
            btn.classList.add('correct-answer');
        } else if (btnText === selected && btnText !== correct) {
            // User's wrong selection
            btn.classList.add('incorrect');
        } else {
            // Other wrong options - dim them
            btn.classList.add('dimmed');
        }
    });

    if (isCorrect) {
        playCorrect();
        gameScreen.classList.add('flash-correct');
        showFeedback(true);
        const speedBonus = Math.floor((timeLeft / MAX_TIME) * 50);
        const points = 50 + speedBonus;
        score += points;
        updateScore();

        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
        }
    } else {
        playWrong();
        gameScreen.classList.add('flash-incorrect');
        showFeedback(false);

        // Strong haptic feedback for wrong answer
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 100]);
        }
    }

    setTimeout(() => {
        gameScreen.classList.remove('flash-correct', 'flash-incorrect');
        nextQuestion();
    }, 1000);
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        showReveal();
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function showReveal() {
    playVictoryTune();
    launchFireworks();

    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('revealScreen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;

    // Continue fireworks for dramatic effect
    setTimeout(() => launchFireworks(), 2000);
    setTimeout(() => launchFireworks(), 4000);
}

function restartGame() {
    document.getElementById('revealScreen').classList.add('hidden');
    document.getElementById('welcomeScreen').classList.remove('hidden');
}
