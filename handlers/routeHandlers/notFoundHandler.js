const handler = {};
handler.notFoundHandler = (requestProp, callback) => {
  callback(404, {
    msg: 'Bad Request',
  });
};
module.exports = handler;
