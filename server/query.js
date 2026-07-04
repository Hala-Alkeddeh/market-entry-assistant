// خط أنابيب الاسترجاع والتوليد (RAG) — تحليل ملف تعريف المستخدم (profile)
// تنبيه مهم: هذا النظام أداة دعم قرار لدخول السوق السوري فقط.
// هو لا يقدّم استشارة قانونية ولا رأيًا قانونيًا — بل يبني فهمًا مبنيًا حصرًا على
// المصادر المفهرسة، ويجهّز ملخصًا يساعد المستخدم عند لقائه بمحامٍ مختص لاحقًا.

import { GoogleGenAI } from '@google/genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { config, requireEnv } from './config.js';
import { buildMockResult } from './mock.js';

const TOP_K = 6;

// حد أقصى لطول مقتطف نص المصدر المعروض في الواجهة
const SNIPPET_MAX_LENGTH = 200;

// أسماء عرض عربية مقروءة لملفات المصادر المعروفة (بدون الامتداد) — مع fallback
// ميكانيكي (استبدال _ و - بمسافة) لأي ملف غير مدرج هنا
const SOURCE_DISPLAY_NAMES = {
  journey: 'القاعدة المعرفية الشاملة لتأسيس الشركات في سوريا',
  inside_syria: 'التأسيس للمقيمين داخل سوريا',
  outside_syria: 'التأسيس للمستثمرين من خارج سوريا',
  foreign_branch: 'تأسيس فرع لشركة أجنبية',
  representative_office: 'تأسيس مكتب تمثيلي',
  llc: 'الشركة المحدودة المسؤولية (LLC)',
  steps: 'خطوات تأسيس شركة في سوريا',
  minesrtyOfEconomyAndIndustry: 'دليل إجراءات التأسيس (وزارة الاقتصاد والصناعة)',
  SyrianCompaniesLaw: 'قانون الشركات السوري',
};

// أنواع الأخطاء "الآمنة" التي يمكن إرسالها إلى الواجهة الأمامية — لا تحتوي على
// أي تفاصيل تقنية (لا status codes، لا أسماء نماذج، لا حصص استخدام، لا روابط API)
// القيم الممكنة: quota | network | auth | unavailable | location | unknown
// تُستخدم من الواجهة الأمامية (Analysis.jsx) لعرض رسالة عربية مناسبة لكل حالة

// يصنّف خطأ خام (من Gemini أو Pinecone أو من requireEnv) إلى أحد الأنواع الآمنة أعلاه
// التفاصيل الكاملة للخطأ (رسالة Google الحرفية، status، إلخ) لا تُستخدم إلا هنا للتصنيف
// ثم تُسجَّل في الطرفية عبر console.error فقط — ولا تُرسَل أبدًا إلى المستخدم
function classifyProviderError(error) {
  const status = error?.status ?? error?.statusCode;
  const message = String(error?.message || error || '');

  // مفتاح API غير موجود أصلاً (خطأ إعداد داخلي من requireEnv) — نعامله كخطأ "auth"
  // حتى لا نكشف اسم متغيّر البيئة المفقود للمستخدم
  if (/متغيّر البيئة المطلوب/i.test(message)) return 'auth';

  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(message)) return 'quota';

  if (status === 401 || status === 403 || /UNAUTHENTICATED|PERMISSION_DENIED|API key/i.test(message)) {
    return 'auth';
  }

  if (status === 503 || /UNAVAILABLE|overloaded/i.test(message)) return 'unavailable';

  if (/location is not supported|FAILED_PRECONDITION/i.test(message) && /location/i.test(message)) {
    return 'location';
  }

  // لا يوجد status رقمي إطلاقًا (الطلب لم يصل للخادم أصلاً) — على الأرجح فشل شبكة
  if (!status && /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network/i.test(message)) {
    return 'network';
  }

  return 'unknown';
}

