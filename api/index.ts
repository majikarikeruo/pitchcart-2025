import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "./[...path].js";

// This file handles /api and /api/index only
// All other routes are handled by [...path].ts
export default handler;

