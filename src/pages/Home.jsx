import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="home-page">
      <h1 className="home-title">{t("home.title")}</h1>
      <p className="home-intro">{t("home.intro")}</p>
      <button className="btn btn-primary home-cta" onClick={() => navigate("/input")}>
        {t("home.cta")}
      </button>
    </div>
  );
}
