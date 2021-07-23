const server = require('./lib/server');
const workers = require('./lib/worker');
const app = {};

app.init = () => {
  server.init();
  workers.init();
};

app.init();
