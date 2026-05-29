const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const INFO_DIR = path.join(__dirname, 'info');
const INDEX_FILE = path.join(__dirname, 'index.html');

fs.mkdirSync(INFO_DIR, { recursive: true });

function sendResponse(res, statusCode, data, contentType = 'application/json') {
    res.writeHead(statusCode, { 'Content-Type': contentType });
    res.end(contentType === 'application/json' ? JSON.stringify(data) : data);
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
        fs.readFile(INDEX_FILE, 'utf8', (err, data) => {
            if (err) return sendResponse(res, 500, { error: 'Unable to load page' });
            sendResponse(res, 200, data, 'text/html; charset=utf-8');
        });
        return;
    }

    if (req.method === 'POST' && pathname === '/save-info') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                const { address, phone, birthdate } = payload;
                const timestamp = Date.now();
                const filename = path.join(INFO_DIR, `entry-${timestamp}.txt`);
                const content = `Address: ${address || ''}\nPhone: ${phone || ''}\nDate: ${birthdate || ''}\n`;

                fs.writeFile(filename, content, 'utf8', err => {
                    if (err) return sendResponse(res, 500, { error: 'Unable to save info' });
                    sendResponse(res, 200, { success: true });
                });
            } catch (error) {
                sendResponse(res, 400, { error: 'Invalid request data' });
            }
        });
        return;
    }

    sendResponse(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
