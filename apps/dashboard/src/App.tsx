import { useEffect, useRef, useState } from "react";
import { connect } from "./lib/ws";
import Login from "./components/Login";
import { type JobEvent, type Stats } from "@queueengine/shared"
import Depth from "./components/Depth";
import { ReplayResult, type ConnectionStatus, type LogRow, type ThroughputPoint } from "./lib/types";
import JobLog from "./components/JobLog";
import Workers from "./components/Workers";
import Throughput from "./components/Throughput";
import Dlq from "./components/Dlq";

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
    const [replayResult, setReplayResult] = useState<ReplayResult | null>(null);
    const [deadTick, setDeadTick] = useState<number>(0);
    const nextId = useRef(0);
    const sendRef = useRef<((message: unknown) => boolean) | null>(null);

    function sendMessage(message: unknown): boolean {
        if (sendRef.current === null) return false;

        return sendRef.current(message);
    }

    useEffect(() => {
        if (adminKey === null) return;
        setErrorMessage(null);
        const connection = connect(
            import.meta.env.VITE_BROKER_URL,
            adminKey,
            (msg) => {
                if (msg.t === "snapshot" || msg.t === "state") {
                    setStats(msg.stats);
                }
                if (msg.t === "events") {

                    if (msg.events.some((event: JobEvent) => event.to === "dead")) {
                        setDeadTick((prev) => prev + 1);
                    }

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

                if (msg.t === "replay_result") {
                    setReplayResult(msg);
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
        sendRef.current = connection.send;
        return () => {
            sendRef.current = null;
            connection.close();
        };
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
            {adminKey !== null ? <Throughput history={history} /> : null}
            {adminKey !== null ? <JobLog rows={rows} /> : null}
            {adminKey !== null ? <Dlq adminKey={adminKey} send={sendMessage} replayResult={replayResult} deadTick={deadTick} /> : null}
        </div>
    );
}