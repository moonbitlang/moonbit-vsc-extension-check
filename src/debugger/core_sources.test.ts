import * as vscode from 'vscode';
import * as Path from 'path';
import { DebugProtocol } from '@vscode/debugprotocol';
import * as assert from 'assert/strict'
import { autoDispose, addBreakpoint } from './test_util';

test("core sources", async () => {
  const workspaceUri = vscode.workspace.workspaceFolders![0].uri;
  using _autoDispose1 = await addBreakpoint(new vscode.SourceBreakpoint(
    new vscode.Location(
      vscode.Uri.joinPath(workspaceUri, "src/main/main.mbt"),
      new vscode.Position(2, 0)
    )
  ));
  const didSendMessage = new vscode.EventEmitter<DebugProtocol.ProtocolMessage>();
  const willReceiveMessage = new vscode.EventEmitter<DebugProtocol.ProtocolMessage>();
  using _autoDispose2 = autoDispose(vscode.debug.registerDebugAdapterTrackerFactory("pwa-node", {
    createDebugAdapterTracker(session: vscode.DebugSession): vscode.DebugAdapterTracker {
      return {
        onWillReceiveMessage: (message) => {
          console.log(JSON.stringify({'DebugAdapterTracker__onWillReceiveMessage': message}));
          willReceiveMessage.fire(message);
        },
        onDidSendMessage: (message) => {
          console.log(JSON.stringify({'DebugAdapterTracker__onDidSendMessage': message}));
          didSendMessage.fire(message);
        },
      };
    },
  }));
  const sessionResolvers = Promise.withResolvers<vscode.DebugSession>();
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
  const waitForFoundMoonCoreSources = new Promise<void>((resolve, reject) => {
    const subscription = didSendMessage.event((message) => {
      if (message.type === "response") {
        const response = message as DebugProtocol.Response;
        if (response.command === "stackTrace" && response.success) {
          const stackTraceResponse = response as DebugProtocol.StackTraceResponse;
          if (stackTraceResponse.body.stackFrames.some((frame) => frame.source != null && frame.source.path.includes(".moon/lib/core/"))) {
            resolve();
            subscription.dispose();
          }
        }
      }
    });
  });
  await vscode.commands.executeCommand("workbench.action.debug.stepInto");
  await waitForFoundMoonCoreSources;
  await vscode.debug.stopDebugging(session);
  assert.ok(true);
});
