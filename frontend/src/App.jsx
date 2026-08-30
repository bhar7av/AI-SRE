import { useEffect, useMemo, useState } from "react";
import "./App.css";

import {
  approveRemediation,
  detectIncidents,
  executeRemediation,
  getIncidents,
  rollbackRemediation,
} from "./api/incidents";

import IncidentDetails from "./components/IncidentDetails";
import IncidentTable from "./components/IncidentTable";

function App() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadIncidents(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const data = await getIncidents();
      const incidentList = Array.isArray(data) ? data : [];

      setIncidents(incidentList);
      setLastUpdated(new Date());

      setSelectedIncident((current) => {
        if (!current) return null;

        const updated = incidentList.find(
          (incident) => incident.id === current.id
        );

        return updated || null;
      });

      if (showLoader) {
        setError("");
      }
    } catch (err) {
      console.error("Failed to load incidents:", err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to connect to the AI-SRE backend."
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadIncidents();

    const interval = setInterval(() => {
      loadIncidents(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const normalize = (value) =>
      String(value || "").toLowerCase();

    return {
      total: incidents.length,

      critical: incidents.filter(
        (incident) =>
          normalize(incident.severity) === "critical"
      ).length,

      high: incidents.filter(
        (incident) =>
          normalize(incident.severity) === "high"
      ).length,

      open: incidents.filter(
        (incident) =>
          normalize(incident.status) === "open"
      ).length,

      investigating: incidents.filter(
        (incident) =>
          normalize(incident.status) === "investigating"
      ).length,

      resolved: incidents.filter(
        (incident) =>
          normalize(incident.status) === "resolved"
      ).length,
    };
  }, [incidents]);

  async function handleDetect() {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const result = await detectIncidents();

      await loadIncidents(false);

      const count = Array.isArray(result)
        ? result.length
        : 0;

      if (count > 0) {
        setSuccess(
          `${count} new incident${
            count === 1 ? "" : "s"
          } detected.`
        );
      } else {
        setSuccess(
          "Detection completed. No new incidents detected."
        );
      }
    } catch (err) {
      console.error("Detection failed:", err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Incident detection failed."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!selectedIncident?.id) {
      setError("Select an incident first.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await approveRemediation(selectedIncident.id);
      await loadIncidents(false);

      setSuccess(
        "Remediation approved. Execution is now available."
      );
    } catch (err) {
      console.error("Approval failed:", err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Remediation approval failed."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExecute() {
    if (!selectedIncident?.id) {
      setError("Select an incident first.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const result = await executeRemediation(
        selectedIncident.id
      );

      await loadIncidents(false);

      if (result?.executed === false) {
        setError(
          result?.message ||
            "Execution was blocked."
        );
      } else {
        setSuccess(
          result?.message ||
            "Approved remediation executed successfully."
        );
      }
    } catch (err) {
      console.error("Execution failed:", err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Remediation execution failed."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRollback() {
    if (!selectedIncident?.id) {
      setError("Select an incident first.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const result = await rollbackRemediation(
        selectedIncident.id
      );

      await loadIncidents(false);

      setSuccess(
        result?.message ||
          "Remediation rollback completed successfully."
      );
    } catch (err) {
      console.error("Rollback failed:", err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Rollback failed."
      );
    } finally {
      setActionLoading(false);
    }
  }

  function handleSelectIncident(incident) {
    setSelectedIncident(incident);
    setError("");
    setSuccess("");

    setTimeout(() => {
      document
        .getElementById("incident-details")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  return (
    <div className="app-shell">

      <header className="topbar">
        <div className="topbar-inner">

          <div className="brand">
            <div className="brand-icon">
              AI
            </div>

            <div>
              <div className="brand-title">
                AI-SRE
              </div>

              <div className="brand-subtitle">
                Intelligent Incident Response
              </div>
            </div>
          </div>

          <div className="topbar-actions">

            <div className="system-status">
              <span className="status-dot" />
              System Operational
            </div>

            <button
              className="detect-button"
              onClick={handleDetect}
              disabled={actionLoading}
            >
              <span className={actionLoading ? "spin" : ""}>
                ↻
              </span>

              {actionLoading
                ? "Detecting..."
                : "Detect Incidents"}
            </button>

          </div>
        </div>
      </header>

      <main className="page">

        <section className="hero">

          <div className="hero-copy">

            <div className="eyebrow">
              Site Reliability Operations
            </div>

            <h1>
              Incident
              <span> Command Center</span>
            </h1>

            <p>
              Monitor production services, investigate incidents,
              understand root causes, and safely execute
              AI-assisted remediation.
            </p>

            <div className="hero-status">

              <div className="live-status">
                <span className="live-dot" />
                <span>Live monitoring</span>
              </div>

              <span className="separator">/</span>

              <span>Auto-refresh every 3s</span>

              <span className="separator">/</span>

              <span>AI-SRE Engine</span>

            </div>

          </div>

          <div className="hero-orbit">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />
            <div className="orbit-core">
              <span>AI</span>
            </div>
          </div>

        </section>

        {error && (
          <div className="message error-message">
            <div className="message-icon">!</div>
            <div>
              <strong>System Error</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="message success-message">
            <div className="message-icon">✓</div>
            <div>
              <strong>Operation Complete</strong>
              <span>{success}</span>
            </div>
          </div>
        )}

        <section className="overview-section">

          <div className="section-header">

            <div>
              <div className="eyebrow">
                System Overview
              </div>

              <h2>Incident Overview</h2>

              <p>
                Current production health and incident activity.
              </p>
            </div>

            <div className="last-updated">
              <span className="live-dot" />
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : "Connecting"}
            </div>

          </div>

          <div className="stats-grid">

            <StatCard
              label="Total Incidents"
              value={stats.total}
              description="All detected events"
              icon="◎"
            />

            <StatCard
              label="Open"
              value={stats.open}
              description="Requiring attention"
              icon="!"
              active={stats.open > 0}
            />

            <StatCard
              label="High Severity"
              value={stats.high + stats.critical}
              description="Elevated risk events"
              icon="▲"
              active={stats.high + stats.critical > 0}
            />

            <StatCard
              label="Resolved"
              value={stats.resolved}
              description="Completed incidents"
              icon="✓"
            />

          </div>

        </section>

        <section className="workspace">

          <div className="workspace-header">

            <div>
              <div className="eyebrow">
                Operations
              </div>

              <h2>Incident Operations</h2>
            </div>

            <button
              className="refresh-button"
              onClick={() => loadIncidents()}
              disabled={loading || actionLoading}
            >
              <span className={loading ? "spin" : ""}>
                ↻
              </span>

              {loading ? "Refreshing" : "Refresh"}
            </button>

          </div>

          <div className="operations-grid">

            <section className="panel incidents-panel">

              <div className="panel-header">

                <div>
                  <div className="panel-kicker">
                    DETECTION FEED
                  </div>

                  <h3>Active Incidents</h3>

                  <p>
                    Production events detected by the AI-SRE
                    telemetry pipeline.
                  </p>
                </div>

                <div className="panel-count">
                  {incidents.length}
                </div>

              </div>

              <div className="panel-body">

                {loading ? (
                  <div className="loading-state">
                    <div className="loading-spinner" />
                    <strong>Loading incidents</strong>
                    <span>
                      Connecting to the AI-SRE engine...
                    </span>
                  </div>
                ) : incidents.length === 0 ? (
                  <div className="empty-state">

                    <div className="empty-graphic">
                      <div className="empty-circle">
                        ✓
                      </div>
                    </div>

                    <h3>No active incidents</h3>

                    <p>
                      The system has not detected any production
                      anomalies yet.
                    </p>

                    <button
                      className="empty-action"
                      onClick={handleDetect}
                      disabled={actionLoading}
                    >
                      Run Detection
                    </button>

                  </div>
                ) : (
                  <IncidentTable
                    incidents={incidents}
                    selectedIncident={selectedIncident}
                    onSelect={handleSelectIncident}
                  />
                )}

              </div>

              <div className="panel-footer">
                <span>
                  Showing {incidents.length} incident
                  {incidents.length === 1 ? "" : "s"}
                </span>

                <span className="footer-live">
                  <span className="live-dot" />
                  LIVE
                </span>
              </div>

            </section>

            <section
              id="incident-details"
              className="panel intelligence-panel"
            >

              <div className="panel-header">

                <div>
                  <div className="panel-kicker">
                    INVESTIGATION
                  </div>

                  <h3>Incident Intelligence</h3>

                  <p>
                    AI analysis, telemetry evidence and
                    controlled remediation.
                  </p>
                </div>

                {selectedIncident && (
                  <div className="selected-indicator">
                    SELECTED
                  </div>
                )}

              </div>

              <div className="intelligence-body">

                <IncidentDetails
                  incident={selectedIncident}
                  onApprove={handleApprove}
                  onExecute={handleExecute}
                  onRollback={handleRollback}
                  loading={actionLoading}
                />

              </div>

            </section>

          </div>

        </section>

        <footer className="dashboard-footer">

          <div>
            <strong>AI-SRE</strong>
            <span>
              Intelligent Incident Response Platform
            </span>
          </div>

          <div className="footer-capabilities">
            <span>AI-ASSISTED RCA</span>
            <span>/</span>
            <span>HUMAN APPROVAL</span>
            <span>/</span>
            <span>AUDITABLE REMEDIATION</span>
          </div>

        </footer>

      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
  active = false,
}) {
  return (
    <div className={`stat-card ${active ? "stat-active" : ""}`}>

      <div className="stat-card-top">

        <span className="stat-label">
          {label}
        </span>

        <span className="stat-icon">
          {icon}
        </span>

      </div>

      <div className="stat-value">
        {value}
      </div>

      <div className="stat-description">
        {description}
      </div>

    </div>
  );
}

export default App;