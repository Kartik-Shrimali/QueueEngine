import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const migrationsDir = join(__dirname , '..' , '..' , '..' , '..' , '..' , 'migrations');

export async function runMigrations(){
    const trackingSql = readFileSync(join(migrationsDir , '000_migrations_table.sql') , 'utf-8');

    await pool.query(trackingSql);
    console.log(`Schema migration table ready`);

    const sqlFiles = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    for(const file of sqlFiles){
        const result = await pool.query(`SELECT 1 FROM schema_migrations WHERE version = $1` , [file]);

        if(result.rowCount && result.rowCount > 0){
            console.log(`Skipping ${file} (already applied)`);
            continue;
        }

        console.log(`Applying ${file}`);

        const sqlQuery = readFileSync(join(migrationsDir , file) , 'utf-8');
        await pool.query(sqlQuery);
        await pool.query(`INSERT INTO schema_migrations (version) VALUES ($1)` , [file]);
        console.log(`Applied ${file}`);
    }
}