// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BridgeStorage.sol";
import "./AssetManager.sol";
import "./ChannelManager.sol";
import "./PriceConsumer.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ERC165Checker } from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import {IWrappedERC20} from "./WrappedToken.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract AxiomBridgeV2 is BridgeStorage,AssetManager,ChannelManager,PausableUpgradeable{
     using SafeERC20 for IERC20;

     event LogTransferInitiated(uint256 assetId,address sender,address to,uint256 amount,uint16 channel,uint64 nonce,uint256 dstChainId);
     event LogTransferFinalizedData(uint256 assetId,address receiver,uint256 bridgeFee,uint256 remainFee);
     event LogTransferFinalized(uint16 channel,uint64 begin, uint64 end, uint256 endHeight);
     event LogWithdrawal(uint256 assetId,address to,uint256 amount);
     event LogWithdrawalWtoken(uint256 assetId,address to,uint256 amount);
     


    function initialize(address payable _treasuryAddr,bool _bridgeFeeRequired,uint256 _dstChainId
    ) external initializer {
        require(_treasuryAddr!=address(0x0),"AxiomBridge: treasury cannot be 0x0");
        treasury=_treasuryAddr;
        bridgeFeeRequired=_bridgeFeeRequired;
        dstChainId=_dstChainId;
        __Ownable_init();
    }

    function isBridgeFeeRequired() public view returns (bool) {
        return bridgeFeeRequired;
    }

    function _isMintableERC20(address _token) internal view returns (bool) {
        return ERC165Checker.supportsInterface(_token, type(IWrappedERC20).interfaceId);
    }

    function depositNativeTokenTo(address recipient,uint16 channel) external payable whenNotPaused onlyChannelRegistered(channel){
        require(msg.value!=0,"AxiomBridge: This function call must carry native tokens");
        require(isAssetRegistered(block.chainid),"AxiomBridge: The token is not registered");
        address tokenAddr=getAssetAddr(block.chainid);
        uint256 transferMinAmount=getAssetMinAmount(block.chainid);
        require(msg.value>=transferMinAmount,"AxiomBridge: transfer amount must greater than min amount");
        _initiateBridgeTransfer(block.chainid,tokenAddr,msg.sender,recipient,msg.value,channel);
    }

    function despositErc20To(uint256 assetId,uint256 amount,address recipient,uint16 channel) external whenNotPaused onlyChannelRegistered(channel){
        require(isAssetRegistered(assetId),"AxiomBridge: The token is not registered");
        address tokenAddr=getAssetAddr(assetId);
        uint256 transferMinAmount=getAssetMinAmount(assetId);
        require(amount>=transferMinAmount,"AxiomBridge: transfer amount must greater than min amount");
        require(!_isMintableERC20(tokenAddr),"AxiomBridge: only normal Token can transfer");
        _initiateBridgeTransfer(assetId,tokenAddr,msg.sender,recipient,amount,channel);
    }

    function withdrawalWTokenTo(uint256 assetId,uint256 amount,address recipient,uint16 channel) external whenNotPaused onlyChannelRegistered(channel){
        require(isAssetRegistered(assetId),"AxiomBridge: The token is not registered");
        address tokenAddr=getAssetAddr(assetId);
        uint256 transferMinAmount=getAssetMinAmount(assetId);
        require(amount>=transferMinAmount,"AxiomBridge: transfer amount must greater than min amount");
        require(_isMintableERC20(tokenAddr),"AxiomBridge: only wToken can withdrawal");
        _initiateBridgeTransfer(assetId,tokenAddr,msg.sender,recipient,amount,channel);
    }


    function _initiateBridgeTransfer(uint256 _assetId,address _tokenAddr,address _from,address _to,uint256 _amount,uint16 _channel) internal{
        uint64 nonce = ++outNonceMap[_channel];
        if(_isMintableERC20(_tokenAddr)){
            IWrappedERC20(_tokenAddr).burn(_from,_amount);
        }else{
            if(_assetId!=block.chainid){
                IERC20(_tokenAddr).transferFrom(_from, address(this), _amount);
            }
        }
        emit LogTransferInitiated(_assetId,_from,_to,_amount,_channel,nonce,dstChainId);
    }


    function batchFinalizeTransfer(TransferItem[] memory transferData,CommissionItem[] memory commissionData,uint16 channel,uint64 begin, uint64 end, uint256 endHeight, uint64 gasEstimate) external whenNotPaused onlyFromChannelComitter(channel){
        require(begin==inNonceMap[channel]+1,"AxiomBridge: begin must be equal to inNonce+1");
        require(transferData.length>0,"AxiomBridge: transferData cannot be empty");
        require(commissionData.length>0,"AxiomBridge: commissionData cannot be empty");
        require(end>=begin,"AxiomBridge: end must be greater than begin");
        require(endHeight>=determinedHeight,"AxiomBridge: endHeight must be greater than determinedHeight");
        require(gasEstimate>0,"AxiomBridge: gasEstimate must be greater than 0");
        uint txCount=transferData.length;
        uint256 averageGasFee=tx.gasprice*gasEstimate/txCount;

        for(uint256 i=0;i<transferData.length;i++){
            uint256 assetId=transferData[i].assetId;
            require(isAssetRegistered(assetId),"AxiomBridge: The token is not registered");
             address tokenAddr=getAssetAddr(assetId);
             uint256 amount=transferData[i].amount;
            (uint256 bridgeFee,uint remainFee)=caculateFee(averageGasFee,assetId,tokenAddr,amount);
            address receiver=transferData[i].receipt;
             if(_isMintableERC20(tokenAddr)){
                pendingMints[assetId][treasury]=pendingMints[assetId][treasury]+bridgeFee;
                IWrappedERC20(tokenAddr).mint(receiver,remainFee);
             }else{
                pendingWithdrawals[assetId][treasury]=pendingWithdrawals[assetId][treasury]+bridgeFee;
                pendingWithdrawals[assetId][receiver]=pendingWithdrawals[assetId][receiver]+remainFee;
             }
             emit LogTransferFinalizedData(assetId,receiver,bridgeFee,remainFee);
        }
        for(uint256 i=0;i<commissionData.length;i++){
            address tokenAddr=getAssetAddr(commissionData[i].assetId);
             if(_isMintableERC20(tokenAddr)){
                pendingMints[commissionData[i].assetId][treasury]=pendingMints[transferData[i].assetId][treasury]+commissionData[i].amount;
             }else{
                pendingWithdrawals[commissionData[i].assetId][treasury]=pendingWithdrawals[commissionData[i].assetId][treasury]+commissionData[i].amount;
             }
        }
        inNonceMap[channel]=end;
        determinedHeight=endHeight;
        emit LogTransferFinalized(channel,begin,end,endHeight);
    }
    


    function caculateFee(uint256 averageGasFee,uint256 assetId,address tokenAddr,uint256 amount) internal returns(uint256,uint256){
        uint256 bridgeFee=0;
        uint256 remainFee=0;
        if (bridgeFeeRequired){
            if(assetId==block.chainid){
                bridgeFee=averageGasFee;
            }else{
                bridgeFee=SafeMath.div(SafeMath.mul(averageGasFee, 10 ** PriceConsumer(priceConsumer).getDecimals(tokenAddr)), uint256(PriceConsumer(priceConsumer).getLatestPrice(tokenAddr)));
            }
            if (bridgeFee<amount){
                    remainFee=amount-bridgeFee; 
            }else{
                    bridgeFee=amount;
            }
        }else{
            remainFee=amount;
        }
        return (bridgeFee,remainFee);
    }


    function getInNonce(uint16 channel) public view returns(uint64){
        return inNonceMap[channel];
    }

    function getOutNonce(uint16 channel) public view returns(uint64){
        return outNonceMap[channel];
    }

    function getDeterminedHeight() external view returns (uint256){
        return determinedHeight;
    }

    function getWithdrawAmount(uint256 assetId) external view returns(uint256){
        require(isAssetRegistered(assetId),"The token is not registered");
        return pendingWithdrawals[assetId][msg.sender];
    }

     function getBridgeProfit(uint256 assetId) external view returns(uint256){
        require(isAssetRegistered(assetId),"The token is not registered");
        return pendingMints[assetId][msg.sender];
    }

    function withdraw(uint256 assetId) external whenNotPaused{
        require(isAssetRegistered(assetId),"The token is not registered");
        uint amount=pendingWithdrawals[assetId][msg.sender];
        require(amount>0,"no pending withdrawals");
        pendingWithdrawals[assetId][msg.sender]=0;
        if(assetId==block.chainid){
            (bool success, ) = msg.sender.call{ value: amount}(new bytes(0));
            require(success,"AxiomBridge:safeTransferETH: ETH transfer failed");
        }else{
            address tokenAddr=getAssetAddr(assetId);
            IERC20(tokenAddr).safeTransfer(msg.sender,amount);
        }
        emit LogWithdrawal(assetId,msg.sender,amount);
    }

    function withdrawPengdingWtoken(uint256 assetId) external whenNotPaused {
        require(isAssetRegistered(assetId),"The token is not registered");
        uint amount=pendingMints[assetId][msg.sender];
        require(amount>0,"no pending withdrawals");
        pendingMints[assetId][msg.sender]=0;
        address tokenAddr=getAssetAddr(assetId);
        IWrappedERC20(tokenAddr).mint(msg.sender,amount);
        emit LogWithdrawalWtoken(assetId,msg.sender,amount);
    }


    function setPriceConsumer(address _priceConsumer) external onlyOwner{
        priceConsumer=_priceConsumer;
    }

    function getPriceConsumer() public view returns(address){
        return priceConsumer;
    }
    

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getTreasury() external view returns (address){
        return treasury;
    }

    function getBridgeFeeRequired() external view returns (bool){
        return bridgeFeeRequired;
    }

    function getDstChainId() external view returns(uint256){
        return dstChainId;
    }


    function testProxyUpgrade() external pure returns(string memory){
        return "AxiomBridgeV2";
    }




}