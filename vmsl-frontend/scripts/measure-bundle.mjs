// Usage: node scripts/measure-bundle.mjs dist [path/to/baseline/dist]
// Measures local asset sizes fetched by a fresh Chromium home-page visit.
// gzip is calculated per file at zlib's default level; it is not CDN transfer size.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
try {
    for (const directory of process.argv.slice(2)) {
        const root = resolve(directory);
        const server = createServer(async (request, response) => {
            try {
                const path = resolve(root, '.' + new URL(request.url, 'http://localhost').pathname);
                if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
                const file = path === root ? resolve(root, 'index.html') : path;
                response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(file)] || 'application/octet-stream');
                response.end(await readFile(file));
            } catch { response.writeHead(404).end(); }
        });
        await new Promise(done => server.listen(0, '127.0.0.1', done));
        const context = await browser.newContext();
        try {
            const page = await context.newPage();
            await page.route('**/divisions/grouped?*', route => route.fulfill({ json: { categories: [] } }));
            const files = new Set();
            page.on('response', response => { const url = new URL(response.url()); if (url.pathname.endsWith('.js')) files.add(url.pathname); });
            await page.goto(`http://127.0.0.1:${server.address().port}/`);
            await page.getByLabel('Season ending year').waitFor();
            await page.getByText('Loading divisions...').waitFor({ state: 'detached' });
            const assets = await Promise.all([...files].sort().map(async path => {
                const bytes = await readFile(resolve(root, '.' + path));
                return { file: path, bytes: bytes.length, gzipBytes: gzipSync(bytes).length };
            }));
            console.log(JSON.stringify({ directory, assets, totalBytes: assets.reduce((sum, a) => sum + a.bytes, 0), totalGzipBytes: assets.reduce((sum, a) => sum + a.gzipBytes, 0) }, null, 2));
        } finally { await context.close(); await new Promise(done => server.close(done)); }
    }
} finally { await browser.close(); }
