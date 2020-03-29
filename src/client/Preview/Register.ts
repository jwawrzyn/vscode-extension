import * as vscode from 'vscode';
import { TextDocumentContentProvider } from './TextDocumentContentProvider';

export function registerPreview(context, window, client) {

  const aureliaViewDataPanelType = 'aureliaViewData';

  const previewUri = vscode.Uri.parse('aurelia-preview://authority/aurelia-preview');

  const provider = new TextDocumentContentProvider(client);
  let isPanelVisible: boolean = false;
  let panel: vscode.WebviewPanel;

  function fillWebViewHtml(bodyContent: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cat Coding</title>
        </head>
        ${bodyContent}
      </html>
    `;
  }

  vscode.workspace.onDidChangeTextDocument(async (e: vscode.TextDocumentChangeEvent) => {
    if (!isPanelVisible) return;
    if (e.document === vscode.window.activeTextEditor.document) {
      await provider.update(previewUri).then(success => {
        panel.webview.html = fillWebViewHtml(success);
      });
    }
  });

  vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor) => {
    setTimeout(() => {
      if (!isPanelVisible) return;
      if (editor === vscode.window.activeTextEditor) {
        provider.update(previewUri).then(success => {
          panel.webview.html = fillWebViewHtml(success);
        });
      }
    }, 0);
  });

  context.subscriptions.push(vscode.commands.registerCommand('aurelia.showViewProperties', () => {

    const smartAutocomplete = vscode.workspace.getConfiguration().get('aurelia.featureToggles.smartAutocomplete');
    if (smartAutocomplete as boolean) {
      panel = vscode.window.createWebviewPanel(
        aureliaViewDataPanelType,
        'Aurelia view data',
        vscode.ViewColumn.Two,
      );

      provider.provideTextDocumentContent(previewUri)
        .then(
          (success) => {
            panel.webview.html = fillWebViewHtml(success);
          },
          (reason) => {
            window.showErrorMessage(reason);
          });
    } else {
      return vscode.window.showWarningMessage('This command requires the experimental feature "smartAutocomplete" to be enabled');
    }

    /**
     * Set panel visible flag to true, if
     * - we have the correct WebView type (multiple WebView types possible)
     * - and panel itself is not active
     */
    panel.onDidChangeViewState(event => {
      const correctPanelType = (event.webviewPanel.viewType === aureliaViewDataPanelType);
      /** Don't update panel if the panel itself is 'active' */
      const panelNotActive = !event.webviewPanel.active;
      isPanelVisible = correctPanelType && panelNotActive;
    });

    panel.onDidDispose(() => {
      isPanelVisible = false;
    });

  }));

}

