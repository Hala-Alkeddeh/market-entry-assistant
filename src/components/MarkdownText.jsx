import ReactMarkdown from "react-markdown";

// عناصر Markdown مُخصَّصة: نُحيّد الروابط (a) والصور — النص المعروض هنا نص حر
// يُنتجه النموذج (Gemini)، لا يوجد سبب مشروع لظهور رابط قابل للنقر أو صورة داخله
const MARKDOWN_COMPONENTS = {
  a: ({ children }) => <>{children}</>,
  img: () => null,
};

// عنصر مشترك لعرض أي حقل نصي حر يعيده النموذج (businessSummary، إجابة سؤال متابعة،
// نص قيد/متطلب/خطر/فجوة...) كـ Markdown مُنسَّق (غامق، قوائم مرقّمة/نقطية، فقرات)
// بدل نص خام فيه ** ظاهرة حرفيًا. معرّفات الاستشهاد مثل [S1] أو [موافقة أمنية] تبقى
// نصًا عاديًا تلقائيًا لأنه لا يوجد تعريف رابط مطابق لها في CommonMark
export default function MarkdownText({ children, className = "" }) {
  if (!children) return null;
  return (
    <div className={`markdown-text ${className}`.trim()}>
      <ReactMarkdown components={MARKDOWN_COMPONENTS}>{children}</ReactMarkdown>
    </div>
  );
}
