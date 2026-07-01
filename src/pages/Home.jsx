import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Market Entry Assistant</h1>
      <button onClick={() => navigate("/input")}>Start</button>
    </div>
  );
}
