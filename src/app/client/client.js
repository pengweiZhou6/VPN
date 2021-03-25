
const {ipcRenderer } = require('electron');
const { dialog } = require('electron').remote
const { encryptAes } = require('../../util/encrypt/aes/aes');
const stringToAesKey = require('../../util/encrypt/aes/string-to-aes-key');
const aesjs = require('aes-js');
const net = require('net');

document.getElementById('form').onsubmit = e => {
    e.preventDefault();

    // send ip,port to main.js
    const ip = document.getElementById('IP').value;
    const port = document.getElementById('port').value;
    const secret = document.getElementById('secret').value;
    const validatedInputs = validatePort(port) && validateKey(secret) && validateIP(ip)

    if(validatedInputs) {
        const keyedSecret = stringToAesKey(secret)
        ipcRenderer.send('initialize-client-connection', [ip, port, keyedSecret])
        setConnectionStatus(`Connecting to Ip address ${ip} at port ${port} with secret key ${secret} `, "Waiting confirm from server.");
    }
};

ipcRenderer.on('client-confirm-connection', (event, arg) => {
    // SHOULD HANDLE STATUS AFTER CONNECTED
    document.getElementById("IP").disabled = true;
    document.getElementById("port").disabled = true;
    document.getElementById("secret").disabled = true;
    document.getElementById("start").disabled = true;
    toggleContinueSkip();
});

document.getElementById('sendForm').onsubmit = e => {
    e.preventDefault();
    // send encrypted Message to main.js
    const message = document.getElementById("msg").value;
    ipcRenderer.send('client-send-message', message);
    document.getElementById("msg").value = "";
};

const setConnectionStatus = (status, substatus) => {
    document.getElementById("connectionStatus").innerHTML = status;
    document.getElementById("connectionSubStatus").innerHTML = substatus;
}

const setMSGStatus = (status, substatus) => {
    document.getElementById("msgStatus").innerHTML = status;
    document.getElementById("msgSubStatus").innerHTML = substatus;
}

const validatePort = (port) => {
    if (port >= 1000 && port <= 20000)
        return true;
    dialog.showErrorBox("Input Error", "Please enter a port from 1000 to 20000")
    return false
}

const validateIP = (ip) => {
    if (net.isIPv4(ip) || net.isIPv6(ip)) {
        return true;
    }
    else {
        dialog.showErrorBox("Input Error", "Please enter a valid IP address")
        return false;
    }
}

const validateKey = (key) => {
    if (key.length > 0 && key.length <= 32)
        return true;
    dialog.showErrorBox("Input Error", "Please check that the key length is of 16, 24, or 32 bytes")
    return false;
}

const submitContinue = () => {
    ipcRenderer.send('client-continue', null);
}

const submitSkip = () => {
    ipcRenderer.send('client-skip', null);
}

const toggleContinueSkip = () => {
    const currContinue = document.getElementById("continue-button").disabled;
    const currSkip = document.getElementById("skip-button").disabled;
    document.getElementById("continue-button").disabled = !currContinue;
    document.getElementById("skip-button").disabled = !currSkip;
}

ipcRenderer.on('client-set-status', (event, status, substatus) => {
    setConnectionStatus(status, substatus);
});

ipcRenderer.on('client-set-session-key', (event, sessionKey) => {
    document.getElementById("session-key").innerHTML = sessionKey;
})

ipcRenderer.on('client-toggle-continue-skip', (event, args) => {
    toggleContinueSkip();
})

ipcRenderer.on('client-send-message', (event, messageEncrypted, messageDecrypted) => {
    document.getElementById("message-encrypted").innerHTML = messageEncrypted;
    document.getElementById("message-decrypted").innerHTML = messageDecrypted;
})