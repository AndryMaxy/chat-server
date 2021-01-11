const { Strategy, ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');
const User = require('./model/User.js');
const config = require('./config.json');

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwt_secret,
};

const createJwtStrategy = () =>
    new Strategy(options, async (payload, done) => {
        try {
            const user = await User.findById(payload.userId);

            if (user) {
                done(null, user);
            } else {
                done(null, false);
            }
        } catch (error) {
            console.log('wtf');
        }
    });

const genToken = ({ userId, username }) =>
    jwt.sign(
        {
            userId,
            username,
        },
        config.jwt_secret,
        { expiresIn: 3600 }
    );

const genWebSocketToken = ({ userId, username }) =>
    jwt.sign(
        {
            userId: user._id,
            username: user.username,
        },
        config.jwt_ws_secret,
        { expiresIn: 1800 }
    );

module.exports = { createJwtStrategy, genToken, genWebSocketToken };
