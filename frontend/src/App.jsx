import { useEffect, useMemo, useState } from "react";

import "./App.css";

import ServicesPanel from "./components/ServicesPanel";

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


  // ============================================================
  // LOAD INCIDENTS
  // ============================================================

  async function loadIncidents(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const data = await getIncidents();

      const incidentList = Array.isArray(data) ? data : [];

      setIncidents(incidentList);

      setSelectedIncident((current) => {
        if (!current) return null;

        const updated = incidentList.find(
          (incident) => incident.id === current.id
        );

        return updated || null;
      });
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


  // ============================================================
  // AUTO REFRESH
  // ============================================================

  useEffect(() => {
    loadIncidents();

    const interval = setInterval(() => {
      loadIncidents(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);


  // ============================================================
  // INCIDENT STATISTICS
  // ============================================================

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


  // ============================================================
  // DETECT INCIDENTS
  // ============================================================

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

      setSuccess(
        count > 0
          ? `${count} new incident${
              count === 1 ? "" : "s"
            } detected.`
          : "Detection completed. No new incidents detected."
      );
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


  // ============================================================
  // APPROVE REMEDIATION
  // ============================================================

  async function handleApprove() {
    if (!selectedIncident?.id) {
      setError("Please select an incident first.");
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


  // ============================================================
  // EXECUTE REMEDIATION
  // ============================================================

  async function handleExecute() {
    if (!selectedIncident?.id) {
      setError("Please select an incident first.");
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


  // ============================================================
  // ROLLBACK REMEDIATION
  // ============================================================

  async function handleRollback() {
    if (!selectedIncident?.id) {
      setError("Please select an incident first.");
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


  // ============================================================
  // SELECT INCIDENT
  // ============================================================

  function handleSelectIncident(incident) {
    setSelectedIncident(incident);
    setError("");
    setSuccess("");
  }


  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="app-shell">

      {/* ======================================================
          TOP NAVIGATION
          ====================================================== */}

      <header className="topbar">

        <div className="brand">

          <div className="brand-icon">
            AI
          </div>

          <div className="brand-text">

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
            System Operational
          </div>

          <button
            className="detect-button"
            onClick={handleDetect}
            disabled={actionLoading}
          >

            <span>↻</span>

            {actionLoading
              ? "Working..."
              : "Detect Incidents"}

          </button>

        </div>

      </header>


      {/* ======================================================
          HERO
          ====================================================== */}

      <section className="hero">

        <div className="eyebrow">
          Site Reliability Operations
        </div>

        <h1 className="hero-title">
          Incident Command Center
        </h1>

        <p className="hero-description">
          Monitor, analyze, and safely remediate production
          incidents with AI-assisted root cause analysis.
        </p>

        <div className="hero-meta">

          <div className="monitoring-status">

            <span className="live-dot" />

            Live monitoring

            <span>•</span>

            Auto-refresh: 3s

          </div>

          <div>
            Engine / AI-SRE
          </div>

        </div>

      </section>


      {/* ======================================================
          ALERTS
          ====================================================== */}

      {error && (
        <div className="error-message app-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message app-message">
          {success}
        </div>
      )}


      {/* ======================================================
          QUICK STATUS
          ====================================================== */}

      <section className="quick-status">

        <div className="section-heading">

          <div>

            <div className="eyebrow">
              Quick Status
            </div>

            <h2>
              Incident Overview
            </h2>

          </div>

          <span className="count-badge">
            {stats.total} events
          </span>

        </div>


        <div className="stats-grid">

          {/* TOTAL */}

          <div className="stat-card">

            <div className="stat-header">

              <span className="stat-label">
                Total Incidents
              </span>

              <span className="stat-icon">
                ◉
              </span>

            </div>

            <div className="stat-value">
              {stats.total}
            </div>

            <div className="stat-description">
              All detected events
            </div>

          </div>


          {/* OPEN */}

          <div className="stat-card">

            <div className="stat-header">

              <span className="stat-label">
                Open Incidents
              </span>

              <span className="stat-icon">
                !
              </span>

            </div>

            <div className="stat-value">
              {stats.open}
            </div>

            <div className="stat-description">
              Requiring attention
            </div>

          </div>


          {/* HIGH */}

          <div className="stat-card">

            <div className="stat-header">

              <span className="stat-label">
                High Severity
              </span>

              <span className="stat-icon">
                ▲
              </span>

            </div>

            <div className="stat-value">
              {stats.high}
            </div>

            <div className="stat-description">
              Elevated risk events
            </div>

          </div>


          {/* RESOLVED */}

          <div className="stat-card">

            <div className="stat-header">

              <span className="stat-label">
                Resolved
              </span>

              <span className="stat-icon">
                ✓
              </span>

            </div>

            <div className="stat-value">
              {stats.resolved}
            </div>

            <div className="stat-description">
              Completed incidents
            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          SERVICE REGISTRY
          ====================================================== */}

      <ServicesPanel />


      {/* ======================================================
          INCIDENT DASHBOARD
          ====================================================== */}

      <main className="dashboard-grid">

        {/* ====================================================
            INCIDENT LIST
            ==================================================== */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2 className="panel-title">
                Active Incidents
              </h2>

              <p className="panel-subtitle">
                Detected production events and their current
                status
              </p>

            </div>


            <div className="panel-header-actions">

              <span className="count-badge">
                {incidents.length}
              </span>

              <button
                className="secondary-button"
                onClick={() => loadIncidents()}
                disabled={loading || actionLoading}
              >
                {loading
                  ? "Loading..."
                  : "Refresh"}
              </button>

            </div>

          </div>


          {loading ? (

            <div className="loading">

              <span className="spinner" />

              Loading incidents...

            </div>

          ) : incidents.length === 0 ? (

            <div className="empty-state">

              <div className="empty-state-icon">
                ◈
              </div>

              <h3>
                No incidents detected
              </h3>

              <p>
                Run detection to check for new production
                incidents.
              </p>

            </div>

          ) : (

            <IncidentTable
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelect={handleSelectIncident}
            />

          )}

        </section>


        {/* ====================================================
            INCIDENT INTELLIGENCE
            ==================================================== */}

        <section className="panel incident-intelligence">

          <div className="panel-header">

            <div>

              <h2 className="panel-title">
                Incident Intelligence
              </h2>

              <p className="panel-subtitle">
                AI analysis and controlled remediation
              </p>

            </div>

          </div>


          <IncidentDetails
            incident={selectedIncident}
            onApprove={handleApprove}
            onExecute={handleExecute}
            onRollback={handleRollback}
            loading={actionLoading}
          />

        </section>

      </main>


      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="footer">

        <span>
          AI-SRE Incident Command Center
        </span>

        <span>
          Human-in-the-loop remediation
        </span>

      </footer>

    </div>
  );
}


export default App;