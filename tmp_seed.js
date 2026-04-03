
const axios = require('axios');

async function seed() {
  try {
    console.log('Resetting and seeding database...');
    const resp = await axios.post('http://localhost:3000/api/v1/seed/reset');
    console.log('Success:', resp.data);
  } catch (err) {
    console.error('Error seeding:', err.response?.data || err.message);
  }
}

seed();
