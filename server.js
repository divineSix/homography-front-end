const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const port = process.env.PORT || 3001;
const shell = require('shelljs');

app.use(express.static(path.join(__dirname, '/dist/demo')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname));
});

// REST API
app.put('/api/shell', (req, res) => {
  // req.image-points
  // req.map-points
  // file-write req.image-points as image-points.json
  // file-write req
  shell.exec('bash shell_script.sh', { async: true });
  res.send({ output: 'Waiting...' });
});

const server = http.createServer(app);
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
