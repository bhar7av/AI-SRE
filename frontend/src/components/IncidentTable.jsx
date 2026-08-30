function severityClass(severity) {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "severity-badge severity-critical";

    case "high":
      return "severity-badge severity-high";

    case "medium":
      return "severity-badge severity-medium";

    case "low":
      return "severity-badge severity-low";

    default:
      return "severity-badge severity-default";
  }
}

function statusClass(status) {
  switch (status?.toLowerCase()) {
    case "open":
      return "status-badge status-open";

    case "investigating":
      return "status-badge status-investigating";

    case "resolved":
      return "status-badge status-resolved";

    default:
      return "status-badge status-default";
  }
}

function StatusDot({ status }) {
  const value = status?.toLowerCase();

  return (
    <span
      className={`status-dot ${
        value === "resolved"
          ? "dot-resolved"
          : value === "open"
          ? "dot-open"
          : "dot-investigating"
      }`}
    />
  );
}

export default function IncidentTable({
  incidents,
  selectedIncident,
  onSelect,
}) {
  if (!incidents?.length) {
    return (
      <div className="incident-table-empty">
        <div className="empty-icon">✓</div>

        <h3>No incidents found</h3>

        <p>
          There are currently no incidents matching the
          available records.
        </p>
      </div>
    );
  }

  return (
    <div className="incident-table-wrapper">
      <div className="incident-table-scroll">
        <table className="incident-table">
          <thead>
            <tr>
              <th>Incident</th>
              <th>Service</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Created</th>
              <th className="action-column" />
            </tr>
          </thead>

          <tbody>
            {incidents.map((incident) => {
              const isSelected =
                selectedIncident?.id === incident.id;

              return (
                <tr
                  key={incident.id}
                  onClick={() => onSelect(incident)}
                  className={
                    isSelected
                      ? "incident-row selected"
                      : "incident-row"
                  }
                >
                  <td className="incident-main-cell">
                    <div className="incident-title-row">
                      <span className="incident-indicator" />

                      <div>
                        <div className="incident-title">
                          {incident.title}
                        </div>

                        <div className="incident-id">
                          {incident.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="service-name">
                      {incident.service}
                    </span>
                  </td>

                  <td>
                    <span
                      className={severityClass(
                        incident.severity
                      )}
                    >
                      {incident.severity}
                    </span>
                  </td>

                  <td>
                    <span
                      className={statusClass(
                        incident.status
                      )}
                    >
                      <StatusDot status={incident.status} />
                      {incident.status}
                    </span>
                  </td>

                  <td>
                    <span className="created-time">
                      {incident.created_at
                        ? new Date(
                            incident.created_at
                          ).toLocaleString()
                        : "—"}
                    </span>
                  </td>

                  <td className="action-cell">
                    <span
                      className={
                        isSelected
                          ? "incident-arrow active"
                          : "incident-arrow"
                      }
                    >
                      →
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="incident-table-footer">
        <span>
          Showing{" "}
          <strong>{incidents.length}</strong>{" "}
          incident{incidents.length !== 1 ? "s" : ""}
        </span>

        <span className="footer-live">
          <span className="footer-live-dot" />
          Live data
        </span>
      </div>
    </div>
  );
}