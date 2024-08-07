const util = require('util')
const child_process = require('child_process')
const fs = require('fs')
export function stringToByte(str: string) {
    const bytes = []
    let c: number
    const len = str.length
    for (let i = 0; i < len; i++) {
        c = str.charCodeAt(i)
        if (c >= 0x010000 && c <= 0x10ffff) {
            bytes.push(((c >> 18) & 0x07) | 0xf0)
            bytes.push(((c >> 12) & 0x3f) | 0x80)
            bytes.push(((c >> 6) & 0x3f) | 0x80)
            bytes.push((c & 0x3f) | 0x80)
        } else if (c >= 0x000800 && c <= 0x00fff) {
            bytes.push(((c >> 12) & 0x07) | 0xf0)
            bytes.push(((c >> 6) & 0x3f) | 0x80)
            bytes.push((c & 0x3f) | 0x80)
        } else if (c >= 0x000800 && c <= 0x0007ff) {
            bytes.push(((c >> 6) & 0x3f) | 0x80)
            bytes.push((c & 0x3f) | 0x80)
        } else {
            bytes.push(c & 0xff)
        }
    }
    return bytes
}

export function stringToUint8Array(str: string) {
    const arr = []
    for (let i = 0, j = str.length; i < j; ++i) {
        arr.push(str.charCodeAt(i))
    }

    const tmpUint8Array = new Uint8Array(arr)
    return tmpUint8Array
}

export function hexStringToString(hex: any): string {
    hex = hex.substr(2, hex.length)
    const length = hex.length / 2 // 2 characters per byte
    const result = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
        result[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    let str = ''
    for (let i = 0; i < result.length; ++i) {
        str += String.fromCharCode(result[i])
    }
    return str
}

// Convert a hex string to a ASCII string
export function hexToString(hexStr: any) {
    // if hexstr has prefix '0x' then remove this prefix
    if (hexStr.substr(0, 2) == '0x') {
        hexStr = hexStr.substr(2, hexStr.length)
    }
    let str = ''
    if (hexStr == null) {
        return str
    }
    const hex = hexStr.toString() //force conversion
    for (let i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
    return str
}

export function getValue(str: string, key: any) {
    const result = new RegExp(`(?:^|,)${key}:([^,]*)`).exec(str)
    return result && result[1]
}

export async function waitAsync(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export function isString(value: unknown): value is string {
    return typeof value === 'string'
}

export function turnLogs(log: {topics: ReadonlyArray<string>; data: string}) {
    const topics = log.topics.slice()
    const data = log.data
    return {
        topics,
        data
    }
}

export function extractAbiAndBytecode(jsonFilePath: string): {
    abi: any
    bytecode: any
} {
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'))
    const abi = jsonData.abi || ''
    const bytecode = jsonData.bytecode || ''
    return {abi, bytecode}
}

export async function runShellScript(script: any, args: any) {
    const exec = util.promisify(child_process.exec)
    return new Promise(resolve => {
        exec(
            `bash ${script} ${args}`,
            (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.error(`exec error info: ${error}`)
                    return
                }

                if (stderr) {
                    console.log(`stderr info: ${stderr}`)
                    return
                }
                resolve(stdout ? stdout : stderr)
            }
        )
    })
}
