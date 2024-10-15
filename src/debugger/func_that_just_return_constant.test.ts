import * as vscode from 'vscode';
import * as Path from 'path';
import { DebugProtocol } from '@vscode/debugprotocol';
import * as assert from 'assert/strict'
import { autoDispose, addBreakpoint } from './test_util';

test("func that just return constant", async () => {
  const workspaceUri = vscode.workspace.workspaceFolders![0].uri;
  using _autoDispose1 = await addBreakpoint(new vscode.SourceBreakpoint(
    new vscode.Location(
      vscode.Uri.joinPath(workspaceUri, "src/lib/hello.mbt"),
      new vscode.Position(1, 0)
    )
  ));
  const didSendMessage = new vscode.EventEmitter<DebugProtocol.ProtocolMessage>();
  const willReceiveMessage = new vscode.EventEmitter<DebugProtocol.ProtocolMessage>();
  const _autoDispose2 = autoDispose(vscode.debug.registerDebugAdapterTrackerFactory("pwa-node", {
    createDebugAdapterTracker(session: vscode.DebugSession): vscode.DebugAdapterTracker {
      return {
        onWillReceiveMessage: (message) => {
          willReceiveMessage.fire(message);
        },
        onDidSendMessage: (message) => {
          didSendMessage.fire(message);
        },
      };
    },
  }));
  const waitForStoppedEvent = new Promise<DebugProtocol.StoppedEvent>((resolve) => {
    const subscription = didSendMessage.event((message) => {
      if (message.type === "event") {
        const event = message as DebugProtocol.Event;
        if (event.event === "stopped") {
          resolve(event as DebugProtocol.StoppedEvent);
          subscription.dispose();
        }
      }
    });
  });
  const sessionResolvers = Promise.withResolvers<vscode.DebugSession>();
  const subscription = vscode.debug.onDidStartDebugSession((session) => {
    sessionResolvers.resolve(session);
    subscription.dispose();
  });
  void vscode.commands.executeCommand("moonbit-lsp/debug-main", {
    modUri: workspaceUri.toString(),
    pkgUri: workspaceUri.with({ path: Path.join(workspaceUri.path, "src/main") }).toString(),
    pkgPath: "username/hello/main",
    fileUri: workspaceUri.with({ path: Path.join(workspaceUri.path, "src/main/main.mbt") }).toString(),
  });
  const stoppedEvent = await waitForStoppedEvent;
  const session = await sessionResolvers.promise;
  await vscode.debug.stopDebugging(session);
  assert.ok(true);
});
