'use strict';

const jwt = require('jsonwebtoken'),
  User = require('../models/user'),
  Guest = require('../models/guest'),
  config = require('../config/main');

function generateToken(user) {
  console.log(user);
  return jwt.sign({ _id: user.id }, config.secret, {
    expiresIn: 7200,
  });
}

function setUserInfo(req) {
  return {
    id: req.id,
    username: req.username,
  };
}

// LOGIN ROUTE
exports.login = function (req, res, next) {
  console.log(req.user);
  let userInfo = setUserInfo(req.user);

  res.status(200).json({
    token: 'JWT ' + generateToken(userInfo),
    user: userInfo,
  });
};

// REGISTRATION ROUTE
exports.register = function (req, res, next) {
  const id = req.body.id;
  const username = req.body.username;
  const password = req.body.password;

  console.log(req.body);

  // Validating username and password
  if (!id) {
    return res.status(422).send({
      error: 'You must enter an id .',
    });
  }
  if (!username) {
    return res.status(422).send({
      error: 'You must enter a username.',
    });
  }

  if (!password) {
    return res.status(422).send({
      error: 'You must enter a password.',
    });
  }

  // Looks for existing username and makes user account if no duplicate are found
  User.findOne({ id }, function (err, existingUser) {
    if (err) {
      return next(err);
    }

    if (existingUser) {
      return res.status(422).send({
        error: 'That user id is already in use.',
      });
    }

    //If email is unique and password is provied -> create account
    let user = new User({
      id: id,
      username: username,
      password: password,
    });

    user.save(function (err, user) {
      if (err) {
        return next(err);
      }

      let userInfo = setUserInfo(user);

      res.status(200).json({
        token: 'JWT ' + generateToken(userInfo),
        user: userInfo,
        message: 'Successfully created your account.',
      });
    });
  });
};

// Guest login route
exports.guestSignup = function (req, res, next) {
  const guestName = req.body.guestInputName;

  if (!guestName) {
    return res.status(422).json({
      error: 'You must enter a username.',
    });
  }

  // Looks for existing guest name in database
  Guest.findOne({ guestName }, function (err, existingGuest) {
    if (err) {
      return next(err);
    }

    if (existingGuest) {
      return res.status(422).send({
        error: 'That Guest name is already taken.',
      });
    }

    let guest = new Guest({
      guestName,
    });

    // Checks against Usernames so there is no overlap
    User.findOne({ username: guestName }, function (err, existingUser) {
      if (err) {
        return next(err);
      }

      if (existingUser) {
        return res.status(422).send({
          error: 'That Guest name is already taken.',
        });
      } else {
        guest.save(function (err, user) {
          if (err) {
            return next(err);
          }

          // Generates a token for guests to be able to make certain api calls to the backend
          res.status(200).json({
            token: 'JWT ' + generateToken({ guest }),
            guestUser: { guest },
            message: 'Sucessfully created a guest account',
          });
        });
      }
    });
  });
};
