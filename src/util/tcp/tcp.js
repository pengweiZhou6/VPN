const net = require('net');

/* 
 * Connects to a server using TCP. Currently sends a single message upon
 * connection and waits for data to be be sent back.
 * 
 * Default connection is localhost:9000 unless specified in arguments
 * on start (e.g. npm start 1 8000 localhost)
 */
const connectClient = (port, hostname, emitter) => {
    // creates a TCP socket used to interact with the server
    // console.log(port)
    // console.log(hostname)

    var client = net.connect(port, hostname, () => {
        console.log(`Attempting to connect to ${hostname}:${port}`)
    });

    client.setEncoding('utf8');

    client.on('connect', onClientConn);
    client.on('data', onClientData);
    client.once('close', onClientClose);
    client.on('error', onClientError);

    // called upon successful connection with other TCP socket
    function onClientConn() {
        console.log('Client: connection established with server');
    }

    // called when data recieved by server
    function onClientData(data) {
        emitter.emit('client-data-received', data);
    }

    // called when socket on other end is closed 
    function onClientClose() {
        console.log('Connection with server closed.');
    }

    // called when client-side socket error
    function onClientError(err) {
        console.log('Connection error: %s', err.message);
    }

    return client;
}

/*
 * Creates a TCP service that can be connected to
 * using applications like telnet or netcat (e.g. telnet localhost 9000)
 * 
 * Currently takes strings and writes them back in uppercase (echo)
 */
const connectServer = (port, emitter) => {
    var server = net.createServer();
    server.on('connection', handleConnection);

    server.listen(port, function() {
        console.log('Server listening to %j', server.address());
    });

    /*
     * Created to handle each connection individually,
     * allowing for multiple connections to server
     * 
     * Revised to handle single connection as per Assignment 3
     */
    function handleConnection(conn) {
        var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
        console.log('new client connection from %s', remoteAddress);
        
        /*
         * Will only handle a single connection and close the server
         * to new connections after the first one is made.
         * 
         * Server must be restarted (i.e. made to listen again)
         * if client disconnects.
         */
        var socket = conn;

        // Close to incoming connections - behavior is changed to reset to a new socket when a new connection is made
        // server.close(function() {
        //     console.log('All connections ended, server closed.');
        // });

        // sockets.push(conn);
        // conn.id = sockets.length - 1;

        conn.setEncoding('utf8');
    
        conn.on('data', onConnData);
        conn.once('close', onConnClose);
        conn.on('error', onConnError);
    
        // called when data recieved by server
        function onConnData(data) {
            console.log('connection data from %s', remoteAddress);
            emitter.emit('server-data-received', data);
        }
    
        // called when socket on other end is closed
        function onConnClose() {
            console.log('connection from %s closed', remoteAddress);
            // sockets.splice(conn.id, 1);
        }
    
        // called when server-side socket error
        function onConnError(err) {
            console.log('Connection %s error: %s', remoteAddress, err.message);
        }
        
        emitter.emit('initialize-server-socket', socket);
    }
}

module.exports = {
    connectClient,
    connectServer
}
