import { useEffect, useRef, useState } from "react";
import { connect } from "./lib/ws";
import Login from "./components/Login";
import {type JobEvent, type Stats} from "@queueengine/shared"
import Depth from "./components/Depth";
import type { LogRow } from "./lib/types";
import JobLog from "./components/JobLog";
import Workers from "./components/Workers";

export default function App() {
    const [adminKey , setAdminKey] = useState<string | null>(null);
    const [stats , setStats] = useState<Stats | null>(null);
    const [rows , setRows] = useState<LogRow[]>([]);
    const nextId = useRef(0)

    useEffect(() => {
        if(adminKey === null) return;   
        const socketClose = connect(
            import.meta.env.VITE_BROKER_URL,
            adminKey,
            (msg) => {
                if(msg.t === "snapshot" || msg.t === "state"){
                    setStats(msg.stats);
                }
                if(msg.t === "events"){
                    const eventList : LogRow[] = [];
                    const reversedList = msg.events.reverse();

                    reversedList.forEach((event : JobEvent) => {
                        eventList.push({
                            kind : "event",
                            id : nextId.current,
                            event : event
                        })
                        nextId.current++;
                    })

                    if(msg.dropped > 0){
                        eventList.push({
                            kind : "gap",
                            id : nextId.current,
                            dropped : msg.dropped
                        })
                        nextId.current++;
                    }

                    setRows((prev) => {
                        return [...eventList , ...prev].slice(0,200)
                    })
                }
            }
        );
        return () => socketClose();
    }, [adminKey]);

    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-6">
            <h1 className="text-2xl font-semibold">QueueEngine</h1>
            {adminKey === null ? <Login onLogin={setAdminKey}></Login> : null}
            {adminKey !== null ? <Depth stats={stats}></Depth> : null}
            {adminKey !== null ? <Workers stats={stats}></Workers> : null}
            {adminKey !== null ? <JobLog rows={rows}/> : null}
        </div>
    );
}