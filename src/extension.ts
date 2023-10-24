import * as vscode from "vscode";

function sortUseLinesBeforeSave(document: vscode.TextDocument): vscode.TextEdit[] | null {
    const text = document.getText();
    const lines = text.split("\n");

    // Identify the lines before the class definition
    const classDefinitionIndex = lines.findIndex((line) => /^\s*class\s/.test(line));
    const linesBeforeClass = classDefinitionIndex !== -1 ? lines.slice(0, classDefinitionIndex) : lines;

    // Extract and sort "use" lines
    const useLines = linesBeforeClass.filter((line) => line.trim().startsWith("use "));
    const sortedLines = useLines.sort((a, b) => a.length - b.length);

    // Create a map to track whether a line has been processed
    const processedLines = new Set<string>();

    // Apply the changes
    const sortedText = lines
        .map((line) => {
            if (line.trim().startsWith("use ")) {
                const sortedLine = sortedLines.shift();
                if (sortedLine) {
                    processedLines.add(sortedLine);
                    return sortedLine;
                }
            }
            return processedLines.has(line) ? "" : line;
        })
        .join("\n");

    // Calculate the range to apply the changes
    const documentStart = new vscode.Position(0, 0);
    const documentEnd = new vscode.Position(document.lineCount - 1, lines[lines.length - 1].length);
    const fullRange = new vscode.Range(documentStart, documentEnd);

    // Create and return the TextEdit
    const edit = new vscode.TextEdit(fullRange, sortedText);
    return [edit];
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.workspace.onWillSaveTextDocument((event) => {
            if (event.document.languageId === "php") {
                event.waitUntil(Promise.resolve(sortUseLinesBeforeSave(event.document)));
            }
        })
    );
}

// This method is called when your extension is deactivated
export function deactivate() {}
