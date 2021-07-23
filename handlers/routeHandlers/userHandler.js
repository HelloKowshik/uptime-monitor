const dataLib = require('../../lib/data');
const { hash } = require('../../helpers/utils');
const { parseJSON } = require('../../helpers/utils');
const tokenHandler = require('./tokenHandler');
const handler = {};
handler._users = {};

handler.userHandler = (requestProp, callback) => {
  const validMethods = ['get', 'post', 'put', 'delete'];
  if (validMethods.indexOf(requestProp.method) > -1) {
    handler._users[requestProp.method](requestProp, callback);
  } else {
    callback(405);
  }
};

handler._users.post = (requestProp, callback) => {
  const firstName =
    typeof requestProp.body.firstName === 'string' &&
    requestProp.body.firstName.trim().length > 0
      ? requestProp.body.firstName
      : null;
  const lastName =
    typeof requestProp.body.lastName === 'string' &&
    requestProp.body.lastName.trim().length > 0
      ? requestProp.body.lastName
      : null;
  const phone =
    typeof requestProp.body.phone === 'string' &&
    requestProp.body.phone.trim().length === 11
      ? requestProp.body.phone
      : null;
  const password =
    typeof requestProp.body.password === 'string' &&
    requestProp.body.password.trim().length >= 3
      ? requestProp.body.password
      : null;
  const tos =
    typeof requestProp.body.tos === 'boolean' ? requestProp.body.tos : false;
  if (firstName && lastName && phone && password && tos) {
    dataLib.read('users', phone, (err, data) => {
      if (err) {
        const userObject = {
          firstName,
          lastName,
          phone,
          password: hash(password),
          tos,
        };
        dataLib.create('users', phone, userObject, (err) => {
          if (!err) {
            callback(200, { msg: 'User created!' });
          } else {
            callback(404, { msg: 'Unable to create User' });
          }
        });
      } else {
        callback(500, { msg: 'Error' });
      }
    });
  } else {
    callback(400, { msg: 'Error in request' });
  }
};

handler._users.get = (requestProp, callback) => {
  const phone =
    typeof requestProp.queryString.phone === 'string' &&
    requestProp.queryString.phone.trim().length === 11
      ? requestProp.queryString.phone
      : null;
  if (phone) {
    let token =
      typeof requestProp.headersObject.token === 'string'
        ? requestProp.headersObject.token
        : false;
    tokenHandler._token.verifyToken(token, phone, (tokenInfo) => {
      if (tokenInfo) {
        dataLib.read('users', phone, (err, u) => {
          let user = { ...parseJSON(u) };
          if (!err && u) {
            delete user.password;
            callback(200, { data: user });
          } else {
            callback(404, { msg: 'Error, user not found' });
          }
        });
      } else {
        callback(403, { msg: 'Authentication failed!' });
      }
    });
  } else {
    callback(404, { msg: 'Error, user not found' });
  }
};

handler._users.put = (requestProp, callback) => {
  const phone =
    typeof requestProp.body.phone === 'string' &&
    requestProp.body.phone.trim().length === 11
      ? requestProp.body.phone
      : null;
  const firstName =
    typeof requestProp.body.firstName === 'string' &&
    requestProp.body.firstName.trim().length > 0
      ? requestProp.body.firstName
      : null;
  const lastName =
    typeof requestProp.body.lastName === 'string' &&
    requestProp.body.lastName.trim().length > 0
      ? requestProp.body.lastName
      : null;
  const password =
    typeof requestProp.body.password === 'string' &&
    requestProp.body.password.trim().length >= 3
      ? requestProp.body.password
      : null;
  if (phone) {
    if (firstName || lastName || password) {
      let token =
        typeof requestProp.headersObject.token === 'string'
          ? requestProp.headersObject.token
          : false;
      tokenHandler._token.verifyToken(token, phone, (tokenInfo) => {
        if (tokenInfo) {
          dataLib.read('users', phone, (err, uData) => {
            let userData = { ...parseJSON(uData) };
            if (!err && userData) {
              if (firstName) userData.firstName = firstName;
              if (lastName) userData.lastName = lastName;
              if (password) userData.password = hash(password);
              dataLib.update('users', phone, userData, (err) => {
                if (!err) {
                  callback(200, { msg: 'Update Success!' });
                } else {
                  callback(400, { msg: 'Failed to update' });
                }
              });
            } else {
              callback(400, { msg: 'Invalid phone number' });
            }
          });
        } else {
          callback(403, 'Authentication Failed!');
        }
      });
    } else {
      callback(400, { msg: 'Invalid data provided' });
    }
  } else {
    callback(400, { msg: 'Invalid phone number' });
  }
};

handler._users.delete = (requestProp, callback) => {
  const phone =
    typeof requestProp.queryString.phone === 'string' &&
    requestProp.queryString.phone.trim().length === 11
      ? requestProp.queryString.phone
      : null;
  if (phone) {
    let token =
      typeof requestProp.headersObject.token === 'string'
        ? requestProp.headersObject.token
        : false;
    tokenHandler._token.verifyToken(token, phone, (tokenInfo) => {
      if (tokenInfo) {
        dataLib.read('users', phone, (err, data) => {
          if (!err && data) {
            dataLib.delete('users', phone, (err) => {
              if (!err) {
                callback(200, { msg: 'Data deleted' });
              } else {
                callback(400, { msg: 'Deletion failed!' });
              }
            });
          } else {
            callback(400, { msg: 'No such file' });
          }
        });
      } else {
        callback(403, { msg: 'Authentication failed!' });
      }
    });
  } else {
    callback(400, { msg: 'There was an error occured!' });
  }
};

module.exports = handler;
