import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Analysis.css";

// عنوان الخادم الخلفي (Express) — يمكن تجاوزه عبر VITE_API_BASE_URL دون تعديل الكود
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// رسائل عربية واضحة لكل نوع خطأ آمن يُرجعه الخادم — لا تُعرض أي تفاصيل تقنية
// خام (status codes، أسماء نماذج، حصص استخدام، روابط API) للمستخدم إطلاقًا
const ERROR_MESSAGES = {
  quota: "لقد تجاوزنا الحد المسموح من الطلبات حاليًا. يرجى المحاولة بعد قليل.",
  network: "تعذّر الاتصال بالخادم. تحقّق من اتصالك بالإنترنت وحاول مجددًا.",
  auth: "حدث خطأ في الإعداد. يرجى المحاولة لاحقًا.",
  unavailable: "الخدمة مشغولة حاليًا. يرجى المحاولة بعد قليل.",
  location: "الخدمة غير متاحة من موقعك الحالي. قد تحتاج إلى تعديل إعدادات الشبكة.",
  unknown: "حدث خطأ غير متوقع أثناء التحليل. يرجى المحاولة مجددًا.",
};

function getErrorMessage(type) {
  return ERROR_MESSAGES[type] ?? ERROR_MESSAGES.unknown;
}

export default function Analysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = location.state?.profile;

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
          body: JSON.stringify({ profile }),
        });

        // إن فشل تحليل الاستجابة كـ JSON، نتعامل معها كخطأ غير معروف (unknown)
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          // data?.error هنا نوع خطأ آمن فقط من الخادم (quota/network/auth/...) — نسجّله للتصحيح فقط
          console.error("فشل طلب /api/analyze:", response.status, data);
          throw new Error(data?.error || "unknown");
        }

        if (!cancelled) {
          navigate("/result", { state: data });
        }
      } catch (err) {
        // لا نعرض err.message الخام أبدًا للمستخدم — فقط رسالة عربية آمنة مطابقة لنوع الخطأ
        // fetch نفسه قد يرمي TypeError عند فشل الشبكة (لا يصل الطلب إلى الخادم إطلاقًا)
        console.error("فشل التحليل:", err);
        if (!cancelled) {
          const type = err instanceof TypeError ? "network" : err.message;
          setError(getErrorMessage(type));
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
        <h1 className="analysis-error-title">تعذّر إتمام التحليل</h1>
        <p className="analysis-error-message">{error}</p>
        <button className="btn btn-primary" onClick={() => navigate("/input")}>
          العودة والمحاولة مجددًا
        </button>
      </div>
    );
  }

  return (
    <div className="analysis-page">
      <div className="spinner" role="status" aria-label="جاري التحميل" />
      <h1 className="analysis-title">جاري تحليل بيانات دخولك إلى السوق...</h1>
      <p className="analysis-subtitle">قد تستغرق هذه العملية بضع ثوانٍ</p>
    </div>
  );
}
