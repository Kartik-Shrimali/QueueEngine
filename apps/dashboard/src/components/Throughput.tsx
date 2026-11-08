import {LineChart, Line , XAxis , YAxis , Tooltip , Legend , ResponsiveContainer} from "recharts";
import type { ThroughputPoint } from "../lib/types";

export default function Throughput({ history }: { history: ThroughputPoint[] }) {
    return (
        <div className="mt-6 border rounded p-2">
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                        <XAxis
                            dataKey="at"
                            tickFormatter={(value: number) => new Date(value).toLocaleTimeString()}
                        />
                        <YAxis />
                        <Tooltip
                            labelFormatter={(value) => new Date(Number(value)).toLocaleTimeString()}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="completed"
                            name="Completed per sec"
                            stroke="#22c55e"
                            dot={false}
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="failed"
                            name="Dead per sec"
                            stroke="#ef4444"
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}