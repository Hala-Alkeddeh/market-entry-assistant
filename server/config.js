// يقرأ متغيرات البيئة (المفاتيح السرية) من ملف .env ويتحقق من وجودها
// لا تكتب أي مفتاح هنا مباشرة — كل القيم تأتي من process.env

import 'dotenv/config';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`متغيّر البيئة المطلوب غير موجود: ${name} (راجع .env.example)`);
  }
  return value;
}

export const config = {
  port: process.env.PORT || 3001,

  // Gemini يُستخدم لكل من الـ embeddings ونموذج الدردشة (قرار نهائي)
  geminiApiKey: process.env.GEMINI_API_KEY,

  // اسم نموذج الـ embedding وأبعاد المتجه — يجب أن تتطابق مع أبعاد فهرس Pinecone
  embeddingModel: 'gemini-embedding-001',
  embeddingDimension: 1536,

  // نموذج الدردشة (chat) المستخدم في query.js لتحليل ملف تعريف المستخدم
  chatModel: 'gemini-2.5-flash',

  // Pinecone (مخزن المتجهات المُختار)
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeIndexName: process.env.PINECONE_INDEX_NAME,

  // وضع المحاكاة (Mock) — للتطوير المحلي فقط، دون استهلاك حصة Gemini المجانية اليومية
  // true فقط عندما تكون القيمة الحرفية "true" في .env؛ أي قيمة أخرى أو عدم التحديد = false
  useMock: process.env.USE_MOCK === 'true',
};

export { requireEnv };
