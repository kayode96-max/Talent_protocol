// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SkillNFT.sol";
import "../src/MilestoneVerifier.sol";
import "../src/ReputationMarket.sol";

contract CosmicCreatorTest is Test {
    SkillNFT public skillNFT;
    MilestoneVerifier public milestoneVerifier;
    ReputationMarket public reputationMarket;

    address public owner = address(1);
    address public builder1 = address(2);
    address public builder2 = address(3);
    address public oracle = address(4);

    function setUp() public {
        vm.startPrank(owner);

        // Deploy contracts
        skillNFT = new SkillNFT();
        milestoneVerifier = new MilestoneVerifier(address(skillNFT));
        skillNFT.setMilestoneVerifier(address(milestoneVerifier));
        reputationMarket = new ReputationMarket(address(skillNFT), address(milestoneVerifier));

        // Setup oracle
        milestoneVerifier.addOracle(oracle);

        vm.stopPrank();
    }

    function testMintSkillNFT() public {
        vm.startPrank(builder1);

        uint256 tokenId = skillNFT.mint(builder1, SkillNFT.SkillCategory.SolidityDev);

        assertEq(skillNFT.ownerOf(tokenId), builder1);
        
        SkillNFT.Skill memory skill = skillNFT.getSkill(tokenId);
        assertEq(uint256(skill.category), uint256(SkillNFT.SkillCategory.SolidityDev));
        assertEq(skill.level, 1);
        assertEq(skill.xp, 0);

        vm.stopPrank();
    }

    function testCreateMilestone() public {
        vm.startPrank(builder1);

        // Mint skill NFT first
        uint256 tokenId = skillNFT.mint(builder1, SkillNFT.SkillCategory.SolidityDev);

        // Create milestone
        uint256 milestoneId = milestoneVerifier.createMilestone(
            tokenId,
            MilestoneVerifier.MilestoneType.GitHubCommit,
            "Fixed critical bug",
            "Fixed reentrancy vulnerability in smart contract",
            "https://github.com/user/repo/commit/abc123"
        );

        MilestoneVerifier.Milestone memory milestone = milestoneVerifier.getMilestone(milestoneId);
        assertEq(milestone.builder, builder1);
        assertEq(milestone.skillNftId, tokenId);
        assertEq(uint256(milestone.status), uint256(MilestoneVerifier.MilestoneStatus.Pending));

        vm.stopPrank();
    }

    function testVerifyMilestoneAndGainXP() public {
        vm.startPrank(builder1);

        // Mint skill NFT
        uint256 tokenId = skillNFT.mint(builder1, SkillNFT.SkillCategory.SolidityDev);

        // Create milestone
        uint256 milestoneId = milestoneVerifier.createMilestone(
            tokenId,
            MilestoneVerifier.MilestoneType.HackathonProject,
            "Won ETHGlobal Hackathon",
            "Built DeFi protocol",
            "https://ethglobal.com/showcase/project"
        );

        vm.stopPrank();

        // Verify milestone as oracle
        vm.prank(oracle);
        milestoneVerifier.verifyMilestone(milestoneId, 100);

        // Check milestone verified
        MilestoneVerifier.Milestone memory milestone = milestoneVerifier.getMilestone(milestoneId);
        assertEq(uint256(milestone.status), uint256(MilestoneVerifier.MilestoneStatus.Verified));
        assertGt(milestone.xpAwarded, 0);

        // Check skill NFT gained XP
        SkillNFT.Skill memory skill = skillNFT.getSkill(tokenId);
        assertGt(skill.xp, 0);
        assertEq(skill.totalMilestones, 1);
    }

    function testSkillLevelUp() public {
        vm.startPrank(builder1);

        // Mint skill NFT
        uint256 tokenId = skillNFT.mint(builder1, SkillNFT.SkillCategory.SolidityDev);

        vm.stopPrank();

        // Add enough XP to level up multiple times
        vm.startPrank(address(milestoneVerifier));
        skillNFT.addXP(tokenId, 1000);
        vm.stopPrank();

        SkillNFT.Skill memory skill = skillNFT.getSkill(tokenId);
        assertGt(skill.level, 1);
    }

    function testEndorseMilestone() public {
        vm.startPrank(builder1);

        uint256 tokenId = skillNFT.mint(builder1, SkillNFT.SkillCategory.SolidityDev);
        uint256 milestoneId = milestoneVerifier.createMilestone(
            tokenId,
            MilestoneVerifier.MilestoneType.FeatureShipped,
            "Shipped feature",
            "Implemented new feature",
            "https://github.com/user/repo"
        );

        vm.stopPrank();

        // Endorse from another user
        vm.prank(builder2);
        milestoneVerifier.endorseMilestone(milestoneId);

        MilestoneVerifier.Milestone memory milestone = milestoneVerifier.getMilestone(milestoneId);
        assertEq(milestone.endorsements, 1);
    }

    function testTipBuilder() public {
        vm.deal(builder2, 1 ether);

        vm.prank(builder2);
        reputationMarket.tipBuilder{value: 0.1 ether}(builder1);

        uint256 reputation = reputationMarket.getReputationScore(builder1);
        assertGt(reputation, 0);
    }

    function testStakeOnSkill() public {
        vm.startPrank(builder1);
        uint256 tokenId = skillNFT.mint(builder1, SkillNFT.SkillCategory.SolidityDev);
        vm.stopPrank();

        vm.deal(builder2, 1 ether);
        vm.prank(builder2);
        reputationMarket.stakeOnSkill{value: 0.5 ether}(tokenId);

        assertEq(reputationMarket.totalStaked(builder2), 0.5 ether);
        assertEq(reputationMarket.nftTotalStaked(tokenId), 0.5 ether);
    }

    function testRarityUpgrade() public {
        vm.startPrank(builder1);
        uint256 tokenId = skillNFT.mint(builder1, SkillNFT.SkillCategory.SolidityDev);
        vm.stopPrank();

        // Add XP to reach level 20 (Uncommon)
        vm.startPrank(address(milestoneVerifier));
        skillNFT.addXP(tokenId, 5000);
        vm.stopPrank();

        SkillNFT.Skill memory skill = skillNFT.getSkill(tokenId);
        assertGt(uint256(skill.rarity), uint256(SkillNFT.Rarity.Common));
    }

    function testCannotEndorseOwnMilestone() public {
        vm.startPrank(builder1);

        uint256 tokenId = skillNFT.mint(builder1, SkillNFT.SkillCategory.SolidityDev);
        uint256 milestoneId = milestoneVerifier.createMilestone(
            tokenId,
            MilestoneVerifier.MilestoneType.GitHubCommit,
            "Commit",
            "Description",
            "https://github.com"
        );

        vm.expectRevert(MilestoneVerifier.NotAuthorized.selector);
        milestoneVerifier.endorseMilestone(milestoneId);

        vm.stopPrank();
    }

    function testOnlyOracleCanVerify() public {
        vm.startPrank(builder1);

        uint256 tokenId = skillNFT.mint(builder1, SkillNFT.SkillCategory.SolidityDev);
        uint256 milestoneId = milestoneVerifier.createMilestone(
            tokenId,
            MilestoneVerifier.MilestoneType.GitHubCommit,
            "Commit",
            "Description",
            "https://github.com"
        );

        vm.expectRevert(MilestoneVerifier.NotAuthorized.selector);
        milestoneVerifier.verifyMilestone(milestoneId, 100);

        vm.stopPrank();
    }
}
