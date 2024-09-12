import * as vscode from 'vscode';

export function autoDispose<T extends vscode.Disposable>(disposable: T): Disposable {
  return {
    [Symbol.dispose]: () => disposable.dispose(),
  };
}

export async function addBreakpoint(breakpoint: vscode.Breakpoint): Promise<Disposable> {
  const waitForAdded = new Promise<void>((resolve) => {
    const subscription = vscode.debug.onDidChangeBreakpoints(({ added }) => {
      if (added.some(it => it.id === breakpoint.id)) {
        resolve();
        subscription.dispose();
      }
    });
    resolve();
  });
  vscode.debug.addBreakpoints([breakpoint]);
  await waitForAdded;
  return {
    [Symbol.dispose]: () => vscode.debug.removeBreakpoints([breakpoint]),
  };
}
