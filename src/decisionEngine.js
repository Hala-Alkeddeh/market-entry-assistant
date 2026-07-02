// ==========================================
// 1. QUESTIONS (Q1–Q7)
// ==========================================
export const questions = [
  { id: "Q1", text: "أين تتواجد حاليًا؟", options: ["inside_syria", "outside_syria"] },
  { id: "Q2", text: "ما جنسيتك؟", options: ["syrian", "arab", "foreign_non_arab"] },
  { id: "Q3", text: "هل تمتلك شركة مسجلة رسميًا خارج سوريا؟", options: ["yes", "no"] },
  { id: "Q4", text: "ما هو هدفك الأساسي من الدخول؟", options: ["commercial_profit", "market_study_only"] },
  { id: "Q5", text: "كم رأس المال المتوفر لديك (ليرة سورية)؟", options: ["none", "less_than_50M", "50M_to_150M", "more_than_150M"] },
  { id: "Q6", text: "كم عدد الشركاء المتوقعين؟", options: ["single_founder", "two_or_more_partners"] },
  { id: "Q7", text: "ما هو مجال أو قطاع نشاط الشركة؟", options: ["trade", "services", "manufacturing", "tech", "agriculture", "other"] }
];

// ==========================================
// 2. BASE DECISION ENGINE (DO NOT CHANGE)
// ==========================================
export function decideEntryType(answers) {
  const { Q1, Q2, Q3, Q4, Q5, Q6 } = answers;

  if (Q4 === "market_study_only" && Q3 === "yes") {
    return "Representative Office";
  }

  if (Q4 === "commercial_profit" && Q3 === "yes") {
    return "Branch";
  }

  if (Q4 === "commercial_profit" && Q3 === "no") {
    if (Q5 === "50M_to_150M" || Q5 === "more_than_150M") {
      return "LLC";
    }

    if (Q5 === "less_than_50M" && (Q2 === "syrian" || Q2 === "arab")) {
      return "Sole Proprietorship";
    }

    if (Q2 === "foreign_non_arab" && Q6 === "single_founder") {
      return "Insufficient Setup - Need Second Foreign Partner or Foreign Parent Company";
    }
  }

  if (Q5 === "none") {
    if (Q3 === "yes") return "Representative Office";
    if (Q2 === "syrian" || Q2 === "arab") return "Sole Proprietorship";
    return "No Valid Option";
  }

  return "No Valid Option";
}

// ==========================================
// 3. SECTOR WEIGHTS (Q7 LAYER)
// ==========================================
const sectorWeights = {
  trade: { LLC: 2, Branch: 2, "Representative Office": 1, "Sole Proprietorship": 1 },
  services: { LLC: 2, Branch: 1, "Representative Office": 1, "Sole Proprietorship": 1 },
  manufacturing: { LLC: 2, Branch: 1, "Representative Office": 0, "Sole Proprietorship": 0 },
  tech: { LLC: 2, Branch: 1, "Representative Office": 2, "Sole Proprietorship": 1 },
  agriculture: { LLC: 1, Branch: 1, "Representative Office": 0, "Sole Proprietorship": 2 },
  other: { LLC: 1, Branch: 1, "Representative Office": 1, "Sole Proprietorship": 1 }
};

// ==========================================
// 4. FINAL ENGINE (Base + Sector Layer)
// ==========================================
export function decideEntryTypeWithSector(answers) {
  const baseDecision = decideEntryType(answers);

  const sector = answers.Q7 || "other";
  const weights = sectorWeights[sector] || sectorWeights.other;

  // CASE 1: Valid base decision
  if (
    baseDecision !== "No Valid Option" &&
    !baseDecision.startsWith("Insufficient")
  ) {
    const confidence = weights[baseDecision] ?? 1;

    return {
      recommended: baseDecision,
      confidence,
      sectorNote:
        confidence === 0
          ? `تنبيه: قطاع "${sector}" غير مناسب عادة لـ ${baseDecision}`
          : null
    };
  }

  // CASE 2: fallback logic
  const sorted = Object.entries(weights).sort((a, b) => b[1] - a[1]);
  const fallback = sorted[0][0];

  return {
    recommended: fallback,
    confidence: sorted[0][1],
    sectorNote: `تم الترشيح بناءً على القطاع "${sector}" بسبب: ${baseDecision}`,
    originalIssue: baseDecision
  };
}