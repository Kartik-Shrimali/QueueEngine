import type { JobDetail, JobRow } from "./types";

export async function fetchDeadJobs(adminKey : string , cursor ?: string){
    let url = `${import.meta.env.VITE_BROKER_URL}/jobs?status=dead&limit=50`;

    if(cursor){
        url = url + `&cursor=${encodeURIComponent(cursor)}`;
    }

    const response = await fetch(url , {
        "headers" : {
            "Authorization" :  `Bearer ${adminKey}`,
            "Content-Type" : "application/json"
        }
    })

    if(!response.ok) throw Error("There was some error in fetching dead jobs.Error status: " + response.status);

    const body = await response.json() as {jobs : JobRow[], nextCursor : string | null};

    return body;
}

export async function fetchJobDetail(adminKey : string , jobId : string){
    const url = `${import.meta.env.VITE_BROKER_URL}/jobs/${encodeURIComponent(jobId)}`;

    const response = await fetch(url , {
        "headers" : {
            "Authorization" : `Bearer ${adminKey}`,
        }
    })

    if(!response.ok) throw new Error("There was some error fetching the job details.Status : " + response.status);

    const body = await response.json() as JobDetail;
    return body;
}