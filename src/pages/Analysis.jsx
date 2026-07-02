import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Analysis() {
  const navigate = useNavigate();
  const location = useLocation();

  const answers = location.state;

  useEffect(() => {
    if (!answers) {
      navigate("/");
      return;
    }

    const timer = setTimeout(() => {
      navigate("/result", { state: answers });
    }, 1500);

    return () => clearTimeout(timer);
  }, [answers, navigate]);

  return (
    <div>
      <h1>Analyzing your market entry...</h1>
      <p>Please wait</p>
    </div>
  );
}