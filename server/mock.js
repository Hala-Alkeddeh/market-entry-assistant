// بيانات وهمية (Mock) — للتطوير المحلي فقط
// تُستخدم فقط عندما يكون USE_MOCK=true في .env، لتطوير الواجهة الأمامية دون
// استهلاك حصة Gemini المجانية اليومية (المحدودة بـ 20 طلبًا/يوم) أو Pinecone.
// لا يوجد هنا أي اتصال خارجي إطلاقًا — كل القيم ثابتة (hardcoded) ومصممة فقط
// لتبدو واقعية على شكل [S1]/[S2] بنفس بنية الاستجابة الحقيقية تمامًا.

// نقطة الدخول: تختار الحمولة الوهمية العربية أو الإنجليزية حسب لغة الإخراج
// المطلوبة، دون أي تغيير في منطق الـ RAG الحقيقي (هذا الملف لا يُستخدم إلا في
// وضع USE_MOCK=true)
export function buildMockResult(profile, language = 'ar') {
  return language === 'en' ? buildEnglishMockResult(profile) : buildArabicMockResult(profile);
}

function buildArabicMockResult(profile) {
  const sector = profile?.sector || 'غير محدد';
  const investorLocation = profile?.investorLocation || 'غير محدد';

  const result = {
    constraints: [
      {
        text: 'يُسمح للمستثمرين غير السوريين بتملك شركة محدودة المسؤولية (LLC) بنسبة تصل إلى 100% دون الحاجة لشريك سوري',
        status: 'clear',
        sources: ['S1'],
      },
      {
        text: 'يشترط الحصول على موافقة أمنية مسبقة لكل مؤسس أو شريك غير مقيم في سوريا قبل قيد الشركة أو إيداع رأس المال',
        status: 'needs_clarification',
        sources: ['S2'],
      },
      {
        text: 'يُحظر على الأجانب من جنسيات غير عربية فتح سجل تجاري فردي (مؤسسة فردية) للتجزئة أو التجارة العادية',
        status: 'blocked',
        sources: ['S3'],
      },
    ],
    entryOptions: [
      {
        name: 'شركة محدودة المسؤولية (LLC)',
        complexity: 'متوسط',
        requirements: [
          'حجز الاسم التجاري لدى مديرية الشركات المختصة',
          'إيداع 40% على الأقل من رأس المال (الحد الأدنى 50,000,000 ليرة سورية)',
          'تسجيل الشركة في السجل التجاري والحصول على الرقم الضريبي',
        ],
        risks: [
          'المدة قد تمتد من 20 إلى 45 يوم عمل حسب وجود شركاء أجانب',
          'قد تحتاج إلى موافقة أمنية إضافية إذا كان أحد الشركاء غير مقيم',
        ],
        sources: ['S1', 'S4'],
      },
      {
        name: 'فرع لشركة أجنبية',
        complexity: 'مرتفع',
        requirements: [
          'قرار من مجلس إدارة الشركة الأم بالموافقة على فتح الفرع',
          'تعيين مدير فرع مقيم في سوريا وحائز على الأهلية القانونية',
          'تصديق دولي كامل لجميع وثائق الشركة الأم',
        ],
        risks: [
          'لا يُسمح بتحويل الأرباح للخارج إلا بعد تسوية الضرائب المحلية',
          'يُحظر العمل في قطاعات معينة (كالإعلام والتعدين) دون موافقات خاصة',
        ],
        sources: ['S5'],
      },
    ],
    gaps: [
      'لا تحدد المصادر المتاحة القيمة الدقيقة لرسوم التسجيل لهذا القطاع تحديدًا',
      'لم يُذكر في المصادر سقف زمني ملزم لصدور الموافقة الأمنية للشركاء غير المقيمين',
    ],
    lawyerSummary: {
      businessSummary: `[بيانات وهمية للتطوير] مستثمر يرغب بدخول قطاع "${sector}" في السوق السوري، متواجد حاليًا ${investorLocation}، ويدرس الخيار بين تأسيس شركة محدودة المسؤولية أو فتح فرع لشركة أجنبية.`,
      keyLegalQuestions: [
        'ما المدة الفعلية المتوقعة للحصول على الموافقة الأمنية في هذه الحالة تحديدًا؟',
        'هل يخضع القطاع المختار لأي قيود استثمار أجنبي إضافية غير مذكورة أعلاه؟',
        'ما الآلية الدقيقة لتحويل الأرباح للخارج في حال اختيار فرع بدلًا من شركة جديدة؟',
      ],
      missingDocuments: [
        'خلاصة سجل عدلي (بيان غير محكوم) حديثة',
        'وكالة قانونية مصدقة في حال التأسيس من خارج سوريا',
        'إثبات ملكية أو عقد إيجار مصدق لمقر الشركة',
      ],
    },
  };

  // نفس بنية sources الحقيقية تمامًا بعد الدمج حسب اسم المصدر (ids, sourceName, snippet)
  // — بدون أي مسار محلي. راجع groupSourcesByName في query.js لمنطق الدمج الفعلي
  const sources = [
    {
      ids: ['S1'],
      sourceName: 'الشركة المحدودة المسؤولية (LLC)',
      snippet:
        'تُؤسَّس من شخص واحد سوري على الأقل، أو شخصين غير سوريين على الأقل. يمكن للمستثمرين غير السوريين تملّك الشركة بنسبة 100% دون وجود شريك سوري، ضمن الضوابط القانونية المعمول بها…',
    },
    {
      ids: ['S2'],
      sourceName: 'التأسيس للمستثمرين من خارج سوريا',
      snippet:
        'الحصول على موافقة أمنية مسبقة (Security Clearance) لكل مؤسس أو شريك غير مقيم في سوريا قبل قيد الشركة في السجل التجاري أو إيداع رأس المال…',
    },
    {
      ids: ['S3'],
      sourceName: 'القاعدة المعرفية الشاملة لتأسيس الشركات في سوريا',
      snippet:
        'يُحظر على الأجانب من جنسيات غير عربية فتح سجل تجاري فردي للتجزئة أو التجارة العادية — قطاع التجزئة الفردي العادي مخصص للمواطنين فقط…',
    },
    {
      ids: ['S4'],
      sourceName: 'خطوات تأسيس شركة في سوريا',
      snippet:
        'فتح حساب بنكي باسم الشركة تحت التأسيس وإيداع الحد الأدنى لرأس المال المطلوب قانونًا حسب نوع الشركة، ثم استكمال إجراءات التسجيل في السجل التجاري…',
    },
    {
      ids: ['S5'],
      sourceName: 'تأسيس فرع لشركة أجنبية',
      snippet:
        'لا يُسمح للفرع بتحويل أرباحه إلا بعد تسوية الضرائب المترتبة عليه محليًا. يجب على الفرع مسك دفاتر محاسبية مستقلة في سوريا وتقديم إقرارات ضريبية سنوية…',
    },
  ];

  return { result, sources };
}

