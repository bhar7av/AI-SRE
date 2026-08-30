export default function RemediationCard({
  remediation,
  incident,
  onApprove,
  onExecute,
  onRollback,
  loading,
}) {
  if (!remediation) {
    return (
      <section className="remediation-card remediation-empty">
        <div className="section-eyebrow">REMEDIATION</div>

        <div className="remediation-empty-content">
          <div className="empty-icon">—</div>

          <div>
            <h3>No remediation plan</h3>
            <p>
              A remediation plan is not currently available for this
              incident.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const approved = incident?.status === "investigating";
  const resolved = incident?.status === "resolved";

  const risk = remediation.risk || "medium";

  return (
    <section className="remediation-card">
      {/* Header */}
      <div className="remediation-header">
        <div>
          <div className="section-eyebrow">REMEDIATION</div>

          <h2 className="remediation-title">
            {remediation.action || "Proposed remediation"}
          </h2>

          <p className="remediation-subtitle">
            AI-generated action requiring controlled execution.
          </p>
        </div>

        <div className="risk-badge">
          <span className="risk-dot" />
          {risk} risk
        </div>
      </div>

      {/* Summary */}
      <div className="remediation-summary">
        <div className="remediation-summary-item">
          <span className="summary-label">ACTION</span>
          <span className="summary-value">
            {remediation.action || "—"}
          </span>
        </div>

        <div className="remediation-summary-item">
          <span className="summary-label">RISK</span>
          <span className="summary-value">{risk}</span>
        </div>

        <div className="remediation-summary-item">
          <span className="summary-label">APPROVAL</span>
          <span className="summary-value">
            {remediation.requires_approval !== false
              ? "Required"
              : "Not required"}
          </span>
        </div>
      </div>

      {/* Reason */}
      <div className="remediation-block">
        <div className="block-label">WHY THIS ACTION</div>

        <p className="block-text">
          {remediation.reason || "No reason provided."}
        </p>
      </div>

      {/* Recommendation */}
      {remediation.recommendation && (
        <div className="remediation-block">
          <div className="block-label">RECOMMENDATION</div>

          <p className="block-text">
            {remediation.recommendation}
          </p>
        </div>
      )}

      {/* Steps */}
      {Array.isArray(remediation.steps) &&
        remediation.steps.length > 0 && (
          <div className="remediation-block">
            <div className="block-label">EXECUTION PLAN</div>

            <div className="remediation-steps">
              {remediation.steps.map((step, index) => (
                <div
                  key={index}
                  className="remediation-step"
                >
                  <div className="step-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="step-content">
                    <p>{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Safety notice */}
      <div className="remediation-safety">
        <div className="safety-icon">!</div>

        <div>
          <p className="safety-title">
            Human approval required
          </p>

          <p className="safety-text">
            Production remediation is never executed automatically.
            Review the proposed action before proceeding.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="remediation-actions">
        {!approved && !resolved && (
          <button
            type="button"
            onClick={onApprove}
            disabled={loading}
            className="remediation-button remediation-button-primary"
          >
            <span>
              {loading
                ? "Approving..."
                : "Approve remediation"}
            </span>

            <span className="button-arrow">→</span>
          </button>
        )}

        {approved && (
          <button
            type="button"
            onClick={onExecute}
            disabled={loading}
            className="remediation-button remediation-button-primary"
          >
            <span>
              {loading
                ? "Executing..."
                : "Execute approved action"}
            </span>

            <span className="button-arrow">→</span>
          </button>
        )}

        {resolved && (
          <button
            type="button"
            onClick={onRollback}
            disabled={loading}
            className="remediation-button remediation-button-danger"
          >
            <span>
              {loading
                ? "Rolling back..."
                : "Rollback remediation"}
            </span>

            <span className="button-arrow">↶</span>
          </button>
        )}

        {resolved && (
          <p className="remediation-status">
            Incident resolved. Rollback is available if the
            remediation needs to be reversed.
          </p>
        )}
      </div>
    </section>
  );
}