import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../index";

export default function analyzeStream(req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
