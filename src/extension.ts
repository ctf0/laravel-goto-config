'use strict'

import {
    ExtensionContext,
    languages,
    window,
    workspace
} from 'vscode'
import LinkProvider from './providers/linkProvider'
import * as util    from './util'

let providers  = []
const debounce = require('lodash.debounce')

export function activate(context: ExtensionContext) {
    util.readConfig()

    // config
    workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(util.PACKAGE_NAME)) {
            util.readConfig()
        }
    })

    // links
    initProviders()
    window.onDidChangeActiveTextEditor(async (e) => {
        await clearAll()
        initProviders()
    })

    // scroll
    util.scrollToText()
}

const initProviders = debounce(function() {
    providers.push(languages.registerDocumentLinkProvider(['php', 'blade'], new LinkProvider()))
}, 250)

function clearAll() {
    return new Promise((res, rej) => {
        providers.map((e) => e.dispose())
        providers = []

        setTimeout(() => {
            return res(true)
        }, 500)
    })
}

export function deactivate() {
    clearAll()
}