function buildEnglishMockResult(profile) {
  const sector = profile?.sector || 'Not specified';
  const investorLocation = profile?.investorLocation || 'Not specified';

  const result = {
    constraints: [
      {
        text: 'Non-Syrian investors are allowed to own up to 100% of a Limited Liability Company (LLC) without needing a Syrian partner',
        status: 'clear',
        sources: ['S1'],
      },
      {
        text: 'Prior security clearance is required for every founder or partner not residing in Syria before registering the company or depositing capital',
        status: 'needs_clarification',
        sources: ['S2'],
      },
      {
        text: 'Foreigners of non-Arab nationality are prohibited from opening an individual (sole proprietorship) commercial registration for retail or ordinary trade',
        status: 'blocked',
        sources: ['S3'],
      },
    ],
    entryOptions: [
      {
        name: 'Limited Liability Company (LLC)',
        complexity: 'Medium',
        requirements: [
          'Reserve the trade name with the competent Companies Directorate',
          'Deposit at least 40% of the capital (minimum 50,000,000 SYP)',
          'Register the company in the commercial registry and obtain the tax number',
        ],
        risks: [
          'The process may take 20 to 45 business days depending on the presence of foreign partners',
          'May require additional security clearance if one of the partners is not a resident',
        ],
        sources: ['S1', 'S4'],
      },
      {
        name: 'Branch of a Foreign Company',
        complexity: 'High',
        requirements: [
          "A decision from the parent company's board of directors approving the branch opening",
          'Appointing a branch manager residing in Syria with full legal capacity',
          "Full international certification of all the parent company's documents",
        ],
        risks: [
          'Profit transfer abroad is not allowed until local taxes are settled',
          'Certain sectors (such as media and mining) are prohibited without special approvals',
        ],
        sources: ['S5'],
      },
    ],
    gaps: [
      'The available sources do not specify the exact registration fee amount for this particular sector',
      'The sources do not mention a binding time limit for issuing security clearance for non-resident partners',
    ],
    lawyerSummary: {
      businessSummary: `[Mock data for development] An investor wishing to enter the "${sector}" sector in the Syrian market, currently located ${investorLocation}, considering the choice between establishing a limited liability company or opening a branch of a foreign company.`,
      keyLegalQuestions: [
        'What is the actual expected duration for obtaining security clearance in this specific case?',
        'Is the chosen sector subject to any additional foreign investment restrictions not mentioned above?',
        'What is the precise mechanism for transferring profits abroad if a branch is chosen instead of a new company?',
      ],
      missingDocuments: [
        'A recent certificate of no criminal record',
        'A certified power of attorney if establishing from outside Syria',
        'Proof of ownership or a certified lease contract for the company premises',
      ],
    },
  };

  // أسماء المصادر مُترجمة للإنجليزية لمطابقة سلوك الوضع الحقيقي، لكن المقتطفات
  // (snippet) تبقى بالعربية دومًا — نصوص حرفية من المصدر لا تُترجَم أبدًا
  // (راجع getReadableSourceName وbuildSnippet في query.js لنفس القاعدة في الوضع الحقيقي)
  const sources = [
    {
      ids: ['S1'],
      sourceName: 'Limited Liability Company (LLC)',
      snippet:
        'تُؤسَّس من شخص واحد سوري على الأقل، أو شخصين غير سوريين على الأقل. يمكن للمستثمرين غير السوريين تملّك الشركة بنسبة 100% دون وجود شريك سوري، ضمن الضوابط القانونية المعمول بها…',
    },
    {
      ids: ['S2'],
      sourceName: 'Formation for Investors From Outside Syria',
      snippet:
        'الحصول على موافقة أمنية مسبقة (Security Clearance) لكل مؤسس أو شريك غير مقيم في سوريا قبل قيد الشركة في السجل التجاري أو إيداع رأس المال…',
    },
    {
      ids: ['S3'],
      sourceName: 'Comprehensive Knowledge Base for Company Formation in Syria',
      snippet:
        'يُحظر على الأجانب من جنسيات غير عربية فتح سجل تجاري فردي للتجزئة أو التجارة العادية — قطاع التجزئة الفردي العادي مخصص للمواطنين فقط…',
    },
    {
      ids: ['S4'],
      sourceName: 'Steps to Establish a Company in Syria',
      snippet:
        'فتح حساب بنكي باسم الشركة تحت التأسيس وإيداع الحد الأدنى لرأس المال المطلوب قانونًا حسب نوع الشركة، ثم استكمال إجراءات التسجيل في السجل التجاري…',
    },
    {
      ids: ['S5'],
      sourceName: 'Establishing a Branch of a Foreign Company',
      snippet:
        'لا يُسمح للفرع بتحويل أرباحه إلا بعد تسوية الضرائب المترتبة عليه محليًا. يجب على الفرع مسك دفاتر محاسبية مستقلة في سوريا وتقديم إقرارات ضريبية سنوية…',
    },
  ];

  return { result, sources };
}
