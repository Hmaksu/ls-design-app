const fetch = require('node-fetch');

async function test() {
    try {
        console.log("Logging in...");
        const res = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'mhmthep@gmail.com', password: 'password123' })
        });
        const data = await res.json();
        console.log("Login User:", data.user?.email);

        const token = data.token;
        if (!token) return console.log("Login failed");

        console.log("\nFetching /ls/published...");
        const lsRes = await fetch('http://localhost:3001/api/ls/published', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const lsData = await lsRes.json();
        console.dir(lsData, { depth: null });
    } catch (err) {
        console.error(err);
    }
}
test();
