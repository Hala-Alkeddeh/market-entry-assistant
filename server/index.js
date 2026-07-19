// نقطة الدخول لخادم Express للتشغيل المحلي فقط (يخدم dist/ بشكل ثابت + يستمع على منفذ)
// على Vercel، api/index.js يستورد نفس app من ./app.js مباشرة دون static/listen —
// الملفات الثابتة والـ SPA fallback هناك من مسؤولية Vercel نفسه (راجع vercel.json)

import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app } from './app.js';
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

app.use(express.static(distDir));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`الخادم يعمل على http://localhost:${config.port}`);
});
