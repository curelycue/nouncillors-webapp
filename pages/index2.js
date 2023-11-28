import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import RelayerService from '../components/RelayerService'; // Import the RelayerService

const MintForm = () => {
  const [userAddress, setUserAddress] = useState('');
  const [merkleProof, setMerkleProof] = useState([]);
  const [loadingProof, setLoadingProof] = useState(false);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);
        fetchMerkleProof(address);
      } else {
        console.error('MetaMask is not installed!');
      }
    } catch (error) {
      console.error('An error occurred during wallet connection:', error);
    }
  };

  const fetchMerkleProof = async (address) => {
    setLoadingProof(true);
    try {
      const response = await fetch(`/api/getProof?address=${address}`);
      const data = await response.json();
      if (data && data.proof) {
        setMerkleProof(data.proof);
      } else {
        console.error('No proof found for this address');
      }
    } catch (error) {
      console.error('Error fetching Merkle proof:', error);
    } finally {
      setLoadingProof(false);
    }
  };

    const mintToken = async () => {
    try {
      // Connect to MetaMask
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      // NouncillorsToken contract address and ABI
      const contractAddress = 'YOUR_NouncillorsToken_CONTRACT_ADDRESS';
      const contractABI = 'YOUR_CONTRACT_ABI';
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Data for the meta-transaction
      const nonce = await contract.nonces(await signer.getAddress());
      const forwarderAddress = '0xa2f0732A65D9B475df43cb5C84B41e09C2Ecef6b'; // Your forwarder address
      const data = contract.interface.encodeFunctionData('mint', [merkleProof]);
      const request = {
        from: await signer.getAddress(),
        to: contractAddress,
        value: 0,
        gas: 1000000, // Estimate this value
        nonce,
        deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        data,
      };

      // Sign the transaction
      const signature = await signer._signTypedData(
        // Domain
        {
          name: 'NouncillorsToken',
          version: '1',
          chainId: await signer.getChainId(),
          verifyingContract: forwarderAddress,
        },
        // Types
        {
          ForwardRequestData: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "gas", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint48" },
            { name: "data", type: "bytes" },
          ],
        },
        // Value
        request,
      );

      // Send the signed transaction to the Defender Relayer using RelayerService
      const relayedResponse = await RelayerService.relayTransaction({ ...request, signature });
      console.log('Transaction relayed response:', relayedResponse);
    } catch (error) {
      console.error('Minting failed:', error);
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <div>
      <button onClick={mintToken} disabled={loadingProof || merkleProof.length === 0}>
        Mint Nouncillor Token
      </button>
      {loadingProof && <p>Loading your Merkle proof...</p>}
      {userAddress && <p>Connected as: {userAddress}</p>}
    </div>
  );
};

export default MintForm;