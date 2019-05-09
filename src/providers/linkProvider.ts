'use strict';

import {
    DocumentLinkProvider as vsDocumentLinkProvider,
    TextDocument,
    ProviderResult,
    DocumentLink,
    Position,
    Range,
} from "vscode"
import * as util from '../util';

export default class LinkProvider implements vsDocumentLinkProvider {
    public provideDocumentLinks(doc: TextDocument): ProviderResult<DocumentLink[]> {
        let documentLinks = [];
        let index = 0;
        let reg = /(?<=config\(|Config::get\()(['"])[^'"]*\1/g;

        while (index < doc.lineCount) {
            let line = doc.lineAt(index);
            let result = line.text.match(reg);
            if (result != null) {
                for (let item of result) {
                    let file = util.getFilePath(item, doc);
                    if (file != null) {
                        let start = new Position(line.lineNumber, line.text.indexOf(item));
                        let end = start.translate(0, item.length);
                        let documentlink = new DocumentLink(new Range(start, end), file.fileUri);
                        documentLinks.push(documentlink);
                    };
                }
            }
            index++;
        }

        return documentLinks;
    }
}
