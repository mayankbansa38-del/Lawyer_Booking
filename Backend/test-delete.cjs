
const axios = require('axios');

async function testDelete() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
            email: 'admin@nyaybooker.com',
            password: 'Admin@123456'
        });
        const token = loginRes.data.data.accessToken;
        console.log('   Logged in.');

        console.log('2. Creating user...');
        const userRes = await axios.post('http://localhost:5000/api/v1/auth/register', {
            email: `delete_${Date.now()}@test.com`,
            password: 'User@12345',
            firstName: 'To',
            lastName: 'Delete',
            phone: '+919999999999',
            role: 'USER',
            confirmPassword: 'User@12345'
        });
        // Handle different response structures
        const userId = userRes.data.data.user ? userRes.data.data.user.id : userRes.data.data.id;
        console.log(`   User created: ${userId}`);

        console.log('3. Deleting user...');
        const delRes = await axios.delete(`http://localhost:5000/api/v1/admin/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Delete response:', delRes.data);
        console.log('SUCCESS: Backend delete works!');

    } catch (err) {
        console.error('FAILURE:', err.response ? err.response.data : err.message);
    }
}

testDelete();
