import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'almosamem-al-awwal',
      city: 'Riyadh',
      timestamp: new Date().toISOString(),
    });
  });

  // Web3Forms notification endpoint for new orders & refund requests
  app.post('/api/notify', async (req, res) => {
    const {
      type,
      subject,
      message,
      orderNumber,
      customerEmail,
      managerEmail,
      web3FormsAccessKey,
    } = req.body as {
      type?: string;
      subject?: string;
      message?: string;
      orderNumber?: string;
      customerEmail?: string;
      managerEmail?: string;
      web3FormsAccessKey?: string;
    };

    const accessKey =
      (web3FormsAccessKey && web3FormsAccessKey.trim()) ||
      process.env.WEB3FORMS_ACCESS_KEY ||
      process.env.VITE_WEB3FORMS_ACCESS_KEY ||
      '';

    if (!accessKey) {
      res.json({
        delivered: true,
        channel: 'server-logged',
        type,
        orderNumber,
      });
      return;
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: subject || `إشعار جديد من متجر المصمم الأول (${orderNumber || ''})`,
          from_name: 'متجر المصمم الأول - الرياض',
          email: customerEmail || managerEmail || 'admin@almosamem.com.sa',
          message: message || '',
        }),
      });
      const result = await response.json().catch(() => ({}));
      res.json({
        delivered: response.ok,
        channel: 'web3forms',
        result,
      });
    } catch {
      res.json({
        delivered: false,
        channel: 'web3forms-error',
      });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Al-Mosamem Al-Awwal server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
