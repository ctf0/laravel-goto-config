'use strict';

import {
    HoverProvider as vsHoverProvider,
    TextDocument,
    Position,
    ProviderResult,
    Hover,
    workspace,
    MarkdownString,
} from "vscode";
import * as util from '../util';

export class HoverProvider implements vsHoverProvider {
    provideHover(doc: TextDocument, pos: Position): ProviderResult<Hover> {
        let reg = /(?<=config\(|Config::get\()(['"])[^'"]*\1/;
        let linkRange = doc.getWordRangeAtPosition(pos, reg);

        if (!linkRange) return

        let filePaths = util.getFilePaths(doc.getText(linkRange), doc);
        let workspaceFolder = workspace.getWorkspaceFolder(doc.uri);
        if (filePaths.length > 0) {
            let text: string = "";
            for (let i in filePaths) {
                text += `\`${filePaths[i].name}\``;
                text += ` [${workspaceFolder.name + filePaths[i].showPath}](${filePaths[i].fileUri})  \r`;
            }
            return new Hover(new MarkdownString(text));
        };
    }
}
