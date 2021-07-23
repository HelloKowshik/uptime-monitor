const url = require('url');
const { StringDecoder } = require('string_decoder');
const {
  notFoundHandler,
} = require('../handlers/routeHandlers/notFoundHandler');
const { parseJSON } = require('../helpers/utils');
const routes = require('../routes');
const handler = {};

handler.hanldeReqRes = (req, res) => {
  const parsedURL = url.parse(req.url, true);
  const path = parsedURL.pathname.replace(/^\/*|\/+$/g, '');
  const method = req.method.toLowerCase();
  const statusCode = req.statusCode;
  const queryString = parsedURL.query;
  const headersObject = req.headers;
  let decoder = new StringDecoder('utf-8');
  let realData = '';
  const requestProp = {
    parsedURL,
    path,
    method,
    queryString,
    headersObject,
  };
  const chosenHandler = routes[path] ? routes[path] : notFoundHandler;

  req.on('data', (buffer) => (realData += decoder.write(buffer)));
  req.on('end', () => {
    realData += decoder.end();
    requestProp.body = parseJSON(realData);
    chosenHandler(requestProp, (statusCode, payload) => {
      statusCode = typeof statusCode === 'number' ? statusCode : 500;
      payload = typeof payload === 'object' ? payload : {};
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(JSON.stringify(payload));
    });
  });
};

module.exports = handler;
