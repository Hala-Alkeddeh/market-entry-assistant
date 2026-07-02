import { useLocation, useNavigate } from "react-router-dom";
import "./Result.css";

const STATUS_META = {
  clear: { label: "واضح", className: "badge-clear", dotClassName: "dot-clear" },
  needs_clarification: {
    label: "يحتاج توضيحًا",
    className: "badge-warning",
    dotClassName: "dot-warning",
  },
  blocked: { label: "ممنوع", className: "badge-blocked", dotClassName: "dot-blocked" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, className: "badge-unknown" };
  return <span className={`status-badge ${meta.className}`}>{meta.label}</span>;
}

function CitationTags({ ids }) {
  if (!ids || ids.length === 0) return null;
  return (
    <span className="citation-list">
      {ids.map((id) => (
        <span className="citation-tag" key={id}>
          {id}
        </span>
      ))}
    </span>
  );
}

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();

  const data = location.state;

  // حماية إضافية (MVP-safe)
  if (!data || typeof data !== "object" || !data.result) {
    return (
      <div className="result-page result-empty">
        <h2>لا توجد بيانات</h2>
        <p>يرجى إكمال التقييم أولًا.</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          العودة إلى البداية
        </button>
      </div>
    );
  }

  const { result, sources = [] } = data;
  const {
    constraints = [],
    entryOptions = [],
    gaps = [],
    lawyerSummary = {},
  } = result;

  return (
    <div className="result-page">
      <h1 className="result-title">قرار دخول السوق</h1>

      {result.error && (
        <div className="result-alert">
          ⚠ لم يتمكن النظام من إنتاج تحليل موثوق بالكامل لهذا الطلب. الرجاء
          إعادة المحاولة، أو مراجعة التفاصيل التقنية أدناه.
        </div>
      )}

      {lawyerSummary.businessSummary && (
        <section className="result-section">
          <h2>ملخص المشروع</h2>
          <p className="result-summary-text">{lawyerSummary.businessSummary}</p>
        </section>
      )}

      {entryOptions.length > 0 && (
        <section className="result-section">
          <h2>خيارات الدخول المقترحة</h2>
          <div className="entry-options-grid">
            {entryOptions.map((option, i) => (
              <div className="entry-option-card" key={i}>
                <h3>{option.name}</h3>
                {option.complexity && (
                  <p className="entry-option-complexity">
                    مستوى التعقيد: <strong>{option.complexity}</strong>
                  </p>
                )}
                {option.requirements?.length > 0 && (
                  <div className="entry-option-block">
                    <strong>المتطلبات</strong>
                    <ul>
                      {option.requirements.map((req, j) => (
                        <li key={j}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {option.risks?.length > 0 && (
                  <div className="entry-option-block">
                    <strong>المخاطر</strong>
                    <ul>
                      {option.risks.map((risk, j) => (
                        <li key={j}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <CitationTags ids={option.sources} />
              </div>
            ))}
          </div>
        </section>
      )}

      {constraints.length > 0 && (
        <section className="result-section">
          <h2>القيود والشروط</h2>
          <div className="status-legend">
            <span>
              <span className="status-dot dot-clear" /> واضح
            </span>
            <span>
              <span className="status-dot dot-warning" /> يحتاج توضيحًا
            </span>
            <span>
              <span className="status-dot dot-blocked" /> ممنوع
            </span>
          </div>
          <ul className="constraints-list">
            {constraints.map((c, i) => (
              <li className="constraint-item" key={i}>
                <StatusBadge status={c.status} />
                <span className="constraint-text">{c.text}</span>
                <CitationTags ids={c.sources} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {gaps.length > 0 && (
        <section className="result-section result-gaps">
          <h2>⚠ معلومات ناقصة</h2>
          <ul>
            {gaps.map((gap, i) => (
              <li key={i}>{gap}</li>
            ))}
          </ul>
        </section>
      )}

      {(lawyerSummary.keyLegalQuestions?.length > 0 ||
        lawyerSummary.missingDocuments?.length > 0) && (
        <section className="result-section result-lawyer">
          <h2>ملخص للمحامي</h2>
          {lawyerSummary.keyLegalQuestions?.length > 0 && (
            <div className="entry-option-block">
              <strong>أسئلة قانونية رئيسية يجب طرحها على المحامي</strong>
              <ul>
                {lawyerSummary.keyLegalQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          {lawyerSummary.missingDocuments?.length > 0 && (
            <div className="entry-option-block">
              <strong>مستندات ينبغي تجهيزها</strong>
              <ul className="checklist">
                {lawyerSummary.missingDocuments.map((doc, i) => (
                  <li key={i}>{doc}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {sources.length > 0 && (
        <section className="result-section result-sources">
          <h2>المصادر</h2>
          <ul>
            {sources.map((s) => (
              <li key={s.id}>
                <span className="citation-tag">{s.id}</span> {s.source ?? "غير معروف"}
              </li>
            ))}
          </ul>
        </section>
      )}

      <button className="btn btn-primary" onClick={() => navigate("/")}>
        بدء تحليل جديد
      </button>
    </div>
  );
}
