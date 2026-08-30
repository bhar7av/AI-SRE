export default function AuditTimeline({ logs }) {
  if (!logs?.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
        <p className="text-sm text-zinc-500">
          No audit events recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="relative rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">
                {log.action}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                {log.created_at
                  ? new Date(
                      log.created_at
                    ).toLocaleString()
                  : "Unknown time"}
              </p>
            </div>

            <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
              {log.status}
            </span>
          </div>

          {log.details && (
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {log.details}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
