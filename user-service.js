const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const mongoDBConnectionString = process.env.MONGO_URL;

const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName: {
        type: String,
        unique: true,
    },
    password: String,
    favourites: [String],
});

let User;
let isConnected = false;

module.exports.connect = async function () {
    if (isConnected) {
        return;
    }

    await mongoose.connect(mongoDBConnectionString);

    User = mongoose.models.users || mongoose.model("users", userSchema);
    isConnected = true;
};

module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {
        if (userData.password != userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt
                .hash(userData.password, 10)
                .then((hash) => {
                    userData.password = hash;

                    const newUser = new User(userData);

                    newUser
                        .save()
                        .then(() => {
                            resolve(
                                "User " +
                                    userData.userName +
                                    " successfully registered"
                            );
                        })
                        .catch((err) => {
                            if (err.code == 11000) {
                                reject("User Name already taken");
                            } else {
                                reject("There was an error creating the user: " + err);
                            }
                        });
                })
                .catch((err) => reject(err));
        }
    });
};

module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        User.findOne({ userName: userData.userName })
            .exec()
            .then((user) => {
                if (!user) {
                    reject("Unable to find user " + userData.userName);
                    return;
                }

                bcrypt.compare(userData.password, user.password).then((result) => {
                    if (result === true) {
                        resolve(user);
                    } else {
                        reject("Incorrect password for user " + userData.userName);
                    }
                });
            })
            .catch(() => {
                reject("Unable to find user " + userData.userName);
            });
    });
};

module.exports.getFavourites = function (id) {
    return new Promise(function (resolve, reject) {
        User.findById(id)
            .exec()
            .then((user) => {
                if (!user) {
                    reject(`Unable to get favourites for user with id: ${id}`);
                    return;
                }
                resolve(user.favourites);
            })
            .catch(() => {
                reject(`Unable to get favourites for user with id: ${id}`);
            });
    });
};

module.exports.addFavourite = function (id, favId) {
    return new Promise(function (resolve, reject) {
        User.findById(id)
            .exec()
            .then((user) => {
                if (!user) {
                    reject(`Unable to update favourites for user with id: ${id}`);
                    return;
                }

                if (user.favourites.length < 50) {
                    User.findByIdAndUpdate(
                        id,
                        { $addToSet: { favourites: favId } },
                        { new: true }
                    )
                        .exec()
                        .then((updatedUser) => {
                            resolve(updatedUser.favourites);
                        })
                        .catch(() => {
                            reject(`Unable to update favourites for user with id: ${id}`);
                        });
                } else {
                    reject(`Unable to update favourites for user with id: ${id}`);
                }
            })
            .catch(() => {
                reject(`Unable to update favourites for user with id: ${id}`);
            });
    });
};

module.exports.removeFavourite = function (id, favId) {
    return new Promise(function (resolve, reject) {
        User.findByIdAndUpdate(
            id,
            { $pull: { favourites: favId } },
            { new: true }
        )
            .exec()
            .then((user) => {
                if (!user) {
                    reject(`Unable to update favourites for user with id: ${id}`);
                    return;
                }
                resolve(user.favourites);
            })
            .catch(() => {
                reject(`Unable to update favourites for user with id: ${id}`);
            });
    });
};