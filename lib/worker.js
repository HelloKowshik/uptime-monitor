const { parseJSON } = require('../helpers/utils');
const dataLib = require('./data');
const url = require('url');
const http = require('http');
const https = require('https');
const { sendTwilioSMS } = require('../helpers/notifications');
const worker = {};

worker.getAllChecks = () => {
  dataLib.list('checks', (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach((check) => {
        dataLib.read('checks', check, (err, checkData) => {
          if (!err && checkData) {
            worker.validateData(parseJSON(checkData));
          } else {
            console.log('Error in reading single file.', checkData);
          }
        });
      });
    } else {
      console.log(`Error in reading Data.`);
    }
  });
};

worker.validateData = (data) => {
  if (data && data.id) {
    data.state =
      typeof data.state === 'string' && ['up', 'down'].indexOf(data.state) > -1
        ? data.state
        : 'down';
    data.lastChecked =
      typeof data.lastChecked === 'number' && data.lastChecked > 0
        ? data.lastChecked
        : false;
    worker.performCheck(data);
  } else {
    console.log('Invalid Data provided');
  }
};

worker.performCheck = (data) => {
  let checkResult = {
    error: false,
    responseCode: false,
  };
  let outcomeSent = false;
  const parsedURL = url.parse(`${data.protocol}://${data.url}`, true);
  const hostName = parsedURL.hostname;
  const { path } = parsedURL;
  const requestDetails = {
    protocol: `${data.protocol}:`,
    hostname: hostName,
    method: data.method.toUpperCase(),
    path,
    timeout: data.timeOutSeconds * 1000,
  };
  const protocolToUse = data.protocol === 'http' ? http : https;
  let req = protocolToUse.request(requestDetails, (res) => {
    checkResult.responseCode = res.statusCode;
    if (!outcomeSent) {
      worker.processCheck(data, checkResult);
      outcomeSent = true;
    }
  });
  req.on('error', (err) => {
    checkResult.error = true;
    checkResult.value = err;
    if (!outcomeSent) {
      worker.processCheck(data, checkResult);
      outcomeSent = true;
    }
  });
  req.on('timeout', (err) => {
    checkResult.error = true;
    checkResult.value = 'timeout';
    if (!outcomeSent) {
      worker.processCheck(data, checkResult);
      outcomeSent = true;
    }
  });
  req.end();
};

worker.processCheck = (data, checkOutCome) => {
  let state =
    !checkOutCome.error &&
    checkOutCome.responseCode &&
    data.statusCode.indexOf(checkOutCome.responseCode) > -1
      ? 'up'
      : 'down';
  let alertState = data.lastChecked && data.state !== state ? true : false;
  let newData = data;
  newData.state = state;
  newData.lastChecked = Date.now();
  dataLib.update('checks', newData.id, newData, (err) => {
    if (!err) {
      if (alertState) {
        worker.alertUser(newData);
      } else {
        console.log('State Not Changed!');
      }
    } else {
      console.log('Invalid Operation!');
    }
  });
};

worker.alertUser = (newData) => {
  let msg = `Alert: Your check for ${newData.method.toUpperCase()} ${
    newData.protocol
  }://${newData.url} is currently ${newData.state} now.`;
  sendTwilioSMS(newData.phone, msg, (err) => {
    if (!err) {
      console.log('SMS send Successful.', msg);
    } else {
      console.log('SMS sending failed!');
    }
  });
};

worker.eventLoop = () => {
  setInterval(() => worker.getAllChecks(), 1000 * 60);
};

worker.init = () => {
  worker.getAllChecks();
  worker.eventLoop();
};

module.exports = worker;

module.exports = worker;
