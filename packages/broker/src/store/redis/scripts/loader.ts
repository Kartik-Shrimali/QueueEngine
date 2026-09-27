import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { redisClient } from "../client.js";

const __dirname = dirname(fileURLToPath(import.meta.url))
let scriptShas: Map<string, string> | null = null;

export async function loadAllScripts() {
    const luaFiles = readdirSync(__dirname).filter((f) => f.endsWith('.lua'));

    let scriptMap: Map<string, string> = new Map();
    for (const file of luaFiles) {
        const fileContent = readFileSync(join(__dirname, file), 'utf-8');
        const SHA: string = await redisClient.scriptLoad(fileContent);

        const fileFirstName = file.split(".")[0];
        scriptMap.set(fileFirstName, SHA);
    }
    scriptShas = scriptMap;
    return scriptMap;
}

export function getScriptSha(name: string) {
    const script = scriptShas?.get(name);

    if (!script) {
        throw new Error(`Script ${name} not loaded`)
    }

    return script;
}