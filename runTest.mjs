import path from "node:path";
import { runTests, runVSCodeCommand } from "@vscode/test-electron";
import os from 'node:os';

const testWorkspace = path.resolve(import.meta.dirname, "./fixtures/hello");

await runVSCodeCommand(["--install-extension", "moonbit.moonbit-lang-nightly"]);

await runTests({
  extensionTestsPath: path.resolve(import.meta.dirname, "./out/prepare.js"),
  launchArgs: ["--disable-gpu", testWorkspace, '--user-data-dir', `${os.tmpdir()}/vscode-test-profile`],
});

await runTests({
  extensionTestsPath: path.resolve(import.meta.dirname, "./out/index.js"),
  extensionTestsEnv: {
    // This only works for linux
    PATH: os.platform() === 'win32' ? `${process.env.PATH};${os.homedir()}\\.moon\\bin` : `${process.env.PATH}:${os.homedir()}/.moon/bin`,
  },
  launchArgs: ["--disable-gpu", testWorkspace, '--user-data-dir', `${os.tmpdir()}/vscode-test-profile`],
});
