// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./BridgeStorage.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract AssetManager is BridgeStorage{

    event LogAssetRegistered(uint256 assetId,address tokenAddr,uint256 minTransferAmount);

    function isAssetRegistered(uint256 assetId) public view returns (bool) {
        return registeredAsset[assetId];
    }

    function registerToken(uint256 assetId,address tokenAddr,uint256 minTransferAmount) public onlyOwner{
        require(!isAssetRegistered(assetId), "ASSET_ALREADY_REGISTERED");
        registeredAsset[assetId]=true;
        assetAddress[assetId]=tokenAddr;
        assetMinTransferAmount[assetId]=minTransferAmount;
        assets.push(assetId);
        emit LogAssetRegistered(assetId,tokenAddr,minTransferAmount);
    }

    function getRegisterAssets() public view returns(uint[] memory){
        return assets;
    }

    function getAssetAddr(uint256 assetId) public view returns(address){
        require(isAssetRegistered(assetId), "ASSET_NOT_REGISTERED");
        return assetAddress[assetId];
    }

     function getAssetMinAmount(uint256 assetId) public view returns(uint256){
        require(isAssetRegistered(assetId), "ASSET_NOT_REGISTERED");
        return assetMinTransferAmount[assetId];
    }



}