const { io } = require('socket.io-client');
const axios = require('axios');

const API_URL = 'https://api.creziax.cloud';

async function runTest() {
  console.log('🚀 Starting Deep Live Socket Validation...');

  try {
    // 1. Login Admin
    const adminRes = await axios.post(`${API_URL}/api/users/login`, {
      email: 'admin@creziax.com',
      password: 'Admin@123'
    });
    const adminToken = adminRes.data.token;
    const adminUser = adminRes.data;
    console.log('✅ Admin Logged In:', adminUser.id);

    // 2. Login Client
    const clientRes = await axios.post(`${API_URL}/api/users/login`, {
      email: 'me618@gmail.com',
      password: 'me618@gmail.com'
    });
    const clientToken = clientRes.data.token;
    const clientUser = clientRes.data;
    console.log('✅ Client Logged In:', clientUser.id);

    // 3. Connect Socket as Client
    const socket = io(API_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('🟢 Client Socket Connected! ID:', socket.id);
      socket.emit('join_rooms', {
        userId: clientUser.id,
        role: clientUser.role,
        projectIds: []
      });
      console.log(`📡 Emitted join_rooms for user_${clientUser.id}`);
    });

    socket.on('receive_message', async (msg) => {
      console.log('📨 SOCKET RECEIVED: receive_message ->', msg.content);
      
      // Admin deletes the message immediately after client receives it
      console.log(`🗑️ Admin deleting message ${msg.id} for everyone...`);
      try {
        await axios.delete(`${API_URL}/api/messages/${msg.id}?type=everyone`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Admin API Delete Success!');
      } catch(e) {
        console.error('❌ Admin Delete Failed:', e.response?.data || e.message);
      }
    });

    socket.on('message_deleted', (data) => {
      console.log('🚨 SOCKET RECEIVED: message_deleted ->', data);
      console.log('🎯 TEST CONCLUDED SUCCESSFULLY! Backend Socket Broadcast IS WORKING PERFECTLY.');
      process.exit(0);
    });

    // Wait a brief moment for socket to bind
    setTimeout(async () => {
      console.log('✉️ Admin sending test message to Client...');
      try {
        await axios.post(`${API_URL}/api/messages`, {
          content: 'Test message from Validation Script',
          receiverId: clientUser.id,
          type: 'PRIVATE'
        }, {
           headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Admin API Send Success!');
      } catch(e) {
        console.error('❌ Admin Send Failed:', e.response?.data || e.message);
        process.exit(1);
      }
    }, 2000);

    // Timeout fail-safe
    setTimeout(() => {
      console.error('⏰ TIMEOUT: Never received message_deleted socket event.');
      process.exit(1);
    }, 15000);

  } catch (error) {
    console.error('❌ Diagnostic Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTest();
