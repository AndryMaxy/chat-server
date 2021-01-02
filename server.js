const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 3003 });

let history = [];
let users = {}; //{ name: string, isOnline: boolean }

console.log('running');

server.on('connection', (client, req) => {
    console.log('connected');
    let isAlive = false;
    let user = {};

    client.on('message', (message) => {
        const msg = JSON.parse(message);
        switch (msg.type) {
            case 'LOGIN':
                user = new User(msg.name);
                users[user.id] = user;
                sendAll({
                    type: 'CONNECTED',
                    info: {
                        name: msg.name,
                        users: getUserNames(),
                    },
                });
                break;
            case 'STATUS':
                isAlive = true;
                break;
            case 'MESSAGE':
                saveMessage(msg);
                sendAll(msg);
                break;
        }
    });

    onconnect(client);

    const interval = setInterval(() => {
        if (!isAlive) {
            clearInterval(interval);
            client.terminate();
            delete users[user.id];
            sendAll({
                type: 'DISCONNECTED',
                info: {
                    name: user.name,
                    users: getUserNames(),
                },
            });
        }

        isAlive = false;
    }, 40000);
});

server.on('close', () => {
    clearInterval(interval);
});

// setWsHeartbeat(
//     server,
//     (ws, data, binary) => {
//         if (data === '{"type":"ping"}') {
//             // send pong if recieved a ping.
//             ws.send('{"type":"pong"}');
//             console.log('pong!');
//         }
//     },
//     60000
// );

function saveMessage(message) {
    history.push(message);
    if (history.length > 200) {
        history = history.slice(1);
    }
}

const getUserNames = () => Object.values(users).map((user) => user.name);

const send = (c, m) => c.send(JSON.stringify(m));

function sendAll(message) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            send(client, message);
        }
    });
}

function onconnect(client) {
    if (history.length) {
        history.forEach((msg) => send(client, msg));
    } else {
        const msg = {
            type: 'MESSAGE',
            info: {
                name: 'Bot',
                text: 'Hi stranger...',
            },
        };
        send(client, msg);
        history.push(msg);
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
