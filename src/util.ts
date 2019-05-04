'use strict';

import { workspace, TextDocument, Uri } from 'vscode';
import * as fs from "fs";

export function getFilePath(text: string, document: TextDocument) {
    let paths = getFilePaths(text, document);
    return paths.length > 0 ? paths[0] : null;
}

export function getFilePaths(text: string, document: TextDocument) {
    let paths = workspace.getConfiguration('laravel_goto_config').folders;
    let workspaceFolder = workspace.getWorkspaceFolder(document.uri).uri.fsPath;
    let fileList = text.replace(/\"|\'/g, '').split('.');
    let result = [];
    let found = null;

    for (let item in paths) {
        let whereTo = paths[item];

        if (found) {
            let showPath = `${whereTo}/${found}`;
            let filePath = workspaceFolder + showPath;

            if (fs.existsSync(filePath)) {
                result.push({
                    "name": item,
                    "showPath": showPath,
                    "fileUri": Uri.file(filePath)
                });
            }
        } else {
            while (!found) {
                let join = fileList.join('/');
                let file = `${join}.php`
                let showPath = `${whereTo}/${file}`;
                let filePath = workspaceFolder + showPath;

                if (fs.existsSync(filePath)) {
                    result.push({
                        "name": item,
                        "showPath": showPath,
                        "fileUri": Uri.file(filePath)
                    });
                    found = file
                } else {
                    fileList.pop();
                }
            }
        }
    }

    return result;
}
