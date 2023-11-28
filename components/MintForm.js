import { ethers } from "ethers";
import React, { useState } from 'react';
import RelayerService from './RelayerService'; // Import the RelayerService

const MintForm = () => {
  const [userAddress, setUserAddress] = useState('');
  const [merkleProof, setMerkleProof] = useState([]);
  const [loading, setLoading] = useState(false);

   const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        //await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);
        fetchMerkleProof(address); // Call fetchMerkleProof after getting the address
      } else {
        console.error("MetaMask is not installed!");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    };
  };
   
  const fetchMerkleProof = async (address) =>  {
            setLoading(true);
            try {
                const response = await fetch(`/api/getProof?address=${address}`);
                const data = await response.json();
                if (data.proof) {
                    setMerkleProof(data.proof);
                } else {
                    console.error('No Merkle proof found for this address');
                }
            } catch (error) {
                console.error('Error fetching Merkle proof:', error);
            } finally {
                setLoading(false);
            }
        };




  const mintToken = async () => {
  setLoading(true);
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    // Encode the mint function call
    const data = contract.interface.encodeFunctionData('mint', [merkleProof]);

    // Create the meta-transaction request
    const request = {
      from: await signer.getAddress(),
      to: contractAddress,
      value: 0,
      gas: 1000000, // Estimate this value
      nonce: await contract.nonces(await signer.getAddress()),
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

    // Send the signed transaction to the Defender Relayer
    const relayedResponse = await RelayerService.relayTransaction({ ...request, signature });
    console.log('Transaction relayed response:', relayedResponse);
  } catch (error) {
    console.error('Minting failed:', error);
  } finally {
    setLoading(false);
  }
};

  return (
    <div>
      {userAddress ? (
        <div>
          <p>Connected as: {userAddress}</p>
          <button onClick={mintToken} disabled={loading}>
            {loading ? 'Minting...' : 'Mint Nouncillor Token'}
          </button>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
};

export default MintForm;
