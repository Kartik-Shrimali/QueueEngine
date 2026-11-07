import type { Stats } from "@queueengine/shared";

export default function Depth({ stats }: { stats: Stats | null }) {
    const items = [
        { label: "Critical", value: stats?.queueDepth.critical },
        { label: "High", value: stats?.queueDepth.high },
        { label: "Normal", value: stats?.queueDepth.normal },
        { label: "Low", value: stats?.queueDepth.low },
        { label: "Total", value: stats?.queueDepth.total }
    ];

    return (
        <div className="grid grid-cols-5 gap-4">
            {items.map((item) => (
                <div key={item.label} className="border rounded p-4">
                    <p className="text-sm">{item.label}</p>
                    <p className="text-2xl font-bold">{item.value ?? "-"}</p>
                </div>
            ))}
        </div>
    );
}