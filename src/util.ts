'use strict'

import { workspace, TextDocument, Uri } from 'vscode'

const glob = require("fast-glob")

export async function getFilePaths(text: string, document: TextDocument) {
    let info = text.replace(new RegExp(/(config|Config::(get|set))\(['"]|['"]\)/, 'g'), '')

    return getData(document, info)
}

async function getData(document, list) {
    let fileList = list.split('.')
    fileList.pop()

    let workspaceFolder = workspace.getWorkspaceFolder(document.uri).uri.fsPath
    let paths = workspace.getConfiguration('laravel_goto_config').folders
    let toCheck = []
    while (fileList.length > 0) {
        toCheck.push(`**/${fileList.join('/')}.php`)
        fileList.pop()
    }

    let result = []
    for (const path of paths) {
        let urls = await glob(toCheck, { cwd: `${workspaceFolder}/${path}` })

        result.push({
            showPath: path,
            fileUri: Uri.file(`${workspaceFolder}/${path}/${urls[0]}`)
        })
    }

    return result
}
