# mepamo

A local, browser-based learning prototype built from the Mepamo visual PDF and the supplied Japanese World Heritage content ZIP. No deployment, account, or backend.

## Run

From this directory, with Node.js 22.12+:

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:5173. Stop with Ctrl+C.

```powershell
npm run build
npm test
```

The browser tests use the installed Windows Chrome executable configured in playwright.config.ts. Adjust that path on another computer. Production output is in dist/ and can be served by any static HTTP server. Do not open index.html directly from disk.
