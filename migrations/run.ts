import {runMigrations} from "../packages/broker/src/store/pg/migrate";
import { pool } from "../packages/broker/src/store/pg/client";

try{
    await runMigrations(); 
}catch(error : any){
    console.error('Migration failed: ' , error.message || error.code);
    process.exitCode = 1;
}finally{
    await pool.end();
}