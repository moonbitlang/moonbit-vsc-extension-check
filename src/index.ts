import * as Mocha from "mocha";
import * as path from "path";
import * as esm from "./esm";
import * as vscode from "vscode";
import * as os from "os";

export async function run(testsRoot: string): Promise<void> {
  const rootDir = path.dirname(testsRoot);
  const { globby } = await esm.importGlobby();

  await vscode.commands.executeCommand("moonbit.install-moonbit", {
    silent: true,
  });

  // Workaround
  if (os.platform() === 'win32') {
    process.env.PATH = `${process.env.PATH};${os.homedir()}\\.moon\\bin`;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } else {
    process.env.PATH = `${process.env.PATH}:${os.homedir()}/.moon/bin`;
  }

  console.log(`PATH: ${process.env.PATH}`);

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
