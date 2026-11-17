import type { Stats } from "@queueengine/shared";
import Panel from "./Panel";

export default function Workers({ stats }: { stats: Stats | null }) {
    if (stats === null) {
        return (
            <Panel title="Workers">
                <div role="status">
                    <span className="sr-only">Loading workers</span>
                    <div className="h-6 rounded bg-gray-200 motion-safe:animate-pulse dark:bg-gray-700/60"></div>
                </div>
            </Panel>
        );
    }

    const workerList = stats.workers;

    if (workerList.length === 0) {
        return (
            <Panel title="Workers">
                <p className="text-sm text-gray-500 dark:text-gray-400">No workers connected</p>
            </Panel>
        );
    }

    return (
        <Panel title="Workers">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            <th scope="col" className="py-2 pr-4 font-medium">Worker</th>
                            <th scope="col" className="py-2 pr-4 font-medium">In flight</th>
                            <th scope="col" className="py-2 pr-4 font-medium">Last seen</th>
                            <th scope="col" className="py-2 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {workerList.map((worker) => (
                            <tr key={worker.workerId}>
                                <td className="py-2 pr-4 font-mono">{worker.workerId}</td>
                                <td className="py-2 pr-4 tabular-nums">{worker.inFlight}</td>
                                <td className="py-2 pr-4 tabular-nums">
                                    {new Date(worker.lastSeen).toLocaleTimeString()}
                                </td>
                                <td
                                    className={
                                        worker.alive
                                            ? "py-2 text-green-600 dark:text-green-400"
                                            : "py-2 text-red-600 dark:text-red-400"
                                    }
                                >
                                    {worker.alive ? "alive" : "stopped"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Panel>
    );
}