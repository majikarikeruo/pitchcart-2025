import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "./[...slug].js";

// This file handles /api and /api/index only
// All other routes are handled by [...slug].ts
export default handler;

