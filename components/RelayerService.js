import axios from 'axios';

const RELAYER_API_ENDPOINT = 'https://defender.openzeppelin.com/autotasks/dsdsfff';

const RelayerService = {
  async relayTransaction(signedTxData) {
    try {
      // Send the signed transaction data to the Defender Relayer
      const response = await axios.post(RELAYER_API_ENDPOINT, signedTxData);

      // Handle and return the response
      console.log('Relayer response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error relaying transaction:', error);
      throw error; // Re-throw the error for handling it in the calling function
    }
  }
};

export default RelayerService;
