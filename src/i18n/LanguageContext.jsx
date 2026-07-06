import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ar } from "./ar";
import { en } from "./en";

const DICTIONARIES = { ar, en };
const STORAGE_KEY = "lang";

const LanguageContext = createContext(null);

function readInitialLang() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "ar";
}

// يقرأ مسارًا منقوطًا (مثال: "input.fields.sector.label") من كائن القاموس
function resolvePath(dict, path) {
  return path.split(".").reduce((node, key) => (node == null ? undefined : node[key]), dict);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang);

  // اتجاه الصفحة (RTL/LTR) ولغة <html> تُضبطان ديناميكيًا هنا بدل التثبيت في index.html
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  function setLang(nextLang) {
    setLangState(nextLang);
    window.localStorage.setItem(STORAGE_KEY, nextLang);
  }

  const dict = DICTIONARIES[lang];

  const value = useMemo(() => {
    // ترجمة نص واجهة ثابت عبر مسار منقوط؛ عند غياب المفتاح تُعاد قيمة المسار نفسها
    // (تسهّل ملاحظة الترجمات الناقصة أثناء التطوير بدل عرض فراغ صامت)
    function t(path) {
      return resolvePath(dict, path) ?? path;
    }

    // ترجمة نص خيار في قائمة منسدلة. القيمة الفعلية المخزَّنة في profile تبقى
    // عربية دومًا (canonical) بغض النظر عن اللغة — هذه الدالة تُترجم فقط النص
    // المعروض للمستخدم، ولا تغيّر القيمة المُرسَلة للخادم
    function tOption(fieldId, value) {
      if (lang === "ar") return value;
      return dict.input?.fields?.[fieldId]?.options?.[value] ?? value;
    }

    return { lang, setLang, t, tOption };
  }, [lang, dict]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// hook مرافق لمزوّد السياق أعلاه — نمط شائع لملفات الـ context في مشاريع React+Vite
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
