// نقطة الدخول لخادم Express — يُشغَّل بشكل منفصل عن خادم Vite
// الواجهة الأمامية (React) تستدعي هذا الخادم فقط، ولا ترى أي مفتاح API مباشرة

import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { answerFromProfile } from './query.js';

// لغات الإخراج المدعومة لنص التحليل — أي قيمة أخرى تُرَدّ بصمت إلى 'ar' الافتراضية
const SUPPORTED_LANGUAGES = ['ar', 'en'];

// الحقول الإلزامية في ملف تعريف المستخدم (تطابق حقول type: "select" في Input.jsx)
// freeText غير مدرج هنا عمدًا لأنه اختياري
const REQUIRED_PROFILE_FIELDS = [
  'investorLocation',
  'nationality',
  'hasCompanyAbroad',
  'purpose',
  'sector',
  'businessType',
  'ownershipPreference',
  'capital',
  'partnersCount',
];

// يتحقق من وجود جميع الحقول الإلزامية وأنها ليست فارغة — يمنع إهدار حصة
// Gemini/Pinecone المحدودة على طلبات ناقصة قد تصل عبر استدعاء مباشر لـ API
// يتجاوز واجهة الإدخال (Input.jsx) وتحققها الخاص من جهة العميل
function findMissingRequiredFields(profile) {
  return REQUIRED_PROFILE_FIELDS.filter((field) => {
    const value = profile[field];
    return typeof value !== 'string' || value.trim() === '';
  });
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
  const { profile, language } = req.body ?? {};

  // تحقق أساسي: يجب أن يكون profile كائنًا (object) وليس فارغًا
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    res.status(400).json({ error: 'الحقل profile مطلوب ويجب أن يكون كائن JSON (object)' });
    return;
  }

  // لغة إخراج التحليل (تفضيل عرض وليست معلومة عن وضع المستخدم، لذا لا تدخل ضمن
  // تحقق الحقول الإلزامية أدناه) — أي قيمة غير مدعومة تُرَدّ بصمت إلى 'ar'
  const outputLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : 'ar';

  // تحقق من اكتمال الحقول الإلزامية قبل استدعاء Gemini/Pinecone (يوفّر الحصة المحدودة)
  const missingFields = findMissingRequiredFields(profile);
  if (missingFields.length > 0) {
    // التفاصيل الكاملة (أسماء الحقول الناقصة تحديدًا) تُسجَّل هنا فقط في طرفية الخادم
    // لأغراض تصحيح الأخطاء — ولا تُرسَل أبدًا إلى الواجهة الأمامية
    console.error('POST /api/analyze رفض الطلب: حقول إلزامية ناقصة —', missingFields);
    // نوع خطأ عام فقط (invalid_request) — تُترجمه الواجهة الأمامية لاحقًا إلى رسالة عربية عامة
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  try {
    const { result, sources } = await answerFromProfile(profile, outputLanguage);
    res.json({ result, sources });
  } catch (err) {
    // err.message هنا نوع خطأ آمن فقط (quota/network/auth/unavailable/location/unknown)
    // — التفاصيل الكاملة للخطأ الأصلي سُجِّلت بالفعل داخل query.js عبر console.error
    console.error('POST /api/analyze رفض الطلب بنوع الخطأ:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(config.port, () => {
  console.log(`الخادم يعمل على http://localhost:${config.port}`);
});
