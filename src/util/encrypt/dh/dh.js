const crypto = require('crypto');

/*
 * Generate a Diffie Hellman object with randomized exponents 
 *
 * Diffie Hellman values were generated using the modp14 group 
 * see: https://www.rfc-editor.org/rfc/rfc3526.txt
 */
const generateDiffieHellmanGroup = () => {
    const dhg = crypto.createDiffieHellmanGroup('modp14');
    dhg.generateKeys();
    return dhg;
}

/*
 * Generate the hexidecimal representation of Diffie Hellman public key for 
 * transmission to a server
 */
const generateDiffieHellmanKey = (dhg) => {
    return dhg.getPublicKey('hex');
}

/*
 * Convert a received hexidecimal Diffie Hellman public key into the symmetric
 * shared secret in hexidecimal representation.
 */
const generateDiffieHellmanSecret = (dhg, key) => {
    const keyBuffer = Buffer.from(key, 'hex');
    const secret = dhg.computeSecret(keyBuffer);
    return secret.toString('hex');
}

module.exports = {
    generateDiffieHellmanGroup,
    generateDiffieHellmanKey,
    generateDiffieHellmanSecret,
}