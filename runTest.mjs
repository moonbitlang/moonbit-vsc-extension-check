import path from "node:path";
import { runTests, runVSCodeCommand } from "@vscode/test-electron";
import { $ } from "execa";
import os from "node:os";

const testWorkspace = path.resolve(import.meta.dirname, "./fixtures/hello");

await runVSCodeCommand(["--install-extension", "moonbit.moonbit-lang-nightly"]);

const { stdout } = await runVSCodeCommand([
  "--list-extensions",
  "--show-versions",
]);
console.log(stdout);

await runTests({
  extensionTestsPath: path.resolve(import.meta.dirname, "./out/prepare.js"),
  launchArgs: [
    "--disable-gpu",
    testWorkspace,
    "--user-data-dir",
    `${os.tmpdir()}/vscode-test-profile`,
  ],
});

process.env.PATH =
  os.platform() === "win32"
    ? `${os.homedir()}\\.moon\\bin;${process.env.PATH}`
    : `${os.homedir()}/.moon/bin:${process.env.PATH}`;

await runTests({
  extensionTestsPath: path.resolve(import.meta.dirname, "./out/index.js"),
  launchArgs: [
    "--disable-gpu",
    testWorkspace,
    "--user-data-dir",
    `${os.tmpdir()}/vscode-test-profile`,
  ],
});

const moonPath =
  os.platform() === "win32"
    ? `${os.homedir()}\\.moon\\bin\\moon.exe`
    : `${os.homedir()}/.moon/bin/moon`;
await $({
  stdout: "inherit",
  verbose: "short",
  reject: false,
})`${moonPath} version --all`;
