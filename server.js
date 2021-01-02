const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 3003 });

let history = [];
let users = {}; //{ name: string, isOnline: boolean }

console.log('running');

server.on('connection', (client, req) => {
    console.log('connected');
    let isAlive = false;
    let user = {};

    const send = (m) => client.send(JSON.stringify(m));

    client.on('message', (message) => {
        const msg = JSON.parse(message);
        switch (msg.type) {
            case 'LOGIN':
                const { name } = msg.info || {};
                user = new User(name);
                users[user.id] = user;
                send({
                    type: 'ONLINE',
                    info: {
                        name,
                    },
                });
                sendAll({
                    type: 'CONNECTED',
                    info: {
                        name,
                        users: getUserNames(),
                    },
                });
                initStatusCheck();
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

    const initStatusCheck = () => {
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
    };
});

server.on('close', () => {
    clearInterval(interval);
});

function saveMessage(message) {
    history.push(message);
    if (history.length > 200) {
        history = history.slice(1);
    }
}

const getUserNames = () => Object.values(users).map((user) => user.name);

function sendAll(message) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

function onconnect(client) {
    if (history.length) {
        history.forEach((msg) => client.send(JSON.stringify(msg)));
    } else {
        const msg = {
            type: 'MESSAGE',
            info: {
                name: 'Bot',
                text: 'Hi stranger...',
            },
        };
        client.send(JSON.stringify(msg));
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
