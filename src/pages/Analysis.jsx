import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./Analysis.css";

// عنوان الخادم الخلفي (Express) — يمكن تجاوزه عبر VITE_API_BASE_URL دون تعديل الكود
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// يحوّل نوع خطأ آمن (quota/network/auth/...) إلى رسالة نصية بلغة الواجهة الحالية —
// لا تُعرض أي تفاصيل تقنية خام (status codes، أسماء نماذج، حصص استخدام، روابط API)
// للمستخدم إطلاقًا. عند غياب النوع من القاموس تُستخدم رسالة "unknown" كـ fallback
function getErrorMessage(t, type) {
  const path = `analysis.errorMessages.${type}`;
  const message = t(path);
  return message === path ? t("analysis.errorMessages.unknown") : message;
}

export default function Analysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = location.state?.profile;
  const { lang, t } = useLanguage();

  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) {
      navigate("/");
      return;
    }

    let cancelled = false;

    async function runAnalysis() {
      try {
        const response = await fetch(`${API_BASE}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, language: lang }),
        });

        // إن فشل تحليل الاستجابة كـ JSON، نتعامل معها كخطأ غير معروف (unknown)
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          // data?.error هنا نوع خطأ آمن فقط من الخادم (quota/network/auth/...) — نسجّله للتصحيح فقط
          console.error("فشل طلب /api/analyze:", response.status, data);
          throw new Error(data?.error || "unknown");
        }

        if (!cancelled) {
          // نمرّر profile أيضًا (وليس فقط result/sources) لأن صفحة النتائج تحتاجه
          // لاحقًا عند إرسال أسئلة متابعة إلى /api/followup
          navigate("/result", { state: { ...data, profile } });
        }
      } catch (err) {
        // لا نعرض err.message الخام أبدًا للمستخدم — فقط رسالة آمنة مطابقة لنوع الخطأ ولغة الواجهة
        // fetch نفسه قد يرمي TypeError عند فشل الشبكة (لا يصل الطلب إلى الخادم إطلاقًا)
        console.error("فشل التحليل:", err);
        if (!cancelled) {
          const type = err instanceof TypeError ? "network" : err.message;
          setError(getErrorMessage(t, type));
        }
      }
    }

    runAnalysis();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (error) {
    return (
      <div className="analysis-page">
        <h1 className="analysis-error-title">{t("analysis.errorTitle")}</h1>
        <p className="analysis-error-message">{error}</p>
        <button className="btn btn-primary" onClick={() => navigate("/input")}>
          {t("analysis.retryButton")}
        </button>
      </div>
    );
  }

  return (
    <div className="analysis-page">
      <div className="spinner" role="status" aria-label={t("analysis.loadingAriaLabel")} />
      <h1 className="analysis-title">{t("analysis.loadingTitle")}</h1>
      <p className="analysis-subtitle">{t("analysis.loadingSubtitle")}</p>
    </div>
  );
}
