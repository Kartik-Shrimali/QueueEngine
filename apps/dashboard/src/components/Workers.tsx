import type { Stats } from "@queueengine/shared";

export default function Workers({ stats }: { stats: Stats | null }) {
    const workerList = stats?.workers ?? [];

    if (workerList.length === 0) {
        return (
            <div className="mt-6 border rounded p-4 text-sm">
                No workers connected
            </div>
        );
    }

    return (
        <div className="mt-6 border rounded p-2 text-sm">
            <table className="w-full text-left">
                <thead>
                    <tr>
                        <th className="p-2">Worker</th>
                        <th className="p-2">In flight</th>
                        <th className="p-2">Last seen</th>
                        <th className="p-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {workerList.map((worker) => (
                        <tr key={worker.workerId}>
                            <td className="p-2">{worker.workerId}</td>
                            <td className="p-2">{worker.inFlight}</td>
                            <td className="p-2">
                                {new Date(worker.lastSeen).toLocaleTimeString()}
                            </td>
                            <td
                                className={
                                    worker.alive
                                        ? "p-2 text-green-500"
                                        : "p-2 text-red-500"
                                }
                            >
                                {worker.alive ? "alive" : "stopped"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}