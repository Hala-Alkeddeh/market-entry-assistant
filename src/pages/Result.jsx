import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import MarkdownText from "../components/MarkdownText";
import "./Result.css";
// نعيد استخدام شاشتَي التحميل والخطأ من Analysis.jsx حرفيًا (نفس أصناف CSS:
// analysis-page, spinner, analysis-title...) بدل تكرارها، عند إعادة توليد التحليل
// بلغة جديدة من صفحة النتائج نفسها (راجع تأثير useEffect داخل Result أدناه)
import "./Analysis.css";

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
// لصفحة التحليل — لا منطق استرجاع أو تحقق من صحة هنا، فقط عرض وإرسال. سجل الأسئلة
// والأجوبة (turns) مرفوع إلى المكوّن الأب Result (وليس محليًا هنا) كي يبقى محفوظًا
// حتى أثناء إعادة توليد التحليل الأساسي بلغة جديدة — راجع Result أدناه لسبب ذلك.
// لا يُحفَظ turns في أي مكان دائم بعد مغادرة الصفحة
function FollowUpSection({ profile, analysisResult, turns, setTurns }) {
  const { lang, t } = useLanguage();
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
      const response = await fetch(`/api/followup`, {
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
                  <MarkdownText className="followup-answer">{turn.answer}</MarkdownText>
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
  const { lang, t } = useLanguage();

  const data = location.state;
  const hasValidData = Boolean(data && typeof data === "object" && data.result);

  // اللغة التي وُلِّد بها التحليل المُستلَم عبر التنقّل من صفحة Analysis — تُستخدم
  // فقط لتحديد مفتاح ذاكرة التخزين المؤقت أدناه لأول نتيجة نصل بها
  const initialLanguage = data?.language === "en" ? "en" : "ar";

  // ذاكرة تخزين مؤقت للتحليل الكامل بحسب اللغة، ضمن حالة هذه الصفحة فقط (لا تُحفَظ
  // بعد مغادرتها) — تمنع إعادة استدعاء /api/analyze عند العودة إلى لغة سبق توليدها
  const [resultsByLanguage, setResultsByLanguage] = useState(() =>
    hasValidData ? { [initialLanguage]: { result: data.result, sources: data.sources ?? [] } } : {}
  );
  const [regenError, setRegenError] = useState("");
  // عدّاد يزيده زر "إعادة المحاولة" فقط — تغييره يُعيد تشغيل تأثير إعادة التوليد
  // أدناه لنفس اللغة الحالية دون الحاجة لدالة قابلة للاستدعاء من خارج التأثير
  const [retryToken, setRetryToken] = useState(0);
  // سجل أسئلة المتابعة مرفوع إلى هنا (بدل داخل FollowUpSection) كي يبقى محفوظًا حتى
  // أثناء إعادة توليد التحليل الأساسي بلغة جديدة (شاشة التحميل تستبدل الشجرة بالكامل
  // مؤقتًا أدناه، وكانت ستُصفّر حالة FollowUpSection الداخلية لو بقيت مملوكة منه)
  const [followUpTurns, setFollowUpTurns] = useState([]);

  // عند تبديل اللغة من رأس الصفحة (header)، نعيد توليد التحليل فقط إذا لم يسبق
  // توليده بهذه اللغة ضمن هذه الجلسة — راجع resultsByLanguage أعلاه. الدالة معرَّفة
  // محليًا داخل التأثير (بنفس نمط runAnalysis في Analysis.jsx) بدل دالة خارجية
  // قابلة للاستدعاء من الزر، تفاديًا لتحذير react-hooks/set-state-in-effect؛ زر
  // "إعادة المحاولة" يكتفي بزيادة retryToken لإعادة تشغيل هذا التأثير نفسه
  useEffect(() => {
    if (!hasValidData || !data?.profile || resultsByLanguage[lang]) {
      return;
    }

    let cancelled = false;

    async function regenerate() {
      setRegenError("");
      try {
        const response = await fetch(`/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: data.profile, language: lang }),
        });

        const body = await response.json().catch(() => null);

        if (!response.ok) {
          console.error("فشل إعادة توليد التحليل بلغة جديدة:", response.status, body);
          throw new Error(body?.error || "unknown");
        }

        if (!cancelled) {
          setResultsByLanguage((prev) => ({
            ...prev,
            [lang]: { result: body.result, sources: body.sources ?? [] },
          }));
        }
      } catch (err) {
        console.error("فشل إعادة توليد التحليل:", err);
        if (!cancelled) {
          const type = err instanceof TypeError ? "network" : err.message;
          setRegenError(getErrorMessage(t, type));
        }
      }
    }

    regenerate();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, retryToken]);

  // حماية إضافية (MVP-safe)
  if (!hasValidData) {
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

  // حالة نادرة/غير متوقعة: لا profile فلا يمكن إعادة التوليد — نعرض آخر تحليل متوفر
  // بدل شاشة تحميل لا تنتهي أبدًا. في الوضع الطبيعي (وجود profile) تبقى current
  // undefined أثناء التوليد الفعلي لعرض شاشة التحميل/الخطأ أدناه كما هو مطلوب
  const current =
    resultsByLanguage[lang] ?? (!data.profile ? resultsByLanguage[initialLanguage] : undefined);

  if (!current) {
    if (regenError) {
      return (
        <div className="analysis-page">
          <h1 className="analysis-error-title">{t("analysis.errorTitle")}</h1>
          <p className="analysis-error-message">{regenError}</p>
          <button className="btn btn-primary" onClick={() => setRetryToken((n) => n + 1)}>
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

  const { result, sources = [] } = current;
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
          <MarkdownText className="result-summary-text">{lawyerSummary.businessSummary}</MarkdownText>
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
                        <li key={j}><MarkdownText>{req}</MarkdownText></li>
                      ))}
                    </ul>
                  </div>
                )}
                {option.risks?.length > 0 && (
                  <div className="entry-option-block">
                    <strong>{t("result.risksLabel")}</strong>
                    <ul>
                      {option.risks.map((risk, j) => (
                        <li key={j}><MarkdownText>{risk}</MarkdownText></li>
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
                <MarkdownText className="constraint-text">{c.text}</MarkdownText>
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
              <li key={i}><MarkdownText>{gap}</MarkdownText></li>
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
                  <li key={i}><MarkdownText>{q}</MarkdownText></li>
                ))}
              </ul>
            </div>
          )}
          {lawyerSummary.missingDocuments?.length > 0 && (
            <div className="entry-option-block">
              <strong>{t("result.missingDocumentsLabel")}</strong>
              <ul className="checklist">
                {lawyerSummary.missingDocuments.map((doc, i) => (
                  <li key={i}><MarkdownText>{doc}</MarkdownText></li>
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
                    المقتطفات نصوص حرفية من المصادر وتبقى بالإنجليزية دومًا، حتى في
                    وضع العربية — لا تُترجَم أبدًا (راجع query.js) */}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.profile && (
        <FollowUpSection
          profile={data.profile}
          analysisResult={result}
          turns={followUpTurns}
          setTurns={setFollowUpTurns}
        />
      )}

      <button className="btn btn-primary" onClick={() => navigate("/")}>
        {t("result.newAnalysisButton")}
      </button>
    </div>
  );
}
