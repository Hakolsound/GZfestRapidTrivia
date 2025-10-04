// Initialize player access on load
window.addEventListener('DOMContentLoaded', () => {
    initializePlayerAccess();
    requestFullscreen();
});

// Toggle player access section
function togglePlayerAccess() {
    const content = document.getElementById('playerAccessContent');
    const icon = document.getElementById('accessToggleIcon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Request fullscreen on mobile devices
function requestFullscreen() {
    // Only request fullscreen on mobile devices
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const elem = document.documentElement;

        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                console.log('Fullscreen request failed:', err);
            });
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen().catch(err => {
                console.log('Fullscreen request failed:', err);
            });
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen().catch(err => {
                console.log('Fullscreen request failed:', err);
            });
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen().catch(err => {
                console.log('Fullscreen request failed:', err);
            });
        }
    }
}

function initializePlayerAccess() {
    // Get the current URL and generate player URL
    const currentUrl = window.location.href;
    let playerUrl = currentUrl.replace('host.html', 'player.html').replace('/host', '/player.html');

    // Handle root URL
    if (!playerUrl.includes('player.html')) {
        const base = currentUrl.endsWith('/') ? currentUrl : currentUrl + '/';
        playerUrl = base + 'player.html';
    }

    // Display the URL
    document.getElementById('playerUrl').textContent = playerUrl;

    // Generate QR code using a free API service
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(playerUrl)}`;
    const qrImg = document.getElementById('qrCode');
    qrImg.src = qrApiUrl;
    qrImg.style.display = 'block';

    console.log('Player URL:', playerUrl);
}

function openPlayerPage() {
    const currentUrl = window.location.href;
    let playerUrl = currentUrl.replace('host.html', 'player.html').replace('/host', '/player.html');

    // Handle root URL
    if (!playerUrl.includes('player.html')) {
        const base = currentUrl.endsWith('/') ? currentUrl : currentUrl + '/';
        playerUrl = base + 'player.html';
    }

    window.open(playerUrl, '_blank');
}

function copyPlayerUrl() {
    const currentUrl = window.location.href;
    let playerUrl = currentUrl.replace('host.html', 'player.html').replace('/host', '/player.html');

    // Handle root URL
    if (!playerUrl.includes('player.html')) {
        const base = currentUrl.endsWith('/') ? currentUrl : currentUrl + '/';
        playerUrl = base + 'player.html';
    }

    // Copy to clipboard
    navigator.clipboard.writeText(playerUrl).then(() => {
        // Visual feedback
        const btn = document.getElementById('copyUrlBtn');
        const originalText = btn.textContent;
        btn.textContent = 'COPIED!';
        btn.style.color = '#4caf50';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy URL. Please copy manually:\n' + playerUrl);
    });
}

const questions = [
    {
        question: "What year did we first meet?",
        correct: "2018"
    },
    {
        question: "This is Fufu's favorite color",
        correct: "Purple"
    },
    {
        question: "This country is the origin of the first cocktail we drank together",
        correct: "Mexico"
    },
    {
        question: "What's Leon's middle name?",
        correct: "Sol"
    },
    {
        question: "What month is Leon's birthday?",
        correct: "May"
    },
    {
        question: "This is Lua's super power",
        correct: "Black"
    },
    {
        question: "What food do we like the most?",
        correct: "Pizza"
    },
    {
        question: "Do you know why they call it 'Jazz'?",
        correct: "Because the word SHIT was already taken"
    },
    {
        question: "Where was the last Jazz festival we attended?",
        correct: "Smida"
    },
    {
        question: "What's Leon's favorite YouTube genre?",
        correct: "Trucks"
    },
    {
        question: "What instrument did I try to learn to play during elementary school?",
        correct: "Clarinet"
    },
    {
        question: "Fuf's favorite food is",
        correct: "Dagi"
    },
    {
        question: "What's my go-to coffee order?",
        correct: "Americano"
    },
    {
        question: "What sport do I enjoy watching most?",
        correct: "None"
    },
    {
        question: "Quick! Name our song!",
        correct: "Home is whenever I'm with you"
    },
    {
        question: "What's Fufu's most epic PJs",
        correct: "Dinosaur"
    },
    {
        question: "What does J-Lo's 'let's get loud' tune go like?",
        correct: "TA - Ta - Ta na na na ta ta"
    },
    {
        question: "Which festival is being celebrated globally during October?",
        correct: "GeeZey-Fest"
    },
    {
        question: "Where is Fufu going tomorrow morning?",
        correct: "Albania"
    }
];

let currentQuestionIndex = 0;
let gameActive = false;
let timerInterval = null;
let timeLeft = 7.5;
const MAX_TIME = 7.5;

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
    };

    ws.onmessage = async (event) => {
        try {
            // Handle both text and Blob data
            let messageText = event.data;
            if (event.data instanceof Blob) {
                messageText = await event.data.text();
            }
            const data = JSON.parse(messageText);
            console.log('📨 Host received message:', data.type);
            handleMessage(data);
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

// Unified message handler
function handleMessage(data) {
    if (data.type === 'mic_ready' && waitingForMicReady) {
        waitingForMicReady = false;
        document.getElementById('statusDisplay').textContent = 'LISTENING';
        startTimer();
        console.log('Mic ready received - starting timer');
    } else if (data.type === 'player_sync_request') {
        // Player requesting current game state (after reload)
        console.log('Player requested sync');
        sendGameStateToPlayer();
    }
}

// Send message via WebSocket only
function sendMessage(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

// Initialize WebSocket connection
connectWebSocket();

// Send current game state to player
function sendGameStateToPlayer() {
    if (!gameActive) {
        // Game not started or finished
        sendMessage({
            type: 'sync_state',
            gameState: 'idle',
            score: 0
        });
    } else {
        // Game in progress
        sendMessage({
            type: 'sync_state',
            gameState: 'playing',
            currentQuestionIndex: currentQuestionIndex,
            question: questions[currentQuestionIndex].question,
            total: questions.length,
            timeLeft: timeLeft
        });
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Prevent shortcuts if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch(e.key) {
        case 'Enter':
            e.preventDefault();
            if (!document.getElementById('readyBtn').disabled) {
                setReady();
            }
            break;
        case ' ':
            e.preventDefault();
            if (!document.getElementById('startBtn').disabled) {
                startGame();
            }
            break;
        case 'ArrowRight':
        case 'c':
        case 'C':
            e.preventDefault();
            if (!document.getElementById('correctBtn').disabled) {
                markCorrect();
            }
            break;
        case 'ArrowLeft':
        case 'x':
        case 'X':
            e.preventDefault();
            if (!document.getElementById('wrongBtn').disabled) {
                markWrong();
            }
            break;
        case 'r':
        case 'R':
            e.preventDefault();
            resetGame();
            break;
    }
});

function setReady() {
    document.getElementById('readyBtn').disabled = true;
    document.getElementById('statusDisplay').textContent = 'INITIALIZING';

    console.log('📤 Host sending: ready_to_start');
    // Tell player to start loading sequence
    sendMessage({
        type: 'ready_to_start'
    });

    // Enable start button after loading sequence completes (~3.5 seconds)
    setTimeout(() => {
        document.getElementById('startBtn').disabled = false;
        document.getElementById('mobileStartBtn').disabled = false;
        document.getElementById('mobileStartBtn').textContent = 'BEGIN';
        document.getElementById('mobileStartBtn').style.display = 'flex'; // Show button for BEGIN
        document.getElementById('statusDisplay').textContent = 'READY';
    }, 3500);
}

function handleMobileStart() {
    const readyBtn = document.getElementById('readyBtn');
    const startBtn = document.getElementById('startBtn');

    if (!readyBtn.disabled) {
        setReady();
    } else if (!startBtn.disabled) {
        startGame();
    }
}

function startGame() {
    gameActive = true;
    currentQuestionIndex = 0;

    document.getElementById('startBtn').disabled = true;
    document.getElementById('readyBtn').disabled = true;
    document.getElementById('mobileStartBtn').style.display = 'none'; // Hide START button during game
    document.getElementById('statusDisplay').textContent = 'RUNNING';

    console.log('📤 Host sending: start_game');
    // Tell player to start
    sendMessage({
        type: 'start_game'
    });

    loadQuestion();
}

let waitingForMicReady = false;

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        endGame();
        return;
    }

    const question = questions[currentQuestionIndex];

    // Show correct answer in page title instead of "TRIVIA HOST CONTROL v2.0"
    const titleEl = document.getElementById('pageTitle');
    titleEl.textContent = `ANSWER: ${question.correct}`;
    titleEl.classList.add('answer-display-title');

    document.getElementById('questionNum').textContent = `${currentQuestionIndex + 1}/${questions.length}`;
    document.getElementById('questionDisplay').textContent = question.question;
    document.getElementById('answerDisplay').textContent = `ANSWER: ${question.correct}`;
    document.getElementById('answerDisplay').className = 'answer-display';
    document.getElementById('statusDisplay').textContent = 'INITIALIZING MIC';

    document.getElementById('correctBtn').disabled = false;
    document.getElementById('wrongBtn').disabled = false;
    document.getElementById('mobileCorrectBtn').disabled = false;
    document.getElementById('mobileWrongBtn').disabled = false;

    // Tell player to show question
    sendMessage({
        type: 'show_question',
        questionIndex: currentQuestionIndex,
        question: question.question,
        total: questions.length
    });

    // Wait for mic_ready message from player before starting timer
    waitingForMicReady = true;
}

function startTimer() {
    timeLeft = MAX_TIME;
    updateTimerDisplay();

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        updateTimerDisplay();

        // Send timer update to player
        sendMessage({
            type: 'timer_update',
            timeLeft: timeLeft
        });

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeoutQuestion();
        }
    }, 100);
}

function updateTimerDisplay() {
    document.getElementById('timerDisplay').textContent = Math.max(0, timeLeft).toFixed(1);
}

function markCorrect() {
    if (!gameActive) return;

    clearInterval(timerInterval);
    document.getElementById('correctBtn').disabled = true;
    document.getElementById('wrongBtn').disabled = true;
    document.getElementById('mobileCorrectBtn').disabled = true;
    document.getElementById('mobileWrongBtn').disabled = true;

    const correctAnswer = questions[currentQuestionIndex].correct;
    document.getElementById('answerDisplay').textContent = `[OK] ${correctAnswer}`;
    document.getElementById('answerDisplay').className = 'answer-display correct';
    document.getElementById('statusDisplay').textContent = 'CORRECT';

    // Tell player correct
    sendMessage({
        type: 'answer_result',
        isCorrect: true,
        answer: correctAnswer,
        timeLeft: timeLeft
    });

    setTimeout(nextQuestion, 2500);
}

function markWrong() {
    if (!gameActive) return;

    // Don't stop timer - allow unlimited tries until timeout
    const correctAnswer = questions[currentQuestionIndex].correct;
    document.getElementById('answerDisplay').textContent = `[NO] Try again! Answer: ${correctAnswer}`;
    document.getElementById('answerDisplay').className = 'answer-display wrong';
    document.getElementById('statusDisplay').textContent = 'TRY AGAIN';

    // Tell player to say "No" with TikTok-style voice
    sendMessage({
        type: 'wrong_try_again',
        answer: correctAnswer
    });
}

function timeoutQuestion() {
    document.getElementById('correctBtn').disabled = true;
    document.getElementById('wrongBtn').disabled = true;
    document.getElementById('mobileCorrectBtn').disabled = true;
    document.getElementById('mobileWrongBtn').disabled = true;

    const correctAnswer = questions[currentQuestionIndex].correct;
    document.getElementById('answerDisplay').textContent = `[TIMEOUT] Answer was: ${correctAnswer}`;
    document.getElementById('answerDisplay').className = 'answer-display wrong';
    document.getElementById('statusDisplay').textContent = 'TIMEOUT';

    // Tell player timeout
    sendMessage({
        type: 'answer_result',
        isCorrect: false,
        answer: correctAnswer,
        timeLeft: 0
    });

    setTimeout(nextQuestion, 1500);
}

function nextQuestion() {
    currentQuestionIndex++;

    // Announce question progression
    if (currentQuestionIndex < questions.length) {
        const isLastQuestion = currentQuestionIndex === questions.length - 1;
        sendMessage({
            type: 'question_progression',
            isLastQuestion: isLastQuestion
        });
    }

    loadQuestion();
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);

    // Restore title
    const titleEl = document.getElementById('pageTitle');
    titleEl.textContent = 'TRIVIA HOST CONTROL v2.0';
    titleEl.classList.remove('answer-display-title');

    document.getElementById('questionDisplay').textContent = '[COMPLETE] All questions finished.';
    document.getElementById('correctBtn').disabled = true;
    document.getElementById('wrongBtn').disabled = true;
    document.getElementById('mobileCorrectBtn').disabled = true;
    document.getElementById('mobileWrongBtn').disabled = true;
    document.getElementById('readyBtn').disabled = false;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('mobileStartBtn').disabled = false;
    document.getElementById('mobileStartBtn').textContent = 'START';
    document.getElementById('mobileStartBtn').style.display = 'flex'; // Show START button again after game ends
    document.getElementById('timerDisplay').textContent = '-';
    document.getElementById('statusDisplay').textContent = 'FINISHED';

    // Tell player to show reveal
    sendMessage({
        type: 'show_reveal'
    });
}

function resetGame() {
    // Stop any running timers
    clearInterval(timerInterval);

    // Reset game state
    gameActive = false;
    currentQuestionIndex = 0;
    timeLeft = MAX_TIME;
    waitingForMicReady = false;

    // Reset UI
    const titleEl = document.getElementById('pageTitle');
    titleEl.textContent = 'TRIVIA HOST CONTROL v2.0';
    titleEl.classList.remove('answer-display-title');
    document.getElementById('readyBtn').disabled = false;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('correctBtn').disabled = true;
    document.getElementById('wrongBtn').disabled = true;
    document.getElementById('mobileStartBtn').disabled = false;
    document.getElementById('mobileStartBtn').textContent = 'INIT';
    document.getElementById('mobileStartBtn').style.display = 'flex';
    document.getElementById('mobileCorrectBtn').disabled = true;
    document.getElementById('mobileWrongBtn').disabled = true;
    document.getElementById('questionNum').textContent = '-';
    document.getElementById('timerDisplay').textContent = '-';
    document.getElementById('statusDisplay').textContent = 'IDLE';
    document.getElementById('questionDisplay').textContent = 'Ready to start...';
    document.getElementById('answerDisplay').textContent = '';
    document.getElementById('answerDisplay').className = 'answer-display';

    // Tell player to reset
    sendMessage({
        type: 'reset_game'
    });

    console.log('Game reset');
}
