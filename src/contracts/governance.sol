// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

enum ProposalType {
    CouncilElect,
    NodeUpgrade,
    NodeAdd,
    NodeRemove,
    WhiteListProviderAdd,
    WhiteListProviderRemove,
    GasUpdate
}

enum VoteResult {
    Pass,
    Reject
}

enum ProposalStrategy {
    SimpleStrategy
}

enum ProposalStatus {
    Voting,
    Approved,
    Rejected
}

struct Proposal {
    uint64 ID;
    ProposalType Type;
    ProposalStrategy Strategy;
    string Proposer;
    string Title;
    string Desc;
    uint64 BlockNumber;
    uint64 TotalVotes;
    string[] PassVotes;
    string[] RejectVotes;
    ProposalStatus Status;
    bytes Extra;
    uint64 CreatedBlockNumber;
    uint64 EffectiveBlockNumber;
    bool ExecuteSuccess;
    string ExecuteFailedMsg;
}

// Governance contract is a system contract that needn't be deployed
// this is only used for generate governance ABI
interface Governance {
    // TODO: Remain compatible with before, update proposal 'bytes' to 'Proposal'
    event Propose(
        uint64 indexed proposalID,
        ProposalType indexed proposalType,
        address indexed proposer,
        bytes proposal
    );

    event Vote(
        uint64 indexed proposalID,
        ProposalType indexed proposalType,
        address indexed proposer,
        bytes proposal
    );

    function propose(
        ProposalType proposalType,
        string calldata title,
        string calldata desc,
        uint64 deadlineBlockNumber,
        bytes calldata extra
    ) external;

    function vote(uint64 proposalID, VoteResult voteResult) external;

    function proposal(
        uint64 proposalID
    ) external view returns (Proposal calldata proposal);

    function getLatestProposalID() external view returns (uint64);
}
