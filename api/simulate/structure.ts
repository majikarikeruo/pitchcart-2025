import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../index.js";

// Vercel専用：/api/simulate/structure エンドポイント
export default function structureHandler(req: VercelRequest, res: VercelResponse) {
  req.url = "/api/simulate/structure";
  return handler(req, res);
}
