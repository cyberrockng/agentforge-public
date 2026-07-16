// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ForgeAnchor
/// @notice Minimal append-only provenance anchor for AgentForge birth certificates and service evidence.
/// @dev Stores only bytes32 commitments. Human-readable certificate metadata remains off-chain.
contract ForgeAnchor {
    address public immutable owner;

    struct AnchorRecord {
        bytes32 subjectHash;
        bytes32 evidenceHash;
        bytes32 metadataHash;
        address issuer;
        uint64 anchoredAt;
    }

    mapping(bytes32 anchorId => AnchorRecord record) private records;
    mapping(bytes32 anchorId => bool exists) private recordExists;

    event AnchorWritten(
        bytes32 indexed anchorId,
        bytes32 indexed subjectHash,
        bytes32 indexed evidenceHash,
        bytes32 metadataHash,
        address issuer,
        uint64 anchoredAt
    );

    error NotOwner(address caller);
    error ZeroAddress();
    error ZeroBytes32(string field);
    error AnchorAlreadyExists(bytes32 anchorId);

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner(msg.sender);
        }
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert ZeroAddress();
        }

        owner = initialOwner;
    }

    function anchor(
        bytes32 anchorId,
        bytes32 subjectHash,
        bytes32 evidenceHash,
        bytes32 metadataHash
    ) external onlyOwner returns (uint64 anchoredAt) {
        if (anchorId == bytes32(0)) {
            revert ZeroBytes32("anchorId");
        }
        if (subjectHash == bytes32(0)) {
            revert ZeroBytes32("subjectHash");
        }
        if (evidenceHash == bytes32(0)) {
            revert ZeroBytes32("evidenceHash");
        }
        if (metadataHash == bytes32(0)) {
            revert ZeroBytes32("metadataHash");
        }
        if (recordExists[anchorId]) {
            revert AnchorAlreadyExists(anchorId);
        }

        anchoredAt = uint64(block.timestamp);
        records[anchorId] = AnchorRecord({
            subjectHash: subjectHash,
            evidenceHash: evidenceHash,
            metadataHash: metadataHash,
            issuer: msg.sender,
            anchoredAt: anchoredAt
        });
        recordExists[anchorId] = true;

        emit AnchorWritten(anchorId, subjectHash, evidenceHash, metadataHash, msg.sender, anchoredAt);
    }

    function hasAnchor(bytes32 anchorId) external view returns (bool) {
        return recordExists[anchorId];
    }

    function getAnchor(bytes32 anchorId) external view returns (AnchorRecord memory) {
        return records[anchorId];
    }
}
