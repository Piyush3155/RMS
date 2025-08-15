// server.js
import express, { json } from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(json()); // ✅ built-in JSON parser, no body-parser needed

const PORT = process.env.SSE_PORT || 4000;
const clients = new Set();

function sendEvent(clientRes, eventName, data) {
  try {
    clientRes.write(`event: ${eventName}\n`);
    clientRes.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {
    // ignore write errors for closed clients
  }
}

app.get("/events", (req, res) => {
  // SSE headers
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  res.flushHeaders();

  // Keep-alive ping
  const keepAlive = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {}
  }, 15000);

  clients.add(res);

  req.on("close", () => {
    clearInterval(keepAlive);
    clients.delete(res);
  });
});

app.post("/notify", (req, res) => {
  const payload = req.body;

  if (!payload || !payload.type) {
    return res.status(400).json({ error: "Missing type in payload" });
  }

  for (const clientRes of clients) {
    sendEvent(clientRes, payload.type, payload.data || {});
  }

  return res.json({ success: true, sentTo: clients.size });
});

app.listen(PORT, () => {
  console.log(`SSE server listening on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/events`);
  console.log(`Notify endpoint: http://localhost:${PORT}/notify`);
});
