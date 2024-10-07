import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import requestHandler, { handleSocket } from './requestHandler.mjs';

const app = express();
const server = http.createServer(app);
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 정적 파일 제공 경로 추가
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.use('/', requestHandler);

// Socket.IO 처리기 연결
handleSocket(server, port);

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
