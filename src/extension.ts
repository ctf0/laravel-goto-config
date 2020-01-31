'use strict'

import { languages, ExtensionContext, window } from 'vscode'
import LinkProvider from './providers/linkProvider'

let providers = []
const debounce = require('lodash.debounce')

export function activate(context: ExtensionContext) {
    setTimeout(() => {
        if (window.activeTextEditor) {
            initProvider()
        }

        window.onDidChangeTextEditorVisibleRanges(
            debounce(function (e) {
                clearAll()
                initProvider()
            }, 250)
        )

        window.onDidChangeActiveTextEditor(
            debounce(function (editor) {
                if (editor) {
                    clearAll()
                    initProvider()
                }
            }, 250)
        )
    }, 2000)
}

function initProvider() {
    providers.push(languages.registerDocumentLinkProvider(['php', 'blade'], new LinkProvider()))
}

function clearAll() {
    return providers.forEach((e) => e.dispose())
}

export function deactivate() {
    clearAll()
}
