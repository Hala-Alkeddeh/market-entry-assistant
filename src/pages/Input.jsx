import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./Input.css";

// أسئلة مبنية على حقول "Questions the Software Should Ask the User" المستخرجة
// من كل ملفات /sources (journey.md, inside_syria.md, outside_syria.md,
// foreign_branch.md, representative_office.md, llc.md) — هذه هي العوامل
// التي تحدد فعليًا الشكل القانوني المناسب والقيود المطبَّقة وفق المصادر.
// كل id هنا هو المفتاح الذي يُرسَل مباشرة إلى الخادم كجزء من profile.
// القيم (options) تبقى عربية دومًا بغض النظر عن لغة الواجهة (canonical) — هذا هو
// ما يُخزَّن في answers ويُرسَل للخادم. نصوص العرض (label/options المترجَمة)
// موجودة في src/i18n/ar.js و en.js وتُقرأ عبر t()/tOption() أدناه.
const QUESTIONS = [
  {
    id: "investorLocation",
    type: "select",
    options: ["داخل سوريا", "خارج سوريا"],
  },
  {
    id: "nationality",
    type: "select",
    options: ["سوري", "عربي", "أجنبي (غير عربي)"],
  },
  {
    id: "hasCompanyAbroad",
    type: "select",
    options: ["نعم", "لا"],
  },
  {
    id: "purpose",
    type: "select",
    options: [
      "ممارسة نشاط تجاري ربحي",
      "دراسة السوق والتمثيل فقط (دون نشاط ربحي)",
    ],
  },
  {
    id: "sector",
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
    type: "select",
    options: [
      "ملكية كاملة 100% دون شريك سوري",
      "ملكية مشتركة مع شريك سوري",
      "غير محدد بعد",
    ],
  },
  {
    id: "capital",
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
    type: "select",
    options: ["مؤسس واحد فقط", "شريكان", "ثلاثة شركاء أو أكثر"],
  },
  {
    id: "freeText",
    type: "textarea",
    // حد أقصى لطول النص الحر — يطابق الحد المُطبَّق أيضًا على الخادم (راجع query.js)
    maxLength: 500,
  },
];

const REQUIRED_IDS = QUESTIONS.filter((q) => q.type === "select").map((q) => q.id);

function buildInitialAnswers() {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, ""]));
}

export default function Input() {
  const navigate = useNavigate();
  const { t, tOption } = useLanguage();

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
      setError(t("input.formError"));
      return;
    }
    setError("");
    // التحليل الفعلي (استدعاء /api/analyze) يتم في صفحة Analysis
    navigate("/analysis", { state: { profile: answers } });
  }

  const isComplete = REQUIRED_IDS.every((id) => answers[id]);

  return (
    <div className="input-page">
      <h1 className="input-title">{t("input.title")}</h1>
      <p className="input-subtitle">{t("input.subtitle")}</p>

      <form className="input-form" onSubmit={(e) => e.preventDefault()}>
        {QUESTIONS.map((q) => (
          <div className="form-group" key={q.id}>
            <label>{t(`input.fields.${q.id}.label`)}</label>

            {q.type === "select" ? (
              <select
                value={answers[q.id]}
                onChange={(e) => handleChange(q.id, e.target.value)}
              >
                <option value="">{t("input.selectPlaceholder")}</option>
                {q.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {tOption(q.id, opt)}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                value={answers[q.id]}
                placeholder={t(`input.fields.${q.id}.placeholder`)}
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
          {t("input.submit")}
        </button>
      </form>
    </div>
  );
}
