import * as vscode from 'vscode';
import { Formatter } from '@jrc03c/gtlint';
import { getConfigForDocument } from './configuration';

export class GTLintFormatterProvider implements vscode.DocumentFormattingEditProvider {
  async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    _options: vscode.FormattingOptions,
    _token: vscode.CancellationToken
  ): Promise<vscode.TextEdit[]> {
    const { formatter: formatterConfig, settings } = await getConfigForDocument(document);

    if (!settings.enable) {
      return [];
    }

    const source = document.getText();
    const formatter = new Formatter(formatterConfig);
    const formatted = formatter.format(source);

    // If no changes, return empty array
    if (formatted === source) {
      return [];
    }

    // Replace entire document
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(source.length)
    );

    return [vscode.TextEdit.replace(fullRange, formatted)];
  }
}
