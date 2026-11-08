import { useEffect, useRef, useState } from "react";
import { connect } from "./lib/ws";
import Login from "./components/Login";
import { type JobEvent, type Stats } from "@queueengine/shared"
import Depth from "./components/Depth";
import type { ConnectionStatus, LogRow, ThroughputPoint } from "./lib/types";
import JobLog from "./components/JobLog";
import Workers from "./components/Workers";

const statusText: Record<ConnectionStatus, string> = {
    connecting: "Connecting",
    connected: "Connected",
    reconnecting: "Disconnected, retrying",
    failed: ""
};

export default function App() {
    const [adminKey, setAdminKey] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [rows, setRows] = useState<LogRow[]>([]);
    const [history, setHistory] = useState<ThroughputPoint[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>("connecting");
    const nextId = useRef(0)

    useEffect(() => {
        if (adminKey === null) return;
        setErrorMessage(null);
        const socketClose = connect(
            import.meta.env.VITE_BROKER_URL,
            adminKey,
            (msg) => {
                if (msg.t === "snapshot" || msg.t === "state") {
                    setStats(msg.stats);
                }
                if (msg.t === "events") {
                    const eventList: LogRow[] = [];
                    const reversedList = msg.events.reverse();

                    reversedList.forEach((event: JobEvent) => {
                        eventList.push({
                            kind: "event",
                            id: nextId.current,
                            event: event
                        })
                        nextId.current++;
                    })

                    if (msg.dropped > 0) {
                        eventList.push({
                            kind: "gap",
                            id: nextId.current,
                            dropped: msg.dropped
                        })
                        nextId.current++;
                    }

                    setRows((prev) => {
                        return [...eventList, ...prev].slice(0, 200)
                    })
                }

                if (msg.t === "state") {
                    const at = Date.now();
                    const completed = msg.stats.throughput.completedPerSec;
                    const failed = msg.stats.throughput.failedPerSec;

                    setHistory((prev) => {
                        return [...prev, { at, completed, failed }].slice(-60);
                    })
                }
            },
            (newStatus) => {
                setStatus(newStatus)
                if (newStatus === "failed") {
                    setAdminKey(null);
                    setErrorMessage("Could not connect. Check the key and that the broker is running.")
                }
            }
        );
        return () => socketClose();
    }, [adminKey]);

    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-6">
            <h1 className="text-2xl font-semibold">QueueEngine</h1>
            {adminKey !== null ? (
                <p className={status === "connected" ? "text-green-500" : "text-amber-500"}>
                    {statusText[status]}
                </p>
            ) : null}
            {errorMessage !== null ? <p className="text-red-500">{errorMessage}</p> : null}
            {adminKey === null ? <Login onLogin={setAdminKey}></Login> : null}
            {adminKey !== null ? <Depth stats={stats}></Depth> : null}
            {adminKey !== null ? <Workers stats={stats}></Workers> : null}
            {adminKey !== null ? <JobLog rows={rows} /> : null}
        </div>
    );
}