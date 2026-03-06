const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STRICT_EXTERNAL_TESTS = process.env.STRICT_EXTERNAL_TESTS === 'true';

console.log('🧪 Testing GENEXUS-AI API endpoints...');
console.log(`🌐 Base URL: ${BASE_URL}`);

function isUpstreamLimitation(error) {
  const status = error.response?.status;
  const wrappedStatus = error.response?.data?.status;
  const code = wrappedStatus || status;
  return code === 401 || code === 403 || code === 429;
}

function reportExternalResult(name, error) {
  if (isUpstreamLimitation(error) && !STRICT_EXTERNAL_TESTS) {
    const code = error.response?.data?.status || error.response?.status;
    console.warn(`⚠️ ${name} limited by upstream/API key policy: ${code}`);
    return true;
  }

  console.error(`❌ ${name} failed:`, error.message);
  if (error.response) {
    console.error('Response data:', error.response.data);
  }
  return false;
}

async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health Check failed:', error.message);
    return false;
  }
}

async function testModelLists() {
  console.log('\n📋 Testing Model Lists...');
  try {
    const imageModels = await axios.get(`${BASE_URL}/api/images/models`);
    const videoModels = await axios.get(`${BASE_URL}/api/videos/models`);
    const chatModels = await axios.get(`${BASE_URL}/api/chat/models`);

    console.log('✅ Image Models:', imageModels.data.data.length, 'models available');
    console.log('✅ Video Models:', videoModels.data.data.length, 'models available');
    console.log('✅ Chat Models:', chatModels.data.data.length, 'models available');

    return true;
  } catch (error) {
    console.error('❌ Model Lists failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testImageGeneration() {
  console.log('\n🎨 Testing Image Generation...');
  try {
    const postData = {
      prompt: 'A majestic lion in the savannah',
      model: 'turbo',
      width: 1024,
      height: 1024
    };

    const response = await axios.post(`${BASE_URL}/api/images/generate`, postData);
    console.log('✅ POST Image Generation:', response.data.message);
    return true;
  } catch (error) {
    return reportExternalResult('Image Generation', error);
  }
}

async function testVideoGeneration() {
  console.log('\n🎬 Testing Video Generation...');
  try {
    const postData = {
      prompt: 'A futuristic city with flying cars',
      model: 'seedance',
      duration: 5
    };

    const response = await axios.post(`${BASE_URL}/api/videos/generate`, postData);
    console.log('✅ Video Generation:', response.data.message);
    return true;
  } catch (error) {
    return reportExternalResult('Video Generation', error);
  }
}

async function testChatGeneration() {
  console.log('\n💬 Testing Chat Generation...');
  try {
    const postData = {
      prompt: 'Explain quantum computing in simple terms',
      model: 'gemini-fast',
      temperature: 0.7,
      max_tokens: 500
    };

    const response = await axios.post(`${BASE_URL}/api/chat/chat`, postData);
    console.log('✅ Chat Generation:', response.data.message);
    return true;
  } catch (error) {
    return reportExternalResult('Chat Generation', error);
  }
}

async function testMetricsAndEditValidation() {
  console.log('\n🧩 Testing Metrics + Edit Validation...');
  try {
    const metrics = await axios.get(`${BASE_URL}/metrics`);
    if (!metrics.data.memory || !metrics.data.process) {
      throw new Error('Metrics format invalid');
    }

    const editResponse = await axios.post(`${BASE_URL}/api/edit/image`, {}, {
      validateStatus: () => true
    });

    if (editResponse.status !== 400) {
      throw new Error(`Expected 400 for missing image file, got ${editResponse.status}`);
    }

    console.log('✅ Metrics endpoint and edit validation are working');
    return true;
  } catch (error) {
    console.error('❌ Metrics/Edit validation failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  let allPassed = true;

  console.log('='.repeat(50));
  console.log('🚀 STARTING GENEXUS-AI API TESTS');
  console.log('='.repeat(50));

  const tests = [
    testHealthCheck,
    testModelLists,
    testMetricsAndEditValidation,
    testImageGeneration,
    testVideoGeneration,
    testChatGeneration
  ];

  for (const test of tests) {
    const result = await test();
    allPassed = allPassed && result;
    console.log('-'.repeat(50));
  }

  console.log('='.repeat(50));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('❌ SOME TESTS FAILED. Please check the errors above.');
  }
  console.log('='.repeat(50));

  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch((error) => {
  console.error('💥 Unexpected error during testing:', error);
  process.exit(1);
});
