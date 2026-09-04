import http from 'http';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

function postJson(urlStr: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const urlObj = new URL(urlStr);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 8000,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };


    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

function getJson(urlStr: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 8000,
      path: urlObj.pathname + urlObj.search,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function runLLMTest() {
  console.log('----------------------------------------------------');
  console.log('  BusinessMind AI — LLM Pipeline Diagnostic Test    ');
  console.log('----------------------------------------------------');
  console.log(`AI Microservice Target : ${AI_SERVICE_URL}`);
  console.log('Testing connectivity & Ollama Qwen3 model health...');

  try {
    // Step 1: Health & Model Check
    const modelsInfo = await getJson(`${AI_SERVICE_URL}/api/v1/ai/models`);
    console.log('----------------------------------------------------');
    console.log('✅ AI Microservice Health & Model Check:');
    console.log(`  Ollama Server Online : ${modelsInfo.ollama_status?.online}`);
    console.log(`  Target Reasoning LLM : ${modelsInfo.ollama_status?.target_llm}`);
    console.log(`  Target Embed Model   : ${modelsInfo.ollama_status?.target_embed}`);
    console.log(`  Available Models     : ${JSON.stringify(modelsInfo.ollama_status?.models)}`);

    // Step 2: Query Router Test
    const testQuestion = "Why did sales decrease in July and what actions should management take?";
    console.log('----------------------------------------------------');
    console.log(`Executing Question Router Classification...`);
    console.log(`Question: "${testQuestion}"`);

    const routerResult = await postJson(`${AI_SERVICE_URL}/api/v1/ai/classify`, { question: testQuestion });
    console.log(`✅ Router Category Result: [ ${routerResult.category} ]`);

    // Step 3: Full End-to-End LLM Pipeline Execution (SQL + RAG + Ollama Qwen3 8B)
    console.log('----------------------------------------------------');
    console.log('Executing Full LLM + RAG + SQL Pipeline Chat Call...');
    const chatResult = await postJson(`${AI_SERVICE_URL}/api/v1/ai/chat`, { question: testQuestion });

    if (chatResult.success && chatResult.data) {
      const data = chatResult.data;
      console.log('----------------------------------------------------');
      console.log('🎉 LLM RESPONSE GENERATED SUCCESSFULLY!');
      console.log('----------------------------------------------------');
      console.log(`Category Classified : ${data.category}`);
      console.log(`SQL Context Used    : ${data.sql_context_used}`);
      console.log(`RAG Context Used    : ${data.rag_context_used}`);
      console.log(`FAISS Sources Used  : ${data.sources?.length || 0} document chunk(s)`);
      console.log('----------------------------------------------------');
      console.log('Executive 5-Point Output Parsed:');
      console.log(`1. Direct Answer        : ${data.sections?.direct_answer}`);
      console.log(`2. Key Drivers          : ${JSON.stringify(data.sections?.key_drivers)}`);
      console.log(`3. Supporting Evidence  : ${data.sections?.supporting_evidence}`);
      console.log(`4. Recommended Action   : ${JSON.stringify(data.sections?.recommended_action)}`);
      console.log(`5. Risk Level           : ${data.sections?.risk_level} (${data.sections?.risk_justification})`);
      console.log('----------------------------------------------------');
      console.log('🎉 RESULT: Backend LLM test PASSED completely!');
      process.exit(0);
    } else {
      console.error('❌ Failed to retrieve structured response from LLM.');
      console.error('Full response:', JSON.stringify(chatResult, null, 2));
      process.exit(1);
    }

  } catch (error: any) {
    console.error('----------------------------------------------------');
    console.error('❌ LLM DIAGNOSTIC TEST FAILED!');
    console.error(`Error Message: ${error.message}`);
    console.error('Make sure ai-service is running on http://localhost:8000');
    console.error('Start command: cd ai-service && uvicorn app.main:app --reload');
    process.exit(1);
  }
}

runLLMTest();
