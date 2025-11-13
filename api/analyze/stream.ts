import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../index.js";

// Vercel専用：/api/analyze/stream エンドポイント
export default function streamHandler(req: VercelRequest, res: VercelResponse) {
  // api/index.ts のハンドラーに処理を委譲
  // URLを正規化して渡す
  req.url = "/api/analyze/stream";
  return handler(req, res);
}
