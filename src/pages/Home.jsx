import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <h1 className="home-title">مساعد دخول السوق السوري</h1>
      <p className="home-intro">
        أداة لدعم قرار دخول السوق السورية، تُبنى إجاباتها حصريًا على مصادر
        موثوقة لمساعدتك على فهم الخيارات القانونية المتاحة قبل استشارة محامٍ
        مختص.
      </p>
      <button className="btn btn-primary home-cta" onClick={() => navigate("/input")}>
        ابدأ التقييم
      </button>
    </div>
  );
}
