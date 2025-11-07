import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import formidable from 'formidable';
import handler from './api/index.js';

const PORT = process.env.PORT || 8787;

function createVercelResponse(res: ServerResponse): any {
  const vercelRes = {
    status: (code: number) => {
      res.statusCode = code;
      return vercelRes;
    },
    json: (data: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return vercelRes;
    },
    send: (data: any) => {
      res.end(data);
      return vercelRes;
    },
    setHeader: (name: string, value: string | string[]) => {
      res.setHeader(name, value);
      return vercelRes;
    },
    end: (data?: any) => {
      res.end(data);
      return vercelRes;
    },
    write: (chunk: any) => {
      res.write(chunk);
      return vercelRes;
    },
    get headersSent() {
      return res.headersSent;
    },
  };
  return vercelRes;
}

const server = createServer(async (req, res) => {
  try {
    // CORSヘッダーを設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

    // OPTIONSリクエストへの対応
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // JSONボディのパース
    if (req.method === 'POST' && !req.headers['content-type']?.startsWith('multipart/form-data')) {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      await new Promise<void>((resolve) => {
        req.on('end', () => {
          try {
            (req as any).body = body ? JSON.parse(body) : {};
          } catch (e) {
            (req as any).body = {};
          }
          resolve();
        });
      });
    }

    // 元のreqオブジェクトをそのまま使う（Vercel互換性のため）
    const vercelRes = createVercelResponse(res);

    await handler(req as any, vercelRes);
  } catch (error) {
    console.error('Server error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error', message: String(error) }));
    }
  }
});

server.listen(PORT, () => {
  console.log('\n🚀 PitchCart API Server');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📡 Server running at http://localhost:${PORT}`);
  console.log(`\n📊 Available Endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api`);
  console.log(`   POST http://localhost:${PORT}/api/analyze`);
  console.log(`   POST http://localhost:${PORT}/api/analyze/stream`);
  console.log(`   POST http://localhost:${PORT}/api/analyze/emotional_arc`);
  console.log(`   POST http://localhost:${PORT}/api/simulate/structure`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`💡 Tip: Set environment variables in .env file`);
  console.log(`   - LLM_PROVIDER (openai/anthropic/gemini)`);
  console.log(`   - OPENAI_API_KEY or ANTHROPIC_API_KEY`);
  console.log(`   - PERSONA_MODEL, MERGE_MODEL\n`);
});
