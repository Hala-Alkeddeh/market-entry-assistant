import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Analysis() {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate("/result");
    }, 2000);
  }, []);

  return <h1>Analyzing...</h1>;
}