const http = require('http');

function makeRequest(path, method = 'GET', headers = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            rawBody: data
          });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function testConcurrencyGracePeriod() {
  console.log('=== CONCURRENCY ROTATION GRACE PERIOD AUDIT ===\n');

  // 1. Login
  const loginRes = await makeRequest('/api/auth/login', 'POST', {}, {
    email: 'jaiminvaghasiya9023@gmail.com',
    password: 'admin123'
  });
  console.log('1. Login status:', loginRes.statusCode);
  const rToken1 = loginRes.body.refreshToken;

  // 2. Perform initial rotation
  const refresh1 = await makeRequest('/api/auth/refresh', 'POST', {}, { refreshToken: rToken1 });
  console.log('2. Initial Refresh status:', refresh1.statusCode);

  // 3. Immediate concurrent re-use of rToken1 (within 10 seconds)
  const concurrentRefresh = await makeRequest('/api/auth/refresh', 'POST', {}, { refreshToken: rToken1 });
  console.log('3. Concurrent Refresh status (within grace period):', concurrentRefresh.statusCode);
  if (concurrentRefresh.statusCode === 200) {
    console.log('--> PASSED: Grace period served active tokens smoothly for concurrent request without forcing logout!');
  } else {
    console.error('--> FAILED:', concurrentRefresh.body);
  }
}

testConcurrencyGracePeriod();
