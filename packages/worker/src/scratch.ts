import { createTransport } from "./transport.js";

async function main() {
    const request = createTransport("http://localhost:3000", "");

    const result = await request("GET", "/healthz");
    console.log("Result:", result);
}

main();