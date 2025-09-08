const outController = require('./controller/outController')
const inController = require('./controller/inController')
module.exports = (io) => {
    const chatNamespace = io.of('/chat'); // create a namespace for '/chat'
    const users = {}; // mapping of usernames to socket IDs

    chatNamespace.on('connection', (socket) => {
        // Get the sender from the client
        const sender = socket.handshake.query.username;

        // Store the username-socket ID mapping
        users[sender] = socket.id;

        // receiving the message from sender and then emitting it to the reciever
        socket.on('new message', (data) => {
            const { to, msg } = data;
            // saving message in database
            outController.saveChat(sender, to, msg, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    let recieverSocketId = users[to];
                    // Send the message to the recipient
                    chatNamespace.to(recieverSocketId).emit('message', msg);
                }
            });
        });
        socket.on('friend request sent', (data) => {
            let reciever = data.to;
            let recieverSocket = users[reciever];

            // saving the request in the db
            inController.saveRequest(sender, reciever, (err, result, count) => {
                const current = users[sender];
                
                if (err) {
                    chatNamespace.to(current).emit('friendRequest failure', err, result);
                } else {
                    chatNamespace.to(current).emit('friendRequest ack', reciever);
                    // Send the request to the recipient
                    chatNamespace.to(recieverSocket).emit('friendRequest', result, count);
                }
            })
        })
        socket.on('friend request accept', (data) => {
            let reqSender = data.from;
            let reqReciever = sender;
            let reqSenderId = users[reqSender];
            let reqRecieverId = users[reqReciever];

            // saving the request in the db
            inController.acceptRequest(reqSender, reqReciever, (err, result, reqSender) => {
                if (err) {
                    chatNamespace.to(reqRecieverId).emit('req Acceptance failure', err,result, reqSender);
                } else {
                    // accepting friend request
                    chatNamespace.to(reqRecieverId).emit('req Accepted ack', reqSender);
                    chatNamespace.to(reqSenderId).emit('req Accepted ack', result);
                    chatNamespace.to(reqSenderId).emit('req Accepted', result);
                }
            })
        })
        socket.on('unfriended', (data) => {
            let current = users[sender];
            let other = users[data.to];

            // saving the request in the db
            inController.unFriend(sender, data.to, (err, currUser, otherUser) => {
                if (err) {
                    chatNamespace.to(current).emit('unfriended ack failure', err);
                } else {
                    // accepting friend request
                    chatNamespace.to(current).emit('unfriended ack', otherUser);
                    chatNamespace.to(other).emit('unfriended ack', currUser);
                    // chatNamespace.to(reqSenderId).emit('req Accepted', result);    
                }
            })
        })
    })
}