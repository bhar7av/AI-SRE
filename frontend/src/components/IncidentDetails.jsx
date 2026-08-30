import { useEffect, useState } from "react";

import {
  analyzeIncident,
  getAuditLogs,
  getIncidentContext,
  getRemediation,
} from "../api/incidents";

import AuditTimeline from "./AuditTimeline";
import RemediationCard from "./RemediationCard";

export default function IncidentDetails({
  incident,
  onApprove,
  onExecute,
  onRollback,
  loading,
}) {
  const [context, setContext] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [remediation, setRemediation] = useState(null);
  const [audit, setAudit] = useState([]);

  const [loadingData, setLoadingData] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!incident?.id) {
      setContext(null);
      setAnalysis(null);
      setRemediation(null);
      setAudit([]);
      setError("");
      return;
    }

    let cancelled = false;

    async function loadDetails() {
      try {
        setLoadingData(true);
        setError("");

        const [
          contextResult,
          analysisResult,
          remediationResult,
          auditResult,
        ] = await Promise.all([
          getIncidentContext(incident.id),
          analyzeIncident(incident.id),
          getRemediation(incident.id),
          getAuditLogs(incident.id),
        ]);

        if (cancelled) {
          return;
        }

        setContext(contextResult);
        setAnalysis(analysisResult);
        setRemediation(remediationResult);
        setAudit(
          Array.isArray(auditResult)
            ? auditResult
            : []
        );
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
              "Unable to load incident intelligence."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [incident?.id]);

  /*
  |--------------------------------------------------------------------------
  | Empty State
  |--------------------------------------------------------------------------
  */

  if (!incident) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-xl text-zinc-500">
            ◈
          </div>

          <p className="mt-4 text-sm font-medium text-zinc-300">
            Select an incident
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            Choose an incident from the list to inspect
            its intelligence and remediation.
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Derived Values
  |--------------------------------------------------------------------------
  */

  const severity =
    incident.severity?.toLowerCase() || "unknown";

  const status =
    incident.status?.toLowerCase() || "unknown";

  const confidence =
    typeof analysis?.confidence === "number"
      ? Math.min(
          100,
          Math.max(0, analysis.confidence)
        )
      : null;

  const metrics = Array.isArray(
    context?.metrics
  )
    ? context.metrics
    : [];

  const logs = Array.isArray(context?.logs)
    ? context.logs
    : [];

  const evidence = Array.isArray(
    analysis?.evidence
  )
    ? analysis.evidence
    : [];

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  function severityClass() {
    if (severity === "critical") {
      return "border-red-500/30 bg-red-500/10 text-red-400";
    }

    if (severity === "high") {
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    }

    if (severity === "medium") {
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
    }

    if (severity === "low") {
      return "border-green-500/30 bg-green-500/10 text-green-400";
    }

    return "border-zinc-700 bg-zinc-900 text-zinc-400";
  }

  function statusClass() {
    if (status === "resolved") {
      return "border-green-500/30 bg-green-500/10 text-green-400";
    }

    if (status === "investigating") {
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    }

    if (status === "open") {
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    }

    return "border-zinc-700 bg-zinc-900 text-zinc-400";
  }

  function formatValue(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------------------ */}
      {/* Incident Header */}
      {/* ------------------------------------------------------------------ */}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-zinc-500">
                {incident.id}
              </span>

              <span
                className={`rounded-md border px-2 py-1 text-[11px] font-medium uppercase ${severityClass()}`}
              >
                {severity}
              </span>

              <span
                className={`rounded-md border px-2 py-1 text-[11px] font-medium uppercase ${statusClass()}`}
              >
                {status}
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
              {incident.title}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              {incident.description ||
                "No incident description available."}
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 lg:w-[280px]">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Service
              </p>

              <p className="mt-2 break-all font-mono text-xs text-zinc-300">
                {incident.service || "—"}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Source
              </p>

              <p className="mt-2 break-all text-xs text-zinc-300">
                {incident.source || "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Error */}
      {/* ------------------------------------------------------------------ */}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
            Intelligence Error
          </p>

          <p className="mt-1 text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Loading */}
      {/* ------------------------------------------------------------------ */}

      {loadingData ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-10 text-center">
          <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />

          <p className="text-sm text-zinc-400">
            Loading incident intelligence...
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            Collecting context, AI analysis, remediation
            and audit information.
          </p>
        </div>
      ) : (
        <>
          {/* -------------------------------------------------------------- */}
          {/* AI Analysis + Telemetry */}
          {/* -------------------------------------------------------------- */}

          <div className="grid gap-5 lg:grid-cols-2">
            {/* AI Analysis */}

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    AI Analysis
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-white">
                    Root Cause Analysis
                  </h3>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-sm text-zinc-400">
                  AI
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Root Cause
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {analysis?.root_cause ||
                    "Root cause could not be determined."}
                </p>
              </div>

              {confidence !== null && (
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-500">
                      AI Confidence
                    </p>

                    <p className="text-xs font-semibold text-zinc-300">
                      {confidence}%
                    </p>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-500"
                      style={{
                        width: `${confidence}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {evidence.length > 0 && (
                <div className="mt-6">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Evidence
                  </p>

                  <div className="mt-3 space-y-2">
                    {evidence.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
                        >
                          <p className="text-xs leading-5 text-zinc-400">
                            {formatValue(item)}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {!analysis && (
                <p className="mt-5 text-sm text-zinc-600">
                  No AI analysis available.
                </p>
              )}
            </section>

            {/* Telemetry */}

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  Telemetry
                </p>

                <h3 className="mt-2 text-lg font-semibold text-white">
                  Current Service Signals
                </h3>
              </div>

              <div className="mt-5 space-y-3">
                {metrics.length > 0 ? (
                  metrics.map(
                    (metric, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-zinc-400">
                            {metric?.name ||
                              `Metric ${index + 1}`}
                          </span>

                          <span className="font-mono text-sm font-semibold text-white">
                            {formatValue(
                              metric?.value
                            )}
                          </span>
                        </div>

                        {metric?.unit && (
                          <p className="mt-1 text-right text-[10px] text-zinc-600">
                            {metric.unit}
                          </p>
                        )}
                      </div>
                    )
                  )
                ) : (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
                    <p className="text-sm text-zinc-500">
                      No metrics available.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Logs
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Service log entries collected for
                    analysis.
                  </p>
                </div>

                <span className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300">
                  {logs.length} entries
                </span>
              </div>
            </section>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Logs */}
          {/* -------------------------------------------------------------- */}

          {logs.length > 0 && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    Service Logs
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-white">
                    Recent Evidence
                  </h3>
                </div>

                <span className="text-xs text-zinc-600">
                  {logs.length} records
                </span>
              </div>

              <div className="mt-5 max-h-[260px] space-y-2 overflow-y-auto pr-1">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
                  >
                    <p className="font-mono text-xs leading-5 text-zinc-400">
                      {formatValue(log)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Remediation */}
          {/* -------------------------------------------------------------- */}

          <RemediationCard
            remediation={remediation}
            incident={incident}
            onApprove={onApprove}
            onExecute={onExecute}
            onRollback={onRollback}
            loading={loading}
          />

          {/* -------------------------------------------------------------- */}
          {/* Workflow Status */}
          {/* -------------------------------------------------------------- */}

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Response Workflow
            </p>

            <h3 className="mt-2 text-lg font-semibold text-white">
              Remediation Lifecycle
            </h3>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <WorkflowStep
                number="01"
                title="Detect"
                active
                description="Incident identified"
              />

              <WorkflowStep
                number="02"
                title="Analyze"
                active={Boolean(analysis)}
                description="AI investigates"
              />

              <WorkflowStep
                number="03"
                title="Approve"
                active={
                  status === "investigating" ||
                  status === "resolved"
                }
                description="Human authorization"
              />

              <WorkflowStep
                number="04"
                title="Execute"
                active={status === "resolved"}
                description="Controlled remediation"
              />
            </div>
          </section>

          {/* -------------------------------------------------------------- */}
          {/* Audit */}
          {/* -------------------------------------------------------------- */}

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  Audit Timeline
                </p>

                <h3 className="mt-2 text-lg font-semibold text-white">
                  Incident Activity
                </h3>
              </div>

              <span className="text-xs text-zinc-600">
                {audit.length} events
              </span>
            </div>

            <div className="mt-6">
              {audit.length > 0 ? (
                <AuditTimeline logs={audit} />
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
                  <p className="text-sm text-zinc-500">
                    No audit events recorded yet.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Workflow Step
|--------------------------------------------------------------------------
*/

function WorkflowStep({
  number,
  title,
  description,
  active,
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        active
          ? "border-zinc-700 bg-zinc-950"
          : "border-zinc-800 bg-zinc-950/40 opacity-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-semibold ${
            active
              ? "bg-white text-black"
              : "border border-zinc-800 text-zinc-600"
          }`}
        >
          {active ? "✓" : number}
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-200">
            {title}
          </p>

          <p className="mt-0.5 text-[10px] text-zinc-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}