const { ipcRenderer } = require('electron');
const stringToAesKey = require('../../util/encrypt/aes/string-to-aes-key');
const { dialog } = require('electron').remote;

const submitInput = () => {
    const inputPort = document.getElementById("input-port").value;
    const inputKey = document.getElementById("input-key").value;

    const validatedInputs = validatePort(inputPort) && validateKey(inputKey)

    if (validatedInputs) {
        // These fields can not be changed past this point
        document.getElementById("input-port").disabled = true;
        document.getElementById("input-key").disabled = true;
        document.getElementById("start-button").disabled = true;

        setStatus(`Port ${inputPort} has been set as the server`, "Waiting for a new connection...");

        listen(inputPort, stringToAesKey(inputKey))
    }
}

const submitContinue = () => {
    console.log("Continue Pressed")
    ipcRenderer.send('server-continue', null);
}

const submitSkip = () => {
    console.log("Skip Pressed")
    ipcRenderer.send('server-skip', null);
}

const submitMessage = () => {
    const message = document.getElementById("message-text").value;
    ipcRenderer.send('server-send-message', message);
    document.getElementById("message-text").value = "";
}

const listen = (port, key) => {
    ipcRenderer.send('initialize-server-connection', {port, key})
}

const validatePort = (port) => {
    if (port >= 1000 && port <= 20000)
        return true;
    dialog.showErrorBox("Input Error", "Please enter a port from 1000 to 20000")
    return false
}

const validateKey = (key) => {
    const validatedKey = stringToAesKey(key);
    if (validatedKey != -1) 
        return true;
    dialog.showErrorBox("Input Error", "Please check that the key length is of 16, 24, or 32 bytes")
    return false;
}

/*
 * Update the status and substatus text in the front end
 */
const setStatus = (status, substatus) => {
    document.getElementById("status").innerHTML = status;
    document.getElementById("substatus").innerHTML = substatus;
}

const toggleContinueSkip = () => {
    const currContinue = document.getElementById("continue-button").disabled;
    const currSkip = document.getElementById("skip-button").disabled;
    document.getElementById("continue-button").disabled = !currContinue;
    document.getElementById("skip-button").disabled = !currSkip;
}

ipcRenderer.on('server-set-status', (event, status, substatus) => {
    setStatus(status, substatus);
});

ipcRenderer.on('server-toggle-continue-skip', (event, args) => {
    toggleContinueSkip();
})

ipcRenderer.on('server-set-session-key', (event, sessionKey) => {
    document.getElementById("session-key").innerHTML = sessionKey;
})

ipcRenderer.on('server-send-message', (event, encryptedMessage, decryptedMessage) => {
    document.getElementById("message-encrypted").innerHTML = encryptedMessage;
    document.getElementById("message-decrypted").innerHTML = decryptedMessage;
});
