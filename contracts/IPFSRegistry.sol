// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.19;

contract IPFSRegistry {
    // Mapping from an address to a list of Pinata IPFS CIDs 
    mapping(address => string[]) public ipfsCIDs;

    // Function to add a new CID for the sender
    function addCID(string memory newCID) public {
        ipfsCIDs[msg.sender].push(newCID);
    }

    // Function to get all CIDs for an address
    function getCIDs(address addr) public view returns (string[] memory) {
        return ipfsCIDs[addr];
    }
}