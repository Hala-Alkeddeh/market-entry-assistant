// خط أنابيب الفهرسة (Ingestion Pipeline)
// الهدف: تحويل ملفات PDF و Markdown و نص عادي الموجودة في /sources إلى متجهات (vectors) مخزّنة في Pinecone
// التشغيل: npm run ingest

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PDFParse } from 'pdf-parse';
import { GoogleGenAI } from '@google/genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { config, requireEnv } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCES_DIR = path.join(__dirname, '..', 'sources');

// أنواع الملفات المدعومة، وتسمية كل نوع للعرض في سجل التقدّم
const SUPPORTED_EXTENSIONS = {
  '.pdf': 'PDF',
  '.md': 'Markdown',
  '.txt': 'نص عادي',
};

// إعدادات التقسيم إلى مقاطع (chunking)
const CHUNK_SIZE_WORDS = 400; // بين 300-500 كلمة
const CHUNK_OVERLAP_WORDS = 75; // بين 50-100 كلمة تداخل

// إعدادات الدفعات (batches) — الجهاز يعمل بـ 4GB RAM فقط، لذا الدفعات صغيرة عمدًا
const EMBED_BATCH_SIZE = 10; // عدد المقاطع النصية في كل استدعاء لواجهة الـ embedding
const UPSERT_BATCH_SIZE = 100; // الحد الأقصى المعتاد لكل استدعاء upsert في Pinecone
const DELAY_BETWEEN_EMBED_BATCHES_MS = 1000; // تهدئة بين الدفعات لاحترام حدود الاستخدام المجاني
const MAX_RETRIES = 5;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO 1: قراءة كل ملفات PDF و Markdown و نص عادي من مجلد /sources
async function getSourceFiles() {
  const entries = await readdir(SOURCES_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() in SUPPORTED_EXTENSIONS)
    .map((entry) => entry.name);
}

// TODO 2: استخراج النص الكامل من كل ملف
// PDF عبر pdf-parse، أما Markdown/نص عادي فتُقرأ مباشرة كنص UTF-8 (بدون أي مكتبة إضافية)
async function extractTextFromPdf(filePath) {
  const buffer = await readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    // تحرير الذاكرة دائمًا حتى لو حدث خطأ أثناء الاستخراج
    await parser.destroy();
  }
}

async function extractTextFromPlainFile(filePath) {
  // readFile مع الترميز 'utf8' يقرأ النص العربي (وأي نص UTF-8 آخر) بشكل صحيح
  const text = await readFile(filePath, 'utf8');
  // لا يُحذف من النص شيء سوى المسافات/الأسطر الفارغة في نهايته
  return text.trimEnd();
}

async function extractText(filePath, extension) {
  if (extension === '.pdf') {
    return extractTextFromPdf(filePath);
  }
  // .md و .txt يُعاملان بنفس الطريقة: قراءة مباشرة كنص عادي
  return extractTextFromPlainFile(filePath);
}

// TODO 3: تقسيم النص إلى مقاطع (chunks) بحجم 300-500 كلمة مع تداخل 50-100 كلمة
function chunkText(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks = [];
  const step = CHUNK_SIZE_WORDS - CHUNK_OVERLAP_WORDS;

  for (let start = 0; start < words.length; start += step) {
    const end = Math.min(start + CHUNK_SIZE_WORDS, words.length);
    chunks.push(words.slice(start, end).join(' '));
    if (end === words.length) break;
  }

  return chunks;
}

// TODO 4: استدعاء واجهة Gemini للـ embedding — دفعات صغيرة + معالجة حدود المعدل (rate limit)
async function embedBatchWithRetry(ai, texts) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const result = await ai.models.embedContent({
        model: config.embeddingModel,
        contents: texts,
        config: { outputDimensionality: config.embeddingDimension },
      });
      return result.embeddings.map((embedding) => embedding.values);
    } catch (error) {
      const isRateLimit = error?.status === 429;
      const isTransient = error?.status >= 500;
      const isLastAttempt = attempt === MAX_RETRIES;

      if ((isRateLimit || isTransient) && !isLastAttempt) {
        const backoffMs = 2 ** attempt * 1000; // تراجع تصاعدي (exponential backoff)
        console.warn(
          `  ⚠ محاولة ${attempt} فشلت (status=${error?.status ?? 'غير معروف'}) — إعادة المحاولة بعد ${backoffMs}ms`,
        );
        await sleep(backoffMs);
        continue;
      }
      throw error;
    }
  }
  throw new Error('فشل استدعاء embedContent بعد استنفاد كل المحاولات');
}

