import app from "./http/server.js";
import { config } from "./config.js";

app.listen(config.port , () => {
    console.log(`Broker listening on port ${config.port}`)
})