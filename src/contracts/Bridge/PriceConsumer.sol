// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PriceConsumer is Ownable {
    mapping(address => AggregatorV3Interface) internal priceFeedMap;

    function setPriceFeed(address token, address priceFeed) external onlyOwner {
        priceFeedMap[token] = AggregatorV3Interface(priceFeed);
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice(address token) public view returns (int) {
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeedMap[token].latestRoundData();
        return price;
    }


    function getDecimals(address token) public view returns (uint8) {
         uint8 decimal= priceFeedMap[token].decimals();
         return decimal;
    }

    function getPriceFeedAddr(address _address) external view returns (address) {
        return address(priceFeedMap[_address]);
    }
}