'use strict'

import {
    DocumentLink,
    DocumentLinkProvider,
    Position,
    TextDocument,
    window
} from 'vscode'
import * as util from '../util'

export default class LinkProvider implements DocumentLinkProvider {
    methods: string

    constructor() {
        this.methods = util.methods
    }

    async provideDocumentLinks(doc: TextDocument): Promise<DocumentLink[]> {
        let editor = window.activeTextEditor

        if (editor) {
            const text = doc.getText()
            let regex = new RegExp(`(?<=(${this.methods})\\()['"](.*?)['"]`, 'g')
            let links = []
            let matches

            while ((matches = regex.exec(text)) !== null) {
                let found = matches[0]
                const line = doc.lineAt(doc.positionAt(matches.index).line)
                const indexOf = line.text.indexOf(found)
                const position = new Position(line.lineNumber, indexOf)
                const range = doc.getWordRangeAtPosition(position, new RegExp(regex))

                if (range) {
                    let files = await util.getFilePaths(found, doc)

                    if (files.length) {
                        for (const file of files) {
                            let documentlink = new DocumentLink(range, file.fileUri)
                            documentlink.tooltip = file.tooltip
                            links.push(documentlink)
                        }
                    }
                }
            }

            return links
        }
    }
}
