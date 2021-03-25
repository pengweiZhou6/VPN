//Imports
const { ipcRenderer } = require('electron')


//Buttons
const clientMode = document.getElementById('client');
const serverMode = document.getElementById('server');


clientMode.addEventListener('click', () => {
    console.log(openClientWindowInMainProcessEvent());
    // createClientWindow();
});

// function createClientWindow() {
//     const remote = require('electron').remote;
//     const BrowserWindow = remote.BrowserWindow;
//     const win = new BrowserWindow({
//         height: 800,
//         width: 600,
//         webPreferences: {
//             nodeIntegration: true
//         }
//     });
//     win.loadURL(`file://${__dirname}/client.html`)
//     win.show()
// }

serverMode.addEventListener('click', () => {
    console.log(openServerWindowInMainProcessEvent());
    // createServerWindow();
});

// function createServerWindow() {
//     const remote = require('electron').remote;
//     const BrowserWindow = remote.BrowserWindow;
//     const win = new BrowserWindow({
//         height: 800,
//         width: 600,
//         webPreferences: {
//             nodeIntegration: true
//         }

//     });
//     win.loadURL(`file://${__dirname}/server.html`)
//     win.show()
// }


//If main sends anything back, these functions will return the result.
function openClientWindowInMainProcessEvent(){
    return ipcRenderer.sendSync('open-client-window', 'Status: Opening Client Window') 
}

function openServerWindowInMainProcessEvent(){
    return ipcRenderer.sendSync('open-server-window', 'Status: Opening Server Window') 
}