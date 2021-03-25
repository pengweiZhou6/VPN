const aesjs = require('aes-js');

/* 
 * Set an IV for AES (CBC mode) - in stronger security implementations it
 * may be more effective to seed a sequence, but we have chosen to prioritize
 * the connection time in this implementation
 */ 
const iv = [ 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 ];

/*
 * Executes AES encryption in CBC mode. This function pads with '%' to align to 16 bit blocks.
 *
 * Developed as per recommended instructions in the aes-js NPM package
 * See: https://www.npmjs.com/package/aes-js
 * 
 * Input a UTF-8 plaintext of variable length
 * Returns a hex-represented ciphertext sequence
 */ 
const encryptAes = (plaintext, key) => {
    var inputText = plaintext;

    // Sanitize text input to a 16-byte string and convert to a byte sequence
    const paddingRequired = 16 - inputText.length % 16;
    if (paddingRequired != 0) {
        for (i = 0; i < paddingRequired; i++) {
            inputText += "%";
        }
    }
    const inputTextBytes = aesjs.utils.utf8.toBytes(inputText);

    // Perform encrypt
    const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    const encryptedBytes = aesCbc.encrypt(inputTextBytes);

    // Per maintainer instructions, this should be converted to hex for storage
    const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);

    return encryptedHex;
}

/*
 * Executes AES decryption in CBC mode. This function removes ALL '%' to reverse
 * alignment with 16 bit blocks requirement for AES.
 *
 * Developed as per recommended instructions in the aes-js NPM package
 * See: https://www.npmjs.com/package/aes-js
 * 
 * Input a hex-respresented ciphertext sequence
 * Returns a UTF-8 plaintext sequence of variable length
 */ 
const decryptAes = (ciphertext, key) => {
    // Perform hex to bytes conversion
    const encryptedBytes = aesjs.utils.hex.toBytes(ciphertext);

    // Perform decrypt and conversion to UTF-8
    const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    const decryptedBytes = aesCbc.decrypt(encryptedBytes);
    const outputText = aesjs.utils.utf8.fromBytes(decryptedBytes);

    return outputText.replaceAll('%', '');
}

module.exports = {
    encryptAes,
    decryptAes,
}
