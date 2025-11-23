// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./SkillNFT.sol";

/**
 * @title MilestoneVerifier
 * @notice Verifies and records builder milestones, awarding XP to Skill NFTs
 * @dev Supports both on-chain verification and off-chain oracle signatures
 */
contract MilestoneVerifier is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Milestone types
    enum MilestoneType {
        GitHubCommit,
        HackathonProject,
        CourseCompleted,
        FeatureShipped,
        ContractDeployed,
        AuditCompleted,
        CommunityContribution,
        Custom
    }

    // Milestone status
    enum MilestoneStatus {
        Pending,
        Verified,
        Rejected,
        Challenged
    }

    // Milestone data structure
    struct Milestone {
        address builder;
        uint256 skillNftId;
        MilestoneType milestoneType;
        string title;
        string description;
        string proofUrl;
        uint256 xpAwarded;
        MilestoneStatus status;
        uint256 createdAt;
        uint256 verifiedAt;
        address verifier;
        uint256 endorsements;
        uint256 challenges;
    }

    // State variables
    SkillNFT public skillNFT;
    uint256 private _milestoneIdCounter;
    
    mapping(uint256 => Milestone) public milestones;
    mapping(address => uint256[]) public builderMilestones;
    mapping(uint256 => mapping(address => bool)) public hasEndorsed;
    mapping(uint256 => mapping(address => bool)) public hasChallenged;
    mapping(address => bool) public isOracle;
    mapping(MilestoneType => uint256) public baseXPRewards;
    
    // Constants
    uint256 public constant ENDORSEMENT_THRESHOLD = 3;
    uint256 public constant CHALLENGE_THRESHOLD = 2;
    uint256 public constant XP_MULTIPLIER = 100;
    
    // Events
    event MilestoneCreated(uint256 indexed milestoneId, address indexed builder, MilestoneType milestoneType);
    event MilestoneVerified(uint256 indexed milestoneId, uint256 xpAwarded);
    event MilestoneRejected(uint256 indexed milestoneId, string reason);
    event MilestoneEndorsed(uint256 indexed milestoneId, address indexed endorser);
    event MilestoneChallenged(uint256 indexed milestoneId, address indexed challenger);
    event OracleAdded(address indexed oracle);
    event OracleRemoved(address indexed oracle);

    // Errors
    error NotAuthorized();
    error InvalidMilestone();
    error AlreadyEndorsed();
    error AlreadyChallenged();
    error InvalidStatus();
    error NotMilestoneOwner();

    constructor(address _skillNFT) Ownable(msg.sender) {
        skillNFT = SkillNFT(_skillNFT);
        _initializeBaseXP();
    }

    /**
     * @notice Initialize base XP rewards for each milestone type
     */
    function _initializeBaseXP() private {
        baseXPRewards[MilestoneType.GitHubCommit] = 50;
        baseXPRewards[MilestoneType.HackathonProject] = 500;
        baseXPRewards[MilestoneType.CourseCompleted] = 200;
        baseXPRewards[MilestoneType.FeatureShipped] = 300;
        baseXPRewards[MilestoneType.ContractDeployed] = 400;
        baseXPRewards[MilestoneType.AuditCompleted] = 600;
        baseXPRewards[MilestoneType.CommunityContribution] = 150;
        baseXPRewards[MilestoneType.Custom] = 100;
    }

    /**
     * @notice Create a new milestone
     * @param skillNftId The Skill NFT to attribute this milestone to
     * @param milestoneType Type of milestone
     * @param title Milestone title
     * @param description Detailed description
     * @param proofUrl URL to proof (GitHub, IPFS, etc.)
     * @return milestoneId The created milestone ID
     */
    function createMilestone(
        uint256 skillNftId,
        MilestoneType milestoneType,
        string memory title,
        string memory description,
        string memory proofUrl
    ) external returns (uint256) {
        // Verify the caller owns the Skill NFT
        if (skillNFT.ownerOf(skillNftId) != msg.sender) revert NotMilestoneOwner();
        
        uint256 milestoneId = _milestoneIdCounter++;
        
        milestones[milestoneId] = Milestone({
            builder: msg.sender,
            skillNftId: skillNftId,
            milestoneType: milestoneType,
            title: title,
            description: description,
            proofUrl: proofUrl,
            xpAwarded: 0,
            status: MilestoneStatus.Pending,
            createdAt: block.timestamp,
            verifiedAt: 0,
            verifier: address(0),
            endorsements: 0,
            challenges: 0
        });
        
        builderMilestones[msg.sender].push(milestoneId);
        
        emit MilestoneCreated(milestoneId, msg.sender, milestoneType);
        
        return milestoneId;
    }

    /**
     * @notice Verify a milestone (oracle only)
     * @param milestoneId Milestone to verify
     * @param xpMultiplier Multiplier for base XP (100 = 1x, 200 = 2x)
     */
    function verifyMilestone(uint256 milestoneId, uint256 xpMultiplier) external {
        if (!isOracle[msg.sender] && msg.sender != owner()) revert NotAuthorized();
        
        Milestone storage milestone = milestones[milestoneId];
        if (milestone.status != MilestoneStatus.Pending) revert InvalidStatus();
        
        // Calculate XP
        uint256 baseXP = baseXPRewards[milestone.milestoneType];
        uint256 xpAwarded = (baseXP * xpMultiplier) / 100;
        
        // Update milestone
        milestone.status = MilestoneStatus.Verified;
        milestone.xpAwarded = xpAwarded;
        milestone.verifiedAt = block.timestamp;
        milestone.verifier = msg.sender;
        
        // Award XP to Skill NFT
        skillNFT.addXP(milestone.skillNftId, xpAwarded);
        
        emit MilestoneVerified(milestoneId, xpAwarded);
    }

    /**
     * @notice Reject a milestone
     * @param milestoneId Milestone to reject
     * @param reason Reason for rejection
     */
    function rejectMilestone(uint256 milestoneId, string memory reason) external {
        if (!isOracle[msg.sender] && msg.sender != owner()) revert NotAuthorized();
        
        Milestone storage milestone = milestones[milestoneId];
        if (milestone.status != MilestoneStatus.Pending) revert InvalidStatus();
        
        milestone.status = MilestoneStatus.Rejected;
        
        emit MilestoneRejected(milestoneId, reason);
    }

    /**
     * @notice Endorse a milestone (community verification)
     * @param milestoneId Milestone to endorse
     */
    function endorseMilestone(uint256 milestoneId) external {
        Milestone storage milestone = milestones[milestoneId];
        
        if (milestone.builder == msg.sender) revert NotAuthorized();
        if (hasEndorsed[milestoneId][msg.sender]) revert AlreadyEndorsed();
        if (milestone.status != MilestoneStatus.Pending) revert InvalidStatus();
        
        hasEndorsed[milestoneId][msg.sender] = true;
        milestone.endorsements++;
        
        emit MilestoneEndorsed(milestoneId, msg.sender);
        
        // Auto-verify if threshold reached
        if (milestone.endorsements >= ENDORSEMENT_THRESHOLD) {
            verifyMilestone(milestoneId, 100);
        }
    }

    /**
     * @notice Challenge a milestone (triggers community audit)
     * @param milestoneId Milestone to challenge
     */
    function challengeMilestone(uint256 milestoneId) external {
        Milestone storage milestone = milestones[milestoneId];
        
        if (hasChallenged[milestoneId][msg.sender]) revert AlreadyChallenged();
        if (milestone.status == MilestoneStatus.Rejected) revert InvalidStatus();
        
        hasChallenged[milestoneId][msg.sender] = true;
        milestone.challenges++;
        
        emit MilestoneChallenged(milestoneId, msg.sender);
        
        // Mark as challenged if threshold reached
        if (milestone.challenges >= CHALLENGE_THRESHOLD) {
            milestone.status = MilestoneStatus.Challenged;
        }
    }

    /**
     * @notice Verify milestone with off-chain signature
     * @param milestoneId Milestone to verify
     * @param xpMultiplier XP multiplier
     * @param signature Oracle signature
     */
    function verifyWithSignature(
        uint256 milestoneId,
        uint256 xpMultiplier,
        bytes memory signature
    ) external {
        Milestone storage milestone = milestones[milestoneId];
        if (milestone.status != MilestoneStatus.Pending) revert InvalidStatus();
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(milestoneId, xpMultiplier));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        
        if (!isOracle[signer] && signer != owner()) revert NotAuthorized();
        
        // Calculate XP
        uint256 baseXP = baseXPRewards[milestone.milestoneType];
        uint256 xpAwarded = (baseXP * xpMultiplier) / 100;
        
        // Update milestone
        milestone.status = MilestoneStatus.Verified;
        milestone.xpAwarded = xpAwarded;
        milestone.verifiedAt = block.timestamp;
        milestone.verifier = signer;
        
        // Award XP
        skillNFT.addXP(milestone.skillNftId, xpAwarded);
        
        emit MilestoneVerified(milestoneId, xpAwarded);
    }

    // Admin functions
    function addOracle(address oracle) external onlyOwner {
        isOracle[oracle] = true;
        emit OracleAdded(oracle);
    }

    function removeOracle(address oracle) external onlyOwner {
        isOracle[oracle] = false;
        emit OracleRemoved(oracle);
    }

    function setBaseXPReward(MilestoneType milestoneType, uint256 xp) external onlyOwner {
        baseXPRewards[milestoneType] = xp;
    }

    // View functions
    function getMilestone(uint256 milestoneId) external view returns (Milestone memory) {
        return milestones[milestoneId];
    }

    function getBuilderMilestones(address builder) external view returns (uint256[] memory) {
        return builderMilestones[builder];
    }

    function totalMilestones() external view returns (uint256) {
        return _milestoneIdCounter;
    }
}
