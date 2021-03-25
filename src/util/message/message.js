const assert = require('assert').strict;

// Set a delimiter to separate contents of the authentication message
const delimiter = '*';

/*
 * Assemble an authentication message by passing in a timestamp and generated Diffie-Hellman key
 */
const buildAuthMessage = (timestamp, diffieHellmanKey) => {
    return `${timestamp}${delimiter}${diffieHellmanKey}`;
}

/*
 * Extract a Diffie Hellman key from the authentication message
 */ 
const getAuthDH = (message) => {
    return message.split(delimiter)[1];
}

/*
 * Extract a timestamp from the authentication message
 */
const getAuthTimestamp = (message) => {
    return message.split(delimiter)[0];
}

/*
 * Run a message stringify test
 */
const messageTestDriver = () => {
    const sampleTimestamp = 1001;
    const sampleKey = 'bc3cb3f366a5f9fdae538a193e995167765438ce7d35c24f318bb5fe53eaa4d81a1fc6b1417c69a4d21e5297498b14071527e541430b713e685cb3182166a5efdbb2fd71b1cfc5cdcbe6b5cf8fbada147c91929cacc1b19a60b85293e7fa409ad6ceed337efc9a9201714139baaa66175e2ec7b34c19130742628bf9db4f80b63dbdcf1d035d65b5156f012fb387fd7791cded94aa16cbd1306ea2a08d90cd4fbbb27f7247060b8409d1dd7b7c0e92814c17ef0adade5e7effd997b6d0beae3cdcb36b4770cf9956f44a4f55c05380f08241625b3950b0eb4b48f7f514f13ba68d99e5fdfc5e92e51a4c0ed9bbf511f6b35d459f025509b590aebb05a01365a5';

    const am = buildAuthMessage(sampleTimestamp, sampleKey);

    assert(getAuthDH(am) == sampleKey);
    assert(getAuthTimestamp(am) == 1001);

    const invalidMessage = '12341234';
    const invalidMessage2 = 'abc123*abc123';

    assert(validateAuthMessage(am) == true);
    assert(validateAuthMessage(invalidMessage) == false);
    assert(validateAuthMessage(invalidMessage2) == false);

    console.log("Message Tests have passed");
}

const validateAuthMessage = (message) => {
    const re = /^[0-9]+\*[0-9a-zA-Z]+$/;
    return re.test(message);
}

module.exports = {
    messageTestDriver,
    buildAuthMessage,
    getAuthDH,
    getAuthTimestamp,
    validateAuthMessage,
}