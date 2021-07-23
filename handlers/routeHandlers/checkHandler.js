const dataLib = require('../../lib/data');
const { parseJSON, createToken } = require('../../helpers/utils');
const tokenHandler = require('./tokenHandler');
const { maxCheck } = require('../../helpers/env');
const handler = {};
handler._check = {};

handler.checkHandler = (requestProp, callback) => {
  const validMethods = ['get', 'post', 'put', 'delete'];
  if (validMethods.indexOf(requestProp.method) > -1) {
    handler._check[requestProp.method](requestProp, callback);
  } else {
    callback(405);
  }
};

handler._check.post = (requestProp, callback) => {
  let protocol =
    typeof requestProp.body.protocol === 'string' &&
    ['http', 'https'].indexOf(requestProp.body.protocol) > -1
      ? requestProp.body.protocol
      : null;
  let url =
    typeof requestProp.body.url === 'string' &&
    requestProp.body.url.trim().length > 0
      ? requestProp.body.url
      : null;
  let method =
    typeof requestProp.body.method === 'string' &&
    ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProp.body.method) > -1
      ? requestProp.body.method
      : null;
  let statusCode =
    typeof requestProp.body.statusCode === 'object' &&
    requestProp.body.statusCode instanceof Array
      ? requestProp.body.statusCode
      : null;
  let timeOutSeconds =
    typeof requestProp.body.timeOutSeconds === 'number' &&
    requestProp.body.timeOutSeconds % 1 === 0 &&
    requestProp.body.timeOutSeconds >= 1 &&
    requestProp.body.timeOutSeconds <= 5
      ? requestProp.body.timeOutSeconds
      : null;
  if (protocol && url && method && statusCode && timeOutSeconds) {
    let token =
      typeof requestProp.headersObject.token === 'string'
        ? requestProp.headersObject.token
        : false;
    dataLib.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        let phone = parseJSON(tokenData).phone;
        if (phone) {
          dataLib.read('users', phone, (err, userData) => {
            if (!err && userData) {
              tokenHandler._token.verifyToken(token, phone, (isValidToken) => {
                if (isValidToken) {
                  let userObject = parseJSON(userData);
                  let userChecks =
                    typeof userObject.checks === 'object' &&
                    userObject.checks instanceof Array
                      ? userObject.checks
                      : [];
                  if (userChecks.length < maxCheck) {
                    let checkId = createToken(20);
                    const checkObj = {
                      id: checkId,
                      phone,
                      protocol,
                      url,
                      method,
                      statusCode,
                      timeOutSeconds,
                    };
                    dataLib.create('checks', checkId, checkObj, (err) => {
                      if (!err) {
                        userObject.checks = userChecks;
                        userObject.checks.push(checkId);
                        dataLib.update('users', phone, userObject, (err) => {
                          if (!err) {
                            callback(200, { data: checkObj });
                          } else {
                            callback(400, { msg: 'User update failed' });
                          }
                        });
                      } else {
                        callback(500, { msg: 'Something went wrong!' });
                      }
                    });
                  } else {
                    callback(401, { msg: 'User reached max limit!' });
                  }
                } else {
                  callback(404, { msg: 'Authentication Error!' });
                }
              });
            } else {
              callback(403, { msg: 'user not found!' });
            }
          });
        } else {
          callback(403, { msg: 'Authentication failure!' });
        }
      } else {
        callback(403, { msg: 'Authentication failure!' });
      }
    });
  } else {
    callback(400, {
      msg: 'something is not working',
      data: { url, protocol, method, statusCode, timeOutSeconds },
    });
  }
};

handler._check.get = (requestProp, callback) => {
  const id =
    typeof requestProp.queryString.id === 'string' &&
    requestProp.queryString.id.trim().length === 20
      ? requestProp.queryString.id
      : null;
  if (id) {
    dataLib.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        let token =
          typeof requestProp.headersObject.token === 'string'
            ? requestProp.headersObject.token
            : false;
        tokenHandler._token.verifyToken(
          token,
          parseJSON(checkData).phone,
          (isValidToken) => {
            if (isValidToken) {
              callback(200, { data: parseJSON(checkData) });
            } else {
              callback(404, { msg: 'Authentication unsuccessfull!' });
            }
          }
        );
      } else {
        callback(500, { msg: 'something went wrong' });
      }
    });
  } else {
    callback(400, { msg: 'something is not working' });
  }
};

