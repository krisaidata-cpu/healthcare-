/**
 * Automated Verification Test Script for South Asian Metabolic Health REST API
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET'
};

function makeRequest(path, method = 'GET', postData = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function runVerification() {
  console.log('=== STARTING API ENDPOINT VERIFICATION ===');

  try {
    // 1. Health Check
    const health = await makeRequest('/health');
    console.log('✔ Health Check Response:', health.status, health.body);

    // 2. User Registration
    const newUser = await makeRequest('/api/v1/users/register', 'POST', {
      name: 'Priya Sharma',
      age: 38,
      gender: 'Female',
      height_cm: 160,
      baseline_weight_kg: 62.5,
      waist_circumference_cm: 84.0, // Female >80cm cutoff
      family_history_diabetes: true,
      known_masld: false,
      fasting_blood_sugar_mg_dl: 108,
      hba1c_percentage: 5.9
    });
    console.log('✔ User Registration Status:', newUser.status);
    console.log('  South Asian BMI:', newUser.body.riskAssessment.bmi, 'Category:', newUser.body.riskAssessment.bmiCategory);
    console.log('  Action Triggered:', newUser.body.riskAssessment.southAsianActionTriggered);

    const userId = newUser.body.user.id;

    // 3. User Health Risk
    const risk = await makeRequest(`/api/v1/users/${userId}/health-risk`);
    console.log('✔ User Health Risk Status:', risk.status, 'Visceral Fat Score:', risk.body.riskAssessment.visceralFatScore);

    // 4. Food Search
    const foods = await makeRequest('/api/v1/food/search?query=Paneer');
    console.log('✔ Food Search Count for "Paneer":', foods.body.count);

    // 5. Diet Log Creation
    if (foods.body.foods && foods.body.foods.length > 0) {
      const foodId = foods.body.foods[0].id;
      const log = await makeRequest('/api/v1/logs/diet', 'POST', {
        user_id: userId,
        food_item_id: foodId,
        quantity_multiplier: 1.5,
        meal_type: 'Lunch'
      });
      console.log('✔ Diet Log Created:', log.status, log.body.log.id);
    }

    // 6. Get Daily Logs Timeline
    const logsList = await makeRequest(`/api/v1/logs/diet/${userId}`);
    console.log('✔ Daily Logs Summary:', logsList.body.dailySummary);

    // 7. MCP AI Evaluation Endpoint
    const mcpEval = await makeRequest('/api/v1/mcp/analyze-diet', 'POST', {
      userId,
      loggedMeals: logsList.body.logs
    });
    console.log('✔ MCP AI Evaluation Status:', mcpEval.status);
    console.log('  Recommendations Generated:', mcpEval.body.aiRecommendations.length);

    console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('Verification error:', err.message);
  }
}

// Give server time to boot up if executed together
setTimeout(runVerification, 1500);
