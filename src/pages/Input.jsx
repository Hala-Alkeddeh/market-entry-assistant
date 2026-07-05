import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Input.css";

// أسئلة مبنية على حقول "Questions the Software Should Ask the User" المستخرجة
// من كل ملفات /sources (journey.md, inside_syria.md, outside_syria.md,
// foreign_branch.md, representative_office.md, llc.md) — هذه هي العوامل
// التي تحدد فعليًا الشكل القانوني المناسب والقيود المطبَّقة وفق المصادر.
// كل id هنا هو المفتاح الذي يُرسَل مباشرة إلى الخادم كجزء من profile.
const QUESTIONS = [
  {
    id: "investorLocation",
    label: "أين يتواجد المؤسس حاليًا؟",
    type: "select",
    options: ["داخل سوريا", "خارج سوريا"],
  },
  {
    id: "nationality",
    label: "ما جنسية المؤسس؟",
    type: "select",
    options: ["سوري", "عربي", "أجنبي (غير عربي)"],
  },
  {
    id: "hasCompanyAbroad",
    label: "هل تمتلك شركة مسجلة رسميًا وفعّالة خارج سوريا يمكن فتح فرع لها؟",
    type: "select",
    options: ["نعم", "لا"],
  },
  {
    id: "purpose",
    label: "ما الهدف الأساسي من الدخول إلى السوق السوري؟",
    type: "select",
    options: [
      "ممارسة نشاط تجاري ربحي",
      "دراسة السوق والتمثيل فقط (دون نشاط ربحي)",
    ],
  },
  {
    id: "sector",
    label: "ما القطاع المستهدف؟",
    type: "select",
    options: [
      "تقانة المعلومات والبرمجيات",
      "التجارة العامة (استيراد/تصدير)",
      "التطوير العقاري والمقاولات",
      "التصنيع الغذائي والزراعي",
      "النقل والخدمات اللوجستية",
      "أخرى",
    ],
  },
  {
    id: "businessType",
    label: "ما الشكل القانوني الذي تفضله؟",
    type: "select",
    options: [
      "شركة محدودة المسؤولية (LLC)",
      "فرع لشركة أجنبية",
      "مكتب تمثيلي",
      "مؤسسة فردية",
      "غير متأكد — أرغب باقتراح مناسب",
    ],
  },
  {
    id: "ownershipPreference",
    label: "ما تفضيلك من حيث نسبة الملكية؟",
    type: "select",
    options: [
      "ملكية كاملة 100% دون شريك سوري",
      "ملكية مشتركة مع شريك سوري",
      "غير محدد بعد",
    ],
  },
  {
    id: "capital",
    label: "ما هو رأس المال التقريبي المتاح للاستثمار (بالليرة السورية)؟",
    type: "select",
    options: [
      "لا يوجد رأس مال بعد",
      "أقل من 50 مليون ليرة سورية",
      "من 50 إلى أقل من 150 مليون ليرة سورية",
      "من 150 مليون إلى أقل من مليار ليرة سورية",
      "مليار ليرة سورية فأكثر",
    ],
  },
  {
    id: "partnersCount",
    label: "كم عدد الشركاء المتوقع في المشروع؟",
    type: "select",
    options: ["مؤسس واحد فقط", "شريكان", "ثلاثة شركاء أو أكثر"],
  },
  {
    id: "freeText",
    label: "تفاصيل إضافية عن نشاطك (اختياري)",
    type: "textarea",
    // حد أقصى لطول النص الحر — يطابق الحد المُطبَّق أيضًا على الخادم (راجع query.js)
    maxLength: 500,
    placeholder:
      "مثال: نشاط تخليص جمركي، تطوير عقاري مقابل مقاولات عامة، أنشطة أمن سيبراني، خطة لتحويل الأرباح للخارج، وجود وكيل قانوني داخل سوريا...",
  },
];

const REQUIRED_IDS = QUESTIONS.filter((q) => q.type === "select").map((q) => q.id);

function buildInitialAnswers() {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, ""]));
}

export default function Input() {
  const navigate = useNavigate();

  const [answers, setAnswers] = useState(buildInitialAnswers);
  const [error, setError] = useState("");

  function handleChange(id, value) {
    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  function handleSubmit() {
    const missing = REQUIRED_IDS.filter((id) => !answers[id]);
    if (missing.length > 0) {
      setError("يرجى الإجابة على جميع الأسئلة قبل المتابعة.");
      return;
    }
    setError("");
    // التحليل الفعلي (استدعاء /api/analyze) يتم في صفحة Analysis
    navigate("/analysis", { state: { profile: answers } });
  }

  const isComplete = REQUIRED_IDS.every((id) => answers[id]);

  return (
    <div className="input-page">
      <h1 className="input-title">تقييم دخول السوق</h1>
      <p className="input-subtitle">
        أجب عن الأسئلة التالية للحصول على تحليل مبني على مصادرنا القانونية.
      </p>

      <form className="input-form" onSubmit={(e) => e.preventDefault()}>
        {QUESTIONS.map((q) => (
          <div className="form-group" key={q.id}>
            <label>{q.label}</label>

            {q.type === "select" ? (
              <select
                value={answers[q.id]}
                onChange={(e) => handleChange(q.id, e.target.value)}
              >
                <option value="">اختر...</option>
                {q.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                value={answers[q.id]}
                placeholder={q.placeholder}
                maxLength={q.maxLength}
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            )}
          </div>
        ))}

        {error && <p className="form-error">{error}</p>}

        <button
          type="button"
          className="btn btn-primary"
          disabled={!isComplete}
          onClick={handleSubmit}
        >
          تحليل
        </button>
      </form>
    </div>
  );
}
