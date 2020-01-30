'use strict'

import { languages, ExtensionContext } from 'vscode'
import LinkProvider from './providers/linkProvider'

export function activate(context: ExtensionContext) {
    // wait until editor is idle
    setTimeout(() => {
        context.subscriptions.push(
            languages.registerDocumentLinkProvider(['php', 'blade'], new LinkProvider())
        )
    }, 2000)
}

export function deactivate() {
    //
}
