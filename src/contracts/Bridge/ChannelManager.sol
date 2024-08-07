pragma solidity ^0.8.0;

import "./BridgeStorage.sol";

abstract contract ChannelManager is BridgeStorage{

    event LogChannelRegistered(uint16 channel,address committer);
    event LogChannelUpdated(uint16 channel,address committer);

    modifier onlyFromChannelComitter(uint16 _channel) {
        require(
            isChannelRegistered(_channel) && msg.sender == registeredChannelComitter[_channel],
            "only can be call by channel comitter "
        );
        _;
    }

    modifier onlyChannelRegistered(uint16 _channel){
         require(
            isChannelRegistered(_channel),
            "channel must be registered"
        );
        _;
    }

    function isChannelRegistered(uint16 _channelId) public view returns (bool) {
        return registeredChannel[_channelId];
    }

    function registerChannel(uint16 _channel,address _committer) public onlyOwner{
        require(!isChannelRegistered(_channel), "CHANNEL_ALREADY_REGISTERED");
        registeredChannel[_channel]=true;
        registeredChannelComitter[_channel]=_committer;
        channels.push(_channel);
        emit LogChannelRegistered(_channel,_committer);
    }

    function setChannelComitter(uint16 _channel,address _committer) public onlyOwner{
         require(isChannelRegistered(_channel), "CHANNEL_NOT_REGISTERED");
         registeredChannelComitter[_channel]=_committer;
         emit LogChannelUpdated(_channel,_committer);
    }

     function getChannels() public view returns(uint16[] memory){
        return channels;
    }


}


