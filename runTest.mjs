import path from "node:path";
import { runTests, runVSCodeCommand } from "@vscode/test-electron";

const extensionTestsPath = path.resolve(import.meta.dirname, "./out/index.js");
const testWorkspace = path.resolve(import.meta.dirname, "./fixtures/hello");

await runVSCodeCommand(["--install-extension", "moonbit.moonbit-lang-nightly"]);

await runTests({
  extensionTestsPath,
  launchArgs: ["--disable-gpu", testWorkspace],
});
