import * as vscode from 'vscode';
import { getVSCodeSettings, initConfigWatcher, disposeConfigWatcher } from './configuration';
import { scheduleLint, lintNow, clearDiagnostics, lintAllOpen, dispose as disposeDiagnostics } from './diagnostics';
import { GTLintFormatterProvider } from './formatter';

import { GTLintCompletionProvider } from './completions';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('GTLint');
  outputChannel.appendLine('GTLint extension activated');

  // Watch config files so cached configs are invalidated on change
  context.subscriptions.push(initConfigWatcher(() => {
    outputChannel.appendLine('GTLint config file changed, re-linting all documents');
    lintAllOpen();
  }));

  // Register formatter
  const formatterProvider = new GTLintFormatterProvider();
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      { language: 'guidedtrack' },
      formatterProvider
    )
  );

  // Register completion provider for directives
  const completionProvider = new GTLintCompletionProvider();
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: 'guidedtrack' },
      completionProvider,
      '@', ',', ' '
    )
  );

  // Lint all open documents on activation
  lintAllOpen();

  // Listen for document changes (on-type linting)
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const settings = getVSCodeSettings();
      if (settings.enable && settings.lintOnType) {
        scheduleLint(event.document, settings.lintOnTypeDelay);
      }
    })
  );

  // Listen for document saves
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      const settings = getVSCodeSettings();
      if (settings.enable && settings.lintOnSave) {
        lintNow(document);
      }
    })
  );

  // Listen for document opens
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === 'guidedtrack') {
        const settings = getVSCodeSettings();
        if (settings.enable) {
          lintNow(document);
        }
      }
    })
  );

  // Listen for document closes
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      clearDiagnostics(document);
    })
  );

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('gtlint')) {
        outputChannel.appendLine('GTLint configuration changed, re-linting all documents');
        lintAllOpen();
      }
    })
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('gtlint.lintFile', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'guidedtrack') {
        lintNow(editor.document);
        outputChannel.appendLine(`Linted: ${editor.document.fileName}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gtlint.formatFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'guidedtrack') {
        await vscode.commands.executeCommand('editor.action.formatDocument');
        outputChannel.appendLine(`Formatted: ${editor.document.fileName}`);
      }
    })
  );

  outputChannel.appendLine('GTLint extension ready');
}

export function deactivate() {
  disposeDiagnostics();
  disposeConfigWatcher();
  if (outputChannel) {
    outputChannel.dispose();
  }
}
