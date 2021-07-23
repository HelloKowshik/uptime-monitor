const https = require('https');
const { twilio } = require('../helpers/env');
const queryString = require('querystring');
const notifications = {};

notifications.sendTwilioSMS = (phone, msg, callback) => {
  let userPhone =
    typeof phone === 'string' && phone.trim().length === 11
      ? phone.trim()
      : null;
  let userMsg =
    typeof msg === 'string' && msg.trim().length > 0 && msg.length <= 1600
      ? msg.trim()
      : null;
  if (userPhone && userMsg) {
    const payload = {
      From: twilio.from,
      To: `+88${userPhone}`,
      Body: userMsg,
    };
    let payloadString = queryString.stringify(payload);
    const twilioDetails = {
      hostname: 'api.twilio.com',
      method: 'POST',
      path: `/2010-04-01/Accounts/${twilio.AccountSid}/Messages.json`,
      auth: `${twilio.AccountSid}:${twilio.AuthToken}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
    let req = https.request(twilioDetails, (res) => {
      const statusCode = res.statusCode;
      if (statusCode === 200 || statusCode === 201) {
        callback(false);
      } else {
        callback({ msg: statusCode });
      }
    });
    req.on('error', (err) => callback({ msg: err }));
    req.write(payloadString);
    req.end();
  } else {
    callback(404, { msg: 'Invalid Credentials' });
  }
};

module.exports = notifications;
