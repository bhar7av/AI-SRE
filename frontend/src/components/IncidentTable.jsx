function severityClass(severity) {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    case "high":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";

    case "medium":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

    case "low":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    default:
      return "border-zinc-700 bg-zinc-800 text-zinc-300";
  }
}

function statusClass(status) {
  switch (status?.toLowerCase()) {
    case "open":
      return "text-orange-400";

    case "investigating":
      return "text-yellow-400";

    case "resolved":
      return "text-green-400";

    default:
      return "text-zinc-400";
  }
}

export default function IncidentTable({
  incidents,
  selectedIncident,
  onSelect,
}) {
  if (!incidents.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-10 text-center">
        <p className="text-zinc-400">
          No incidents found.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-zinc-800 bg-zinc-950/50">
            <tr>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Incident
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Service
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Severity
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Status
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Created
              </th>

              <th className="px-5 py-4"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
            {incidents.map((incident) => (
              <tr
                key={incident.id}
                onClick={() => onSelect(incident)}
                className={`cursor-pointer transition hover:bg-zinc-800/50 ${
                  selectedIncident?.id === incident.id
                    ? "bg-zinc-800/40"
                    : ""
                }`}
              >
                <td className="px-5 py-4">
                  <div>
                    <p className="font-medium text-white">
                      {incident.title}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {incident.id}
                    </p>
                  </div>
                </td>

                <td className="px-5 py-4 text-sm text-zinc-300">
                  {incident.service}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(
                      incident.severity
                    )}`}
                  >
                    {incident.severity}
                  </span>
                </td>

                <td
                  className={`px-5 py-4 text-sm font-medium ${statusClass(
                    incident.status
                  )}`}
                >
                  {incident.status}
                </td>

                <td className="px-5 py-4 text-xs text-zinc-500">
                  {incident.created_at
                    ? new Date(
                        incident.created_at
                      ).toLocaleString()
                    : "—"}
                </td>

                <td className="px-5 py-4 text-right text-zinc-500">
                  →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
