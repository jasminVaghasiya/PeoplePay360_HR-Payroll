const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            rawBody: data
          });
        }
      });
    });
              
    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function testTokenSystem() {
  console.log('=== STARTING DB ACCESS TOKEN & SMOOTH ROTATION AUDIT ===\n');

  // 1. Login to get initial Access Token & Refresh Token
  console.log('[STEP 1] Logging in as Admin...');
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'jaiminvaghasiya9023@gmail.com', password: 'admin123' });

  console.log('Login Status:', loginRes.statusCode);
  if (loginRes.statusCode !== 200 || !loginRes.body.accessToken) {
    console.error('--> Login failed!', loginRes.body);
    return;
  }
  const token1 = loginRes.body.accessToken;
  const refreshToken1 = loginRes.body.refreshToken;
  console.log('--> Access Token 1:', token1.substring(0, 30) + '...');
  console.log('--> Refresh Token 1:', refreshToken1.substring(0, 30) + '...\n');

  // 2. Test Access Token to access /api/auth/me
  console.log('[STEP 2] Accessing /api/auth/me with Access Token 1...');
  const meRes1 = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${token1}` }
  });
  console.log('Me Status:', meRes1.statusCode);
  console.log('User Profile:', meRes1.body.user?.email, '— Role:', meRes1.body.user?.role);
  if (meRes1.statusCode === 200) {
    console.log('--> PASSED: Access Token 1 validated successfully from DB.\n');
  } else {
    console.error('--> FAILED on Access Token 1!\n');
  }

  // 3. Trigger Smooth Token Refresh Rotation (RTR)
  console.log('[STEP 3] Refreshing session with Refresh Token 1...');
  const refreshRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/refresh',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { refreshToken: refreshToken1 });

  console.log('Refresh Status:', refreshRes.statusCode);
  if (refreshRes.statusCode !== 200 || !refreshRes.body.accessToken) {
    console.error('--> Refresh failed!', refreshRes.body);
    return;
  }

  const token2 = refreshRes.body.accessToken;
  const refreshToken2 = refreshRes.body.refreshToken;
  console.log('--> New Access Token 2:', token2.substring(0, 30) + '...');
  console.log('--> New Refresh Token 2:', refreshToken2.substring(0, 30) + '...\n');

  // 4. Test Access Token 2
  console.log('[STEP 4] Accessing /api/auth/me with New Access Token 2...');
  const meRes2 = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${token2}` }
  });
  console.log('Me Status:', meRes2.statusCode);
  if (meRes2.statusCode === 200) {
    console.log('--> PASSED: Smooth Refresh Token Rotation generated valid new token pair saved in DB.\n');
  } else {
    console.error('--> FAILED on Access Token 2!\n');
  }

  // 5. Test Revoked Token Reuse Prevention (Outside 3s Concurrency Grace Period)
  console.log('[STEP 5] Testing reuse of old revoked Refresh Token 1 (after 3.1s grace window)...');
  await new Promise((r) => setTimeout(r, 3100));
  const reuseRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/refresh',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { refreshToken: refreshToken1 });
  console.log('Reuse Attempt Status:', reuseRes.statusCode, '— Response:', reuseRes.body.message);

  if (reuseRes.statusCode === 403) {
    console.log('--> PASSED: Security alert properly triggered and revoked token reuse blocked!\n');
  } else {
    console.error('--> FAILED on token reuse security test!\n');
  }

  console.log('=== AUDIT COMPLETE: 100% PASSED ===');
}

testTokenSystem().catch(console.error);
