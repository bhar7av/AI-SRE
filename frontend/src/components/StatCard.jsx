export default function StatCard({
  title,
  value,
  description,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl shadow-black/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-semibold text-white">
            {value}
          </p>

          {description && (
            <p className="mt-2 text-xs text-zinc-500">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
