import proofs from '../../data/merkleProofs.json';

export default function handler(req, res) {
    const { address } = req.query;
    
    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    const proof = proofs[address.toLowerCase()];
    if (proof) {
        res.status(200).json({ proof });
    } else {
        res.status(404).json({ error: 'Proof not found for the given address' });
    }
}
