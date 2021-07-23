const handler = {};
handler.sampleHandler = (requestProp, callback) => {
  callback(200, {
    msg: 'Sample Data',
  });
};
module.exports = handler;
