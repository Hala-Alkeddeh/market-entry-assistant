// نقطة دخول Vercel Serverless — يُصدِّر تطبيق Express كما هو (بلا listen، بلا
// static) لأن Vercel يقدّم الملفات الثابتة وSPA fallback بنفسه (راجع vercel.json)
import { app } from '../server/app.js';

export default app;
