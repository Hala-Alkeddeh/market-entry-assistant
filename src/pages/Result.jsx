import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./Result.css";

// المفتاح هنا نوع status كما يعيده النموذج، والقيمة تشير إلى مفتاح الترجمة داخل
// result.status.* (راجع src/i18n/ar.js و en.js) بالإضافة إلى صنف CSS الخاص بالشارة
const STATUS_META = {
  clear: { key: "clear", className: "badge-clear" },
  needs_clarification: { key: "needsClarification", className: "badge-warning" },
  blocked: { key: "blocked", className: "badge-blocked" },
};

function StatusBadge({ status }) {
  const { t } = useLanguage();
  const meta = STATUS_META[status];
  const label = meta ? t(`result.status.${meta.key}`) : status;
  const className = meta ? meta.className : "badge-unknown";
  return <span className={`status-badge ${className}`}>{label}</span>;
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
  const { t } = useLanguage();

  const data = location.state;

  // حماية إضافية (MVP-safe)
  if (!data || typeof data !== "object" || !data.result) {
    return (
      <div className="result-page result-empty">
        <h2>{t("result.empty.title")}</h2>
        <p>{t("result.empty.message")}</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          {t("result.empty.cta")}
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
      <h1 className="result-title">{t("result.title")}</h1>

      {result.error && <div className="result-alert">{t("result.errorBanner")}</div>}

      {lawyerSummary.businessSummary && (
        <section className="result-section">
          <h2>{t("result.businessSummaryTitle")}</h2>
          <p className="result-summary-text">{lawyerSummary.businessSummary}</p>
        </section>
      )}

      {entryOptions.length > 0 && (
        <section className="result-section">
          <h2>{t("result.entryOptionsTitle")}</h2>
          <div className="entry-options-grid">
            {entryOptions.map((option, i) => (
              <div className="entry-option-card" key={i}>
                <h3>{option.name}</h3>
                {option.complexity && (
                  <p className="entry-option-complexity">
                    {t("result.complexityLabel")} <strong>{option.complexity}</strong>
                  </p>
                )}
                {option.requirements?.length > 0 && (
                  <div className="entry-option-block">
                    <strong>{t("result.requirementsLabel")}</strong>
                    <ul>
                      {option.requirements.map((req, j) => (
                        <li key={j}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {option.risks?.length > 0 && (
                  <div className="entry-option-block">
                    <strong>{t("result.risksLabel")}</strong>
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
          <h2>{t("result.constraintsTitle")}</h2>
          <div className="status-legend">
            <span>
              <span className="status-dot dot-clear" /> {t("result.status.clear")}
            </span>
            <span>
              <span className="status-dot dot-warning" /> {t("result.status.needsClarification")}
            </span>
            <span>
              <span className="status-dot dot-blocked" /> {t("result.status.blocked")}
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
          <h2>{t("result.gapsTitle")}</h2>
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
          <h2>{t("result.lawyerSummaryTitle")}</h2>
          {lawyerSummary.keyLegalQuestions?.length > 0 && (
            <div className="entry-option-block">
              <strong>{t("result.keyLegalQuestionsLabel")}</strong>
              <ul>
                {lawyerSummary.keyLegalQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          {lawyerSummary.missingDocuments?.length > 0 && (
            <div className="entry-option-block">
              <strong>{t("result.missingDocumentsLabel")}</strong>
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
          <h2>{t("result.sourcesTitle")}</h2>
          <p className="result-sources-note">{t("result.sourcesNote")}</p>
          <div className="source-list">
            {sources.map((s) => (
              <div className="source-card" key={s.sourceName}>
                <div className="source-card-header">
                  <CitationTags ids={s.ids} />
                  <span className="source-name">{s.sourceName ?? t("result.unknownSource")}</span>
                </div>
                {/* المقتطف (s.snippet) مخفي حاليًا من العرض عمدًا — البيانات ما زالت
                    موجودة في الكائن، يمكن إعادة إظهاره لاحقًا بإرجاع سطر <p> هنا.
                    المقتطفات نصوص حرفية من المصادر وتبقى بالعربية دومًا، حتى في
                    وضع الإنجليزية — لا تُترجَم أبدًا (راجع query.js) */}
              </div>
            ))}
          </div>
        </section>
      )}

      <button className="btn btn-primary" onClick={() => navigate("/")}>
        {t("result.newAnalysisButton")}
      </button>
    </div>
  );
}
