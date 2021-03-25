const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const EventEmitter = require('events');
const { diffieHellmanTestDriver, encryptionTestDriver } = require('./util/encrypt/encrypt');
const { decryptAes, encryptAes } = require('./util/encrypt/aes/aes');
const { generateDiffieHellmanGroup, generateDiffieHellmanKey, generateDiffieHellmanSecret } = require('./util/encrypt/dh/dh');
const { timeTestDriver, getTimestamp, incrementTimestamp, validateTimestamp } = require('./util/time/time');
const { connectClient, connectServer  } = require('./util/tcp/tcp');
const { messageTestDriver, buildAuthMessage, getAuthDH, getAuthTimestamp, validateAuthMessage } = require('./util/message/message');
const stringToAesKey = require('./util/encrypt/aes/string-to-aes-key');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const commonWindowWidth = 800
const commonWindowHeight = 800

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: commonWindowWidth,
    height: commonWindowHeight,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  }

  );

  // App state variables here
  let clientSocket = null;
  let serverSocket = null;

  let clientAuthenticated = false;
  let serverAuthenticated = false;

  let serverIncomingTS;
  let serverIncomingDH;
  let serverOutgoingTS;
  let serverOutgoingDH;

  let clientIncomingTS;
  let clientIncomingDH;
  // Set initially
  let clientOutgoingTS;

  /*
   * 0 - starting state after message incoming
   * 1 - message decrypted to plaintext (Timestamp = ..., Diffie-Hellman Public Key = ...)
   * 2 - generate return contents (T + 1 = ..., Diffie-Hellman Public Key = ...)
   * 3 - return authentication message, session key = ...
   */
  let serverAuthState = 0;

  let clientAuthState = 0;

  let privateKey = null;
  let sessionKey = null;

  let diffieHellmanGroup = generateDiffieHellmanGroup();

  // EventEmitter object to emit and listen to events
  // passed to tcp.js functions to generate nested events
  const tcpEmitter = new EventEmitter();

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '/app/main/index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  ipcMain.on('initialize-client-connection', (event, arg) => {
    clientSocket = connectClient(arg[1], arg[0], tcpEmitter);
    privateKey = arg[2];

    clientOutgoingTS = getTimestamp();
    const dhPublicKey = generateDiffieHellmanKey(diffieHellmanGroup);
    const message = buildAuthMessage(clientOutgoingTS, dhPublicKey);
    // Where arg is set to key
    const encryptedMessage = encryptAes(message, privateKey);
    clientSocket.write(encryptedMessage);
  });

  ipcMain.on('initialize-server-connection', (event, arg) => {
    connectServer(arg.port, tcpEmitter);
    privateKey = arg.key;
  });

  tcpEmitter.on('initialize-server-socket', (socket) => {
    serverSocket = socket;
  })

  tcpEmitter.on('server-data-received', (data) => {
    if (!serverAuthenticated) {
      // Check for 16 byte block alignment
      if (data.length % 16 != 0) {
        serverWindow.webContents.send('server-set-status', 'Client Used Invalid Authentication', 'The request was not encrypted');
        return;
      }

      const plaintext = decryptAes(data, privateKey);
      if (!validateAuthMessage(plaintext)) {
        serverWindow.webContents.send('server-set-status', 'Client Used Invalid Authentication', 'The request was not encrypted using a valid key');
        return;
      }
      else {
        serverIncomingTS = getAuthTimestamp(plaintext);
        serverIncomingDH = getAuthDH(plaintext);
        serverOutgoingTS = incrementTimestamp(parseInt(serverIncomingTS));
        serverOutgoingDH = generateDiffieHellmanKey(diffieHellmanGroup);
        if (validateTimestamp(serverIncomingTS)) {
          serverWindow.webContents.send('server-set-status', 'Incoming Encrypted Message', data);
          serverWindow.webContents.send('server-toggle-continue-skip', null);
          serverAuthenticated = true;
        }
        else {
          serverWindow.webContents.send('server-set-status', 'Client Used Invalid Authentication', 'The provided timestamp is invalid');
        }
      }
    }
    else {
      // Attempt to parse the message 
      const plaintext = decryptAes(data, stringToAesKey(sessionKey));
      serverWindow.webContents.send('server-send-message', data, plaintext);
    }
  });

  ipcMain.on('server-continue', (data) => {
    serverAuthState++;
    if (serverAuthState == 1) {
      serverWindow.webContents.send('server-set-status', 'Message Decrypted', `Time = ${serverIncomingTS}, Diffie-Hellman Public Key = ${serverIncomingDH}`);
    }
    else if (serverAuthState == 2) {
      serverWindow.webContents.send('server-set-status', 'Authenticated - Generate Outgoing Authentication', `Time = ${serverOutgoingTS}, Diffie-Hellman Public Key = ${serverOutgoingDH}`);
    }
    else if (serverAuthState == 3) {
      completeServerAuthentication();
    }
  })
  
  ipcMain.on('server-skip', (data) => {
    completeServerAuthentication();
  })

  const completeServerAuthentication = () => {
    sessionKey = generateDiffieHellmanSecret(diffieHellmanGroup, serverIncomingDH).substring(0, 31);
    const outgoingMessage = buildAuthMessage(serverOutgoingTS, serverOutgoingDH);
    const encryptedOutgoingMessage = encryptAes(outgoingMessage, privateKey)
    serverSocket.write(encryptedOutgoingMessage);
    serverWindow.webContents.send('server-set-status', 'Return Outgoing Authentication', encryptedOutgoingMessage);
    serverWindow.webContents.send('server-toggle-continue-skip', null);
    serverWindow.webContents.send('server-set-session-key', sessionKey);
  }

  tcpEmitter.on('client-data-received', (data) => {
    if (!clientAuthenticated) {
      // Check for 16 byte block alignment
      if (data.length % 16 != 0) {
        clientWindow.webContents.send('client-set-status', 'Server Used Invalid Authentication', 'The request was not encrypted');
        return;
      }

      const plaintext = decryptAes(data, privateKey);
      if (!validateAuthMessage(plaintext)) {
        clientWindow.webContents.send('client-set-status', 'Server Used Invalid Authentication', 'The request was not encrypted using a valid key');
      }
      else {
        clientIncomingTS = getAuthTimestamp(plaintext);
        clientIncomingDH = getAuthDH(plaintext);
        if (parseInt(clientIncomingTS) == clientOutgoingTS + 1) {
          // TODO: add front end logic
          clientWindow.webContents.send('client-set-status', 'Incoming Encrypted Message', data);
          clientWindow.webContents.send('client-confirm-connection', null);
          clientAuthenticated = true;
        }
        else {
          clientWindow.webContents.send('client-set-status', 'Server Used Invalid Authentication', 'The request did not contain the correct timestamp');
        }
      }
    }
    else {
      // Attempt to parse the message 
      const plaintext = decryptAes(data, stringToAesKey(sessionKey));
      clientWindow.webContents.send('client-send-message', data, plaintext);
    }
  });

  ipcMain.on('client-continue', (data) => {
    clientAuthState++;
    if (clientAuthState == 1) {
      clientWindow.webContents.send('client-set-status', 'Message Decrypted', `Time = ${clientIncomingTS}, Diffie-Hellman Public Key = ${clientIncomingDH}`);
    }
    else if (clientAuthState == 2) {
      completeClientAuthentication();
    }
  });

  ipcMain.on('client-skip', (data) => {
    completeClientAuthentication()
  })

  const completeClientAuthentication = () => {
    sessionKey = generateDiffieHellmanSecret(diffieHellmanGroup, clientIncomingDH).substring(0, 31);
    // TODO: toggle buttons
    clientWindow.webContents.send('client-set-status', 'Authenticated', 'Messages will now be encrypted and sent using the private session key');
    clientWindow.webContents.send('client-set-session-key', sessionKey);
    clientWindow.webContents.send('client-toggle-continue-skip', null);
  }

  //created needed windows, pre-load them, and hide them. Show only when needed.
  clientWindow = new BrowserWindow({
    width: commonWindowWidth,
    height: commonWindowHeight,
    webPreferences: {
      nodeIntegration: true,
        enableRemoteModule: true
      // preload: path.resolve(path.join(__dirname, "preloads/preload.js"))
    },
    show: false,
  });
  clientWindow.loadFile(path.join(__dirname, '/app/client/client.html'));

  serverWindow = new BrowserWindow({
    width: commonWindowWidth,
    height: commonWindowHeight,
    webPreferences: {
      nodeIntegration: true,
        enableRemoteModule: true
    },
    show: false,
  });
  serverWindow.loadFile(path.join(__dirname, '/app/server/server.html'));

  //event listeners to call the client or server window
  ipcMain.on('open-server-window', (event, arg) => {
    console.log(arg)
    serverWindow.focus()
    serverWindow.show()
    mainWindow.hide()
    // mainWindow.loadFile(path.join(__dirname, 'server.html'));
    event.reply('reply-title', 'Status: Server window opened!')
  })

  ipcMain.on('open-client-window', (event, arg) => {
    console.log(arg)
    clientWindow.focus()
    clientWindow.show()
    mainWindow.hide()
    // mainWindow.loadFile(path.join(__dirname, 'client.html'));
    event.reply('reply-title', 'Status: Client window opened!')
  })

  ipcMain.on('client-send-message', (event, arg) => {
    // Do nothing if not authenticated
    if (clientAuthenticated) {
      const encryptedMessage = encryptAes(arg, stringToAesKey(sessionKey));
      clientSocket.write(encryptedMessage);
    }
  });
  
  ipcMain.on('server-send-message', (event, arg) => {
    // Do nothing if not authenticated 
    if (serverAuthenticated) {
      const encryptedMessage = encryptAes(arg, stringToAesKey(sessionKey));
      serverSocket.write(encryptedMessage);
    }
  });

  // Add some vanilla assert tests while we develop
  encryptionTestDriver();
  diffieHellmanTestDriver();
  timeTestDriver();
  messageTestDriver();
};

// // receive message from client.html
// ipcMain.on('asynchronous-ip', (event, arg) => {
//   console.log( arg );
//
//   // send message to index.html
//   event.sender.send('asynchronous-reply1', 'hello' );
// });
//

ipcMain.on('asynchronous-ip', (event, arg) => {
  console.log( arg );

    // TODO: confirmation message from server
  event.sender.send('asynchronous-reply-confirm', true );
});

ipcMain.on('asynchronous-port', (event, arg) => {
  console.log( arg );

});

ipcMain.on('asynchronous-msg', (event, arg) => {
  console.log( arg );

  event.sender.send('asynchronous-reply-Answer', "Here is respond" );
  // send message to index.html
});



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
