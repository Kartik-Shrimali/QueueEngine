import { useEffect, useState } from "react";
import { type JobDetail, type JobRow, type ReplayResult } from "../lib/types";
import { fetchDeadJobs, fetchJobDetail } from "../lib/api";
import { formatDateTime, shortId } from "../lib/format";
import Panel from "./Panel";

export default function Dlq(props: { adminKey: string, send: (message: unknown) => boolean, replayResult: ReplayResult | null, deadTick: number }) {
    const [jobs, setJobs] = useState<JobRow[]>([]);
    const [nextCursor, setCursor] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<JobDetail | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
    const [replayNote, setReplayNote] = useState<string | null>(null);

    function handleReplay() {
        if (detail === null) return;

        const requestId = crypto.randomUUID();
        setPendingRequestId(requestId);
        setReplayNote(null);

        const result = props.send({ t: "replay", jobId: detail.id, requestId });

        if (result === false) {
            setReplayNote("Not Connected");
            setPendingRequestId(null);
        }
    }

    useEffect(() => {
        let ignore = false;
        async function main() {

            try {
                const response = await fetchDeadJobs(props.adminKey);
                if (ignore === false) {
                    setJobs(response.jobs);
                    setCursor(response.nextCursor);
                    setErrorMessage(null);
                    setLoading(false);
                }
            } catch (error: any) {
                if (ignore === false) {
                    setErrorMessage("Could not load dead jobs.");
                    setLoading(false);
                }
            }
        }

        main();

        return () => {
            ignore = true;
        }
    }, [props.adminKey, props.deadTick]);

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

    const columns = "grid-cols-[minmax(8rem,1fr)_14rem_11rem_6rem]";

    return (
        <Panel title="Dead jobs">
            {loading ? (
                <div role="status" className="space-y-2">
                    <span className="sr-only">Loading dead jobs</span>
                    {[0, 1, 2, 3, 4].map((n) => (
                        <div key={n} className="h-8 rounded bg-gray-200 motion-safe:animate-pulse dark:bg-gray-700/60"></div>
                    ))}
                </div>
            ) : null}

            {errorMessage !== null ? (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            ) : null}

            {!loading && errorMessage === null && jobs.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No dead jobs</p>
            ) : null}

            {jobs.length > 0 ? (
                <div className="max-h-96 overflow-auto [color-scheme:light] dark:[color-scheme:dark]">
                    <div className="min-w-[40rem]">
                        <div className={"grid gap-4 px-3 pb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 " + columns}>
                            <span>Type</span>
                            <span>Reason</span>
                            <span>Finished</span>
                            <span>Id</span>
                        </div>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {jobs.map((job) => {
                                let reasonClass = "";
                                let reasonMeaning = "";

                                if (job.deadReason === "abandoned") {
                                    reasonClass = "text-red-600 dark:text-red-400";
                                    reasonMeaning = "worker died";
                                } else if (job.deadReason === "exhausted") {
                                    reasonClass = "text-amber-600 dark:text-amber-400";
                                    reasonMeaning = "handler failed";
                                }

                                const selected = job.id === selectedId;

                                return (
                                    <li key={job.id}>
                                        <button
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() => {
                                                setSelectedId(job.id);
                                                setPendingRequestId(null);
                                                setReplayNote(null);
                                            }}
                                            className={
                                                "grid w-full cursor-pointer items-center gap-4 px-3 py-2 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 " +
                                                columns + " " +
                                                (selected ? "bg-blue-500/10" : "hover:bg-gray-500/10")
                                            }
                                        >
                                            <span className="truncate font-mono">{job.type}</span>
                                            <span>
                                                <span className={reasonClass}>{job.deadReason ?? "unknown"}</span>{" "}
                                                <span className="text-gray-500 dark:text-gray-400">{reasonMeaning}</span>
                                            </span>
                                            <span className="tabular-nums text-gray-600 dark:text-gray-300" title={job.finishedAt ?? undefined}>
                                                {formatDateTime(job.finishedAt)}
                                            </span>
                                            <span className="font-mono text-gray-500 dark:text-gray-400" title={job.id}>
                                                {shortId(job.id)}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            ) : null}

            {nextCursor !== null ? (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Showing the newest 50 dead jobs. Older ones are not loaded.
                </p>
            ) : null}

            {selectedId !== null ? (
                <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                    {detailError !== null ? (
                        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{detailError}</p>
                    ) : null}

                    {detail === null && detailError === null ? (
                        <div role="status" className="space-y-2">
                            <span className="sr-only">Loading attempts</span>
                            {[0, 1, 2].map((n) => (
                                <div key={n} className="h-6 rounded bg-gray-200 motion-safe:animate-pulse dark:bg-gray-700/60"></div>
                            ))}
                        </div>
                    ) : null}

                    {detail !== null ? (
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium">
                                        <span className="font-mono">{detail.type}</span>{" "}
                                        <span className="font-mono text-gray-500 dark:text-gray-400" title={detail.id}>{shortId(detail.id)}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {detail.totalAttempts} {detail.totalAttempts === 1 ? "attempt" : "attempts"}
                                        {detail.totalAttempts > detail.attemptHistory.length ? ", showing the latest " + detail.attemptHistory.length : ""}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleReplay}
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    Replay
                                </button>
                            </div>

                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full min-w-[40rem] text-left text-sm">
                                    <thead>
                                        <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            <th scope="col" className="py-2 pr-4 font-medium">#</th>
                                            <th scope="col" className="py-2 pr-4 font-medium">Worker</th>
                                            <th scope="col" className="py-2 pr-4 font-medium">Outcome</th>
                                            <th scope="col" className="py-2 pr-4 font-medium">Started</th>
                                            <th scope="col" className="py-2 pr-4 font-medium">Ended</th>
                                            <th scope="col" className="py-2 font-medium">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {detail.attemptHistory.map((attempt) => {
                                            let outcomeClass = "text-gray-600 dark:text-gray-300";
                                            if (attempt.outcome === "succeeded") {
                                                outcomeClass = "text-green-600 dark:text-green-400";
                                            } else if (attempt.outcome === "failed") {
                                                outcomeClass = "text-amber-600 dark:text-amber-400";
                                            } else if (attempt.outcome === "abandoned") {
                                                outcomeClass = "text-red-600 dark:text-red-400";
                                            }

                                            return (
                                                <tr key={attempt.attemptNumber}>
                                                    <td className="py-2 pr-4 tabular-nums">{attempt.attemptNumber}</td>
                                                    <td className="py-2 pr-4 font-mono">{attempt.workerId}</td>
                                                    <td className={"py-2 pr-4 " + outcomeClass}>{attempt.outcome ?? "No outcome"}</td>
                                                    <td className="py-2 pr-4 tabular-nums" title={attempt.startedAt}>{formatDateTime(attempt.startedAt)}</td>
                                                    <td className="py-2 pr-4 tabular-nums" title={attempt.endedAt ?? undefined}>
                                                        {attempt.endedAt !== null ? formatDateTime(attempt.endedAt) : "Not ended"}
                                                    </td>
                                                    <td className="max-w-[20rem] break-words py-2">
                                                        {attempt.errorMessage ?? (
                                                            <span className="text-gray-500 dark:text-gray-400">No error message</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-3 text-sm" aria-live="polite">
                                {replayNote !== null ? (
                                    <p className="text-red-600 dark:text-red-400">{replayNote}</p>
                                ) : null}
                                {props.replayResult !== null && props.replayResult.requestId === pendingRequestId ? (
                                    props.replayResult.ok === true ? (
                                        <p className="text-green-600 dark:text-green-400">
                                            Replayed as <span className="font-mono">{props.replayResult.newJobId}</span>
                                        </p>
                                    ) : (
                                        <p className="text-red-600 dark:text-red-400">Replay failed: {props.replayResult.error}</p>
                                    )
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </Panel>
    );
}