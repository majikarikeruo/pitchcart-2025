import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "./index.js";

// Vercel専用：/api/analyze エンドポイント
export default function analyzeHandler(req: VercelRequest, res: VercelResponse) {
  // api/index.ts のハンドラーに処理を委譲
  req.url = "/api/analyze";
  return handler(req, res);
}
