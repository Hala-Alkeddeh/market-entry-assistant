import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./Result.css";

// عنوان الخادم الخلفي — نفس القيمة المستخدمة في Analysis.jsx (لا يوجد وحدة API مشتركة
// حاليًا في المشروع، فكرّرنا هذا السطر الواحد بدل استحداث تجريد جديد لهذا النطاق الصغير)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// حد أقصى لطول سؤال المتابعة على الواجهة — يطابق FOLLOWUP_QUESTION_MAX_LENGTH في index.js
const FOLLOWUP_QUESTION_MAX_LENGTH = 500;

// نفس منطق getErrorMessage في Analysis.jsx: يحوّل نوع خطأ آمن إلى رسالة بلغة الواجهة
function getErrorMessage(t, type) {
  const path = `analysis.errorMessages.${type}`;
  const message = t(path);
  return message === path ? t("analysis.errorMessages.unknown") : message;
}

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

// قسم أسئلة المتابعة: يعيد استخدام /api/followup على نفس خط أنابيب RAG المؤسَّس
// لصفحة التحليل — لا منطق استرجاع أو تحقق من صحة هنا، فقط عرض/إرسال/تخزين محلي
// لسجل الأسئلة والأجوبة ضمن هذه الجلسة (لا يُحفَظ في أي مكان بعد مغادرة الصفحة)
function FollowUpSection({ profile, analysisResult }) {
  const { lang, t } = useLanguage();
  const [turns, setTurns] = useState([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed) {
      setFormError(t("result.followUp.emptyError"));
      return;
    }
    setFormError("");
    setSending(true);

    // سجل المحادثة المُرسَل كسياق: فقط الجولات الناجحة سابقًا (بدون جولات فشلت بخطأ)
    const history = turns
      .filter((turn) => !turn.error)
      .map((turn) => ({ question: turn.question, answer: turn.answer }));

    try {
      const response = await fetch(`${API_BASE}/api/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          analysisResult,
          history,
          question: trimmed,
          language: lang,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("فشل طلب /api/followup:", response.status, data);
        throw new Error(data?.error || "unknown");
      }

      setTurns((prev) => [
        ...prev,
        { question: trimmed, answer: data.answer, sources: data.sources ?? [] },
      ]);
      setQuestion("");
    } catch (err) {
      console.error("فشل سؤال المتابعة:", err);
      const type = err instanceof TypeError ? "network" : err.message;
      setTurns((prev) => [
        ...prev,
        { question: trimmed, error: true, errorMessage: getErrorMessage(t, type) },
      ]);
      setQuestion("");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="result-section result-followup">
      <h2>{t("result.followUp.title")}</h2>
      <p className="result-followup-subtitle">{t("result.followUp.subtitle")}</p>

      {turns.length > 0 && (
        <div className="followup-turns">
          {turns.map((turn, i) => (
            <div className="followup-turn" key={i}>
              <p className="followup-question">
                <strong>{t("result.followUp.youLabel")}</strong> {turn.question}
              </p>
              {turn.error ? (
                <p className="followup-answer followup-answer-error">{turn.errorMessage}</p>
              ) : (
                <>
                  <p className="followup-answer">{turn.answer}</p>
                  {turn.sources?.length > 0 && (
                    <div className="followup-sources">
                      <span className="followup-sources-label">
                        {t("result.followUp.sourcesLabel")}
                      </span>
                      <div className="source-list">
                        {turn.sources.map((s) => (
                          <div className="source-card" key={s.sourceName}>
                            <div className="source-card-header">
                              <CitationTags ids={s.ids} />
                              <span className="source-name">
                                {s.sourceName ?? t("result.unknownSource")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="followup-composer">
        <textarea
          className="followup-input"
          value={question}
          maxLength={FOLLOWUP_QUESTION_MAX_LENGTH}
          placeholder={t("result.followUp.inputPlaceholder")}
          disabled={sending}
          onChange={(e) => setQuestion(e.target.value)}
        />
        {formError && <p className="form-error">{formError}</p>}
        <button type="button" className="btn btn-primary" disabled={sending} onClick={handleAsk}>
          {sending ? t("result.followUp.sending") : t("result.followUp.send")}
        </button>
      </div>
    </section>
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

      {data.profile && <FollowUpSection profile={data.profile} analysisResult={result} />}

      <button className="btn btn-primary" onClick={() => navigate("/")}>
        {t("result.newAnalysisButton")}
      </button>
    </div>
  );
}
