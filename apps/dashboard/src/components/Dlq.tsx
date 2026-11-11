import { useEffect, useState } from "react";
import type { JobRow } from "../lib/types";
import { fetchDeadJobs } from "../lib/api";

export default function Dlq(props: { adminKey: string }) {
    const [jobs, setJobs] = useState<JobRow[]>([]);
    const [nextCursor, setCursor] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;
        async function main() {

            try {
                const response = await fetchDeadJobs(props.adminKey);
                if (ignore === false) {
                    setJobs(response.jobs);
                    setCursor(response.nextCursor);
                    setErrorMessage(null);
                }
            } catch (error: any) {
                if (ignore === false) {
                    setErrorMessage("Could not load dead jobs.");
                }
            }
        }

        main();

        return () => {
            ignore = true;
        }
    }, [props.adminKey]);

    return (
        <div className="border rounded p-4 mt-6">
            <h2 className="text-lg font-semibold">Dead jobs</h2>
            {errorMessage !== null ? <p className="text-red-500">{errorMessage}</p> : null}
            {errorMessage === null && jobs.length === 0 ? <p>No dead jobs</p> : null}
            {jobs.map((job) => {
                return (
                    <p key={job.id}>
                        {job.type} , {job.deadReason} , {job.finishedAt ?? "unknown"}
                    </p>
                )
            })}
        </div>
    )
}