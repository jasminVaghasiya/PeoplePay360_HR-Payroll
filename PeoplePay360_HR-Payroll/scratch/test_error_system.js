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

async function runTests() {
  console.log('=== STARTING PRODUCTION ERROR HANDLING & VALIDATION AUDIT ===\n');

  // Test 1: Invalid Joi Login Input
  console.log('[TEST 1] Testing Joi Schema Input Validation on /api/auth/login...');
  const res1 = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'invalid-email-format', password: '' });

  console.log('Status:', res1.statusCode);
  console.log('X-Request-Id:', res1.headers['x-request-id']);
  console.log('Payload:', JSON.stringify(res1.body, null, 2));

  if (res1.statusCode === 422 && res1.body.error?.code === 'VALIDATION_ERROR' && res1.body.error?.fields?.email) {
    console.log('--> PASSED: Joi Schema Validation correctly returned 422 VALIDATION_ERROR with field-level map.\n');
  } else {
    console.error('--> FAILED: Invalid login input test failed.\n');
  }

  // Test 2: Invalid Credentials Auth Failure
  console.log('[TEST 2] Testing Authentication Failure on /api/auth/login...');
  const res2 = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@peoplepay360.com', password: 'wrongpassword' });

  console.log('Status:', res2.statusCode);
  console.log('X-Request-Id:', res2.headers['x-request-id']);
  console.log('Payload:', JSON.stringify(res2.body, null, 2));

  if (res2.statusCode === 401 && (res2.body.error?.code === 'UNAUTHORIZED' || res2.body.message)) {
    console.log('--> PASSED: Auth Failure correctly returned 401 UNAUTHORIZED with sanitized message.\n');
  } else {
    console.error('--> FAILED: Auth failure test failed.\n');
  }

  // Test 3: Route Not Found (404)
  console.log('[TEST 3] Testing 404 AppError on non-existent endpoint...');
  const res3 = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/non-existent-endpoint-xyz',
    method: 'GET'
  });

  console.log('Status:', res3.statusCode);
  console.log('X-Request-Id:', res3.headers['x-request-id']);
  console.log('Payload:', JSON.stringify(res3.body, null, 2));

  if (res3.statusCode === 404 && res3.body.error?.code === 'RESOURCE_NOT_FOUND') {
    console.log('--> PASSED: 404 AppError correctly returned 404 RESOURCE_NOT_FOUND.\n');
  } else {
    console.error('--> FAILED: 404 endpoint test failed.\n');
  }

  // Test 4: Verify Sensitive Data Sanitization (No stack trace, DB details in response)
  console.log('[TEST 4] Checking payload sanitization...');
  const bodyStr = JSON.stringify(res1.body) + JSON.stringify(res2.body) + JSON.stringify(res3.body);
  const containsStack = bodyStr.includes('stack') || bodyStr.includes('node_modules') || bodyStr.includes('mongodb');

  if (!containsStack) {
    console.log('--> PASSED: No sensitive internal stack traces or database info leaked in API responses!\n');
  } else {
    console.error('--> FAILED: Sensitive stack info detected in API response!\n');
  }

  console.log('=== AUDIT COMPLETE ===');
}

runTests().catch(console.error);
