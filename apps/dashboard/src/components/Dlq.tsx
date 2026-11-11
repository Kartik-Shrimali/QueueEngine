import { useEffect, useState } from "react";
import { type JobDetail, type JobRow } from "../lib/types";
import { fetchDeadJobs, fetchJobDetail } from "../lib/api";

export default function Dlq(props: { adminKey: string }) {
    const [jobs, setJobs] = useState<JobRow[]>([]);
    const [nextCursor, setCursor] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<JobDetail | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);

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

    useEffect(() => {
        let ignore = false;
        if (selectedId === null) {
            setDetail(null);
            return;
        }

        setDetail(null);
        setDetailError(null);

        async function main(id: string) {
            try {
                const jobDetail = await fetchJobDetail(props.adminKey, id)
                if (ignore === false) {
                    setDetail(jobDetail);
                }
            } catch (error: any) {
                if (ignore === false) setDetailError("There was some error in fetching job Detail");
            }
        }

        main(selectedId);

        return () => {
            ignore = true
        }
    }, [selectedId, props.adminKey])

    return (
        <div className="border rounded p-4 mt-6">
            <h2 className="text-lg font-semibold">Dead jobs</h2>
            {errorMessage !== null ? <p className="text-red-500">{errorMessage}</p> : null}
            {errorMessage === null && jobs.length === 0 ? <p>No dead jobs</p> : null}
            {jobs.map((job) => {
                let reasonClass = "";
                let reasonMeaning = "";

                if (job.deadReason === "abandoned") {
                    reasonClass = "text-red-500";
                    reasonMeaning = "worker died";
                } else if (job.deadReason === "exhausted") {
                    reasonClass = "text-amber-500";
                    reasonMeaning = "handler failed";
                }

                return (
                    <div key={job.id} onClick={() => {
                        setSelectedId(job.id);
                    }} className={job.id === selectedId ? "cursor-pointer font-bold" : "cursor-pointer"}>
                        {job.type} , <span className={reasonClass}>{job.deadReason}</span> {reasonMeaning} , {job.finishedAt ?? "unknown"}
                    </div>
                )
            })}
            {detailError !== null ? <div className="text-red-500 mt-4">{detailError}</div> : null}
            {detail !== null ? <div className="mt-4">Attempts : {detail.totalAttempts}</div> : null}
            {detail !== null ? detail.attemptHistory.map((attempt) => {
                return (
                    <div key={attempt.attemptNumber}>
                        <div># {attempt.attemptNumber}</div>
                        <div>{attempt.workerId}</div>
                        <div>{attempt.outcome ?? "No Outcome"}</div>
                        <div>{attempt.startedAt}</div>
                        <div>{attempt.endedAt ?? "Not ended"}</div>
                        <div>{attempt.errorMessage ?? "No error message"}</div>
                    </div>
                )
            }) : null}
        </div>
    )
}