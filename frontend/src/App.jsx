import { useEffect, useMemo, useState } from "react";

import {
  approveRemediation,
  detectIncidents,
  executeRemediation,
  getIncidents,
  rollbackRemediation,
} from "./api/incidents";

import IncidentDetails from "./components/IncidentDetails";
import IncidentTable from "./components/IncidentTable";
import StatCard from "./components/StatCard";

function App() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------
  // LOAD INCIDENTS
  // --------------------------------------------------

  async function loadIncidents(showLoader = false) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const data = await getIncidents();

      setIncidents(data);

      // Keep selected incident synchronized with backend
      setSelectedIncident((current) => {
        if (!current) {
          return data.length > 0 ? data[0] : null;
        }

        const updated = data.find(
          (incident) => incident.id === current.id
        );

        return updated || current;
      });

      setError("");
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

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    loadIncidents(true);
  }, []);

  // --------------------------------------------------
  // AUTOMATIC INCIDENT MONITORING
  //
  // The backend can receive telemetry independently
  // of the frontend. Poll the incidents endpoint so
  // newly detected incidents appear automatically.
  // --------------------------------------------------

  useEffect(() => {
    const interval = setInterval(() => {
      loadIncidents(false);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const stats = useMemo(() => {
    return {
      total: incidents.length,

      critical: incidents.filter(
        (incident) =>
          incident.severity?.toLowerCase() === "critical"
      ).length,

      high: incidents.filter(
        (incident) =>
          incident.severity?.toLowerCase() === "high"
      ).length,

      open: incidents.filter(
        (incident) =>
          incident.status?.toLowerCase() === "open"
      ).length,

      investigating: incidents.filter(
        (incident) =>
          incident.status?.toLowerCase() === "investigating"
      ).length,

      resolved: incidents.filter(
        (incident) =>
          incident.status?.toLowerCase() === "resolved"
      ).length,
    };
  }, [incidents]);

  // --------------------------------------------------
  // RUN DETECTION MANUALLY
  // --------------------------------------------------

  async function handleDetect() {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const result = await detectIncidents();

      console.log("Detection result:", result);

      await loadIncidents(false);

      setSuccess("Incident detection completed.");
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

  // --------------------------------------------------
  // APPROVE REMEDIATION
  // --------------------------------------------------

  async function handleApprove() {
    if (!selectedIncident) {
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

  // --------------------------------------------------
  // EXECUTE REMEDIATION
  // --------------------------------------------------

  async function handleExecute() {
    if (!selectedIncident) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await executeRemediation(selectedIncident.id);

      await loadIncidents(false);

      setSuccess(
        "Approved remediation executed successfully."
      );
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

  // --------------------------------------------------
  // ROLLBACK REMEDIATION
  // --------------------------------------------------

  async function handleRollback() {
    if (!selectedIncident) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await rollbackRemediation(selectedIncident.id);

      await loadIncidents(false);

      setSuccess(
        "Remediation rollback completed."
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

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* HEADER */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-black">
              AI
            </div>

            <div>
              <h1 className="text-lg font-semibold">
                AI-SRE
              </h1>

              <p className="text-xs text-zinc-500">
                Autonomous Incident Response Platform
              </p>
            </div>

          </div>

          <div className="flex items-center gap-4">

            <div className="hidden items-center gap-2 sm:flex">

              <span className="h-2 w-2 rounded-full bg-green-400" />

              <span className="text-xs text-zinc-400">
                System Operational
              </span>

            </div>

            <button
              onClick={handleDetect}
              disabled={actionLoading}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {actionLoading
                ? "Working..."
                : "Run Detection"}
            </button>

          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-[1600px] px-6 py-8">

        {/* TITLE */}
        <div className="mb-8">

          <h2 className="text-2xl font-semibold">
            Operations Overview
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Monitor incidents, AI analysis, remediation and
            execution.
          </p>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="mb-5 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* STATISTICS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <StatCard
            title="Total Incidents"
            value={stats.total}
            description="All recorded incidents"
            icon="◈"
          />

          <StatCard
            title="Critical"
            value={stats.critical}
            description="Requires immediate attention"
            icon="!"
          />

          <StatCard
            title="High Severity"
            value={stats.high}
            description="High-priority incidents"
            icon="▲"
          />

          <StatCard
            title="Investigating"
            value={stats.investigating}
            description="Awaiting or executing response"
            icon="◌"
          />

          <StatCard
            title="Resolved"
            value={stats.resolved}
            description="Successfully resolved"
            icon="✓"
          />

        </div>

        {/* INCIDENTS + INTELLIGENCE */}
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.15fr]">

          {/* INCIDENT LIST */}
          <section>

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h3 className="text-lg font-semibold">
                  Incidents
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Select an incident to investigate.
                </p>

              </div>

              <button
                onClick={() => loadIncidents(true)}
                disabled={loading}
                className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:bg-zinc-900 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>

            </div>

            {loading ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-10 text-center">

                <p className="text-sm text-zinc-500">
                  Loading incidents...
                </p>

              </div>
            ) : incidents.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-10 text-center">

                <p className="text-sm text-zinc-500">
                  No incidents detected.
                </p>

                <p className="mt-2 text-xs text-zinc-600">
                  Waiting for telemetry anomalies...
                </p>

              </div>
            ) : (
              <IncidentTable
                incidents={incidents}
                selectedIncident={selectedIncident}
                onSelect={setSelectedIncident}
              />
            )}

          </section>

          {/* INCIDENT INTELLIGENCE */}
          <section>

            <div className="mb-4">

              <h3 className="text-lg font-semibold">
                Incident Intelligence
              </h3>

              <p className="mt-1 text-xs text-zinc-500">
                AI analysis and controlled remediation.
              </p>

            </div>

            <IncidentDetails
              incident={selectedIncident}
              onApprove={handleApprove}
              onExecute={handleExecute}
              onRollback={handleRollback}
              loading={actionLoading}
            />

          </section>

        </div>

      </main>

    </div>
  );
}

export default App;