handler._check.put = (requestProp, callback) => {
  const id =
    typeof requestProp.body.id === 'string' &&
    requestProp.body.id.trim().length === 20
      ? requestProp.body.id
      : null;
  let protocol =
    typeof requestProp.body.protocol === 'string' &&
    ['http', 'https'].indexOf(requestProp.body.protocol) > -1
      ? requestProp.body.protocol
      : null;
  let url =
    typeof requestProp.body.url === 'string' &&
    requestProp.body.url.trim().length > 0
      ? requestProp.body.url
      : null;
  let method =
    typeof requestProp.body.method === 'string' &&
    ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProp.body.method) > -1
      ? requestProp.body.method
      : null;
  let statusCode =
    typeof requestProp.body.statusCode === 'object' &&
    requestProp.body.statusCode instanceof Array
      ? requestProp.body.statusCode
      : null;
  let timeOutSeconds =
    typeof requestProp.body.timeOutSeconds === 'number' &&
    requestProp.body.timeOutSeconds % 1 === 0 &&
    requestProp.body.timeOutSeconds >= 1 &&
    requestProp.body.timeOutSeconds <= 5
      ? requestProp.body.timeOutSeconds
      : null;
  if (id) {
    if (protocol || url || method || statusCode || timeOutSeconds) {
      dataLib.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          let checkObject = parseJSON(checkData);
          let token =
            typeof requestProp.headersObject.token === 'string'
              ? requestProp.headersObject.token
              : false;
          tokenHandler._token.verifyToken(
            token,
            checkObject.phone,
            (isValidToken) => {
              if (isValidToken) {
                if (protocol) checkObject.protocol = protocol;
                if (url) checkObject.url = url;
                if (method) checkObject.method = method;
                if (statusCode) checkObject.statusCode = statusCode;
                if (timeOutSeconds) checkObject.timeOutSeconds = timeOutSeconds;
                dataLib.update('checks', id, checkObject, (err) => {
                  if (!err) {
                    callback(200, { data: checkObject });
                  } else {
                    callback(500, { msg: 'Server error' });
                  }
                });
              } else {
                callback(403, { msg: 'Authentication failure' });
              }
            }
          );
        } else {
          callback(500, { msg: 'Something went wrong' });
        }
      });
    } else {
      callback(400, { msg: 'No field provided' });
    }
  } else {
    callback(400, { msg: 'Invalid Request' });
  }
};

handler._check.delete = (requestProp, callback) => {
  const id =
    typeof requestProp.queryString.id === 'string' &&
    requestProp.queryString.id.trim().length === 20
      ? requestProp.queryString.id
      : null;
  if (id) {
    dataLib.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        let token =
          typeof requestProp.headersObject.token === 'string'
            ? requestProp.headersObject.token
            : false;
        tokenHandler._token.verifyToken(
          token,
          parseJSON(checkData).phone,
          (isValidToken) => {
            if (isValidToken) {
              dataLib.delete('checks', id, (err) => {
                if (!err) {
                  dataLib.read(
                    'users',
                    parseJSON(checkData).phone,
                    (err, userData) => {
                      let userObject = parseJSON(userData);
                      if (!err && userData) {
                        let userChecks =
                          typeof userObject.checks === 'object' &&
                          userObject.checks instanceof Array
                            ? userObject.checks
                            : [];
                        let checkPos = userChecks.indexOf(id);
                        if (checkPos > -1) {
                          userChecks.splice(checkPos, 1);
                          userObject.checks = userChecks;
                          dataLib.update(
                            'users',
                            userObject.phone,
                            userObject,
                            (err) => {
                              if (!err) {
                                callback(200, { data: userObject });
                              } else {
                                callback(500, { msg: 'server problem' });
                              }
                            }
                          );
                        } else {
                          callback(404, {
                            msg: 'The operation failed for invalid id',
                          });
                        }
                      } else {
                        callback(500, { msg: 'server problem' });
                      }
                    }
                  );
                } else {
                  callback(500, { msg: 'server problem' });
                }
              });
            } else {
              callback(403, { msg: 'Authentication failure' });
            }
          }
        );
      } else {
        callback(500, { msg: 'something went wrong' });
      }
    });
  } else {
    callback(400, { msg: 'something is not working' });
  }
};

module.exports = handler;
