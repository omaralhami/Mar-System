const express = require('express');
const server = express();

server.all('/', (req, res) => {
  res.send('Mar System Bot is running!');
});

function keepAlive() {
  server.listen(3000, () => {
    console.log('\x1b[34m✦ \x1b[0mWeb server is ready.');
  });
}

module.exports = keepAlive; 