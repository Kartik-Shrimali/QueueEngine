import { useEffect, useState } from "react";
import { connect } from "./lib/ws";
import Login from "./components/Login";

export default function App() {
    const [adminKey , setAdminKey] = useState<string | null>(null);
    useEffect(() => {
        if(adminKey === null) return;   
        const socketClose = connect(
            import.meta.env.VITE_BROKER_URL,
            adminKey,
            (msg) => console.log(msg)
        );
        return () => socketClose();
    }, [adminKey]);

    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-6">
            <h1 className="text-2xl font-semibold">QueueEngine</h1>
            {adminKey === null ? <Login onLogin={setAdminKey}></Login> : null}
        </div>
    );
}