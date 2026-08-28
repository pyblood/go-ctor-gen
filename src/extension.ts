import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('go-ctor-gen.generate', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'go') {
      vscode.window.showErrorMessage('Place cursor inside a Go struct.');
      return;
    }

    const doc = editor.document;
    const cursorLine = editor.selection.active.line;
    const text = doc.getText();

    const structInfo = findEnclosingStruct(text, doc.offsetAt(editor.selection.active));
    if (!structInfo) {
      vscode.window.showErrorMessage('No struct found at cursor.');
      return;
    }

    const { name, fields } = structInfo;
    const params = fields.map(f => `${lowerFirst(f.name)} ${f.type}`).join(', ');
    const assigns = fields.map(f => `${f.name}: ${lowerFirst(f.name)}`).join(', ');

    const ctor = `\nfunc New${name}(${params}) *${name} {\n\treturn &${name}{${assigns}}\n}\n`;

    // Insert after the struct's closing brace
    const insertPos = doc.positionAt(structInfo.endOffset);
    const insertLine = insertPos.line + 1;

    editor.edit(editBuilder => {
      editBuilder.insert(new vscode.Position(insertLine, 0), ctor);
    });
  });

  context.subscriptions.push(disposable);
}

interface Field {
  name: string;
  type: string;
}

interface StructInfo {
  name: string;
  fields: Field[];
  endOffset: number;
}

function findEnclosingStruct(text: string, cursorOffset: number): StructInfo | null {
  const structRegex = /type\s+(\w+)\s+struct\s*{/g;
  let match: RegExpExecArray | null;

  while ((match = structRegex.exec(text)) !== null) {
    const openBraceIdx = match.index + match[0].length - 1;
    const closeBraceIdx = findMatchingBrace(text, openBraceIdx);
    if (closeBraceIdx === -1) continue;

    // Only accept the struct that actually contains the cursor
    if (cursorOffset >= match.index && cursorOffset <= closeBraceIdx) {
      const body = text.slice(openBraceIdx + 1, closeBraceIdx);
      return {
        name: match[1],
        fields: parseFields(body),
        endOffset: closeBraceIdx + 1
      };
    }
  }
  return null;
}

function findMatchingBrace(text: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parseFields(body: string): Field[] {
  const fields: Field[] = [];
  const lines = body.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.split('//')[0].trim(); // strip comments
    if (!line) continue;

    // Matches: FieldName Type   or   FieldName Type `tag:"x"`
    const m = line.match(/^([A-Z]\w*)\s+([\w.\[\]\*]+)/);
    if (m) {
      fields.push({ name: m[1], type: m[2] });
    }
  }
  return fields;
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function deactivate() {}