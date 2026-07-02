import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Analysis.css";

// عنوان الخادم الخلفي (Express) — يمكن تجاوزه عبر VITE_API_BASE_URL دون تعديل الكود
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

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

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || `فشل الطلب (HTTP ${response.status})`);
        }

        if (!cancelled) {
          navigate("/result", { state: data });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "حدث خطأ غير متوقع أثناء التحليل");
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
