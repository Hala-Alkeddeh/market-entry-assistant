// قاموس النصوص الإنجليزية
// كل حقل select هنا يملك خريطة "options": القيمة العربية الكندية (canonical،
// كما تُخزَّن في profile وتُرسَل للخادم) → نص العرض الإنجليزي فقط. القيمة
// نفسها لا تتغيّر أبدًا — راجع tOption في LanguageContext.jsx وسياسة 1(a) في النقاش
export const en = {
  header: {
    langToggleAriaLabel: "Language",
  },
  home: {
    title: "DecisionSyria",
    intro:
      "A decision-support tool for entering the Syrian market. Its answers are built exclusively on trusted sources to help you understand the available legal options before consulting a specialized lawyer.",
    cta: "Start Assessment",
  },
  input: {
    title: "Market Entry Assessment",
    subtitle: "Answer the following questions to get an analysis based on our legal sources.",
    selectPlaceholder: "Select...",
    formError: "Please answer all questions before continuing.",
    submit: "Analyze",
    fields: {
      investorLocation: {
        label: "Where is the founder currently located?",
        options: {
          "داخل سوريا": "Inside Syria",
          "خارج سوريا": "Outside Syria",
        },
      },
      nationality: {
        label: "What is the founder's nationality?",
        options: {
          "سوري": "Syrian",
          "عربي": "Arab (non-Syrian)",
          "أجنبي (غير عربي)": "Foreign (non-Arab)",
        },
      },
      hasCompanyAbroad: {
        label:
          "Do you own an officially registered, active company abroad that a branch could be opened for?",
        options: {
          "نعم": "Yes",
          "لا": "No",
        },
      },
      purpose: {
        label: "What is the main purpose of entering the Syrian market?",
        options: {
          "ممارسة نشاط تجاري ربحي": "Conducting for-profit commercial activity",
          "دراسة السوق والتمثيل فقط (دون نشاط ربحي)":
            "Market research and representation only (non-profit)",
        },
      },
      sector: {
        label: "What is the target sector?",
        options: {
          "تقانة المعلومات والبرمجيات": "IT & Software",
          "التجارة العامة (استيراد/تصدير)": "General Trade (Import/Export)",
          "التطوير العقاري والمقاولات": "Real Estate Development & Contracting",
          "التصنيع الغذائي والزراعي": "Food & Agricultural Manufacturing",
          "النقل والخدمات اللوجستية": "Transport & Logistics",
          "أخرى": "Other",
        },
      },
      businessType: {
        label: "Which legal form do you prefer?",
        options: {
          "شركة محدودة المسؤولية (LLC)": "Limited Liability Company (LLC)",
          "فرع لشركة أجنبية": "Branch of a Foreign Company",
          "مكتب تمثيلي": "Representative Office",
          "مؤسسة فردية": "Sole Proprietorship",
          "غير متأكد — أرغب باقتراح مناسب": "Not sure — I'd like a suggestion",
        },
      },
      ownershipPreference: {
        label: "What is your preference regarding ownership share?",
        options: {
          "ملكية كاملة 100% دون شريك سوري": "100% full ownership without a Syrian partner",
          "ملكية مشتركة مع شريك سوري": "Joint ownership with a Syrian partner",
          "غير محدد بعد": "Not decided yet",
        },
      },
      capital: {
        label: "What is the approximate capital available for investment (in Syrian pounds)?",
        options: {
          "لا يوجد رأس مال بعد": "No capital yet",
          "أقل من 50 مليون ليرة سورية": "Less than 50 million SYP",
          "من 50 إلى أقل من 150 مليون ليرة سورية": "50 to under 150 million SYP",
          "من 150 مليون إلى أقل من مليار ليرة سورية": "150 million to under 1 billion SYP",
          "مليار ليرة سورية فأكثر": "1 billion SYP or more",
        },
      },
      partnersCount: {
        label: "How many partners are expected in the project?",
        options: {
          "مؤسس واحد فقط": "A single founder only",
          "شريكان": "Two partners",
          "ثلاثة شركاء أو أكثر": "Three or more partners",
        },
      },
      freeText: {
        label: "Additional details about your activity (optional)",
        placeholder:
          "e.g. customs clearance activity, real estate development vs. general contracting, cybersecurity activities, plan to transfer profits abroad, existence of a legal agent inside Syria...",
      },
    },
  },
  analysis: {
    loadingAriaLabel: "Loading",
    loadingTitle: "Analyzing your market entry data...",
    loadingSubtitle: "This may take a few seconds",
    errorTitle: "Analysis could not be completed",
    retryButton: "Go back and try again",
    errorMessages: {
      quota: "We've exceeded the currently allowed number of requests. Please try again shortly.",
      network: "Could not connect to the server. Check your internet connection and try again.",
      auth: "A configuration error occurred. Please try again later.",
      unavailable: "The service is currently busy. Please try again shortly.",
      location:
        "The service is not available from your current location. You may need to adjust your network settings.",
      invalid_request: "The submitted data is incomplete or invalid. Please review the fields and try again.",
      unknown: "An unexpected error occurred during analysis. Please try again.",
    },
  },
  result: {
    title: "Market Entry Decision",
    errorBanner:
      "⚠ The system could not fully produce a reliable analysis for this request. Please try again, or review the technical details below.",
    businessSummaryTitle: "Project Summary",
    entryOptionsTitle: "Suggested Entry Options",
    complexityLabel: "Complexity level:",
    requirementsLabel: "Requirements",
    risksLabel: "Risks",
    constraintsTitle: "Constraints & Conditions",
    status: {
      clear: "Clear",
      needsClarification: "Needs clarification",
      blocked: "Blocked",
    },
    gapsTitle: "⚠ Missing Information",
    lawyerSummaryTitle: "Summary for Your Lawyer",
    keyLegalQuestionsLabel: "Key legal questions to raise with your lawyer",
    missingDocumentsLabel: "Documents to prepare",
    sourcesTitle: "Sources",
    sourcesNote: "Sources are general legal references; some information may apply across more than one situation.",
    unknownSource: "Unknown source",
    newAnalysisButton: "Start a new analysis",
    empty: {
      title: "No data available",
      message: "Please complete the assessment first.",
      cta: "Back to start",
    },
    followUp: {
      title: "Follow-up Questions",
      subtitle: "Ask an additional question about this analysis — the answer will be grounded in the same sources.",
      inputPlaceholder: "Type your question here...",
      send: "Send",
      sending: "Sending...",
      emptyError: "Please write a question before sending.",
      youLabel: "You:",
      sourcesLabel: "Sources:",
    },
  },
};
