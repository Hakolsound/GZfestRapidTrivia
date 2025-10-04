const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = 3000;
const HTTPS_PORT = 3443;

// SSL certificate options for HTTPS
const httpsOptions = {
    key: fs.readFileSync('localhost-key.pem'),
    cert: fs.readFileSync('localhost-cert.pem')
};

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Request handler (shared between HTTP and HTTPS)
const requestHandler = (req, res) => {
    let filePath = '.' + req.url;

    // Route handling for host-controlled game
    if (filePath === './' || filePath === './index.html') {
        filePath = './host.html'; // Default to host control page
    } else if (filePath === './host' || filePath === './host/') {
        filePath = './host.html';
    } else if (filePath === './player' || filePath === './player/') {
        filePath = './player.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                    <head><title>Rapid Trivia</title></head>
                    <body style="font-family: monospace; padding: 40px; background: #0a0a0a; color: #e0e0e0;">
                        <h1>🎉 Rapid Trivia</h1>
                        <h2>404 - Page Not Found</h2>
                        <p>Available pages:</p>
                        <ul>
                            <li><a href="/" style="color: #667eea;">Host Control</a> - Control the game (desktop or phone)</li>
                            <li><a href="/player.html" style="color: #667eea;">Player View</a> - Game display for players</li>
                        </ul>
                    </body>
                    </html>
                `, 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
};

// Create both HTTP and HTTPS servers
const httpServer = http.createServer(requestHandler);
const httpsServer = https.createServer(httpsOptions, requestHandler);

// Start HTTP server
httpServer.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();

    console.log('\n🎉 Rapid Trivia Server is running! (Host-Controlled Mode)\n');
    console.log('=' .repeat(60));
    console.log('\n🎮 HOST CONTROL:');
    console.log(`   Local (HTTP):    http://localhost:${PORT}`);

    const networkAddresses = [];
    Object.keys(interfaces).forEach((ifname) => {
        interfaces[ifname].forEach((iface) => {
            if (iface.family === 'IPv4' && !iface.internal) {
                networkAddresses.push(iface.address);
            }
        });
    });

    if (networkAddresses.length > 0) {
        console.log('\n   Network (HTTP):');
        networkAddresses.forEach(addr => {
            console.log(`   📱 http://${addr}:${PORT}`);
        });
    }

    console.log('\n📺 PLAYER VIEW:');
    console.log(`   Local (HTTP):    http://localhost:${PORT}/player.html`);
    if (networkAddresses.length > 0) {
        console.log('\n   Network (HTTP):');
        networkAddresses.forEach(addr => {
            console.log(`   📺 http://${addr}:${PORT}/player.html`);
        });
    }
});

// WebSocket servers for both HTTP and HTTPS
const wss = new WebSocket.Server({ server: httpServer });
const wssSecure = new WebSocket.Server({ server: httpsServer });

// Store all connected clients
const clients = new Set();

// Handle WebSocket connections (shared handler for both HTTP and HTTPS)
function handleWebSocket(ws) {
    clients.add(ws);
    console.log('New WebSocket connection. Total clients:', clients.size);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data.type);

            // Broadcast to all other clients
            clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected. Total clients:', clients.size);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
}

wss.on('connection', handleWebSocket);
wssSecure.on('connection', handleWebSocket);

// Start HTTPS server
httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();

    console.log('\n🔒 HTTPS SERVER (for microphone access on network):');
    console.log('=' .repeat(60));
    console.log(`   Local (HTTPS):   https://localhost:${HTTPS_PORT}`);

    const networkAddresses = [];
    Object.keys(interfaces).forEach((ifname) => {
        interfaces[ifname].forEach((iface) => {
            if (iface.family === 'IPv4' && !iface.internal) {
                networkAddresses.push(iface.address);
            }
        });
    });

    if (networkAddresses.length > 0) {
        console.log('\n   Network (HTTPS) - USE THESE FOR MICROPHONE:');
        networkAddresses.forEach(addr => {
            console.log(`   🎤 https://${addr}:${HTTPS_PORT}`);
            console.log(`   🎤 https://${addr}:${HTTPS_PORT}/player.html`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n⚠️  IMPORTANT FOR MICROPHONE ACCESS:\n');
    console.log('   • Use HTTPS URLs (port 3443) for network access');
    console.log('   • Accept the security warning (self-signed certificate)');
    console.log('   • localhost works with HTTP, network requires HTTPS\n');
    console.log('✨ Setup Options:\n');
    console.log('   Option 1 - Desktop Host + Phone Display:');
    console.log('     • Open HOST on computer (HTTP or HTTPS)');
    console.log('     • Open PLAYER on phone (HTTPS for mic access)');
    console.log('     • Control with keyboard shortcuts\n');
    console.log('   Option 2 - Phone Host + TV/Monitor Display:');
    console.log('     • Open HOST on phone (HTTPS for mic access)');
    console.log('     • Open PLAYER on TV/monitor browser');
    console.log('     • Control with phone touch buttons\n');
    console.log('   Option 3 - All-in-One Phone:');
    console.log('     • Open HOST on phone (HTTPS)');
    console.log('     • Use phone as both host and display\n');
    console.log('=' .repeat(60) + '\n');
});
