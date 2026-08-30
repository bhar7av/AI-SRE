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
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
        <p className="text-sm text-zinc-500">
          No remediation plan available.
        </p>
      </div>
    );
  }

  const approved =
    incident?.status === "investigating";

  const resolved =
    incident?.status === "resolved";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            AI Remediation
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            {remediation.action}
          </h3>
        </div>

        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
          {remediation.risk || "medium"} risk
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Reason
          </p>

          <p className="mt-1 text-sm text-zinc-300">
            {remediation.reason || "No reason provided."}
          </p>
        </div>

        {remediation.recommendation && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Recommendation
            </p>

            <p className="mt-1 text-sm text-zinc-300">
              {remediation.recommendation}
            </p>
          </div>
        )}

        {remediation.steps?.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Steps
            </p>

            <ol className="mt-2 space-y-2">
              {remediation.steps.map((step, index) => (
                <li
                  key={index}
                  className="flex gap-3 text-sm text-zinc-400"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-300">
                    {index + 1}
                  </span>

                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-zinc-800 pt-5">
        {!approved && !resolved && (
          <button
            onClick={onApprove}
            disabled={loading}
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Approving..."
              : "Approve Remediation"}
          </button>
        )}

        {approved && (
          <button
            onClick={onExecute}
            disabled={loading}
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Executing..."
              : "Execute Approved Action"}
          </button>
        )}

        {resolved && (
          <button
            onClick={onRollback}
            disabled={loading}
            className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Rolling Back..."
              : "Rollback Remediation"}
          </button>
        )}
      </div>
    </div>
  );
}

