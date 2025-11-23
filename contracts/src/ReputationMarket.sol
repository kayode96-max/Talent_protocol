// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SkillNFT.sol";
import "./MilestoneVerifier.sol";

/**
 * @title ReputationMarket
 * @notice A marketplace for reputation actions: tips, endorsements, and reputation-backed governance
 * @dev Allows builders to monetize reputation and supporters to invest in builder success
 */
contract ReputationMarket is Ownable {
    // Reputation action types
    enum ActionType {
        Tip,
        Endorsement,
        Challenge,
        Stake
    }

    // Reputation stake
    struct Stake {
        address staker;
        uint256 amount;
        uint256 skillNftId;
        uint256 timestamp;
        uint256 rewardsClaimed;
    }

    // Proposal for reputation-backed governance
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) voteWeight;
    }

    // State variables
    SkillNFT public skillNFT;
    MilestoneVerifier public milestoneVerifier;
    
    mapping(address => uint256) public reputationScore;
    mapping(uint256 => Stake[]) public nftStakes;
    mapping(address => uint256) public totalStaked;
    mapping(uint256 => uint256) public nftTotalStaked;
    
    uint256 private _proposalIdCounter;
    mapping(uint256 => Proposal) private proposals;
    
    // Builder seasons
    uint256 public currentSeason;
    mapping(uint256 => mapping(address => uint256)) public seasonPoints;
    mapping(uint256 => address[]) public seasonLeaderboard;
    uint256 public seasonDuration = 90 days;
    uint256 public seasonStartTime;
    
    // Constants
    uint256 public constant MIN_REPUTATION_TO_PROPOSE = 1000;
    uint256 public constant TIP_FEE_PERCENTAGE = 5; // 5%
    uint256 public constant ENDORSEMENT_REPUTATION = 10;
    uint256 public constant CHALLENGE_COST_REPUTATION = 50;
    
    // Events
    event TipSent(address indexed from, address indexed to, uint256 amount);
    event ReputationEarned(address indexed builder, uint256 amount, ActionType actionType);
    event StakeDeposited(address indexed staker, uint256 skillNftId, uint256 amount);
    event StakeWithdrawn(address indexed staker, uint256 skillNftId, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event SeasonStarted(uint256 indexed season, uint256 startTime);
    event SeasonEnded(uint256 indexed season, address[] topBuilders);

    // Errors
    error InsufficientReputation();
    error InsufficientStake();
    error InvalidProposal();
    error ProposalNotActive();
    error AlreadyVoted();
    error ProposalNotPassed();

    constructor(address _skillNFT, address _milestoneVerifier) Ownable(msg.sender) {
        skillNFT = SkillNFT(_skillNFT);
        milestoneVerifier = MilestoneVerifier(_milestoneVerifier);
        
        // Start first season
        seasonStartTime = block.timestamp;
        currentSeason = 1;
        emit SeasonStarted(currentSeason, seasonStartTime);
    }

    /**
     * @notice Send a tip to a builder
     * @param to Builder to tip
     */
    function tipBuilder(address to) external payable {
        require(msg.value > 0, "Must send ETH");
        require(to != msg.sender, "Cannot tip yourself");
        
        uint256 fee = (msg.value * TIP_FEE_PERCENTAGE) / 100;
        uint256 amountToBuilder = msg.value - fee;
        
        // Transfer to builder
        (bool success, ) = payable(to).call{value: amountToBuilder}("");
        require(success, "Transfer failed");
        
        // Award reputation to builder
        uint256 reputationEarned = msg.value / 0.001 ether; // 1 rep per 0.001 ETH
        reputationScore[to] += reputationEarned;
        
        // Award season points
        seasonPoints[currentSeason][to] += reputationEarned;
        
        emit TipSent(msg.sender, to, amountToBuilder);
        emit ReputationEarned(to, reputationEarned, ActionType.Tip);
    }

    /**
     * @notice Endorse a builder's skill NFT (costs reputation)
     * @param skillNftId Skill NFT to endorse
     */
    function endorseSkill(uint256 skillNftId) external {
        address builder = skillNFT.ownerOf(skillNftId);
        require(builder != msg.sender, "Cannot endorse yourself");
        
        if (reputationScore[msg.sender] < ENDORSEMENT_REPUTATION) {
            revert InsufficientReputation();
        }
        
        // Deduct reputation from endorser
        reputationScore[msg.sender] -= ENDORSEMENT_REPUTATION;
        
        // Award reputation to builder
        reputationScore[builder] += ENDORSEMENT_REPUTATION * 2;
        
        // Award season points
        seasonPoints[currentSeason][builder] += ENDORSEMENT_REPUTATION * 2;
        
        emit ReputationEarned(builder, ENDORSEMENT_REPUTATION * 2, ActionType.Endorsement);
    }

    /**
     * @notice Stake on a builder's skill NFT
     * @param skillNftId Skill NFT to stake on
     */
    function stakeOnSkill(uint256 skillNftId) external payable {
        require(msg.value > 0, "Must stake ETH");
        
        Stake memory newStake = Stake({
            staker: msg.sender,
            amount: msg.value,
            skillNftId: skillNftId,
            timestamp: block.timestamp,
            rewardsClaimed: 0
        });
        
        nftStakes[skillNftId].push(newStake);
        totalStaked[msg.sender] += msg.value;
        nftTotalStaked[skillNftId] += msg.value;
        
        emit StakeDeposited(msg.sender, skillNftId, msg.value);
    }

    /**
     * @notice Withdraw stake from a skill NFT
     * @param skillNftId Skill NFT to withdraw from
     * @param stakeIndex Index of stake to withdraw
     */
    function withdrawStake(uint256 skillNftId, uint256 stakeIndex) external {
        Stake[] storage stakes = nftStakes[skillNftId];
        require(stakeIndex < stakes.length, "Invalid stake index");
        
        Stake storage stake = stakes[stakeIndex];
        require(stake.staker == msg.sender, "Not stake owner");
        
        uint256 amount = stake.amount;
        
        // Calculate rewards (simple: 1% per level of the NFT)
        SkillNFT.Skill memory skill = skillNFT.getSkill(skillNftId);
        uint256 rewards = (amount * skill.level) / 100;
        
        // Remove stake
        stakes[stakeIndex] = stakes[stakes.length - 1];
        stakes.pop();
        
        totalStaked[msg.sender] -= amount;
        nftTotalStaked[skillNftId] -= amount;
        
        // Transfer back stake + rewards
        (bool success, ) = payable(msg.sender).call{value: amount + rewards}("");
        require(success, "Transfer failed");
        
        emit StakeWithdrawn(msg.sender, skillNftId, amount + rewards);
    }

    /**
     * @notice Create a governance proposal (reputation-backed)
     * @param title Proposal title
     * @param description Proposal description
     * @param duration Voting duration in seconds
     */
    function createProposal(
        string memory title,
        string memory description,
        uint256 duration
    ) external returns (uint256) {
        if (reputationScore[msg.sender] < MIN_REPUTATION_TO_PROPOSE) {
            revert InsufficientReputation();
        }
        
        uint256 proposalId = _proposalIdCounter++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + duration;
        proposal.executed = false;
        
        emit ProposalCreated(proposalId, msg.sender, title);
        
        return proposalId;
    }

    /**
     * @notice Vote on a proposal (reputation-weighted)
     * @param proposalId Proposal to vote on
     * @param support True for yes, false for no
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        
        if (block.timestamp < proposal.startTime || block.timestamp > proposal.endTime) {
            revert ProposalNotActive();
        }
        if (proposal.hasVoted[msg.sender]) revert AlreadyVoted();
        
        uint256 voteWeight = reputationScore[msg.sender];
        
        proposal.hasVoted[msg.sender] = true;
        proposal.voteWeight[msg.sender] = voteWeight;
        
        if (support) {
            proposal.votesFor += voteWeight;
        } else {
            proposal.votesAgainst += voteWeight;
        }
        
        emit VoteCast(proposalId, msg.sender, support, voteWeight);
    }

    /**
     * @notice End current season and start new one
     */
    function endSeason() external onlyOwner {
        require(block.timestamp >= seasonStartTime + seasonDuration, "Season not ended");
        
        // Get top 10 builders
        address[] memory topBuilders = _getTopBuilders(10);
        seasonLeaderboard[currentSeason] = topBuilders;
        
        emit SeasonEnded(currentSeason, topBuilders);
        
        // Start new season
        currentSeason++;
        seasonStartTime = block.timestamp;
        
        emit SeasonStarted(currentSeason, seasonStartTime);
    }

    /**
     * @notice Get top N builders for current season
     */
    function _getTopBuilders(uint256 n) private view returns (address[] memory) {
        // Simplified implementation - in production, use more efficient sorting
        address[] memory topBuilders = new address[](n);
        uint256[] memory topScores = new uint256[](n);
        
        // This is a basic implementation - in production, maintain a sorted leaderboard
        // For now, returning empty array as placeholder
        return topBuilders;
    }

    // View functions
    function getReputationScore(address builder) external view returns (uint256) {
        return reputationScore[builder];
    }

    function getSeasonPoints(uint256 season, address builder) external view returns (uint256) {
        return seasonPoints[season][builder];
    }

    function getNFTStakes(uint256 skillNftId) external view returns (Stake[] memory) {
        return nftStakes[skillNftId];
    }

    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 startTime,
        uint256 endTime,
        bool executed
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.startTime,
            proposal.endTime,
            proposal.executed
        );
    }

    // Withdraw contract balance (owner only)
    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    receive() external payable {}
}
