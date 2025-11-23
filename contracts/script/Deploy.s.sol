// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SkillNFT.sol";
import "../src/MilestoneVerifier.sol";
import "../src/ReputationMarket.sol";

/**
 * @title Deploy
 * @notice Deployment script for CosmicCreator contracts
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy SkillNFT
        console.log("Deploying SkillNFT...");
        SkillNFT skillNFT = new SkillNFT();
        console.log("SkillNFT deployed at:", address(skillNFT));

        // 2. Deploy MilestoneVerifier
        console.log("Deploying MilestoneVerifier...");
        MilestoneVerifier milestoneVerifier = new MilestoneVerifier(address(skillNFT));
        console.log("MilestoneVerifier deployed at:", address(milestoneVerifier));

        // 3. Set MilestoneVerifier in SkillNFT
        console.log("Setting MilestoneVerifier in SkillNFT...");
        skillNFT.setMilestoneVerifier(address(milestoneVerifier));

        // 4. Deploy ReputationMarket
        console.log("Deploying ReputationMarket...");
        ReputationMarket reputationMarket = new ReputationMarket(
            address(skillNFT),
            address(milestoneVerifier)
        );
        console.log("ReputationMarket deployed at:", address(reputationMarket));

        vm.stopBroadcast();

        // Save deployment addresses
        console.log("\n=== Deployment Complete ===");
        console.log("SkillNFT:", address(skillNFT));
        console.log("MilestoneVerifier:", address(milestoneVerifier));
        console.log("ReputationMarket:", address(reputationMarket));
        console.log("===========================\n");
    }
}
