import { ethers } from "ethers";
import React, { useState } from 'react';
import RelayerService from './RelayerService'; // Import the RelayerService
import NouncillorsToken from '../contracts/NouncillorsToken.json';

const MintForm = () => {
  const [userAddress, setUserAddress] = useState('');
  const [merkleProof, setMerkleProof] = useState([]);
  const [loading, setLoading] = useState(false);

   const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
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
    const forwarderAddress = '0x0Fe84a13dbAb8A9Acf2dB3B88a6f91c30C5F5df8';
    const nouncillorsTokenAddress = '0x9dFDb199b40D10360f35a119545BC8956a582cE8';

    // Create a new ethers provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    // Connect the signer
    const signer = await provider.getSigner();
    await console.log("The signer is:", signer);

    // Fetch the signer's address and nonce
    const address = await signer.getAddress();
    const nonce = await signer.getNonce();
    console.log("The signer addressis", address,", and nonce is ", nonce);


    const { abi: nouncillorsTokenABI } = NouncillorsToken;
    const contract = new ethers.Contract(nouncillorsTokenAddress, nouncillorsTokenABI, signer);

    // Encode the mint function call
    const data = contract.interface.encodeFunctionData('mint', [merkleProof]);
    console.log("The encoded data is: ", data);

    // Automatically estimates gas
    const estimatedGas = await signer.estimateGas({ /* transaction details here */ });
    // Convert BigInt to String
    const gasLimitString = estimatedGas.toString();

     // Create the meta-transaction request
    const request = {
      from: address,
      to: nouncillorsTokenAddress,
      value: 0,
      gas: gasLimitString,
      nonce: nonce,
      deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      data, // Your transaction data
    };
    console.log("This the request", request);
    // Sign the transaction
    const signature = await signer.signTypedData(
      // Domain
      {
        name: 'NouncillorsToken',
        version: '1',
        chainId: await provider.getNetwork().chainId,
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
      request
    );
    console.log("Transaction signed succesfully");

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
