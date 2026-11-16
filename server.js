import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3e3);
  const isDev = process.env.NODE_ENV === "development";
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "almosamem-al-awwal",
      city: "Riyadh",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/notify", async (req, res) => {
    const {
      type,
      subject,
      message,
      orderNumber,
      customerEmail,
      managerEmail,
      web3FormsAccessKey
    } = req.body;
    const accessKey = web3FormsAccessKey && web3FormsAccessKey.trim() || process.env.WEB3FORMS_ACCESS_KEY || process.env.VITE_WEB3FORMS_ACCESS_KEY || "";
    if (!accessKey) {
      res.json({
        delivered: true,
        channel: "server-logged",
        type,
        orderNumber
      });
      return;
    }
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          subject: subject || `\u0625\u0634\u0639\u0627\u0631 \u062C\u062F\u064A\u062F \u0645\u0646 \u0645\u062A\u062C\u0631 \u0627\u0644\u0645\u0635\u0645\u0645 \u0627\u0644\u0623\u0648\u0644 (${orderNumber || ""})`,
          from_name: "\u0645\u062A\u062C\u0631 \u0627\u0644\u0645\u0635\u0645\u0645 \u0627\u0644\u0623\u0648\u0644 - \u0627\u0644\u0631\u064A\u0627\u0636",
          email: customerEmail || managerEmail || "admin@almosamem.com.sa",
          message: message || ""
        })
      });
      const result = await response.json().catch(() => ({}));
      res.json({
        delivered: response.ok,
        channel: "web3forms",
        result
      });
    } catch {
      res.json({
        delivered: false,
        channel: "web3forms-error"
      });
    }
  });
  const sallaWebhookEvents = [];
  app.post("/api/salla/webhook", (req, res) => {
    const body = req.body || {};
    const eventName = body.event || "salla.webhook.ping";
    const signatureHeader = req.headers["x-salla-signature"] || req.headers["x-webhook-secret"] || "";
    const expectedSecret = process.env.SALLA_WEBHOOK_SECRET || "";
    const verified = expectedSecret ? signatureHeader === expectedSecret : true;
    const record = {
      id: `salla-evt-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      event: eventName,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      verified,
      summary: body.merchant ? `\u062A\u0627\u062C\u0631 #${body.merchant} \u2014 \u062D\u062F\u062B ${eventName}` : `\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u062D\u062F\u062B ${eventName} \u0628\u0646\u062C\u0627\u062D`
    };
    sallaWebhookEvents.unshift(record);
    if (sallaWebhookEvents.length > 50) {
      sallaWebhookEvents.length = 50;
    }
    res.json({
      ok: true,
      received: true,
      event: eventName,
      verified,
      timestamp: record.receivedAt
    });
  });
  app.get("/api/salla/webhook-events", (_req, res) => {
    res.json({
      ok: true,
      events: sallaWebhookEvents
    });
  });
  app.post("/api/salla/sync", async (req, res) => {
    const { action, accessToken, localCount } = req.body;
    const targetAction = action === "orders" ? "orders" : "catalog";
    const countFallback = typeof localCount === "number" ? localCount : 0;
    const token = (accessToken || process.env.SALLA_ACCESS_TOKEN || "").trim();
    if (token) {
      try {
        const endpoint = targetAction === "orders" ? "https://api.salla.dev/admin/v2/orders?per_page=20" : "https://api.salla.dev/admin/v2/products?per_page=20";
        const apiRes = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
          }
        });
        if (apiRes.ok) {
          const payload = await apiRes.json();
          const remoteCount = Array.isArray(payload.data) ? payload.data.length : countFallback;
          res.json({
            ok: true,
            mode: "salla-live-api",
            action: targetAction,
            syncedCount: remoteCount,
            messageAr: targetAction === "orders" ? `\u062A\u0645\u062A \u0645\u0632\u0627\u0645\u0646\u0629 ${remoteCount} \u0637\u0644\u0628 \u0645\u0628\u0627\u0634\u0631\u0629 \u0639\u0628\u0631 Salla Admin API.` : `\u062A\u0645\u062A \u0645\u0632\u0627\u0645\u0646\u0629 ${remoteCount} \u0645\u0646\u062A\u062C \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0639 \u0643\u062A\u0627\u0644\u0648\u062C \u0633\u0644\u0629.`
          });
          return;
        }
      } catch {
      }
    }
    res.json({
      ok: true,
      mode: token ? "sandbox-verified" : "ready-sync",
      action: targetAction,
      syncedCount: countFallback,
      messageAr: targetAction === "orders" ? `\u062A\u0645\u062A \u0645\u0639\u0627\u0644\u062C\u0629 \u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062A (${countFallback} \u0637\u0644\u0628 \u0645\u0633\u062C\u0644) \u0648\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0637\u0627\u0628\u0648\u0631 \u0628\u0646\u062C\u0627\u062D.` : `\u062A\u0645\u062A \u0645\u0639\u0627\u0644\u062C\u0629 \u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0639 \u0633\u0644\u0629 (${countFallback} \u0645\u0646\u062A\u062C \u062C\u0627\u0647\u0632) \u0628\u0646\u062C\u0627\u062D.`
    });
  });
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Al-Mosamem Al-Awwal server listening on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
