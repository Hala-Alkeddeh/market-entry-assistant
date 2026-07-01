import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Input.css";

export default function Input() {
  const navigate = useNavigate();

  const [businessIdea, setBusinessIdea] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");

  return (
    <div className="input-page">
      <h1>Input Your Idea</h1>

      <form className="input-form" onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <label htmlFor="businessIdea">Business Idea</label>
          <textarea
            id="businessIdea"
            placeholder="Describe your business idea"
            value={businessIdea}
            onChange={(e) => setBusinessIdea(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="budget">Budget</label>
          <input
            id="budget"
            type="number"
            placeholder="Enter your budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            placeholder="Enter target location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <button type="button" onClick={() => navigate("/analysis")}>
          Continue
        </button>
      </form>
    </div>
  );
}
