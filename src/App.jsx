import AppRouter from "./router/AppRouter";
import { useLanguage } from "./i18n/LanguageContext";
import "./App.css";

export default function App() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          {/* العلامة على جهة البداية — رابط بسيط للرئيسية (App خارج الراوتر) */}
          <a className="app-brand" href="/">
              <img src="/bosla_mark_navy.svg" alt="BOSLA" width={35} />
            <span>BOSLA</span>
          </a>

          <div
            className="lang-toggle"
            role="group"
            aria-label={t("header.langToggleAriaLabel")}
          >
            <button
              type="button"
              className={`lang-toggle-btn ${lang === "ar" ? "active" : ""}`}
              onClick={() => setLang("ar")}
            >
              عربي
            </button>
            <button
              type="button"
              className={`lang-toggle-btn ${lang === "en" ? "active" : ""}`}
              onClick={() => setLang("en")}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <AppRouter />
      </main>
    </div>
  );
}