export const runtime = "edge";

export default async function (req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const host = req.headers.get("host");
    if (!host) {
      return new Response("Host header is missing", { status: 400 });
    }

    const proto = req.headers.get("x-forwarded-proto") || "https";
    const internalApiUrl = new URL("/api", `${proto}://${host}`);

    // Forward the request to the Node.js backend for processing
    const response = await fetch(internalApiUrl.toString(), {
      method: "POST",
      headers: req.headers,
      body: req.body,
      // @ts-ignore
      duplex: "half",
    });

    // Stream the response from the Node.js backend back to the client
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
