export default async ({ req, res, log, error }) => {
  if (req.method === "GET") {
    return res.json({
      ok: true,
      service: "redline-scan-worker",
      message: "Use POST with { hash } to trigger a scan from the hosted Redline app."
    });
  }

  if (req.method !== "POST") {
    return res.json({ error: "Method not allowed" }, 405);
  }

  const hash = req.bodyJson?.hash;
  if (!hash) {
    error("Missing scan hash");
    return res.json({ error: "hash is required" }, 400);
  }

  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    error("APP_URL is not configured");
    return res.json({ error: "APP_URL is not configured" }, 500);
  }

  log(`Dispatching Redline scan stream for ${hash}`);
  const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/scan/${hash}/stream`);

  return res.json({
    ok: response.ok,
    hash,
    status: response.status,
    dispatchedAt: new Date().toISOString()
  });
};
