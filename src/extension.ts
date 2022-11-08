'use strict'

import {
    commands,
    languages,
    window,
    workspace
} from 'vscode'
import LinkProvider from './providers/linkProvider'
import { debounce } from 'lodash'
import * as util from './util'

let providers  = []

export function activate({subscriptions}) {
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
    subscriptions.push(commands.registerCommand('lgcnf.openFile', util.scrollToText))
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
