// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


contract BridgeStorage is OwnableUpgradeable  {

    struct TransferItem{
        uint256 assetId;
        uint256 amount;
        address receipt;
    }
    struct CommissionItem{
        uint256 assetId;
        uint256 amount;
    }

    uint256 determinedHeight;
    address priceConsumer;
    address treasury;
    bool bridgeFeeRequired;

    uint256 dstChainId;
    
    uint256[] assets;
    mapping(uint256 => bool) registeredAsset;
    mapping(uint256 => address) assetAddress;
    mapping(uint256 => uint256) assetMinTransferAmount;

    mapping(uint256 =>mapping(address=>uint256)) pendingWithdrawals;
    mapping(uint256 =>mapping(address=>uint256)) pendingMints;

    uint16[] channels;
    mapping(uint16 => bool) registeredChannel;
    mapping(uint16 => address) registeredChannelComitter;
    mapping(uint16 => uint64) inNonceMap;
    mapping(uint16 => uint64) outNonceMap;


}