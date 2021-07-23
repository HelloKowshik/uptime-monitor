const dataLib = require('../../lib/data');
const { hash } = require('../../helpers/utils');
const { parseJSON, createToken } = require('../../helpers/utils');
const handler = {};
handler._token = {};

handler.tokenHandler = (requestProp, callback) => {
  const validMethods = ['get', 'post', 'put', 'delete'];
  if (validMethods.indexOf(requestProp.method) > -1) {
    handler._token[requestProp.method](requestProp, callback);
  } else {
    callback(405);
  }
};

handler._token.post = (requestProp, callback) => {
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
  if (phone && password) {
    dataLib.read('users', phone, (err, uData) => {
      if (!err && uData) {
        let hashedPass = hash(password);
        if (hashedPass === parseJSON(uData).password) {
          let tokenId = createToken(20);
          let expireTime = Date.now() + 24 * 60 * 60 * 1000;
          let tokenObj = {
            id: tokenId,
            expires: expireTime,
            phone,
          };
          dataLib.create('tokens', tokenId, tokenObj, (err) => {
            if (!err) {
              callback(200, { data: tokenObj });
            } else {
              callback(500, { msg: 'server Error!' });
            }
          });
        }
      } else {
        callback(400, { msg: 'Invalid Data provided!' });
      }
    });
  } else {
    callback(400, { msg: 'Invalid crediential' });
  }
};

handler._token.get = (requestProp, callback) => {
  const tokenId =
    typeof requestProp.queryString.id === 'string' &&
    requestProp.queryString.id.trim().length === 20
      ? requestProp.queryString.id
      : null;
  if (tokenId) {
    dataLib.read('tokens', tokenId, (err, token) => {
      let tokenInfo = { ...parseJSON(token) };
      if (!err && tokenInfo) {
        callback(200, { data: tokenInfo });
      } else {
        callback(404, { msg: 'Error, token not found' });
      }
    });
  } else {
    callback(404, { msg: 'Error, token not found' });
  }
};

handler._token.put = (requestProp, callback) => {
  const tokenId =
    typeof requestProp.body.id === 'string' &&
    requestProp.body.id.trim().length === 20
      ? requestProp.body.id
      : null;
  const extendToken =
    typeof requestProp.body.extend === 'boolean' &&
    requestProp.body.extend === true
      ? true
      : false;
  if (tokenId && extendToken) {
    dataLib.read('tokens', tokenId, (err, tokenData) => {
      let tokenObj = parseJSON(tokenData);
      if (tokenObj.expires > Date.now()) {
        tokenObj.expires = Date.now() + 60 * 60 * 1000;
        dataLib.update('tokens', tokenId, tokenObj, (err) => {
          if (!err) {
            callback(200, { data: 'Token Updated' });
          } else {
            callback(500, { msg: 'Bad Request' });
          }
        });
      } else {
        callback(400, { msg: 'Token Expired!' });
      }
    });
  } else {
    callback(400, { msg: 'Bad Request' });
  }
};

handler._token.delete = (requestProp, callback) => {
  const tokenId =
    typeof requestProp.queryString.id === 'string' &&
    requestProp.queryString.id.trim().length === 20
      ? requestProp.queryString.id
      : null;
  if (tokenId) {
    dataLib.read('tokens', tokenId, (err, data) => {
      if (!err && data) {
        dataLib.delete('tokens', tokenId, (err) => {
          if (!err) {
            callback(200, { msg: 'Token deleted' });
          } else {
            callback(400, { msg: 'Token Deletion failed!' });
          }
        });
      } else {
        callback(400, { msg: 'No such file' });
      }
    });
  } else {
    callback(400, { msg: 'There was an error occured!' });
  }
};

handler._token.verifyToken = (id, phone, callback) => {
  dataLib.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      if (
        parseJSON(tokenData).phone === phone &&
        parseJSON(tokenData).expires > Date.now()
      ) {
        callback(true);
      }
    } else {
      callback(false);
    }
  });
};

module.exports = handler;