// TODO 5: تخزين كل متجه في Pinecone مع البيانات الوصفية (metadata)
async function upsertRecords(index, records) {
  for (let i = 0; i < records.length; i += UPSERT_BATCH_SIZE) {
    const batch = records.slice(i, i + UPSERT_BATCH_SIZE);
    await index.upsert({ records: batch });
  }
}

async function getPineconeIndex(pc) {
  const description = await pc.describeIndex(config.pineconeIndexName);

  if (description.dimension !== config.embeddingDimension) {
    throw new Error(
      `أبعاد فهرس Pinecone (${description.dimension}) لا تطابق أبعاد نموذج الـ embedding ` +
        `(${config.embeddingDimension}). تأكد من إنشاء الفهرس بالبعد الصحيح.`,
    );
  }

  return pc.index({ host: description.host });
}

// TODO 6: معالجة الملفات على دفعات صغيرة (small batches) لتقليل استهلاك الذاكرة
export async function ingestSources() {
  const geminiApiKey = requireEnv('GEMINI_API_KEY');
  const pineconeApiKey = requireEnv('PINECONE_API_KEY');
  requireEnv('PINECONE_INDEX_NAME');

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const pc = new Pinecone({ apiKey: pineconeApiKey });
  const index = await getPineconeIndex(pc);

  const fileNames = await getSourceFiles();
  if (fileNames.length === 0) {
    console.log(`لا توجد ملفات PDF/Markdown/نص في ${SOURCES_DIR} — ضع ملفاتك هناك ثم أعد التشغيل.`);
    return;
  }

  console.log(`تم العثور على ${fileNames.length} ملف(ات) (PDF / Markdown / نص عادي).`);

  let totalChunks = 0;
  let totalVectors = 0;
  const retrievalDate = new Date().toISOString();

  for (const fileName of fileNames) {
    const filePath = path.join(SOURCES_DIR, fileName);
    const extension = path.extname(fileName).toLowerCase();
    const typeLabel = SUPPORTED_EXTENSIONS[extension];
    console.log(`\n📄 معالجة [${typeLabel}]: ${fileName}`);

    const text = await extractText(filePath, extension);
    const chunks = chunkText(text);
    totalChunks += chunks.length;
    console.log(`  → تم استخراج ${chunks.length} مقطع (chunk) نصي.`);

    const sourceSlug = fileName.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();

    // معالجة المقاطع على دفعات صغيرة — لكل من استدعاء الـ embedding وتخزين النتائج
    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + EMBED_BATCH_SIZE);
      const vectors = await embedBatchWithRetry(ai, batchChunks);

      const records = vectors.map((values, j) => ({
        id: `${sourceSlug}-${i + j}`,
        values,
        metadata: {
          source: fileName,
          path: filePath,
          retrievalDate,
          text: batchChunks[j], // نص المقطع نفسه، حتى يستطيع query.js إرجاعه كمصدر
          // لغة نص المصدر الفعلي المفهرَس (بعد ترجمة القاعدة المعرفية بالكامل للإنجليزية)
          sourceLanguage: 'en',
          // اسم الملف الأصلي — يطابق source حاليًا لأن الترجمة تمت داخل نفس الملف
          // بدون أرشيف عربي منفصل؛ الحقل موجود كخطاف لأي تتبّع لغوي/إصدارات مستقبلي
          originalFile: fileName,
        },
      }));

      await upsertRecords(index, records);
      totalVectors += records.length;
      console.log(`  → تمت فهرسة ${totalVectors} متجه حتى الآن...`);

      // تهدئة بين الدفعات لاحترام حدود الاستخدام المجاني لـ Gemini
      if (i + EMBED_BATCH_SIZE < chunks.length) {
        await sleep(DELAY_BETWEEN_EMBED_BATCHES_MS);
      }
    }
  }

  console.log('\n✅ اكتملت الفهرسة.');
  console.log(`   الملفات: ${fileNames.length}`);
  console.log(`   المقاطع (chunks): ${totalChunks}`);
  console.log(`   المتجهات المخزَّنة في Pinecone: ${totalVectors}`);
}

// السماح بتشغيل هذا الملف مباشرة عبر: node server/ingest.js (أو npm run ingest)
const isMainModule = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (isMainModule) {
  ingestSources().catch((error) => {
    console.error('\n❌ فشلت عملية الفهرسة:', error.message);
    process.exitCode = 1;
  });
}
