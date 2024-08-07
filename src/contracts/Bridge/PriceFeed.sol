// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceFeed is AggregatorV3Interface {
    uint8 deciaml;
    string des;
    uint256 ver;
    uint80 round;

    event AnswerUpdated(
        int256 indexed current,
        uint256 indexed roundId,
        uint256 updatedAt
    );

    constructor(uint8 _deciaml, string memory _description, uint256 _version) {
        deciaml = _deciaml;
        des = _description;
        ver = _version;
    }

    function decimals() external view override returns (uint8) {
        return deciaml;
    }

    function description() external view override returns (string memory) {
        return des;
    }

    function version() external view override returns (uint256) {
        return ver;
    }

    struct RoundData {
        uint256 startedAt;
        uint256 updatedAt;
        int256 answer;
        uint80 answeredInRound;
    }

    mapping(uint80 => RoundData) public roundDataMap;

    function getRoundData(
        uint80 _roundId
    )
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        RoundData memory data = roundDataMap[_roundId];
        return (
            _roundId,
            data.answer,
            data.startedAt,
            data.updatedAt,
            data.answeredInRound
        );
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        RoundData memory data = roundDataMap[round];
        roundId = round;
        answer = data.answer;
        startedAt = data.startedAt;
        updatedAt = data.updatedAt;
        answeredInRound = data.answeredInRound;
    }

    function update(
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt
    ) public {
        round = round + 1;
        roundDataMap[round] = RoundData(startedAt, updatedAt, answer, round);
        emit AnswerUpdated(answer, round, updatedAt);
    }
}