// system prompt صارم — كل القواعد المطلوبة مذكورة صراحة لتقليل احتمال تجاوزها
const SYSTEM_PROMPT = `
أنت مساعد تحليلي ضمن نظام دعم قرار لدخول السوق السوري (Market Entry Decision Support System).

قواعد صارمة يجب الالتزام بها دائمًا بدون استثناء:
١. أجب حصريًا اعتمادًا على المحتوى الموجود داخل كتلة <SOURCES> أدناه.
   يُمنع منعًا باتًا استخدام أي معرفة عامة أو معلومات من خارج هذه المصادر.
٢. إذا كانت المصادر لا تغطي نقطة معيّنة تخص ملف المستخدم، لا تخترع إجابة إطلاقًا —
   بل أدرج تلك النقطة كعنصر داخل "gaps".
٣. لا تقدّم استشارة قانونية ولا رأيًا قانونيًا شخصيًا. اكتفِ بنقل ما تنص عليه
   المصادر حرفيًا أو بمعناها الدقيق، دون تفسير قانوني إضافي من عندك.
٤. بعد كل ادعاء أو معلومة مبنية على مصدر، أضف إشارة المصدر بالشكل [S1] أو [S2]...
   وفق أرقام المصادر كما وردت في <SOURCES>.
٥. قاعدة تحديد "status" لكل قيد (constraint):
   - "clear": فقط إذا كانت المصادر تدعم هذا القيد بشكل صريح وواضح.
   - "blocked": فقط إذا نصّت إحدى المصادر صراحةً على منع/حظر هذا الأمر.
   - "needs_clarification": في أي حالة أخرى (غموض، معلومة جزئية، تضارب، إلخ).
٦. أعد الإجابة بصيغة JSON صالحة فقط — بدون أي نص قبلها أو بعدها،
   وبدون أسوار كود (code fences من نوع \`\`\`)، وبالشكل التالي بالضبط:

{
  "constraints": [ { "text": "...", "status": "clear|needs_clarification|blocked", "sources": ["S1"] } ],
  "entryOptions": [ { "name": "...", "complexity": "...", "requirements": ["..."], "risks": ["..."], "sources": ["S2"] } ],
  "gaps": [ "معلومة ناقصة أو غير مغطاة بالمصادر..." ],
  "lawyerSummary": { "businessSummary": "...", "keyLegalQuestions": ["..."], "missingDocuments": ["..."] }
}
`.trim();

// TODO 1: بناء استعلام استرجاع بالعربية من حقول ملف تعريف المستخدم
// الحقول مطابقة لأسئلة Input.jsx المبنية على "Questions the Software Should
// Ask the User" الواردة في كل ملفات /sources
function buildRetrievalQuery(profile) {
  const {
    investorLocation,
    nationality,
    hasCompanyAbroad,
    purpose,
    sector,
    businessType,
    ownershipPreference,
    capital,
    partnersCount,
    freeText,
  } = profile;

  const parts = [];

  if (investorLocation) parts.push(`موقع المؤسس: ${investorLocation}`);
  if (nationality) parts.push(`جنسية المؤسس: ${nationality}`);
  if (hasCompanyAbroad) parts.push(`يمتلك شركة مسجلة خارج سوريا: ${hasCompanyAbroad}`);
  if (purpose) parts.push(`الهدف من الدخول: ${purpose}`);
  if (sector) parts.push(`القطاع المستهدف: ${sector}`);
  if (businessType) parts.push(`الشكل القانوني المفضل: ${businessType}`);
  if (ownershipPreference) parts.push(`تفضيل نسبة الملكية: ${ownershipPreference}`);
  if (capital) parts.push(`رأس المال المتاح: ${capital}`);
  if (partnersCount) parts.push(`عدد الشركاء المتوقع: ${partnersCount}`);
  if (freeText) parts.push(`تفاصيل إضافية من المستخدم: ${freeText}`);

  return parts.join('. ');
}

// TODO 2: تحويل استعلام الاسترجاع إلى متجه — بنفس نموذج وأبعاد ingest.js (من config.js، بدون تثبيت مباشر)
async function embedQuery(ai, text) {
  const result = await ai.models.embedContent({
    model: config.embeddingModel,
    contents: text,
    config: { outputDimensionality: config.embeddingDimension },
  });
  return result.embeddings[0].values;
}

async function getPineconeIndex(pc) {
  const description = await pc.describeIndex(config.pineconeIndexName);
  return pc.index({ host: description.host });
}

// TODO 3: البحث في Pinecone عن أقرب top_k=6 متجهات، مع البيانات الوصفية (metadata)
async function retrieveMatches(pc, queryVector) {
  const index = await getPineconeIndex(pc);
  const queryResponse = await index.query({
    vector: queryVector,
    topK: TOP_K,
    includeMetadata: true,
  });
  return queryResponse.matches ?? [];
}

// يحوّل اسم ملف المصدر (source metadata) إلى اسم عرض مقروء بالعربية
// لا يُعرَض أي مسار محلي (path) على الإطلاق — هذه الدالة تعتمد فقط على اسم الملف
function getReadableSourceName(fileName) {
  if (!fileName) return 'مصدر غير معروف';
  const baseName = fileName.replace(/\.[^./]+$/, ''); // إزالة الامتداد (.md/.txt)
  if (SOURCE_DISPLAY_NAMES[baseName]) return SOURCE_DISPLAY_NAMES[baseName];
  // fallback: استبدال الشرطات السفلية/الفاصلة بمسافات (مثال: outside_syria → outside syria)
  return baseName.replace(/[_-]+/g, ' ');
}

// يقتطع نص المقطع المخزَّن في Pinecone إلى مقتطف قصير يصلح للعرض في الواجهة
function buildSnippet(text) {
  if (!text) return '';
  const trimmed = text.trim();
  return trimmed.length > SNIPPET_MAX_LENGTH
    ? `${trimmed.slice(0, SNIPPET_MAX_LENGTH).trim()}…`
    : trimmed;
}

