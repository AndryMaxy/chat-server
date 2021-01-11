const express = require('express');
const { Router } = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { createJwtStrategy, genToken, genWebSocketToken } = require('./authentication.js');
const websocket = require('./websocket/websocket.js');
const Message = require('./model/Message.js');
const User = require('./model/User.js');

const PORT = 4500;
const app = express();
const router = Router();

//this is the default config
const corsConfig = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

app.use(morgan('dev'));
app.use(cors(corsConfig));
app.use(passport.initialize());
passport.use(createJwtStrategy());
app.use(bodyParser.json());
app.use(router);

const authenticate = () => passport.authenticate('jwt', { session: false });

async function run() {
    try {
        await mongoose.connect('mongodb+srv://andry:adminADMIN@chat.dbuht.mongodb.net/chat', {
            useNewUrlParser: true,
            useFindAndModify: false,
            useUnifiedTopology: true,
        });
        websocket();
        app.listen(PORT, () => {
            console.log('server running');
        });
    } catch (error) {
        console.log('server run fault:' + error);
    }
}

run();

router.get('/', (req, res) => {});

router.get('/chat', authenticate(), async (req, res) => {
    console.log('get chat');
    const messages = await Message.find();
    return res.status(200).json(messages);
});

router.post('/test2', authenticate(), async (req, res) => {
    console.log('auth test');
    const msg = new Message({
        type: 'CONNECTED',
        info: {
            userId: req.user.id,
            text: 'blabla',
            date: Date.now(),
        },
    });
    await msg.save();
    return res.status(200);
});

router.post('/test', authenticate(), async (req, res) => {
    console.log('auth test');
    const msg = await Message.findById('5ffb754edf98b320b0159ff6');
    const user = await User.findById(msg.info.userId);

    console.log(user);
    return res.status(200);
});

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const candidate = await User.findOne({ username });

    if (candidate) {
        console.log('exists');
        return res.status(401);
    }

    const salt = bcrypt.genSaltSync(10);
    const pw = bcrypt.hashSync(password, salt);
    const user = new User({
        username,
        password: pw,
    });

    await user.save();
    const token = genToken({ userId: user._id, username: user.username });
    return res.status(200).json({ token });
});

router.post('/login', async (req, res) => {
    console.log('post login');
    const { username, password } = req.body;
    const candidate = await User.findOne({ username });

    if (candidate) {
        const isEqual = bcrypt.compareSync(password, candidate.password);
        if (isEqual) {
            const token = genToken({ userId: candidate._id, username: candidate.username });
            return res.status(200).json({ token });
        }
    }

    return res.status(401);
});

router.post('/websocket', authenticate, (req, res) => {
    const token = genWebSocketToken();
    return res.status(200).json({ token });
});
