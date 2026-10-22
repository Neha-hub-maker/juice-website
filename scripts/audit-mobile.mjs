import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

await mkdir("reports", { recursive: true });
const chromePath = process.env.CHROME_PATH || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
execFileSync(process.execPath, [fileURLToPath(new URL("../node_modules/lighthouse/cli/index.js", import.meta.url)),
  process.env.AUDIT_URL || "http://127.0.0.1:3200", "--only-categories=performance,accessibility,best-practices",
  "--output=json", "--output-path=reports/lighthouse-mobile.json", "--quiet",
  `--chrome-flags=${process.env.AUDIT_CHROME_FLAGS || "--headless --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader"}`,
], { stdio: "inherit", env: { ...process.env, ...(chromePath ? { CHROME_PATH: chromePath } : {}) } });
const report = JSON.parse(await readFile("reports/lighthouse-mobile.json", "utf8"));
console.table(Object.values(report.categories).map(category => ({ category: category.title, score: Math.round(category.score * 100) })));
console.log("Full mobile audit: reports/lighthouse-mobile.json");
if (report.runtimeError) throw new Error(report.runtimeError.message);
