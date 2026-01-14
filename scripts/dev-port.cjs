#!/usr/bin/env node
const net = require("net");
const { spawn } = require("child_process");

function findOpenPort(start, end, cb) {
  let port = start;
  function tryNext() {
    if (port > end) return cb(new Error("No open port found"));
    const server = net.createServer();
    server.unref();
    server.on("error", () => {
      port += 1;
      tryNext();
    });
    server.listen(port, () => {
      const found = port;
      server.close(() => cb(null, found));
    });
  }
  tryNext();
}

const startPort = parseInt(process.env.PORT || "3000", 10);
const endPort = startPort + 50;

findOpenPort(startPort, endPort, (err, port) => {
  if (err) {
    console.error("Could not find open port between", startPort, "and", endPort);
    process.exit(1);
  }
  console.log(`Starting Next.js dev server on open port ${port}...`);
  const child = spawn("npx", ["next", "dev", "-p", String(port)], {
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  child.on("exit", (code) => process.exit(code ?? 0));
});
