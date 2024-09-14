import * as vscode from "vscode";

export async function run(testsRoot: string): Promise<void> {
  await vscode.commands.executeCommand("moonbit.install-moonbit", {
    silent: true,
  });
}
