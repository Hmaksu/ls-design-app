// Quick API test script
const http = require('http');

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: 3001,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(global.TOKEN ? { 'Authorization': `Bearer ${global.TOKEN}` } : {})
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                catch { resolve({ status: res.statusCode, data: body }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function test() {
    console.log('=== 1. Register ===');
    const reg = await request('POST', '/api/auth/register', {
        name: 'Test User', email: 'test@example.com', password: 'password123'
    });
    console.log('Status:', reg.status, JSON.stringify(reg.data, null, 2));

    if (reg.data.token) {
        global.TOKEN = reg.data.token;

        console.log('\n=== 2. Get Me ===');
        const me = await request('GET', '/api/auth/me');
        console.log('Status:', me.status, JSON.stringify(me.data, null, 2));

        console.log('\n=== 3. Create LS ===');
        const createRes = await request('POST', '/api/ls', {
            station: { id: 'test-ls-1', title: 'Test Station', code: 'TS-001', modules: [], level: 'Basic' }
        });
        console.log('Status:', createRes.status, JSON.stringify(createRes.data, null, 2));

        console.log('\n=== 4. List LS ===');
        const listRes = await request('GET', '/api/ls');
        console.log('Status:', listRes.status, JSON.stringify(listRes.data, null, 2));

        console.log('\n=== 5. Update LS ===');
        const updateRes = await request('PUT', '/api/ls/test-ls-1', {
            station: { id: 'test-ls-1', title: 'Updated Station', code: 'TS-001', modules: [{ id: 'm1' }], level: 'Advanced' }
        });
        console.log('Status:', updateRes.status, JSON.stringify(updateRes.data, null, 2));

        console.log('\n=== 6. Get Single LS ===');
        const getRes = await request('GET', '/api/ls/test-ls-1');
        console.log('Status:', getRes.status, JSON.stringify(getRes.data, null, 2));

        console.log('\n=== 7. Delete LS ===');
        const delRes = await request('DELETE', '/api/ls/test-ls-1');
        console.log('Status:', delRes.status, JSON.stringify(delRes.data, null, 2));

        console.log('\n=== 8. List After Delete ===');
        const listRes2 = await request('GET', '/api/ls');
        console.log('Status:', listRes2.status, JSON.stringify(listRes2.data, null, 2));
    }

    console.log('\n=== 9. Login ===');
    const login = await request('POST', '/api/auth/login', {
        email: 'test@example.com', password: 'password123'
    });
    console.log('Status:', login.status, JSON.stringify(login.data, null, 2));

    console.log('\n=== 10. Login with wrong password ===');
    const badLogin = await request('POST', '/api/auth/login', {
        email: 'test@example.com', password: 'wrongpass'
    });
    console.log('Status:', badLogin.status, JSON.stringify(badLogin.data, null, 2));

    console.log('\n✅ All tests completed!');
}

test().catch(console.error);
