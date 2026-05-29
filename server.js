const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const INFO_DIR = path.join(__dirname, 'info');
const INDEX_FILE = path.join(__dirname, 'index.html');

fs.mkdirSync(INFO_DIR, { recursive: true });

function sendResponse(res, statusCode, data, contentType = 'application/json') {
    res.writeHead(statusCode, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(contentType === 'application/json' ? JSON.stringify(data) : data);
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (req.method === 'OPTIONS') {
        res.writeHead(200, { 
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

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

                fs.readdir(INFO_DIR, (err, files) => {
                    let nextNum = 1;
                    if (!err && files.length > 0) {
                        const nums = files
                            .map(f => {
                                const match = f.match(/info\((\d+)\)\.json/);
                                return match ? parseInt(match[1]) : 0;
                            })
                            .filter(n => n > 0);
                        if (nums.length > 0) {
                            nextNum = Math.max(...nums) + 1;
                        }
                    }

                    const filename = path.join(INFO_DIR, `info(${nextNum}).json`);
                    const content = JSON.stringify({
                        주소: address || '정보 없음',
                        전화번호: phone || '정보 없음',
                        생년월일: birthdate || '정보 없음',
                        저장_시간: new Date().toISOString()
                    }, null, 2);

                    fs.writeFile(filename, content, 'utf8', err => {
                        if (err) {
                            console.error('저장 실패:', err);
                            return sendResponse(res, 500, { error: 'Unable to save info' });
                        }
                        console.log('저장 완료:', filename);
                        sendResponse(res, 200, { success: true });
                    });
                });
            } catch (error) {
                console.error('오류:', error);
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
