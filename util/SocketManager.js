socket.on('connect', onConnect);
server.listen(3000);

function onConnect(socket) {
    console.log("Socket Connected.");
    socket.emit('hello', 'can you hear me?', 1, 2, 'abc');
}

module.exports = {
    socket
}