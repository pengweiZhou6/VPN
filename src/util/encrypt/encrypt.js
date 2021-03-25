const assert = require('assert').strict;
const { decryptAes, encryptAes } = require('./aes/aes');
const { generateDiffieHellmanGroup, generateDiffieHellmanKey, generateDiffieHellmanSecret } = require('./dh/dh');

/*
 * Run a sample print-out test to verify basic behavior of decryptAes and encryptAes
 */
const encryptionTestDriver = () => {
    const key = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ];
    const pt = "This is a sample encryption plaintext!";
    const e = encryptAes(pt, key);
    const d = decryptAes(e, key);

    assert(pt != e);
    assert(pt == d);

    console.log(`AES Tests have passed: "${pt}" was encrypted to "${e}" and then back to "${d}"`);
}

/*
 * Run an Alice/Bob DHKE test
 */
const diffieHellmanTestDriver = () => {
    const alice = generateDiffieHellmanGroup();
    const alicePublicKey = generateDiffieHellmanKey(alice);

    const bob = generateDiffieHellmanGroup();
    const bobPublicKey = generateDiffieHellmanKey(bob);

    assert(alicePublicKey != bobPublicKey);

    const aliceSecretKey = generateDiffieHellmanSecret(alice, bobPublicKey);
    const bobSecretKey = generateDiffieHellmanSecret(bob, alicePublicKey);

    assert(aliceSecretKey === bobSecretKey);

    console.log(`DH Tests have passed: Alice generated a secret key: "${aliceSecretKey.substring(0,5)}...". Bob generated a secret key: "${bobSecretKey.substring(0,5)}..."`);
}


module.exports = {
    encryptionTestDriver,
    diffieHellmanTestDriver,
}
