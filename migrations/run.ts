import pg from "pg"
import {readFileSync , readdirSync } from "fs"

const {Client} = pg;

const connectionString = 'postgresql://user:pass123@localhost:5432/postgres';

async function main(){
    const client = new Client({connectionString});
    await client.connect();
    console.log("Connected to Postgres");
    
    const trackingTableSql = readFileSync('migrations/000_migrations_table.sql' , 'utf-8');
    await client.query(trackingTableSql);
    console.log("schema_migrations table ready");

    const files = readdirSync('migrations').filter((f) => f.endsWith('.sql')).sort();
    for(const file of files){
        const result = await client.query(`SELECT 1 FROM schema_migrations WHERE version = $1`, [file]);

        if(result.rowCount && result.rowCount > 0){
            console.log(`Skipping ${file} (already applied)`);
            continue;
        }

        console.log(`Applying ${file}`);
        const query = readFileSync(`migrations/${file}`, 'utf-8');
        await client.query(query);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)' , [file]);
        console.log(`Applied ${file}`);
    }

    

    await client.end();
}

main();