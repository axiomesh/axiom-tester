import {test, expect, describe} from '@jest/globals'
import {newRpcClient, request} from '../../utils/rpc'
import {ContractUtils} from '../../utils/contract'
import {ST_ACCOUNT_1} from '../../utils/accounts_static'
import {
    ST_CONTRACT_DIR,
    ST_CROSS_EVM_CONTRACT_NAME,
    ST_CROSS_EVM_FILENAME,
    ST_EVM_CONTRACT_NAME,
    ST_EVM_FILENAME
} from '../../utils/contracts_static'

describe('test evm context', () => {
    const client = newRpcClient()
    const utils = new ContractUtils(
        ST_CONTRACT_DIR,
        client,
        ST_ACCOUNT_1.privateKey
    )
    utils.compile(ST_EVM_FILENAME, ST_EVM_CONTRACT_NAME)
    utils.compile(ST_CROSS_EVM_FILENAME, ST_CROSS_EVM_CONTRACT_NAME)

    test('test blockhash', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const hash = await utils.call(
            ST_EVM_CONTRACT_NAME,
            address,
            'getBlockhash',
            1
        )
        expect(hash).not.toBeNull()
    })

    test('test block.chainid', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const chainid = await utils.call(
            ST_EVM_CONTRACT_NAME,
            address,
            'blockChainid'
        )
        expect(chainid).toBe(BigInt(1356))
    })

    test('test block.coinbase', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const coinbase = await utils.call(
            ST_EVM_CONTRACT_NAME,
            address,
            'blockCoinbase'
        )
        expect(coinbase).not.toBeNull()
    })

    test('test difficulty', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const difficulty = await utils.call(
            ST_EVM_CONTRACT_NAME,
            address,
            'blockDifficulty'
        )
        expect(difficulty).toBe(BigInt(0))
    })

    test('test block.gaslimt', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const gaslimt = await utils.call(
            ST_EVM_CONTRACT_NAME,
            address,
            'blockGaslimit'
        )
        expect(gaslimt).toBe(BigInt(3141592))
    })

    test('test block.number', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const blockNumber = await utils.call(
            ST_EVM_CONTRACT_NAME,
            address,
            'blockNumber'
        )
        expect(blockNumber).toBeGreaterThan(BigInt(0))
    })

    test('test block.timestamp', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const timestamp = await utils.call(
            ST_EVM_CONTRACT_NAME,
            address,
            'blockTimestamp'
        )
        expect(timestamp).toBeGreaterThan(BigInt(0))
    })

    test('test msg.data', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const data = await utils.call(ST_EVM_CONTRACT_NAME, address, 'msgData')

        const functionSignature =
            client.eth.abi.encodeFunctionSignature('msgData')
        const funcData = utils.client.utils.sha3(functionSignature)
        // same to eth
        expect(data).toBe('0xc4c2bfdc')
    })

    test('test msg.sender', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const sender = await utils.call(
            ST_EVM_CONTRACT_NAME,
            address,
            'msgSender'
        )
        expect(sender).toBe(ST_ACCOUNT_1.address)
    })

    test('test cross msg.sender', async () => {
        const address1 = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const address2 = await utils.deploy(
            ST_CROSS_EVM_CONTRACT_NAME,
            address1
        )
        const crossSender = await utils.call(
            ST_CROSS_EVM_CONTRACT_NAME,
            address2,
            'crossMsgSender'
        )
        expect(crossSender).toBe(address2)
    })

    test('test msg.Sig', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const sig = await utils.call(ST_EVM_CONTRACT_NAME, address, 'msgSig')
        // same to eth
        expect(sig).toBe('0xec3e88cf')
    })

    test('test msg.value', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const receipt = await utils.call(
            ST_EVM_CONTRACT_NAME,
            address,
            'msgValue'
        )
        const value = client.utils.hexToNumber(receipt.logs[0].data)
        expect(value).toBe(0)
    })

    test('test tx.gasprice', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const receipt = await utils.call(
            ST_EVM_CONTRACT_NAME,
            address,
            'txGasprice'
        )

        const evm_gasprice = client.utils.hexToNumber(receipt.logs[0].data)
        const tx = await request('eth_getTransactionByHash', [
            receipt.transactionHash
        ])
        expect(evm_gasprice).toBe(client.utils.hexToNumber(tx.result.gasPrice))
    })

    test('test tx.origin', async () => {
        const address = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const origin = await utils.call(
            ST_EVM_CONTRACT_NAME,
            address,
            'txOrigin'
        )
        expect(origin).toBe(ST_ACCOUNT_1.address)
    })

    test('test cross tx.origin', async () => {
        const address1 = await utils.deploy(ST_EVM_CONTRACT_NAME)
        const address2 = await utils.deploy(
            ST_CROSS_EVM_CONTRACT_NAME,
            address1
        )
        const crossOrigin = await utils.call(
            ST_CROSS_EVM_CONTRACT_NAME,
            address2,
            'crossTxOrigin'
        )
        expect(crossOrigin).toBe(ST_ACCOUNT_1.address)
    })
})
