import type { LogRow } from "../lib/types";
import Panel from "./Panel";

export default function JobLog({ rows }: { rows: LogRow[] }) {
    return (
        <Panel title="Job log">
            {rows.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    No events yet. They appear here as jobs change state.
                </p>
            ) : (
                <div className="max-h-96 overflow-auto [color-scheme:light] dark:[color-scheme:dark]">
                    {rows.map((row) => {
                        if (row.kind === "gap") {
                            return (
                                <div
                                    key={row.id}
                                    className="my-1 min-w-max rounded border border-amber-500 px-2 py-1 text-xs text-amber-600 dark:text-amber-400"
                                >
                                    {row.dropped} events dropped
                                </div>
                            );
                        }

                        let toClass = "text-gray-600 dark:text-gray-400";
                        if (row.event.to === "completed") {
                            toClass = "text-green-600 dark:text-green-400";
                        } else if (row.event.to === "dead") {
                            toClass = "text-red-600 dark:text-red-400";
                        }

                        return (
                            <div key={row.id} className="flex min-w-max gap-4 py-1 font-mono text-xs">
                                <span className="w-24 shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                                    {new Date(row.event.at).toLocaleTimeString()}
                                </span>
                                <span className="w-36 shrink-0">{row.event.type}</span>
                                <span className="w-20 shrink-0 text-gray-500 dark:text-gray-400" title={row.event.jobId}>
                                    {row.event.jobId.slice(0, 8)}
                                </span>
                                <span className="w-44 shrink-0">
                                    {row.event.from ?? "new"} to <span className={toClass}>{row.event.to}</span>
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">attempt {row.event.attempt}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </Panel>
    );
}