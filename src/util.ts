'use strict'

import {
    workspace,
    Uri,
    env,
    window,
    Range,
    commands,
    Selection
} from 'vscode'

const glob = require("fast-glob")

export async function getFilePaths(text, document) {
    let info = text.match(new RegExp(/['"](.*?)['"]/))[1]

    return getData(document, info)
}

async function getData(document, list) {
    let fileList = list.split('.')
    let info = fileList.slice(1).join('.')
    fileList.pop()

    let workspaceFolder = workspace.getWorkspaceFolder(document.uri).uri.fsPath
    let paths = workspace.getConfiguration('laravel_goto_config').folders
    let editor = `${env.uriScheme}://file`

    let toCheck = []
    while (fileList.length > 0) {
        toCheck.push(`**/${fileList.join('/')}.php`)
        fileList.pop()
    }

    let result = []
    for (const path of paths) {
        let urls = await glob(toCheck, { cwd: `${workspaceFolder}/${path}` })
        let url = urls[0]

        result.push({
            showPath: `${path}/${url}`,
            fileUri: Uri
                .parse(`${editor}${workspaceFolder}/${path}/${url}?query=${info}`)
                .with({ authority: 'ctf0.laravel-goto-config' })
        })
    }

    return result
}

/* Scroll ------------------------------------------------------------------- */
export function scrollToText() {
    window.registerUriHandler({
        handleUri(uri) {
            let { authority, path, query } = uri

            if (authority == 'ctf0.laravel-goto-config') {
                commands.executeCommand('vscode.openFolder', Uri.file(path))
                    .then(() => {
                        setTimeout(() => {
                            let editor = window.activeTextEditor
                            let range = getTextPosition(query.replace('query=', ''), editor.document)

                            if (range) {
                                editor.selection = new Selection(range.start, range.end)
                                editor.revealRange(range, 2)
                            }
                        }, 100)
                    })
            }
        }
    })
}

function getTextPosition(searchFor, doc) {
    let txt = doc.getText()
    let match

    if (searchFor.includes('.')) {
        let arr = searchFor.split('.')
        let last = arr[arr.length - 1]
        let regex = ''

        for (const item of arr) {
            regex += item == last
                ? `(?<found>${item}).*=>`
                : `['"]${item}.*\\[([\\S\\s]*?)`
        }

        match = new RegExp(regex).exec(txt)
    } else {
        match = new RegExp(`['"](?<found>${searchFor})['"].*=>`).exec(txt)
    }


    if (match) {
        let pos = doc.positionAt(match.index + match[0].length)

        return new Range(pos, pos)
    }
}

/* Config ------------------------------------------------------------------- */
export let methods

export function readConfig() {
    methods = workspace.getConfiguration('laravel_goto_config').methods
    methods = methods.join('|')
}
