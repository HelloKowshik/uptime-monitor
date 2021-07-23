const utils = {};
const crypto = require('crypto');
const env = require('../helpers/env');

utils.parseJSON = (jsonStr) => {
  let outputStr;
  try {
    outputStr = JSON.parse(jsonStr);
  } catch (err) {
    outputStr = {};
  }
  return outputStr;
};

utils.hash = (str) => {
  if (typeof str === 'string' && str.length > 0) {
    const hash = crypto
      .createHmac('sha256', env.secretKey)
      .update(str)
      .digest('hex');
    return hash;
  } else {
    return false;
  }
};

utils.createToken = (strLen) => {
  let chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
  let length = typeof strLen === 'number' && strLen > 0 ? strLen : false;
  let tokenStr = '';
  if (length) {
    for (let i = 1; i <= length; i++) {
      tokenStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return tokenStr;
  }
  return false;
};

module.exports = utils;
