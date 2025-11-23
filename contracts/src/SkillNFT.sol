// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SkillNFT
 * @notice Dynamic NFTs representing builder skills that evolve based on achievements
 * @dev Each NFT has a level system, XP, rarity traits, and SVG-based on-chain metadata
 */
contract SkillNFT is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;

    // Skill categories
    enum SkillCategory {
        SolidityDev,
        FrontendDev,
        BackendDev,
        AIEngineer,
        DataScience,
        Designer,
        ProductManager,
        Auditor
    }

    // Rarity tiers
    enum Rarity {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }

    // Skill data structure
    struct Skill {
        SkillCategory category;
        uint256 level;
        uint256 xp;
        uint256 totalMilestones;
        Rarity rarity;
        uint256 createdAt;
        uint256 lastUpdated;
    }

    // State variables
    uint256 private _tokenIdCounter;
    mapping(uint256 => Skill) public skills;
    mapping(address => uint256[]) public userSkills;
    mapping(uint256 => uint256) public xpToNextLevel;
    
    address public milestoneVerifier;
    
    // Events
    event SkillMinted(address indexed owner, uint256 indexed tokenId, SkillCategory category);
    event SkillLevelUp(uint256 indexed tokenId, uint256 newLevel);
    event XPGained(uint256 indexed tokenId, uint256 xpGained, uint256 totalXP);
    event RarityUpgraded(uint256 indexed tokenId, Rarity newRarity);

    // Errors
    error NotTokenOwner();
    error NotAuthorized();
    error InvalidSkillId();
    error MaxLevelReached();

    constructor() ERC721("CosmicCreator Skill", "SKILL") Ownable(msg.sender) {
        // Initialize XP requirements for each level
        _initializeXPRequirements();
    }

    /**
     * @notice Initialize XP requirements for levels 1-100
     */
    function _initializeXPRequirements() private {
        for (uint256 i = 1; i <= 100; i++) {
            // Exponential XP curve: 100 * level^1.5
            xpToNextLevel[i] = 100 * i * i / 10;
        }
    }

    /**
     * @notice Mint a new Skill NFT
     * @param to Address to mint the NFT to
     * @param category Skill category
     * @return tokenId The minted token ID
     */
    function mint(address to, SkillCategory category) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        
        skills[tokenId] = Skill({
            category: category,
            level: 1,
            xp: 0,
            totalMilestones: 0,
            rarity: Rarity.Common,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });
        
        userSkills[to].push(tokenId);
        
        _safeMint(to, tokenId);
        _updateTokenURI(tokenId);
        
        emit SkillMinted(to, tokenId, category);
        
        return tokenId;
    }

    /**
     * @notice Add XP to a skill NFT (only callable by MilestoneVerifier)
     * @param tokenId The token ID
     * @param xpAmount Amount of XP to add
     */
    function addXP(uint256 tokenId, uint256 xpAmount) external {
        if (msg.sender != milestoneVerifier) revert NotAuthorized();
        if (_ownerOf(tokenId) == address(0)) revert InvalidSkillId();
        
        Skill storage skill = skills[tokenId];
        skill.xp += xpAmount;
        skill.totalMilestones++;
        skill.lastUpdated = block.timestamp;
        
        emit XPGained(tokenId, xpAmount, skill.xp);
        
        // Check for level up
        _checkLevelUp(tokenId);
        
        // Check for rarity upgrade
        _checkRarityUpgrade(tokenId);
        
        // Update metadata
        _updateTokenURI(tokenId);
    }

    /**
     * @notice Check if skill should level up
     */
    function _checkLevelUp(uint256 tokenId) private {
        Skill storage skill = skills[tokenId];
        
        while (skill.level < 100 && skill.xp >= xpToNextLevel[skill.level]) {
            skill.xp -= xpToNextLevel[skill.level];
            skill.level++;
            emit SkillLevelUp(tokenId, skill.level);
        }
    }

    /**
     * @notice Check if skill rarity should upgrade based on level
     */
    function _checkRarityUpgrade(uint256 tokenId) private {
        Skill storage skill = skills[tokenId];
        Rarity newRarity = skill.rarity;
        
        if (skill.level >= 80 && skill.rarity < Rarity.Legendary) {
            newRarity = Rarity.Legendary;
        } else if (skill.level >= 60 && skill.rarity < Rarity.Epic) {
            newRarity = Rarity.Epic;
        } else if (skill.level >= 40 && skill.rarity < Rarity.Rare) {
            newRarity = Rarity.Rare;
        } else if (skill.level >= 20 && skill.rarity < Rarity.Uncommon) {
            newRarity = Rarity.Uncommon;
        }
        
        if (newRarity != skill.rarity) {
            skill.rarity = newRarity;
            emit RarityUpgraded(tokenId, newRarity);
        }
    }

    /**
     * @notice Generate SVG-based on-chain metadata
     */
    function _generateSVG(uint256 tokenId) private view returns (string memory) {
        Skill memory skill = skills[tokenId];
        
        string memory categoryStr = _getCategoryString(skill.category);
        string memory rarityStr = _getRarityString(skill.rarity);
        string memory rarityColor = _getRarityColor(skill.rarity);
        
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)">',
            '<defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:', rarityColor, ';stop-opacity:1"/>',
            '<stop offset="100%" style="stop-color:#fff;stop-opacity:0.3"/></linearGradient></defs>',
            '<rect width="400" height="600" fill="url(#grad)" rx="20"/>',
            '<text x="200" y="80" font-family="Arial" font-size="32" font-weight="bold" fill="white" text-anchor="middle">',
            categoryStr, '</text>',
            '<text x="200" y="140" font-family="Arial" font-size="24" fill="white" text-anchor="middle">',
            'Level ', skill.level.toString(), '</text>',
            '<rect x="50" y="180" width="300" height="30" rx="15" fill="rgba(255,255,255,0.3)"/>',
            '<rect x="50" y="180" width="', _getProgressWidth(skill).toString(), '" height="30" rx="15" fill="white"/>',
            '<text x="200" y="260" font-family="Arial" font-size="20" fill="white" text-anchor="middle">',
            'XP: ', skill.xp.toString(), ' / ', xpToNextLevel[skill.level].toString(), '</text>',
            '<text x="200" y="320" font-family="Arial" font-size="28" font-weight="bold" fill="', rarityColor, '" text-anchor="middle">',
            rarityStr, '</text>',
            '<text x="200" y="380" font-family="Arial" font-size="18" fill="white" text-anchor="middle">',
            'Milestones: ', skill.totalMilestones.toString(), '</text>',
            '<circle cx="200" cy="480" r="60" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="4"/>',
            '<text x="200" y="500" font-family="Arial" font-size="48" font-weight="bold" fill="white" text-anchor="middle">',
            skill.level.toString(), '</text>',
            '</svg>'
        ));
    }

    /**
     * @notice Get progress bar width based on current XP
     */
    function _getProgressWidth(Skill memory skill) private view returns (uint256) {
        if (skill.level >= 100) return 300;
        uint256 required = xpToNextLevel[skill.level];
        if (required == 0) return 0;
        return (skill.xp * 300) / required;
    }

    /**
     * @notice Update token URI with new metadata
     */
    function _updateTokenURI(uint256 tokenId) private {
        Skill memory skill = skills[tokenId];
        
        string memory svg = _generateSVG(tokenId);
        string memory svgBase64 = Base64.encode(bytes(svg));
        
        string memory json = string(abi.encodePacked(
            '{"name":"', _getCategoryString(skill.category), ' Skill #', tokenId.toString(), '",',
            '"description":"A dynamic skill NFT that evolves with builder achievements on CosmicCreator",',
            '"image":"data:image/svg+xml;base64,', svgBase64, '",',
            '"attributes":[',
            '{"trait_type":"Category","value":"', _getCategoryString(skill.category), '"},',
            '{"trait_type":"Level","value":', skill.level.toString(), '},',
            '{"trait_type":"XP","value":', skill.xp.toString(), '},',
            '{"trait_type":"Rarity","value":"', _getRarityString(skill.rarity), '"},',
            '{"trait_type":"Milestones","value":', skill.totalMilestones.toString(), '},',
            '{"trait_type":"Created","value":', skill.createdAt.toString(), '}',
            ']}'
        ));
        
        string memory uri = string(abi.encodePacked(
            'data:application/json;base64,',
            Base64.encode(bytes(json))
        ));
        
        _setTokenURI(tokenId, uri);
    }

    // Helper functions
    function _getCategoryString(SkillCategory category) private pure returns (string memory) {
        if (category == SkillCategory.SolidityDev) return "Solidity Dev";
        if (category == SkillCategory.FrontendDev) return "Frontend Dev";
        if (category == SkillCategory.BackendDev) return "Backend Dev";
        if (category == SkillCategory.AIEngineer) return "AI Engineer";
        if (category == SkillCategory.DataScience) return "Data Science";
        if (category == SkillCategory.Designer) return "Designer";
        if (category == SkillCategory.ProductManager) return "Product Manager";
        return "Auditor";
    }

    function _getRarityString(Rarity rarity) private pure returns (string memory) {
        if (rarity == Rarity.Common) return "Common";
        if (rarity == Rarity.Uncommon) return "Uncommon";
        if (rarity == Rarity.Rare) return "Rare";
        if (rarity == Rarity.Epic) return "Epic";
        return "Legendary";
    }

    function _getRarityColor(Rarity rarity) private pure returns (string memory) {
        if (rarity == Rarity.Common) return "#9ca3af";
        if (rarity == Rarity.Uncommon) return "#22c55e";
        if (rarity == Rarity.Rare) return "#3b82f6";
        if (rarity == Rarity.Epic) return "#a855f7";
        return "#f59e0b";
    }

    // Admin functions
    function setMilestoneVerifier(address _verifier) external onlyOwner {
        milestoneVerifier = _verifier;
    }

    // View functions
    function getUserSkills(address user) external view returns (uint256[] memory) {
        return userSkills[user];
    }

    function getSkill(uint256 tokenId) external view returns (Skill memory) {
        return skills[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
