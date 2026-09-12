const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const FormData = require('form-data');
const { createReadStream } = require('fs');

const API_URL = 'http://127.0.0.1:8081/api';
const PENDRIVE_PATH = '/tmp/homecloud_pendrive';
const PENDRIVE_OFFLINE_PATH = '/tmp/homecloud_pendrive_offline';

async function runTest() {
  console.log('--- Starting End-to-End Test ---');
  let token = '';
  let userId = '';

  try {
    // 1. Health check (storage should be connected)
    console.log('Checking health...');
    let health = await axios.get(`${API_URL}/health`);
    if (health.data.storage !== 'connected') throw new Error('Storage should be connected');
    console.log('Health check passed.');

    // 2. Register user
    console.log('Registering test user...');
    const email = `test_${Date.now()}@example.com`;
    const authRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email: email,
      password: 'password123'
    });
    token = authRes.data.token;
    userId = authRes.data.user.id;
    console.log('User registered.');

    // 3. Upload a file
    console.log('Creating a dummy file to upload...');
    const dummyFile = '/tmp/test_upload.txt';
    const content = 'Hello from Home Cloud E2E Test!';
    await fs.writeFile(dummyFile, content);

    console.log('Uploading file...');
    const form = new FormData();
    form.append('file', createReadStream(dummyFile));
    
    const uploadRes = await axios.post(`${API_URL}/files/upload`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
    });
    const fileId = uploadRes.data.id;
    const storedName = uploadRes.data.storedName;
    console.log('File uploaded. File ID:', fileId);

    // 4. Verify physical file exists on "pendrive"
    const physicalPath = path.join(PENDRIVE_PATH, 'users', userId, storedName);
    const stat = await fs.stat(physicalPath);
    if (!stat.isFile()) throw new Error('File was not physically stored on the pendrive');
    const diskContent = await fs.readFile(physicalPath, 'utf8');
    if (diskContent !== content) throw new Error('File content mismatch');
    console.log('Physical file verified on pendrive.');

    // 5. Download file
    console.log('Downloading file...');
    const downloadRes = await axios.get(`${API_URL}/files/${fileId}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (downloadRes.data !== content) throw new Error('Downloaded content mismatch');
    console.log('Download verified.');

    // 6. Rename file
    console.log('Renaming file...');
    await axios.patch(`${API_URL}/files/${fileId}`, { originalName: 'renamed.txt' }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getRes = await axios.get(`${API_URL}/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (getRes.data.originalName !== 'renamed.txt') throw new Error('Rename failed');
    console.log('Rename verified.');

    // 7. Disconnect storage
    console.log('Simulating storage disconnect...');
    await fs.rename(PENDRIVE_PATH, PENDRIVE_OFFLINE_PATH);
    
    // Check health again
    health = await axios.get(`${API_URL}/health`);
    if (health.data.storage !== 'disconnected') throw new Error('Storage should be disconnected');
    console.log('Storage disconnect detected successfully.');

    // Reconnect storage
    console.log('Reconnecting storage...');
    await fs.rename(PENDRIVE_OFFLINE_PATH, PENDRIVE_PATH);
    health = await axios.get(`${API_URL}/health`);
    if (health.data.storage !== 'connected') throw new Error('Storage should be connected after reconnect');
    console.log('Storage reconnect detected successfully.');

    // 8. Delete file
    console.log('Deleting file...');
    await axios.delete(`${API_URL}/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Verify physical deletion
    try {
      await fs.stat(physicalPath);
      throw new Error('File still exists on disk after deletion');
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    console.log('File physically deleted.');

    console.log('--- ALL E2E TESTS PASSED ---');
  } catch (error) {
    console.error('Test Failed:', error.message || error);
    if (error.response) console.error(error.response.data);
    process.exit(1);
  } finally {
    // Cleanup
    try { await fs.unlink('/tmp/test_upload.txt'); } catch(e){}
  }
}

runTest();
