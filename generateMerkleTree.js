const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const fs = require('fs');

const addresses = [
    '0xc0768A60Cf71341C942930E077b7EDf390c3E4c7',
    '0xbE41e1Dd8C970AC40E8aB284CDd581e3b35Da51C',
    '0xe6bcaacdca149114446612255cc4721bf7261b5b',
];

const leaves = addresses.map(addr => keccak256(addr));
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

let proofs = {};
addresses.forEach(address => {
    const leaf = keccak256(address);
    const proof = tree.getHexProof(leaf);
    proofs[address.toLowerCase()] = proof;
});

fs.writeFileSync('./data/merkleProofs.json', JSON.stringify(proofs));
