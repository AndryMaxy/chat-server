const WebSocket = require('ws');
const Message = require('./../model/Message.js');

function start() {
    const server = new WebSocket.Server({ port: 3003 });

    let history = [];
    const users = new Set(); //{ name: string, isOnline: boolean }

    console.log('websocket running');

    server.on('connection', (client, req) => {
        // const user = {
        //     client,
        // };

        console.log('connected');
        let user = {};

        const send = (m) => client.send(JSON.stringify(m));

        client.on('message', (message) => {
            const msg = JSON.parse(message);
            switch (msg.type) {
                case 'REGULAR':
                    saveMessage(msg);
                    sendMessages();
                    break;
            }
        });

        client.onclose = () => {
            // saveMessage({
            //     type: 'DISCONNECTED',
            //     info: {
            //         name: user.name,
            //         users: getUserNames(),
            //     },
            // });
            // sendMessages();
            // users.delete(client);
            console.log('connection closed');
        };
    });

    server.on('close', () => {
        console.log('close connection');
    });

    async function saveMessage(message) {
        await new Message(message).save();
        // history.push(message);
        // if (history.length > 300) {
        //     history = history.slice(1);
        // }
    }

    const getUserNames = () => Object.values(users).map((user) => user.name);

    async function sendMessages(message) {
        //const messages = message ? [...history, message] : history;
        const messages = await Message.find({});
        server.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'MESSAGES', info: { messages } }));
            }
        });
    }

    async function onlogin() {
        const messages = await Message.find({});
        //if (!history.length) {
        if (!messages.length) {
            const message = new Message({
                type: 'REGULAR',
                info: {
                    userName: 'Bot',
                    text: 'Hi stranger...',
                },
            });
            await message.save();
        }
    }

    class User {
        constructor(name) {
            this.name = name;
            this.id = Date.now();
        }

        // get id() {
        //     this.id;
        // }

        // private set id() {

        // }
    }
}
module.exports = start;
