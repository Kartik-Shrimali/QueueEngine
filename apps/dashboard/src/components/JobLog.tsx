import type { LogRow } from "../lib/types";

export default function JobLog({ rows }: { rows: LogRow[] }) {
    return (
        <div className="mt-6 max-h-96 overflow-y-auto border rounded p-2 text-sm">
            {rows.map((row) => {
                if (row.kind === "gap") {
                    return (
                        <div
                            key={row.id}
                            className="my-1 border border-amber-500 text-amber-500 rounded px-2 py-1"
                        >
                            {row.dropped} events dropped
                        </div>
                    );
                }

                return (
                    <div key={row.id} className="flex gap-4 py-0.5">
                        <span>{new Date(row.event.at).toLocaleTimeString()}</span>
                        <span>{row.event.type}</span>
                        <span>{row.event.jobId.slice(0, 8)}</span>
                        <span>
                            {row.event.from ?? "new"} to {row.event.to}
                        </span>
                        <span>attempt {row.event.attempt}</span>
                    </div>
                );
            })}
        </div>
    );
}