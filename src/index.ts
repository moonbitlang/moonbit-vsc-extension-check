import * as Mocha from "mocha";
import * as path from "path";
import * as esm from "./esm";
import * as vscode from "vscode";
import * as os from "os";

const testWorkspace = path.join(__dirname, "../fixtures/hello");

export async function run(testsRoot: string): Promise<void> {
  const rootDir = path.dirname(testsRoot);
  const { globby } = await esm.importGlobby();

  await vscode.commands.executeCommand("moonbit.install-moonbit", {
    silent: true,
  });

  // Wait for the installation to finish. This is a workaround for the
  // "moonbit.install-moonbit" command's bug.
  // TODO: Remove this workaround when the bug is fixed.
  await new Promise((resolve) => setTimeout(resolve, 20000));

  // Workaround
  if (os.platform() === "win32") {
    process.env.PATH = `${process.env.PATH};${os.homedir()}\\.moon\\bin`;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } else {
    process.env.PATH = `${process.env.PATH}:${os.homedir()}/.moon/bin`;
  }

  console.log(`PATH: ${process.env.PATH}`);

  const { $ } = await esm.importExeca();
  const exePath =
    os.platform() === "win32"
      ? `${os.homedir()}\\.moon\\bin\\moon.exe`
      : `${os.homedir()}/.moon/bin/moon`;
  await $({ cwd: testWorkspace })`${exePath} check --target js`;

  const files = await globby("**/*.test.js", {
    cwd: rootDir,
  });

  const mocha = new Mocha({
    ui: "tdd",
    timeout: 10000,
    retries: 2,
    parallel: false,
  });

  files.forEach((file) => {
    mocha.addFile(path.join(rootDir, file));
  });

  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      }
      resolve();
    });
  });
}
