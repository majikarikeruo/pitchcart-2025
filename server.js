import { createServer } from 'http';
import { parse } from 'url';
import formidable from 'formidable';
import handler from './api/index.ts';

const PORT = process.env.PORT || 8787;

const server = createServer(async (req, res) => {
  // CORSヘッダーを追加
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // multipart/form-dataの場合、bodyをパースしてreq.bodyにセット
  if (req.headers['content-type']?.startsWith('multipart/form-data')) {
    // Vercel風のリクエストに変換
    await handler(req, res);
  } else if (req.method === 'POST') {
    // JSONボディをパース
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        req.body = JSON.parse(body);
      } catch (e) {
        req.body = {};
      }
      await handler(req, res);
    });
  } else {
    await handler(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api`);
  console.log(`   POST http://localhost:${PORT}/api/analyze`);
  console.log(`   POST http://localhost:${PORT}/api/analyze/stream`);
  console.log(`   POST http://localhost:${PORT}/api/analyze/emotional_arc`);
  console.log(`   POST http://localhost:${PORT}/api/simulate/structure`);
});
