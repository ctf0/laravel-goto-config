'use strict'

import {
    DocumentLinkProvider as vsDocumentLinkProvider,
    TextDocument,
    ProviderResult,
    DocumentLink,
    Position,
    workspace,
    Range
} from "vscode"
import * as util from '../util'

export default class LinkProvider implements vsDocumentLinkProvider {
    provideDocumentLinks(doc: TextDocument): ProviderResult<DocumentLink[]> {
        let workspaceFolder = workspace.getWorkspaceFolder(doc.uri)
        let reg = new RegExp(/(config|Config::(get|set))\((['"](.*)?['"])\)/, 'gm')
        let documentLinks = []

        doc.getText().replace(reg, (match: string, p1: any, p2: any, p3: any, p4: any, offset: any) => {
            // console.log(match, p1, p2, p3, p4, offset)
            let file = util.getFilePath(p3, doc)

            if (file != null) {
                let pos = doc.positionAt(offset)
                let start = new Position(pos.line, pos.character)
                let end = new Position(pos.line, pos.character + match.length)

                let documentlink = new DocumentLink(new Range(start, end), file.fileUri)
                documentlink.tooltip = `${file.name}: ${workspaceFolder.name}${file.showPath}`
                documentLinks.push(documentlink)
            }

            return match
        })

        return documentLinks
    }
}
