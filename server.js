const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const jwt = require("jsonwebtoken");

dotenv.config();

const userService = require("./user-service.js");

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
};

const strategy = new JwtStrategy(jwtOptions, (jwt_payload, done) => {
    if (jwt_payload) {
        return done(null, {
            _id: jwt_payload._id,
            userName: jwt_payload.userName
        });
    }
    return done(null, false);
});

passport.use(strategy);

app.post("/api/user/register", async (req, res) => {
    await userService.connect();
    userService.registerUser(req.body)
        .then((msg) => res.json({ message: msg }))
        .catch((msg) => res.status(422).json({ message: msg.toString() }));
});

app.post("/api/user/login", async (req, res) => {
    await userService.connect();
    userService.checkUser(req.body)
        .then((user) => {
            const payload = { _id: user._id, userName: user.userName };
            const token = jwt.sign(payload, process.env.JWT_SECRET);
            res.json({ message: "login successful", token: token });
        })
        .catch((msg) => res.status(422).json({ message: msg.toString() }));
});

app.get("/api/user/favourites",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        await userService.connect();
        userService.getFavourites(req.user._id)
            .then((data) => res.json(data))
            .catch((msg) => res.status(422).json({ error: msg.toString() }));
    }
);

app.put("/api/user/favourites/:id",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        await userService.connect();
        userService.addFavourite(req.user._id, req.params.id)
            .then((data) => res.json(data))
            .catch((msg) => res.status(422).json({ error: msg.toString() }));
    }
);

app.delete("/api/user/favourites/:id",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        await userService.connect();
        userService.removeFavourite(req.user._id, req.params.id)
            .then((data) => res.json(data))
            .catch((msg) => res.status(422).json({ error: msg.toString() }));
    }
);

module.exports = app;