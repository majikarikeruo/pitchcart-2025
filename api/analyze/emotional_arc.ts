import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../index.js";

// Vercel専用：/api/analyze/emotional_arc エンドポイント
export default function emotionalArcHandler(req: VercelRequest, res: VercelResponse) {
  req.url = "/api/analyze/emotional_arc";
  return handler(req, res);
}
