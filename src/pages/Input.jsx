import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { questions } from "../decisionEngine";
import "./Input.css";

export default function Input() {
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({
    Q1: "",
    Q2: "",
    Q3: "",
    Q4: "",
    Q5: "",
    Q6: "",
    Q7: ""
  });

  function handleChange(id, value) {
    setAnswers((prev) => ({
      ...prev,
      [id]: value
    }));
  }

  function handleSubmit() {
    navigate("/analysis", { state: answers });
  }

  return (
    <div className="input-page">
      <h1>Market Entry Assessment</h1>

      <form
        className="input-form"
        onSubmit={(e) => e.preventDefault()}
      >
        {questions.map((q) => (
          <div className="form-group" key={q.id}>
            <label>{q.text}</label>

            <select
              value={answers[q.id]}
              onChange={(e) => handleChange(q.id, e.target.value)}
            >
              <option value="">Select...</option>
              {q.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button type="button" onClick={handleSubmit}>
          Analyze
        </button>
      </form>
    </div>
  );
}