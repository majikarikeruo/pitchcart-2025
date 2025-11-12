export const runtime = "edge";
// import handler from "../index"; // Node.js handler can't be used directly

export default async function analyzeStream(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Vercel Edge Functions don't have access to the local filesystem directly,
  // so we stream the request body to another function that can process it.
  // This internal function will run in the Node.js runtime.
  const internalApiUrl = new URL("/api", req.url);

  const response = await fetch(internalApiUrl.toString(), {
    method: "POST",
    headers: req.headers,
    body: req.body,
    // @ts-ignore
    duplex: "half",
  });

  // Stream the response back to the client
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
