import escapeStringRegexp from 'escape-string-regexp';
import {
    DocumentLink,
    DocumentLinkProvider,
    TextDocument,
    window,
} from 'vscode';
import * as util from '../util';

export default class LinkProvider implements DocumentLinkProvider {
    methods: string;

    constructor() {
        this.methods = util.methods;
    }

    async provideDocumentLinks(doc: TextDocument): Promise<DocumentLink[]> {
        const editor = window.activeTextEditor;

        if (editor) {
            util.setWs(doc.uri);

            const text = doc.getText();
            const regex = new RegExp(`(?<=(${this.methods}))['"]([\\w\.-]+)['"]`, 'g');
            const links = [];
            const matches = text.matchAll(regex);

            for (const match of matches) {
                const found = match[2];
                const files = await util.getFilePaths(found);
                const range = doc.getWordRangeAtPosition(
                    doc.positionAt(match.index + found.length),
                    new RegExp(escapeStringRegexp(found)),
                );

                if (files.length && range) {
                    for (const file of files) {
                        const documentlink = new DocumentLink(range, file.fileUri);
                        documentlink.tooltip = file.tooltip;

                        links.push(documentlink);
                    }
                }
            }

            return links;
        }
    }
}
