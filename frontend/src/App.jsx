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

  // Newly detected automatic incident
  const [newIncident, setNewIncident] = useState(null);

  // ---------------------------------------------------------
  // Load incidents
  // ---------------------------------------------------------

  async function loadIncidents() {
    try {
      setError("");

      const data = await getIncidents();

      setIncidents((previousIncidents) => {
        /*
         * Detect incidents that appeared since the previous request.
         *
         * We only show the notification for incidents created
         * automatically by the detection engine.
         */
        if (previousIncidents.length > 0) {
          const previousIds = new Set(
            previousIncidents.map(
              (incident) => incident.id
            )
          );

          const newlyDetected = data.find(
            (incident) =>
              !previousIds.has(incident.id) &&
              incident.source === "automatic_detection"
          );

          if (newlyDetected) {
            setNewIncident(newlyDetected);

            /*
             * Automatically hide the notification after 6 seconds.
             */
            setTimeout(() => {
              setNewIncident((current) => {
                if (
                  current?.id === newlyDetected.id
                ) {
                  return null;
                }

                return current;
              });
            }, 6000);
          }
        }

        return data;
      });

      /*
       * Keep the selected incident synchronized with the
       * latest backend data.
       */
      setSelectedIncident((currentSelected) => {
        if (!currentSelected) {
          return null;
        }

        const updated = data.find(
          (item) =>
            item.id === currentSelected.id
        );

        return updated || currentSelected;
      });
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to connect to the AI-SRE backend."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Initial load + automatic polling
  // ---------------------------------------------------------

  useEffect(() => {
    loadIncidents();

    /*
     * Check the backend every 3 seconds.
     *
     * This allows the dashboard to automatically discover
     * incidents created by telemetry/anomaly detection.
     */
    const interval = setInterval(() => {
      loadIncidents();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ---------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------

  const stats = useMemo(() => {
    return {
      total: incidents.length,

      critical: incidents.filter(
        (incident) =>
          incident.severity?.toLowerCase() ===
          "critical"
      ).length,

      high: incidents.filter(
        (incident) =>
          incident.severity?.toLowerCase() ===
          "high"
      ).length,

      open: incidents.filter(
        (incident) =>
          incident.status?.toLowerCase() ===
          "open"
      ).length,

      investigating: incidents.filter(
        (incident) =>
          incident.status?.toLowerCase() ===
          "investigating"
      ).length,

      resolved: incidents.filter(
        (incident) =>
          incident.status?.toLowerCase() ===
          "resolved"
      ).length,
    };
  }, [incidents]);

  // ---------------------------------------------------------
  // Manual detection
  // ---------------------------------------------------------

  async function handleDetect() {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const result = await detectIncidents();

      await loadIncidents();

      const detectedCount = Array.isArray(result)
        ? result.length
        : 0;

      if (detectedCount > 0) {
        setSuccess(
          `${detectedCount} new incident${
            detectedCount === 1 ? "" : "s"
          } detected.`
        );
      } else {
        setSuccess(
          "Detection completed. No new incidents detected."
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Incident detection failed."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Approve remediation
  // ---------------------------------------------------------

  async function handleApprove() {
    if (!selectedIncident) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await approveRemediation(
        selectedIncident.id
      );

      await loadIncidents();

      setSuccess(
        "Remediation approved. Execution is now available."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Remediation approval failed."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Execute remediation
  // ---------------------------------------------------------

  async function handleExecute() {
    if (!selectedIncident) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await executeRemediation(
        selectedIncident.id
      );

      await loadIncidents();

      setSuccess(
        "Approved remediation executed successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Remediation execution failed."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Rollback remediation
  // ---------------------------------------------------------

  async function handleRollback() {
    if (!selectedIncident) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await rollbackRemediation(
        selectedIncident.id
      );

      await loadIncidents();

      setSuccess(
        "Remediation rollback completed."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Rollback failed."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Select incident from notification
  // ---------------------------------------------------------

  function handleInvestigate() {
    if (!newIncident) {
      return;
    }

    const incident = incidents.find(
      (item) => item.id === newIncident.id
    );

    if (incident) {
      setSelectedIncident(incident);
    }

    setNewIncident(null);
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-black">
              AI
            </div>

            <div>
              <h1 className="text-lg font-semibold text-white">
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
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading
                ? "Working..."
                : "Run Detection"}
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-[1600px] px-6 py-8">
        {/* ---------------------------------------------------
            PAGE TITLE
        ---------------------------------------------------- */}

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white">
            Operations Overview
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Monitor incidents, AI analysis, remediation and
            execution.
          </p>
        </div>

        {/* ===================================================
            AUTOMATIC ANOMALY NOTIFICATION
        ==================================================== */}

        {newIncident && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 shadow-lg shadow-red-950/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-lg font-bold text-red-400">
                  !
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                    Anomaly Detected
                  </p>

                  <h3 className="mt-1 text-base font-semibold text-white">
                    {newIncident.title}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-400">
                    {newIncident.service}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {newIncident.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-red-400">
                      {newIncident.severity}
                    </span>

                    <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400">
                      {newIncident.id}
                    </span>

                    <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400">
                      Automatic Detection
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleInvestigate}
                className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                Investigate
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ===================================================
            SUCCESS
        ==================================================== */}

        {success && (
          <div className="mb-5 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* ===================================================
            STATISTICS
        ==================================================== */}

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

        {/* ===================================================
            INCIDENTS + INTELLIGENCE
        ==================================================== */}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.15fr]">
          {/* =================================================
              INCIDENT LIST
          ================================================== */}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Incidents
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Select an incident to investigate.
                </p>
              </div>

              <button
                onClick={loadIncidents}
                disabled={loading}
                className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:bg-zinc-900 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-10 text-center">
                <p className="text-sm text-zinc-500">
                  Loading incidents...
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

          {/* =================================================
              INCIDENT INTELLIGENCE
          ================================================== */}

          <section>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">
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