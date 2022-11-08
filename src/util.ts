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
import escapeStringRegexp from 'escape-string-regexp';

const path = require('path')
const sep  = path.sep
const glob = require('fast-glob')
const exec = require('await-exec')
const scheme = 'command:lgcnf.openFile'

let ws

export function setWs(uri) {
    ws = workspace.getWorkspaceFolder(uri)?.uri.fsPath
}

/* -------------------------------------------------------------------------- */

let cache_store_link = []

export async function getFilePaths(text) {
    text = text.replace(/['"]/g, '')

    if (text.endsWith('.')) {
        return []
    }

    let cache_key = text
    let list      = checkCache(cache_store_link, cache_key)

    if (!list.length) {
        list = await getData(text)

        if (list.length) {
            saveCache(cache_store_link, cache_key, list)
        }
    }

    return list
}

async function getData(text) {
    let fileList = text.split('.')
    let keyName  = fileList.pop()

    let paths  = config.folders

    let toCheck = []
    while (fileList.length > 0) {
        toCheck.push(`**/${fileList.join(sep)}.php`)
        fileList.pop()
    }

    let result = []

    for (const path of paths) {
        let urls = await glob(toCheck, {cwd: `${ws}${sep}${path}`})
        let url  = urls[0]
        let val  = await getConfigValue(text)

        if (url != undefined) {
            let file = `${path}${sep}${url}`
            let args = prepareArgs({ path: normalizePath(`${ws}${sep}${file}`), query: keyName });

            result.push({
                tooltip : `${val} (${file})`,
                fileUri : Uri.parse(`${scheme}?${args}`)
            })
        } else {
            if (config.forceShowConfigLink) {
                result.push({
                    tooltip : val,
                    fileUri : null
                })
            }
        }
    }

    return result
}


function prepareArgs(args: object){
    return encodeURIComponent(JSON.stringify([args]));
}

function normalizePath(path)
{
    return path
            .replace(/\/+/g, '/')
            .replace(/\+/g, '\\')
}

/* Tinker ------------------------------------------------------------------- */
let counter = 1

async function getConfigValue(key) {
    let timer

    try {
        let res = await exec(`${config.phpCommand} tinker --execute="echo json_encode(config('${key}'))"`, {
            cwd   : ws,
            shell : env.shell
        })

        return res.stdout.replace(/<.*/, '').trim().replace(/['"]/g, '')
    } catch (error) {
        // console.error(error)

        if (counter >= 3) {
            return clearTimeout(timer)
        }

        timer = setTimeout(() => {
            counter++
            getConfigValue(key)
        }, 2000)
    }
}

/* Scroll ------------------------------------------------------------------- */
export function scrollToText(args) {
    if (args !== undefined) {
        let { path, query } = args

        commands.executeCommand('vscode.open', Uri.file(path))
            .then(() => {
                setTimeout(() => {
                    let editor = window.activeTextEditor
                    let range  = getTextPosition(query, editor.document)

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

function getTextPosition(searchFor, doc) {
    let txt   = doc.getText()
    let arr   = searchFor.split('.')
    let last  = arr[arr.length - 1]
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

/* Helpers ------------------------------------------------------------------ */

function checkCache(cache_store, text) {
    let check = cache_store.find((e) => e.key == text)

    return check ? check.val : []
}

function saveCache(cache_store, text, val) {
    checkCache(cache_store, text).length
        ? false
        : cache_store.push({
            key : text,
            val : val
        })

    return val
}

/* Config ------------------------------------------------------------------- */
export const PACKAGE_NAME = 'laravelGotoConfig'
export let config: any = {}
export let methods: any = ''

export function readConfig() {
    config  = workspace.getConfiguration(PACKAGE_NAME)
    methods = config.methods.map((e) => escapeStringRegexp(e)).join('|')
}
