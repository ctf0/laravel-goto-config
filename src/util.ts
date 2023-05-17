import escapeStringRegexp from 'escape-string-regexp';
import { execaCommand } from 'execa';
import glob from 'fast-glob';
import * as path from 'node:path';
import {
    DocumentSymbol,
    Selection,
    TextEditorRevealType,
    Uri,
    WorkspaceConfiguration,
    commands,
    env,
    window,
    workspace,
} from 'vscode';

export const CMND_NAME = 'lgcnf.openFile';

const sep = path.sep;
const SCHEME = `command:${CMND_NAME}`;
const PKG_LABEL = 'Laravel Goto Config';
const outputChannel = window.createOutputChannel(PKG_LABEL, 'log');
let ws;

export function setWs(uri) {
    ws = workspace.getWorkspaceFolder(uri)?.uri.fsPath;
}

/* -------------------------------------------------------------------------- */

const cache_store_link = [];

export async function getFilePaths(text) {
    text = text.replace(/['"]/g, '');

    if (text.endsWith('.')) {
        return [];
    }

    const cache_key = text;
    let list = checkCache(cache_store_link, cache_key);

    if (!list.length) {
        list = await getData(text);

        if (list.length) {
            saveCache(cache_store_link, cache_key, list);
        }
    }

    return list;
}

async function getData(text) {
    const fileList = text.split('.');
    const paths = config.folders;

    const toCheck = [];
    while (fileList.length > 0) {
        toCheck.push(`**/${fileList.join(sep)}.php`);
        fileList.pop();
    }

    const result = [];

    for (const path of paths) {
        const urls = await glob(toCheck, { cwd: `${ws}${sep}${path}` });
        const url = urls[0];
        const val = await getConfigValue(text);

        if (url != undefined) {
            // because we dont know which is (a config key) & which is (the config file name)
            const configFile = url.replace('.php', '');
            const keyName = text.replace(text.match(`.*${configFile}\\.`), '');

            const file = `${path}${sep}${url}`;
            const args = prepareArgs({ path: normalizePath(`${ws}${sep}${file}`), query: keyName });

            result.push({
                tooltip : `${val} (${file})`,
                fileUri : Uri.parse(`${SCHEME}?${args}`),
            });
        } else {
            if (config.forceShowConfigLink) {
                result.push({
                    tooltip : val,
                    fileUri : null,
                });
            }
        }
    }

    return result;
}


function prepareArgs(args: object) {
    return encodeURIComponent(JSON.stringify([args]));
}

function normalizePath(path) {
    return path
        .replace(/\/+/g, '/')
        .replace(/\+/g, '\\');
}

/* Tinker ------------------------------------------------------------------- */
let counter = 1;

async function getConfigValue(key) {
    let timer;

    try {
        const { stdout } = await execaCommand(`${config.phpCommand} tinker --execute="echo json_encode(config('${key}'))"`, {
            cwd   : ws,
            shell : env.shell,
        });

        return stdout;
    } catch (error) {
        // console.error(error)

        if (counter >= 3) {
            outputChannel.replace(error.message);
            // outputChannel.show();

            return clearTimeout(timer);
        }

        timer = setTimeout(() => {
            counter++;
            getConfigValue(key);
        }, 2000);
    }
}

/* Scroll ------------------------------------------------------------------- */
export function scrollToText(args) {
    if (args !== undefined) {
        let { path, query } = args;

        commands.executeCommand('vscode.open', Uri.file(path)).then(async () => {
            const editor = window.activeTextEditor;

            const symbols: DocumentSymbol[] = await commands.executeCommand('vscode.executeDocumentSymbolProvider', editor.document.uri);
            let range: any;
            query = query.split('.');

            if (query.length > 1) {
                range = getRange(symbols, query);
            } else {
                range = symbols.find((symbol) => symbol.name == query)?.location.range;
            }

            if (range) {
                editor.selection = new Selection(range.start, range.end);
                editor.revealRange(range, TextEditorRevealType.InCenter);
            }

            if (!range && query) {
                window.showInformationMessage(
                    `${PKG_LABEL}: Copy Key To Clipboard`,
                    ...['Copy'],
                ).then((e) => {
                    if (e) {
                        env.clipboard.writeText(`'${query}'`);
                    }
                });
            }
        });
    }
}

function getRange(symbolsList: Array<any>, keysArray: string[]): any {
    let key: any = null;

    while (keysArray.length) {
        key = keysArray.shift();
        const node = symbolsList.find((symbol: any) => symbol.name === key);

        if (node) {
            if (node.children && keysArray.length) {
                return getRange(node.children, keysArray);
            }

            return node.location.range;
        }

        break;
    }
}

/* Helpers ------------------------------------------------------------------ */

function checkCache(cache_store, text) {
    const check = cache_store.find((e) => e.key == text);

    return check ? check.val : [];
}

function saveCache(cache_store, text, val) {
    checkCache(cache_store, text).length
        ? false
        : cache_store.push({
            key : text,
            val : val,
        });

    return val;
}

/* Config ------------------------------------------------------------------- */
export const PACKAGE_NAME = 'laravelGotoConfig';
export let config: WorkspaceConfiguration;
export let methods: any = '';

export function readConfig() {
    config = workspace.getConfiguration(PACKAGE_NAME);
    methods = config.methods.map((e) => escapeStringRegexp(e)).join('|');
}
