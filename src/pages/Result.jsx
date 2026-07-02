import { useLocation, useNavigate } from "react-router-dom";
import { decideEntryTypeWithSector } from "../decisionEngine";

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();

  const answers = location.state;

  // حماية إضافية (MVP-safe)
  if (!answers || typeof answers !== "object") {
    return (
      <div className="result-page">
        <h2>No data found</h2>
        <p>Please complete the assessment first.</p>
        <button onClick={() => navigate("/")}>
          Go Back
        </button>
      </div>
    );
  }

  const result = decideEntryTypeWithSector(answers);

  return (
    <div className="result-page">
      <h1>Market Entry Decision</h1>

      <div className="result-box">
        <h2>Recommended Entry Type</h2>

        <h3 style={{ fontSize: "28px", margin: "10px 0" }}>
          {result.recommended}
        </h3>

        <p>
          Confidence:{" "}
          <strong>{result.confidence ?? 1}</strong> / 2
        </p>

        {result.sectorNote && (
          <p className="warning">
            ⚠ {result.sectorNote}
          </p>
        )}

        {result.originalIssue && (
          <p className="info">
            Issue: {result.originalIssue}
          </p>
        )}
      </div>

      <button onClick={() => navigate("/")}>
        Start New Analysis
      </button>
    </div>
  );
}