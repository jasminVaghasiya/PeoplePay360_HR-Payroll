const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Health Status:', res.statusCode, data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
