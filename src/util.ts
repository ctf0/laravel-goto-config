'use strict'

import { workspace, TextDocument, Uri, env } from 'vscode'

const glob = require("fast-glob")

export async function getFilePaths(text: string, document: TextDocument) {
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