// بناء كتلة <SOURCES> بمعرّفات [S1], [S2]... حسب ترتيب النتائج المسترجَعة
function buildSourcesBlock(matches) {
  return matches
    .map((match, i) => `[S${i + 1}] (المصدر: ${match.metadata?.source ?? 'غير معروف'})\n${match.metadata?.text ?? ''}`)
    .join('\n\n');
}

// TODO 4: بناء الطلب المرسل لنموذج الدردشة — system prompt صارم + <SOURCES> + ملف المستخدم
function buildUserPrompt(profile, retrievalQuery, sourcesBlock) {
  return [
    '<SOURCES>',
    sourcesBlock || '(لا توجد مصادر مسترجَعة)',
    '</SOURCES>',
    '',
    `ملف تعريف المستخدم (بصيغة JSON):`,
    JSON.stringify(profile, null, 2),
    '',
    `استعلام الاسترجاع المستخدم للبحث عن المصادر أعلاه: "${retrievalQuery}"`,
  ].join('\n');
}

// إزالة أسوار الكود (```json ... ```) إن وُجدت بالخطأ رغم التعليمات الصارمة
function stripJsonFences(rawText) {
  return rawText
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

// TODO 6: تحليل نص JSON بأمان — مع fallback آمن عند فشل التحليل
function safeParseModelOutput(rawText) {
  try {
    return { data: JSON.parse(stripJsonFences(rawText)), parseError: null };
  } catch (error) {
    return { data: null, parseError: error.message };
  }
}

function buildFallbackResult(rawText, parseError) {
  return {
    error: true,
    message: 'تعذّر تحليل استجابة النموذج كـ JSON صالح — تم إرجاع نتيجة احتياطية آمنة',
    parseError,
    rawText,
    constraints: [],
    entryOptions: [],
    gaps: ['تعذّر إنتاج تحليل موثوق لهذا الطلب — يُرجى إعادة المحاولة'],
    lawyerSummary: { businessSummary: '', keyLegalQuestions: [], missingDocuments: [] },
  };
}

// TODO 5+6+7: الدالة الرئيسية — تُنفَّذ كل خطوات RAG وتُرجع النتيجة مع المصادر
export async function answerFromProfile(profile) {
  // وضع المحاكاة (Mock): يُرجع بيانات وهمية فورًا دون أي استدعاء خارجي
  // (لا Gemini embeddings، لا Pinecone، لا Gemini chat) — للتطوير المحلي فقط.
  // يُفعَّل عبر USE_MOCK=true في .env (راجع server/mock.js و server/config.js).
  if (config.useMock) {
    return buildMockResult(profile);
  }

  try {
    const geminiApiKey = requireEnv('GEMINI_API_KEY');
    const pineconeApiKey = requireEnv('PINECONE_API_KEY');
    requireEnv('PINECONE_INDEX_NAME');

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const pc = new Pinecone({ apiKey: pineconeApiKey });

    const retrievalQuery = buildRetrievalQuery(profile);
    const queryVector = await embedQuery(ai, retrievalQuery);
    const matches = await retrieveMatches(pc, queryVector);
    const sourcesBlock = buildSourcesBlock(matches);
    const userPrompt = buildUserPrompt(profile, retrievalQuery, sourcesBlock);

    const response = await ai.models.generateContent({
      model: config.chatModel,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text ?? '';
    const { data, parseError } = safeParseModelOutput(rawText);
    const result = data ?? buildFallbackResult(rawText, parseError);

    // TODO 7: إرجاع المقاطع المسترجَعة (id, اسم عرض مقروء, مقتطف نصي) لعرضها في الواجهة
    // لا يُرسَل اسم الملف الخام ولا المسار المحلي إلى الواجهة الأمامية إطلاقًا
    const sources = matches.map((match, i) => ({
      id: `S${i + 1}`,
      sourceName: getReadableSourceName(match.metadata?.source),
      snippet: buildSnippet(match.metadata?.text),
    }));

    return { result, sources };
  } catch (error) {
    // التفاصيل الكاملة للخطأ (رسالة Gemini/Pinecone الخام، status، حصص الاستخدام، إلخ)
    // تُسجَّل هنا فقط في طرفية الخادم لأغراض تصحيح الأخطاء — ولا تُرسَل للواجهة الأمامية إطلاقًا
    console.error('answerFromProfile: فشل حقيقي في مسار RAG —', error);
    const type = classifyProviderError(error);
    // نرمي خطأ جديدًا رسالته نوع آمن فقط (quota/network/auth/unavailable/location/unknown)
    // يقرأه index.js ثم يُترجَم إلى رسالة عربية في Analysis.jsx
    throw new Error(type);
  }
}
