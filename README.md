# 🎉 RapidTrivia - Birthday Surprise Trivia Game

A cross-device birthday trivia game with voice recognition illusion, real-time microphone visualization, and an epic Albania reveal!

## 🎮 Features

- **Cross-Device Control**: Host controls the game secretly on their phone while the player sees questions on another device
- **Voice Recognition Illusion**: Player thinks they're using voice recognition, but host secretly marks answers as correct/wrong
- **Real-Time Audio Visualization**: Beautiful circular microphone visualization with 60 animated spheres
- **Text-to-Speech**: Questions are read aloud with natural voice
- **Timer Overlay**: Sandclock gradient effect covering the screen as time runs out
- **Score Tracking**: Points awarded based on speed (50 base + up to 50 speed bonus)
- **Epic Reveal**: Fireworks, confetti, and celebration when revealing the Albania trip!
- **HTTPS/WebSocket**: Secure cross-device communication over local network

## 🚀 Setup

### Prerequisites
- Node.js installed
- Two devices on the same network (e.g., phone for host, laptop/tablet for player)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Hakolsound/GZfestRapidTrivia.git
cd GZfestRapidTrivia
```

2. Install dependencies:
```bash
npm install
```

3. Generate SSL certificates (required for microphone access on network):
```bash
openssl req -x509 -newkey rsa:2048 -keyout localhost-key.pem -out localhost-cert.pem -days 365 -nodes -subj "/CN=localhost"
```

4. Start the server:
```bash
node server.js
```

The server will start on `https://0.0.0.0:3443`

## 🎯 How to Play

### On Host Device (Phone):

1. Open `https://[YOUR-IP]:3443/host.html` on your phone
2. You'll see a QR code - scan it or copy the URL for the player
3. Press **ENTER** to initialize the player's screen
4. Press **SPACE** to start the game
5. Use keyboard shortcuts to secretly control answers:
   - **←** (Left Arrow) = Wrong answer, try again (shows "NO!")
   - **→** (Right Arrow) = Correct answer (shows answer and adds points)
   - **↓** (Down Arrow) = Wrong answer, time's up (moves to next question)
6. Press **R** to reveal the Albania surprise at the end!
7. Press **BACKSPACE** to reset the game

### On Player Device:

1. Open the URL from the QR code or copied link
2. Click **"Enable Audio"** to unlock audio and microphone
3. Wait for host to start the game
4. Answer questions out loud (pretend the game is listening!)
5. Celebrate when you see the Albania reveal! 🎊

### Keyboard Shortcuts (Player):
- **F** = Toggle fullscreen mode

## 📁 Project Structure

```
RapidTrivia/
├── server.js           # HTTPS WebSocket server
├── host.html           # Host control interface
├── host-script.js      # Host control logic
├── host-style.css      # Host styling
├── player.html         # Player display interface
├── player-script.js    # Player game logic
├── style.css           # Player styling
├── package.json        # Node dependencies
└── README.md           # This file
```

## 🛠 Technical Details

### Architecture
- **Server**: Node.js HTTPS server with WebSocket (ws library)
- **Communication**: WebSocket for real-time cross-device messaging
- **Audio**: Web Audio API for microphone visualization and sound effects
- **Speech**: Web Speech Synthesis API for TTS

### Key Features Implementation
- **Microphone Visualization**: FFT analysis of speech frequency range (300Hz-3400Hz) with 60 animated spheres
- **Timer**: Gradient overlay that grows from top to bottom as time runs out
- **Wrong Answer Auto-Hide**: Shows "❌ NO!" for 500ms then restores question for another attempt
- **No Duplicates**: WebSocket-only communication to prevent duplicate TTS announcements

## 🎨 Customization

### Change Questions
Edit the `questions` array in `host-script.js`:

```javascript
const questions = [
    { question: "Your question here?", correct: "Correct Answer" },
    // Add more questions...
];
```

### Change Reveal Destination
Edit the reveal messages in `player-script.js`:

```javascript
speakText("Congratulations! You're going to... [Your Destination]!", 1.0);
```

## 🐛 Troubleshooting

**Microphone not working**: Make sure you're using HTTPS and have granted microphone permissions

**Can't connect between devices**: Check that both devices are on the same network and firewall isn't blocking port 3443

**Audio not playing**: Click "Enable Audio" button - browsers require user interaction to unlock audio

**SSL certificate warning**: Accept the self-signed certificate warning in your browser (it's safe for local network use)

## 📝 License

MIT License - feel free to use this for your own birthday surprises!

## 🙏 Acknowledgments

Built with Claude Code for an epic birthday surprise! 🎂🎈

---

Made with ❤️ for an unforgettable birthday surprise trip to Albania! 🇦🇱
