'use strict'

import {
    commands,
    env,
    Range,
    Selection,
    Uri,
    window,
    workspace
} from 'vscode'

const glob = require('fast-glob')

export async function getFilePaths(text, document) {
    let info = text.replace(/['"]/g, '')

    return getData(document, info)
}

async function getData(document, list) {
    let fileList = list.split('.')
    let keyName = fileList.pop()

    let workspaceFolder = workspace.getWorkspaceFolder(document.uri)?.uri.fsPath
    let paths = config.folders
    let editor = `${env.uriScheme}://file`

    let toCheck = []
    while (fileList.length > 0) {
        toCheck.push(`**/${fileList.join('/')}.php`)
        fileList.pop()
    }

    let result = []
    for (const path of paths) {
        let urls = await glob(toCheck, {cwd: `${workspaceFolder}/${path}`})
        let url = urls[0]

        if (url != undefined) {
            result.push({
                tooltip : `${path}/${url}`,
                fileUri : Uri
                    .parse(`${editor}${workspaceFolder}/${path}/${url}`)
                    .with({authority: 'ctf0.laravel-goto-config', query: keyName})
            })
        }
    }

    return result
}

/* Scroll ------------------------------------------------------------------- */
export function scrollToText() {
    window.registerUriHandler({
        handleUri(provider) {
            let {authority, path, query} = provider

            if (authority == 'ctf0.laravel-goto-config') {
                commands.executeCommand('vscode.openFolder', Uri.file(path))
                    .then(() => {
                        setTimeout(() => {
                            let editor = window.activeTextEditor
                            let range = getTextPosition(query, editor.document)

                            if (range) {
                                editor.selection = new Selection(range.start, range.end)
                                editor.revealRange(range, 3)
                            }

                            if (!range && query) {
                                window.showInformationMessage(
                                    'Laravel Goto Config: Copy Key To Clipboard',
                                    ...['Copy']
                                ).then((e) => {
                                    if (e) {
                                        env.clipboard.writeText(`'${query}'`)
                                    }
                                })
                            }
                        }, 500)
                    })
            }
        }
    })
}

function getTextPosition(searchFor, doc) {
    let txt = doc.getText()
    let arr = searchFor.split('.')
    let last = arr[arr.length - 1]
    let regex = ''
    let match

    if (searchFor.includes('.')) {
        for (const item of arr) {
            regex += item == last
                ? `${item}.*=>`
                : `['"]${item}.*\\[([\\S\\s]*?)`
        }

        match = new RegExp(regex).exec(txt)
    } else {
        match = new RegExp(`['"]${searchFor}['"].*=>`).exec(txt)
    }

    if (match) {
        let pos = doc.positionAt(match.index + match[0].length)

        return new Range(pos, pos)
    }
}

/* Config ------------------------------------------------------------------- */
const escapeStringRegexp = require('escape-string-regexp')
export const PACKAGE_NAME = 'laravelGotoConfig'
export let config: any = {}
export let methods: any = ''

export function readConfig() {
    config = workspace.getConfiguration(PACKAGE_NAME)

    methods = config.methods.map((e) => escapeStringRegexp(e)).join('|')
}
