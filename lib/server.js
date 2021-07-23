const http = require('http');
const { hanldeReqRes } = require('../helpers/handleReqRes'); //'./helpers/handleReqRes'
const environment = require('../helpers/env'); //'./helpers/env'
const server = {};

server.createServer = () => {
  const localServer = http.createServer(server.handleRequest);
  localServer.listen(environment.port, () => console.log('connected'));
};

server.handleRequest = hanldeReqRes;

server.init = () => {
  server.createServer();
};

module.exports = server;
