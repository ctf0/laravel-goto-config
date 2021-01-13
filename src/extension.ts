'use strict'

import {
    ExtensionContext,
    languages,
    window,
    workspace
} from 'vscode'
import LinkProvider from './providers/linkProvider'
import * as util    from './util'

let providers = []
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
    window.onDidChangeActiveTextEditor((e) => initProviders())

    // scroll
    util.scrollToText()
}

const initProviders = debounce(function () {
    providers.push(languages.registerDocumentLinkProvider(['php', 'blade'], new LinkProvider()))
}, 250)

export function deactivate() {
    providers.forEach((e) => e.dispose())
}
