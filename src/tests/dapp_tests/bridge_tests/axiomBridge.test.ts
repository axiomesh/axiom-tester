import {test, expect} from '@jest/globals'
import {ethers} from '@axiomesh/axiom'
import * as path from 'path'

import {extractAbiAndBytecode, turnLogs, waitAsync} from '../../../utils/util'
import {ST_CONTRACT_DIR} from '../../../utils/contracts_static'
import {
    ST_ADMIN_2,
    ST_ACCOUNT_2,
    ST_ACCOUNT_1
} from '../../../utils/accounts_static'

const fs = require('fs')
const currentDir = __dirname
describe('test_axiomBridge_contract', () => {
    const SRC_CHAIN_URL = 'http://10.2.69.92:8881'
    const DST_CHAIN_URL = 'http://10.2.69.96:8881'
    const provider = new ethers.JsonRpcProvider(SRC_CHAIN_URL)
    const provider2 = new ethers.JsonRpcProvider(DST_CHAIN_URL)
    const {abi, bytecode} = extractAbiAndBytecode(
        ST_CONTRACT_DIR + 'Bridge/AxiomBridge.json'
    )
    const {abi: erc20_abi, bytecode: weth_bytecode} = extractAbiAndBytecode(
        ST_CONTRACT_DIR + 'Bridge/Token.json'
    )
    let src_axiomBridgeAddr: string
    let dst_axiomBridgeAddr: string
    let src_usdtAddr: string
    let dst_wusdtAddr: string
    let dst_wethAddr: string

    beforeAll(() => {
        console.log('beforeAll: parse bridge contract address')
        const deployPath = path.join(currentDir, 'deployRes.json')
        const deployRes = JSON.parse(fs.readFileSync(deployPath))

        if (deployRes.hasOwnProperty('crossChain1')) {
            src_axiomBridgeAddr = deployRes['crossChain1'].axiomBridge
            console.log(
                'crossChain1 axiomBridge contract address is:',
                src_axiomBridgeAddr
            )
            src_usdtAddr = deployRes['crossChain1'].USDT
        } else {
            console.error(
                'The deployment info of crossChain1 is wrong in deployRes.json'
            )
        }
        if (deployRes.hasOwnProperty('crossChain2')) {
            dst_axiomBridgeAddr = deployRes['crossChain2'].axiomBridge
            console.log(
                'crossChain2 axiomBridge contract address is:',
                dst_axiomBridgeAddr
            )
            dst_wusdtAddr = deployRes['crossChain2'].WUSDT
            dst_wethAddr = deployRes['crossChain2'].WETH
        } else {
            console.error(
                'The deployment info of crossChain2 is wrong in deployRes.json'
            )
        }
    })

    test('invoke axiomBridge contract query dstChainId', async () => {
        let wallet = new ethers.Wallet(ST_ADMIN_2.privateKey, provider)
        let contract = new ethers.Contract(src_axiomBridgeAddr, abi, wallet)
        // query dstChainId
        let res = await contract.getDstChainId()
        //console.log('dstChainId is:', res)
        expect(res).toBe(BigInt(1357))
    })

    test('invoke axiomBridge contract query treasury addr', async () => {
        let wallet = new ethers.Wallet(ST_ADMIN_2.privateKey, provider)
        let contract = new ethers.Contract(src_axiomBridgeAddr, abi, wallet)

        let res = await contract.getTreasury()
        //console.log('treasury address is:', res)
        expect(res).toBe(ST_ADMIN_2.address)
    })

    test('invoke axiomBridge contract getBridgeFeeRequired', async () => {
        let wallet = new ethers.Wallet(ST_ADMIN_2.privateKey, provider)
        let contract = new ethers.Contract(src_axiomBridgeAddr, abi, wallet)

        let res = await contract.getBridgeFeeRequired()
        //console.log('res is:', res)
        expect(res).toBe(true)
    })

    test('invoke axiomBridge contract pause method', async () => {
        let wallet = new ethers.Wallet(ST_ADMIN_2.privateKey, provider)
        let contract = new ethers.Contract(src_axiomBridgeAddr, abi, wallet)

        let res = await contract.pause()
        //console.log('res is:', res)
        await res.wait()

        // send cross-chain transaction will fail
        try {
            await contract.depositNativeTokenTo(ST_ACCOUNT_1.address, 1, {
                value: ethers.parseEther('100')
            })
            expect(true).toBe(false)
        } catch (error: any) {
            //console.log(error)
            expect(error.message).toMatch(
                'execution reverted: "Pausable: paused"'
            )
        }
    })

    test('invoke axiomBridge contract unpause method', async () => {
        let wallet = new ethers.Wallet(ST_ADMIN_2.privateKey, provider)
        let contract = new ethers.Contract(src_axiomBridgeAddr, abi, wallet)

        // invoke unpause
        let res = await contract.unpause()
        console.log('res is:', res)
        await res.wait()

        res = await contract.depositNativeTokenTo(ST_ACCOUNT_1.address, 1, {
            value: ethers.parseEther('100')
        })
        await res.wait()
        console.log('Tx successful:', res.hash)
    })

    test('invoke axiomBridge contract depositNativeTokenTo method', async () => {
        let wallet = new ethers.Wallet(ST_ADMIN_2.privateKey, provider)
        let contract = new ethers.Contract(src_axiomBridgeAddr, abi, wallet)

        let res = await contract.depositNativeTokenTo(ST_ACCOUNT_1.address, 1, {
            value: ethers.parseEther('100')
        })
        //depositNativeTokenTo(ST_ACCOUNT_1.address, 1).send()
        await res.wait()
        console.log('Tx successful:', res)
    })

    test('invoke axiomBridge contract despositErc20To method', async () => {
        let wallet = new ethers.Wallet(ST_ADMIN_2.privateKey, provider)
        let contract = new ethers.Contract(src_axiomBridgeAddr, abi, wallet)
        let usdt_contract = new ethers.Contract(src_usdtAddr, erc20_abi, wallet)

        let res = await usdt_contract.mint(
            ST_ADMIN_2.address,
            BigInt(100000000000000000000000)
        )
        await res.wait()
        // query balance
        res = await usdt_contract.balanceOf(ST_ADMIN_2.address)
        console.log('balance is:', res)
        expect(res).toBeGreaterThanOrEqual(BigInt(100000000000000000000000))
        // approve
        await usdt_contract.approve(
            src_axiomBridgeAddr,
            BigInt(10000000000000000000000)
        )
        await waitAsync(2000)

        // transfer erc20
        res = await contract.despositErc20To(
            1,
            BigInt(100000000000000000000),
            ST_ADMIN_2.address,
            1
        )
        //depositNativeTokenTo(ST_ACCOUNT_1.address, 1).send()
        await res.wait()
        console.log('Tx successful:', res)
    })

    test('invoke axiomBridge contract send muti transactions', async () => {
        let wallet = new ethers.Wallet(ST_ADMIN_2.privateKey, provider)
        let contract = new ethers.Contract(src_axiomBridgeAddr, abi, wallet)

        for (let i = 1; i < 11; i++) {
            let res1 = await contract.depositNativeTokenTo(
                ST_ACCOUNT_1.address,
                1,
                {
                    value: ethers.parseEther('100')
                }
            )
            //depositNativeTokenTo(ST_ACCOUNT_1.address, 1).send()
            await res1.wait()
            console.log('nonce:', i, 'Tx successful:', res1.hash)
        }

        for (let i = 1; i < 11; i++) {
            let res2 = await contract.depositNativeTokenTo(
                ST_ACCOUNT_2.address,
                1,
                {
                    value: ethers.parseEther('100')
                }
            )
            await res2.wait()
            console.log('nonce:', i, 'Tx successful:', res2.hash)
        }
    })

    test('query and verify crosstx log', async () => {
        let wallet2 = new ethers.Wallet(ST_ADMIN_2.privateKey, provider2)
        let contract2 = new ethers.Contract(dst_axiomBridgeAddr, abi, wallet2)
        let tx: any[]
        let block = await provider2.getBlock('latest')
        if (block) {
            tx = [...block.transactions]
            //console.log('tx is:', tx)
            let receipt = await provider2.getTransactionReceipt(tx[0])
            if (receipt && receipt.logs.length > 0) {
                for (let i = 1; i < receipt.logs.length; i++) {
                    //console.log('receipt.logs[', i, '] is:', receipt.logs[i])
                    let log = turnLogs(receipt.logs[i])
                    let parsedLog = contract2.interface.parseLog(log)
                    if (parsedLog?.name == 'LogTransferFinalizedData') {
                        console.log('parsedLog ', i, ' is:', parsedLog)

                        expect(parsedLog.args.assetId).toBe(BigInt(1356))
                        expect(parsedLog.args.bridgeFee).toBe(BigInt(0))
                        expect(parsedLog.args.remainFee).toBeLessThanOrEqual(
                            BigInt(990000000000000000000)
                        )
                        // expect(parsedLog.name).toMatch('LogTransferFinalized')
                    }

                    if (parsedLog?.name == 'LogTransferFinalized') {
                        console.log('parsedLog ', i, ' is:', parsedLog)
                        expect(parsedLog.args.channel).toBe(BigInt(1))
                    }
                }
            } else {
                console.log('Transaction receipt is null')
            }
        } else {
            console.log('No block found')
        }
    })

    test('invoke axiomBridge contract query balance', async () => {
        let wallet2 = new ethers.Wallet(ST_ADMIN_2.privateKey, provider2)
        let weth_contract = new ethers.Contract(
            dst_wethAddr,
            erc20_abi,
            wallet2
        )

        let res = await weth_contract.symbol()
        //console.log('res is:', res)
        src_usdtAddr
        expect(res).toBe('WETH')

        res = await weth_contract.balanceOf(ST_ACCOUNT_1.address)
        console.log('res is:', res)
    })
})
