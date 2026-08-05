const fs = require("fs");

let input = "";

process.stdin.on("data", chunk => input += chunk);

process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);

    const file =
      event.tool_input?.file_path ||
      event.file_path;

    if (!file) return;

    const { spawnSync } = require("child_process");

    spawnSync(
      "pnpm",
      ["exec", "prettier", "--write", "--ignore-unknown", file],
      { stdio: "inherit" }
    );
  } catch {}
});
