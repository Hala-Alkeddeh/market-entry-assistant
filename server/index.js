// نقطة الدخول لخادم Express — يُشغَّل بشكل منفصل عن خادم Vite
// الواجهة الأمامية (React) تستدعي هذا الخادم فقط، ولا ترى أي مفتاح API مباشرة

import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { answerFromProfile } from './query.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
  const { profile } = req.body ?? {};

  // تحقق أساسي: يجب أن يكون profile كائنًا (object) وليس فارغًا
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    res.status(400).json({ error: 'الحقل profile مطلوب ويجب أن يكون كائن JSON (object)' });
    return;
  }

  try {
    const { result, sources } = await answerFromProfile(profile);
    res.json({ result, sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(config.port, () => {
  console.log(`الخادم يعمل على http://localhost:${config.port}`);
});
