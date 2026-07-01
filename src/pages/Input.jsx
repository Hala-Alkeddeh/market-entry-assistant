import { useNavigate } from "react-router-dom";

export default function Input() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Input Your Idea</h1>

      <button onClick={() => navigate("/analysis")}>
        Continue
      </button>
    </div>
  );
}