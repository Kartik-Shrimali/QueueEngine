import { readdirSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";

const srcDir = join(process.cwd(), 'src', 'store', 'redis', 'scripts');
const distDir = join(process.cwd(), 'dist', 'store', 'redis', 'scripts');

mkdirSync(distDir, { recursive: true });

const files = readdirSync(srcDir).filter((f) => f.endsWith('.lua'));

for (const file of files) {
    copyFileSync(join(srcDir, file), join(distDir, file));
    console.log(`Copied ${file}`);
}