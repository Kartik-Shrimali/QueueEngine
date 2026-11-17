import { CartesianGrid, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ThroughputPoint } from "../lib/types";
import Panel from "./Panel";

export default function Throughput({ history }: { history: ThroughputPoint[] }) {
    return (
        <Panel title="Throughput">
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Average per second over a 60 second window, so the line is smoothed.
            </p>
            <div
                className="h-64"
                role="img"
                aria-label="Line chart of completed and dead jobs per second, averaged over 60 seconds"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#9ca3af" strokeOpacity={0.25} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="at"
                            tickFormatter={(value: number) => new Date(value).toLocaleTimeString()}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                            minTickGap={48}
                            stroke="#9ca3af"
                        />
                        <YAxis
                            width={48}
                            tickCount={4}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                            stroke="#9ca3af"
                        />
                        <Tooltip
                            labelFormatter={(value) => new Date(Number(value)).toLocaleTimeString()}
                            formatter={(value) => Number(value).toFixed(3)}
                            contentStyle={{
                                backgroundColor: "rgba(17, 24, 39, 0.95)",
                                border: "1px solid #374151",
                                borderRadius: 8,
                                fontSize: 12
                            }}
                            labelStyle={{ color: "#9ca3af" }}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                        <Line
                            type="monotone"
                            dataKey="completed"
                            name="Completed per sec"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="failed"
                            name="Dead per sec"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Panel>
    );
}