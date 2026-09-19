import { register, executeJob } from "./worker.js";

async function main() {
    register("send_email", async (payload) => {
        console.log("Handling send_email with payload:", payload);
    });

    const goodResult = await executeJob({
        type: "send_email",
        payload: { to: "a@b.com" },
    });
    console.log("Good job result:", goodResult);

    const badResult = await executeJob({
        type: "unknown_type",
        payload: {},
    });
    console.log("Bad job result:", badResult);
}

main();