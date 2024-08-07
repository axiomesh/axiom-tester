import {test, expect, describe} from '@jest/globals'
import {ethers} from '@axiomesh/axiom'
import {
    ST_CONTRACT_DIR,
    ST_GASPRICE_MANAGER_ADDRESS,
    PROPOSAL_TYPE_GAS_PRICE_UPDATE,
    ST_EPOCHMANAGER_ADDRESS
} from '../../utils/contracts_static'
import {newProvider} from '../../utils/rpc'
import {
    ST_ADMIN_1,
    ST_ADMIN_2,
    ST_ADMIN_3,
    ST_ADMIN_4,
    ST_ACCOUNT_1
} from '../../utils/accounts_static'
import {hexToString, stringToUint8Array, turnLogs} from '../../utils/util'
import fs from 'fs'

describe('TestCases for gas price manager', () => {
    const provider = newProvider()
    const abi = fs.readFileSync(
        ST_CONTRACT_DIR + 'Governance/governance.abi',
        'utf8'
    )
    const abi_epoch = fs.readFileSync(
        ST_CONTRACT_DIR + 'Consensus/EpochManager.abi',
        'utf8'
    )
    let gasExtraArgs = {
        MinGasPrice: 100000000000
    }
    let gasArgs = stringToUint8Array(JSON.stringify(gasExtraArgs))
    describe('Suite_A: test proposal to change gas price ', () => {
        let obj: any = {}
        test('normal change gas price ', async () => {
            console.log('1. admin1 post a proposal to change gas price')
            let wallet = new ethers.Wallet(ST_ADMIN_1.privateKey, provider)
            let contract = new ethers.Contract(
                ST_GASPRICE_MANAGER_ADDRESS,
                abi,
                wallet
            )

            const propose = await contract.propose(
                PROPOSAL_TYPE_GAS_PRICE_UPDATE,
                'test change gasPrice',
                'test change gasPrice',
                1000000,
                gasArgs,
                {
                    gasPrice: 1000000000000,
                    gasLimit: 300000
                }
            )
            await propose.wait()
            const receipt = await provider.getTransactionReceipt(propose.hash)

            if (receipt && receipt.logs.length > 0) {
                expect(receipt.to).toBe(ST_GASPRICE_MANAGER_ADDRESS)
                let log = turnLogs(receipt.logs[0])
                let parsedLog = contract.interface.parseLog(log)
                //console.log('parsedLog is:', parsedLog)
                expect(parsedLog?.name).toBe('Propose')

                let data = hexToString(parsedLog?.args[3])
                obj = JSON.parse(data)
                expect(obj.ID).toBeGreaterThan(0)
                expect(obj.Type).toBe(PROPOSAL_TYPE_GAS_PRICE_UPDATE)
                expect(data).toMatch('"Status":0')
            } else {
                console.log('receipt or receipt.logs is null')
            }

            console.log('1.1 admin1 query this proposal')
            let res = await contract.proposal(obj.ID)
            // res is json object
            //console.log('res is:', res)
            expect(res.ID).toBe(BigInt(obj.ID))

            console.log('2. admin2 vote this proposal')
            wallet = new ethers.Wallet(ST_ADMIN_2.privateKey, provider)
            contract = new ethers.Contract(
                ST_GASPRICE_MANAGER_ADDRESS,
                abi,
                wallet
            )

            const result_2 = await contract.vote(obj.ID, 0, {
                gasPrice: 10000000000000,
                gasLimit: 300000
            })
            await result_2.wait()
            const receipt_2 = await provider.getTransactionReceipt(
                result_2.hash
            )

            if (receipt_2 && receipt_2.logs.length > 0) {
                expect(receipt_2.to).toBe(ST_GASPRICE_MANAGER_ADDRESS)
                let log = turnLogs(receipt_2.logs[0])
                let parsedLog = contract.interface.parseLog(log)
                //console.log('parsedLog is:', parsedLog)
                expect(parsedLog?.name).toBe('Vote')

                let data = hexToString(parsedLog?.args[3])
                obj = JSON.parse(data)
                expect(obj.ID).toBeGreaterThan(0)
                expect(obj.Type).toBe(PROPOSAL_TYPE_GAS_PRICE_UPDATE)
                expect(data).toMatch('"Status":0')
            } else {
                console.log('receipt or receipt.logs is null')
            }

            console.log('3. admin3 vote this proposal')
            wallet = new ethers.Wallet(ST_ADMIN_3.privateKey, provider)
            contract = new ethers.Contract(
                ST_GASPRICE_MANAGER_ADDRESS,
                abi,
                wallet
            )
            const result_3 = await contract.vote(obj.ID, 0, {
                gasPrice: 10000000000000,
                gasLimit: 300000
            })
            await result_3.wait()
            const receipt_3 = await provider.getTransactionReceipt(
                result_3.hash
            )

            if (receipt_3 && receipt_3.logs.length > 0) {
                expect(receipt_3.to).toBe(ST_GASPRICE_MANAGER_ADDRESS)
                //console.log('logs is:', receipt_3.logs)
                let log = turnLogs(receipt_3.logs[0])
                let parsedLog = contract.interface.parseLog(log)
                //console.log('parsedLog is:', parsedLog)
                expect(parsedLog?.name).toBe('Vote')

                let data = hexToString(parsedLog?.args[3])
                obj = JSON.parse(data)
                expect(obj.ID).toBeGreaterThan(0)
                expect(obj.Type).toBe(PROPOSAL_TYPE_GAS_PRICE_UPDATE)
                expect(data).toMatch('"Status":1')
            } else {
                console.log('receipt or receipt.logs is null')
            }

            console.log('4. admin4 vote this proposal')
            wallet = new ethers.Wallet(ST_ADMIN_4.privateKey, provider)
            contract = new ethers.Contract(
                ST_GASPRICE_MANAGER_ADDRESS,
                abi,
                wallet
            )
            try {
                const result_4 = await contract.vote(obj.ID, 0, {
                    gasPrice: 10000000000000,
                    gasLimit: 300000
                })
                await result_4.wait()
                expect(true).toBe(false)
            } catch (error: any) {
                expect(error.message).toMatch('transaction execution reverted')
            }

            console.log('5. admin1 query epochInfo')
            wallet = new ethers.Wallet(ST_ADMIN_1.privateKey, provider)
            let contract_epoch = new ethers.Contract(
                ST_EPOCHMANAGER_ADDRESS,
                abi_epoch,
                wallet
            )

            const result_6 = await contract_epoch.nextEpoch()
            expect(result_6.FinanceParams.MinGasPrice).toEqual(
                BigInt(gasExtraArgs.MinGasPrice)
            )
        })

        test('admin post a proposal to change gas price with same args', async () => {
            console.log('1. admin1 post a proposal to change gas price')
            let wallet = new ethers.Wallet(ST_ADMIN_1.privateKey, provider)
            let contract = new ethers.Contract(
                ST_GASPRICE_MANAGER_ADDRESS,
                abi,
                wallet
            )
            try {
                let propose = await contract.propose(
                    PROPOSAL_TYPE_GAS_PRICE_UPDATE,
                    'test change gas price',
                    'test change gas price',
                    1000000,
                    gasArgs,
                    {
                        gasPrice: 10000000000000,
                        gasLimit: 300000
                    }
                )
                await propose.wait()
                expect(true).toBe(false)
            } catch (error: any) {
                //console.log('error is:', error.message)
                expect(error.message).toMatch('transaction execution reverted')
            }
        })

        test('admin post a proposal to change gas price with error min args ', async () => {
            console.log('1. admin1 post a proposal to change gas price')
            let wallet = new ethers.Wallet(ST_ADMIN_1.privateKey, provider)
            let contract = new ethers.Contract(
                ST_GASPRICE_MANAGER_ADDRESS,
                abi,
                wallet
            )

            let gasExtraArgs = {
                MinGasPrice: -100000000000000
            }
            let gasArgs = stringToUint8Array(JSON.stringify(gasExtraArgs))

            try {
                let propose = await contract.propose(
                    PROPOSAL_TYPE_GAS_PRICE_UPDATE,
                    'test change gas price',
                    'test change gas price',
                    1000000,
                    gasArgs,
                    {
                        gasPrice: 10000000000000,
                        gasLimit: 300000
                    }
                )
                await propose.wait()
                expect(true).toBe(false)
            } catch (error: any) {
                //console.log('error is:', error.message)
                expect(error.message).toMatch('transaction execution reverted')
            }
        })

        test('admin post a proposal to change gas price with error args (MinGasPrice is string )', async () => {
            console.log('1. admin1 post a proposal to change gas price')
            let wallet = new ethers.Wallet(ST_ADMIN_1.privateKey, provider)
            let contract = new ethers.Contract(
                ST_GASPRICE_MANAGER_ADDRESS,
                abi,
                wallet
            )

            let gasExtraArgs = {
                MinGasPrice: '100000000000'
            }
            let gasArgs = stringToUint8Array(JSON.stringify(gasExtraArgs))

            try {
                let propose = await contract.propose(
                    PROPOSAL_TYPE_GAS_PRICE_UPDATE,
                    'test change gas price',
                    'test change gas price',
                    1000000,
                    gasArgs,
                    {
                        gasPrice: 10000000000000,
                        gasLimit: 300000
                    }
                )
                await propose.wait()
                expect(true).toBe(false)
            } catch (error: any) {
                //console.log('error is:', error.message)
                expect(error.message).toMatch('transaction execution reverted')
            }
        })

        test('admin repeat post proposal to change gas price ', async () => {
            console.log('1. admin1 post a proposal to change gas price')
            let wallet = new ethers.Wallet(ST_ADMIN_1.privateKey, provider)
            let contract = new ethers.Contract(
                ST_GASPRICE_MANAGER_ADDRESS,
                abi,
                wallet
            )
            let gasExtraArgs = {
                MinGasPrice: 30000000000
            }
            let gasArgs = stringToUint8Array(JSON.stringify(gasExtraArgs))

            const propose = await contract.propose(
                PROPOSAL_TYPE_GAS_PRICE_UPDATE,
                'test change gasPrice',
                'test change gasPrice',
                1000000,
                gasArgs,
                {
                    gasPrice: 1000000000000,
                    gasLimit: 300000
                }
            )
            await propose.wait()
            const receipt = await provider.getTransactionReceipt(propose.hash)

            if (receipt && receipt.logs.length > 0) {
                expect(receipt.to).toBe(ST_GASPRICE_MANAGER_ADDRESS)
                let log = turnLogs(receipt.logs[0])
                let parsedLog = contract.interface.parseLog(log)
                //console.log('parsedLog is:', parsedLog)
                expect(parsedLog?.name).toBe('Propose')

                let data = hexToString(parsedLog?.args[3])
                obj = JSON.parse(data)
                expect(obj.ID).toBeGreaterThan(0)
                expect(obj.Type).toBe(PROPOSAL_TYPE_GAS_PRICE_UPDATE)
                expect(data).toMatch('"Status":0')
            } else {
                console.log('receipt or receipt.logs is null')
            }

            console.log('1.1. admin1 repeat post proposal')
            try {
                const propose_2 = await contract.propose(
                    PROPOSAL_TYPE_GAS_PRICE_UPDATE,
                    'test change gasPrice',
                    'test change gasPrice',
                    1000000,
                    gasArgs,
                    {
                        gasPrice: 10000000000000,
                        gasLimit: 300000
                    }
                )
                await propose_2.wait()
                expect(true).toBe(false)
            } catch (error: any) {
                //console.log('error is:', error.message)
                expect(error.message).toMatch('transaction execution reverted')
            }

            // finish the proposal
            console.log('2. admin2 vote this proposal')
            wallet = new ethers.Wallet(ST_ADMIN_2.privateKey, provider)
            contract = new ethers.Contract(
                ST_GASPRICE_MANAGER_ADDRESS,
                abi,
                wallet
            )

            const result_2 = await contract.vote(obj.ID, 1, {
                gasPrice: 10000000000000,
                gasLimit: 300000
            })
            await result_2.wait()

            console.log('3. admin3 vote this proposal')
            wallet = new ethers.Wallet(ST_ADMIN_3.privateKey, provider)
            contract = new ethers.Contract(
                ST_GASPRICE_MANAGER_ADDRESS,
                abi,
                wallet
            )
            const result_3 = await contract.vote(obj.ID, 1, {
                gasPrice: 10000000000000,
                gasLimit: 300000
            })
            await result_3.wait()
            const receipt_3 = await provider.getTransactionReceipt(
                result_3.hash
            )

            if (receipt_3 && receipt_3.logs.length > 0) {
                expect(receipt_3.to).toBe(ST_GASPRICE_MANAGER_ADDRESS)
                let log = turnLogs(receipt_3.logs[0])
                let parsedLog = contract.interface.parseLog(log)
                //console.log('parsedLog is:', parsedLog)
                expect(parsedLog?.name).toBe('Vote')

                let data = hexToString(parsedLog?.args[3])
                obj = JSON.parse(data)
                expect(obj.ID).toBeGreaterThan(0)
                expect(obj.Type).toBe(PROPOSAL_TYPE_GAS_PRICE_UPDATE)
                expect(data).toMatch('"Status":2')
            } else {
                console.log('receipt or receipt.logs is null')
            }
        })

        test('user post a proposal to change gas price ', async () => {
            console.log('1. user1 post a proposal to change gas price')
            let wallet = new ethers.Wallet(ST_ACCOUNT_1.privateKey, provider)
            let contract = new ethers.Contract(
                ST_GASPRICE_MANAGER_ADDRESS,
                abi,
                wallet
            )
            let gasExtraArgs = {
                MinGasPrice: 300000000000
            }
            let gasArgs = stringToUint8Array(JSON.stringify(gasExtraArgs))
            try {
                let propose = await contract.propose(
                    PROPOSAL_TYPE_GAS_PRICE_UPDATE,
                    'test change gas price',
                    'test change gas price',
                    1000000,
                    gasArgs,
                    {
                        gasPrice: 10000000000000,
                        gasLimit: 300000
                    }
                )
                await propose.wait()
                expect(true).toBe(false)
            } catch (error: any) {
                //console.log('error is:', error.message)
                expect(error.message).toMatch('transaction execution reverted')
            }
        })

        test('admin post a proposal to change gas price with wrong blocks ', async () => {
            console.log('1. admin1 post a proposal to change gas price')
            let wallet = new ethers.Wallet(ST_ADMIN_1.privateKey, provider)
            let contract = new ethers.Contract(
                ST_GASPRICE_MANAGER_ADDRESS,
                abi,
                wallet
            )
            let gasExtraArgs = {
                MinGasPrice: 400000000000
            }
            let gasArgs = stringToUint8Array(JSON.stringify(gasExtraArgs))
            try {
                let propose = await contract.propose(
                    PROPOSAL_TYPE_GAS_PRICE_UPDATE,
                    'test change gas price',
                    'test change gas price',
                    1,
                    gasArgs,
                    {
                        gasPrice: 10000000000000,
                        gasLimit: 300000
                    }
                )
                await propose.wait()
                expect(true).toBe(false)
            } catch (error: any) {
                //console.log('error is:', error.message)
                expect(error.message).toMatch('transaction execution reverted')
            }
        })
    })
})
