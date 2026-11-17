import type { Stats } from "@queueengine/shared";
import Panel from "./Panel";

export default function Depth({ stats }: { stats: Stats | null }) {
    const items = [
        { label: "Critical", value: stats?.queueDepth.critical, hint: "Ready to run now, critical priority" },
        { label: "High", value: stats?.queueDepth.high, hint: "Ready to run now, high priority" },
        { label: "Normal", value: stats?.queueDepth.normal, hint: "Ready to run now, normal priority" },
        { label: "Low", value: stats?.queueDepth.low, hint: "Ready to run now, low priority" },
        { label: "Total", value: stats?.queueDepth.total, hint: "All pending jobs that are ready to run now" },
        { label: "Active", value: stats?.active, hint: "Running on a worker right now" },
        { label: "Delayed", value: stats?.delayed, hint: "Waiting out a retry delay or a schedule" },
        { label: "Dead", value: stats?.deadTotal, hint: "Every dead job in the database" }
    ];

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
            {items.map((item) => (
                <Panel key={item.label}>
                    <p title={item.hint} className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value ?? "-"}</p>
                </Panel>
            ))}
        </div>
    );
}