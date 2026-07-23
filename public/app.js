/**
 * ============================================================================
 * ANTI GRAVITY FRONTEND LOGIC - SOUTH ASIAN METABOLIC HEALTH PLATFORM
 * ============================================================================
 */

let currentUserId = 'a0000000-0000-0000-0000-000000000001';
let currentSelectedFood = null;
let currentCuisineFilter = 'All';
let currentWaterIntakeLiters = 2.25;
let currentUserDataCache = null;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initOnboardingModal();
  initInteractiveWidgets();
  checkBackendHealth();
  loadUserDashboard(currentUserId);
  initFoodSearch();
  initLogMealForm();
  initMcpTrigger();
});

/**
 * Initialize Live Interactive UI Widgets (Slider, Water Tracker, Video Controls)
 */
function initInteractiveWidgets() {
  // 1. Water Tracker (+250ml button)
  const addWaterBtn = document.getElementById('addWaterBtn');
  if (addWaterBtn) {
    addWaterBtn.addEventListener('click', () => {
      currentWaterIntakeLiters += 0.25;
      document.getElementById('waterIntakeVal').textContent = `${currentWaterIntakeLiters.toFixed(2)} L / 3.0 L`;
      addWaterBtn.style.transform = 'scale(1.2)';
      setTimeout(() => addWaterBtn.style.transform = 'scale(1)', 200);
    });
  }

  // 2. Live Interactive Target Weight Slider
  const rangeSlider = document.getElementById('rangeTargetWeight');
  if (rangeSlider) {
    rangeSlider.addEventListener('input', (e) => {
      const targetVal = parseFloat(e.target.value);
      document.getElementById('liveSliderReadout').textContent = `${targetVal.toFixed(1)} kg`;
      recalculateTargetWeightLive(targetVal);
    });
  }

  // 3. Video Controls Toolbar
  const playPauseBtn = document.getElementById('vPlayPauseBtn');
  const speedBtn = document.getElementById('vSpeedBtn');
  const loopBtn = document.getElementById('vLoopBtn');
  const videoPlayer = document.getElementById('exVideoPlayer');

  if (playPauseBtn && videoPlayer) {
    playPauseBtn.addEventListener('click', () => {
      if (videoPlayer.paused) {
        videoPlayer.play();
        playPauseBtn.textContent = '⏸ Pause Demo';
      } else {
        videoPlayer.pause();
        playPauseBtn.textContent = '▶ Play Demo';
      }
    });

    let currentSpeed = 1.0;
    speedBtn.addEventListener('click', () => {
      currentSpeed = currentSpeed === 1.0 ? 1.5 : (currentSpeed === 1.5 ? 2.0 : 1.0);
      videoPlayer.playbackRate = currentSpeed;
      speedBtn.textContent = `⚡ Speed ${currentSpeed.toFixed(1)}x`;
    });

    loopBtn.addEventListener('click', () => {
      videoPlayer.loop = !videoPlayer.loop;
      loopBtn.textContent = videoPlayer.loop ? '🔁 Loop ON' : '➡️ Loop OFF';
    });
  }
}

/**
 * Recalculate Weight Goal metrics live on slider movement
 */
function recalculateTargetWeightLive(newTargetKg) {
  if (!currentUserDataCache) return;
  const currentWeightKg = currentUserDataCache.demographics.weightKg || 78.5;
  const heightCm = currentUserDataCache.demographics.heightCm || 172;
  const heightM = heightCm / 100;

  const delta = parseFloat((currentWeightKg - newTargetKg).toFixed(1));
  const targetBmi = parseFloat((newTargetKg / (heightM * heightM)).toFixed(2));
  const weeks = delta > 0 ? Math.ceil(delta / 0.65) : 0;

  document.getElementById('goalTargetWeight').textContent = `${newTargetKg.toFixed(1)} kg`;
  document.getElementById('weightDeltaLabel').textContent = delta > 0 ? `Loss Target: -${delta} kg` : `Maintain Weight Goal`;
  document.getElementById('targetBmiLabel').textContent = `Target BMI: ${targetBmi} kg/m²`;
  document.getElementById('goalEstWeeks').textContent = `${weeks} Weeks`;
  document.getElementById('goalStatusBadge').textContent = `${weeks}-Week Timeline`;

  const progressPercent = Math.min(100, Math.max(15, Math.round((1 - (delta / 25)) * 100)));
  document.getElementById('weightProgressBarFill').style.width = `${progressPercent}%`;
}

/**
 * Tab Switching Logic
 */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetTab = document.getElementById(targetId);
      if (targetTab) targetTab.classList.add('active');

      if (targetId === 'dietLoggerTab') {
        loadDailyLogsTimeline();
      }
    });
  });
}

/**
 * Check Backend Health & Neon DB Status
 */
async function checkBackendHealth() {
  try {
    const res = await fetch('/health');
    const data = await res.json();
    const statusText = document.getElementById('dbStatusText');
    if (data.neonDbConnected) {
      statusText.textContent = 'Neon DB Connected';
    } else {
      statusText.textContent = 'Neon DB (Zero-Config Mode)';
    }
  } catch (err) {
    console.warn('Backend health check error:', err);
  }
}

const API_BASE = '/api/v1';

/**
 * Load User Dashboard & Health Risk Score
 */
async function loadUserDashboard(userId) {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}/health-risk`);
    if (!res.ok) throw new Error('Failed to fetch user health risk');
    const data = await res.json();
    currentUserDataCache = data; // Cache data for live slider recalculations

    const { riskAssessment, name } = data;
    document.getElementById('userProfileBtnLabel').textContent = name || 'User Profile';

    // 1. Update Visceral Fat & MASLD Gauge Score
    updateGaugeMeter(riskAssessment.visceralFatScore, riskAssessment.riskLevel, riskAssessment.riskBadgeColor);

    // 2. Update Risk Metrics Text
    document.getElementById('dashBmiVal').textContent = `${riskAssessment.bmi} kg/m²`;
    document.getElementById('dashBmiCat').textContent = `${riskAssessment.bmiCategory} (≥23 cutoff)`;
    
    document.getElementById('dashWaistVal').textContent = `${riskAssessment.waistCircumferenceCm} cm`;
    document.getElementById('dashWaistCat').textContent = riskAssessment.elevatedWaist ? `Elevated (>${riskAssessment.waistThresholdCm} cm)` : 'Normal';

    document.getElementById('dashMasldVal').textContent = `${riskAssessment.masldProbabilityPercentage}%`;

    // 3. Show South Asian Alert Banner if triggered (BMI >= 23.0)
    const alertBanner = document.getElementById('southAsianAlertBanner');
    if (riskAssessment.southAsianActionTriggered) {
      alertBanner.classList.remove('hidden');
      document.getElementById('alertBannerText').textContent = riskAssessment.summaryMessage;
    } else {
      alertBanner.classList.add('hidden');
    }

    // 4. Update Desired Target Weight & Calorie Deficit Goal Card
    if (riskAssessment.weightGoal) {
      const wg = riskAssessment.weightGoal;
      document.getElementById('goalCurrentWeight').textContent = `${wg.currentWeightKg} kg`;
      document.getElementById('goalTargetWeight').textContent = `${wg.targetWeightKg} kg`;
      document.getElementById('goalDailyCalorie').textContent = `${wg.dailyCalorieTargetKcal.toLocaleString()} kcal`;
      document.getElementById('goalCarbCeiling').textContent = `${wg.carbCeilingGrams}g / day`;
      document.getElementById('goalEstWeeks').textContent = `${wg.estimatedWeeksToGoal} Weeks`;
      document.getElementById('goalStatusBadge').textContent = `${wg.estimatedWeeksToGoal}-Week Timeline`;

      const delta = wg.weightDeltaKg;
      document.getElementById('weightDeltaLabel').textContent = delta > 0 ? `Loss Target: -${delta} kg` : `Maintain Weight Goal`;
      document.getElementById('targetBmiLabel').textContent = `Target BMI: ${wg.targetBmi} kg/m²`;

      // Progress bar percentage (assuming start delta vs current)
      const progressPercent = Math.min(100, Math.max(15, Math.round((1 - (delta / 25)) * 100)));
      document.getElementById('weightProgressBarFill').style.width = `${progressPercent}%`;
    }

    // 5. Update Human Body Fat Distribution Map SVG & Metrics
    if (riskAssessment.estimatedBodyFatPercentage) {
      document.getElementById('bodyFatBadge').textContent = `${riskAssessment.estimatedBodyFatPercentage}% Body Fat`;
      document.getElementById('totalBfPercentVal').textContent = `${riskAssessment.estimatedBodyFatPercentage}%`;
      
      const visceralLevel = riskAssessment.visceralFatLevel || 11;
      document.getElementById('visceralLevelVal').textContent = `Level ${visceralLevel} / 20`;
      document.getElementById('visceralLevelVal').className = `stat-value ${visceralLevel > 9 ? 'status-warning' : 'status-success'}`;

      const fatDist = riskAssessment.anatomicalFatDistribution || {};
      const vatKg = ((fatDist.visceralAbdominalFatGrams || 9800) / 1000).toFixed(1);
      const satKg = ((fatDist.subcutaneousFatGrams || 12400) / 1000).toFixed(1);
      document.getElementById('visceralMassVal').textContent = `${vatKg} kg`;
      document.getElementById('subcutaneousMassVal').textContent = `${satKg} kg`;

      const ratio = satKg > 0 ? (vatKg / satKg).toFixed(2) : '0.75';
      document.getElementById('vatSatRatioVal').textContent = `${ratio} VAT/SAT`;

      // Dynamically update Visceral Core SVG Glow color
      const glowCore = document.getElementById('visceralFatGlowCore');
      if (glowCore && fatDist.glowingColor) {
        glowCore.setAttribute('stroke', fatDist.glowingColor);
        glowCore.setAttribute('fill', fatDist.glowingColor.replace(')', ', 0.45)').replace('rgb', 'rgba'));
      }
    }

    // 6. Render Exercise Prescriptions
    renderExercisePrescriptions(riskAssessment.exercisePrescriptions || []);

    // 7. Load Nutrition & Logs Breakdown for Macros
    loadDailyNutritionMacros(userId);
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

/**
 * Update Visceral Fat Gauge Meter SVG Pointer Needle
 */
function updateGaugeMeter(score, riskLevel, badgeColor) {
  document.getElementById('gaugeScoreVal').textContent = score;
  const badge = document.getElementById('visceralRiskBadge');
  badge.textContent = `${riskLevel} Risk`;
  badge.className = `risk-badge badge-${badgeColor}`;

  // Gauge angle calculation (0 score = -90 deg, 100 score = 90 deg)
  const angle = -90 + (score / 100) * 180;
  const needle = document.getElementById('gaugeNeedle');
  needle.style.transform = `rotate(${angle}deg)`;
}

let currentExerciseData = [];

/**
 * Render Visceral Fat Targeting Exercise Cards with Click Triggers
 */
function renderExercisePrescriptions(exercises) {
  currentExerciseData = exercises;
  const container = document.getElementById('exerciseGrid');
  container.innerHTML = exercises.map((ex, idx) => `
    <div class="exercise-card" onclick="openExerciseModal(${idx})">
      <h4>${ex.title}</h4>
      <span class="exercise-meta">${ex.duration} • ${ex.intensity}</span>
      <p>${ex.focus}</p>
    </div>
  `).join('');

  initExerciseModal();
}

/**
 * Open Exercise Step-by-Step Modal ("What to Do") with Visual Video Demonstration
 */
window.openExerciseModal = function(idx) {
  const ex = currentExerciseData[idx];
  if (!ex) return;

  document.getElementById('exModalTitle').textContent = ex.title;
  document.getElementById('exModalMeta').textContent = `${ex.duration} • ${ex.intensity} Intensity`;
  document.getElementById('exModalTiming').innerHTML = `<strong>Frequency & Timing:</strong> ${ex.frequency} • ${ex.timing}`;

  // Bind Interactive Exercise Video Stream & Poster
  const videoPlayer = document.getElementById('exVideoPlayer');
  const videoSource = document.getElementById('exVideoSource');
  const videoTitle = document.getElementById('exVideoTitle');

  if (videoPlayer && ex.videoUrl) {
    videoTitle.textContent = ex.videoTitle || `${ex.title} Movement Guide`;
    videoPlayer.poster = ex.videoPoster || '';
    videoSource.src = ex.videoUrl;
    videoPlayer.load(); // Reload video source
    videoPlayer.play().catch(e => console.log('Autoplay muted requirement:', e));
  }

  const stepsList = document.getElementById('exModalSteps');
  const steps = ex.whatToDoSteps || [
    'Perform warm up for 3-5 minutes.',
    'Execute main set maintaining steady pace.',
    'Cool down for 3 minutes.'
  ];
  stepsList.innerHTML = steps.map(s => `<li>${s}</li>`).join('');

  document.getElementById('exModalRationale').textContent = ex.clinicalRationale || ex.focus;

  document.getElementById('exerciseModal').classList.remove('hidden');
};

function initExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  const closeBtn = document.getElementById('closeExModalBtn');
  if (closeBtn) {
    closeBtn.onclick = () => modal.classList.add('hidden');
  }
}

/**
 * Load Daily Nutrition Macros & Update Macro Rings
 */
async function loadDailyNutritionMacros(userId) {
  try {
    const res = await fetch(`${API_BASE}/logs/diet/${userId}`);
    if (!res.ok) return;
    const data = await res.json();
    const { dailySummary } = data;

    document.getElementById('totalCalCount').textContent = dailySummary.calories.toLocaleString();
    document.getElementById('totalCarbsVal').textContent = `${dailySummary.carbsG}g`;
    document.getElementById('totalProteinVal').textContent = `${dailySummary.proteinsG}g`;
    document.getElementById('totalHiddenFatsVal').textContent = `${dailySummary.hiddenFatsG}g`;

    // Update SVG Macro Progress Rings
    // Max carb target: 200g (circumference 414.6)
    const carbOffset = 414.6 - Math.min(414.6, (dailySummary.carbsG / 250) * 414.6);
    document.getElementById('carbRingCircle').style.strokeDashoffset = carbOffset;

    // Max protein target: 60g (circumference 301.5)
    const proteinOffset = 301.5 - Math.min(301.5, (dailySummary.proteinsG / 80) * 301.5);
    document.getElementById('proteinRingCircle').style.strokeDashoffset = proteinOffset;
  } catch (err) {
    console.error('Error loading nutrition macros:', err);
  }
}

/**
 * Initialize Food Database Search & Auto-Suggest
 */
function initFoodSearch() {
  const searchInput = document.getElementById('foodSearchInput');
  const resultsContainer = document.getElementById('foodSearchResults');
  const chips = document.querySelectorAll('.cuisine-chips .chip');

  // Cuisine Chip Filtering
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCuisineFilter = chip.getAttribute('data-cuisine');
      triggerSearch();
    });
  });

  // Debounced input search
  let debounceTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(triggerSearch, 250);
  });

  async function triggerSearch() {
    const query = searchInput.value.trim();
    try {
      const res = await fetch(`${API_BASE}/food/search?query=${encodeURIComponent(query)}&cuisine=${encodeURIComponent(currentCuisineFilter)}`);
      const data = await res.json();

      if (data.foods && data.foods.length > 0) {
        resultsContainer.innerHTML = data.foods.map(item => `
          <div class="food-suggest-item" onclick="selectFoodItem('${item.id}', '${escapeHtml(item.item_name)}', '${escapeHtml(item.base_measure)}', ${item.carbs_g}, ${item.proteins_g}, ${item.fats_g}, ${item.hidden_fats_g})">
            <div>
              <span class="food-item-title">${item.item_name}</span>
              <span class="food-item-sub">${item.regional_cuisine} Cuisine • Base: ${item.base_measure}</span>
            </div>
            <span class="pill pill-carbs">${item.carbs_g}g Carbs</span>
          </div>
        `).join('');
      } else {
        resultsContainer.innerHTML = `<div style="padding:0.75rem; font-size:0.8rem; color:var(--text-muted);">No matching Indian food items found.</div>`;
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  }

  // Run initial default search
  triggerSearch();
}

/**
 * Handle Food Selection & Household Portion Selector
 */
window.selectFoodItem = function(id, name, baseMeasure, carbs, proteins, fats, hiddenFats) {
  currentSelectedFood = { id, name, baseMeasure, carbs, proteins, fats, hiddenFats };

  document.getElementById('selFoodName').textContent = name;
  document.getElementById('selFoodMeasure').textContent = baseMeasure;
  document.getElementById('selFoodCarbs').textContent = `${carbs}g Carbs`;
  document.getElementById('selFoodProteins').textContent = `${proteins}g Protein`;
  document.getElementById('selFoodFats').textContent = `${fats}g Fats`;
  document.getElementById('selFoodHidden').textContent = `${hiddenFats}g Hidden Fat`;

  document.getElementById('portionUnitText').textContent = baseMeasure;
  document.getElementById('selectedFoodPanel').classList.remove('hidden');
};

function escapeHtml(str) {
  return String(str).replace(/'/g, "\\'");
}

/**
 * Quantity Stepper Logic
 */
document.getElementById('stepMinusBtn').addEventListener('click', () => {
  const input = document.getElementById('portionQtyInput');
  const val = parseFloat(input.value) || 1.0;
  if (val > 0.5) input.value = (val - 0.5).toFixed(1);
});

document.getElementById('stepPlusBtn').addEventListener('click', () => {
  const input = document.getElementById('portionQtyInput');
  const val = parseFloat(input.value) || 1.0;
  if (val < 10.0) input.value = (val + 0.5).toFixed(1);
});

/**
 * Log Meal Form Submission
 */
function initLogMealForm() {
  document.getElementById('logMealBtn').addEventListener('click', async () => {
    if (!currentSelectedFood) return;

    const qty = parseFloat(document.getElementById('portionQtyInput').value) || 1.0;
    const mealType = document.getElementById('mealTypeSelect').value;

    try {
      const res = await fetch(`${API_BASE}/logs/diet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          food_item_id: currentSelectedFood.id,
          quantity_multiplier: qty,
          meal_type: mealType
        })
      });

      if (res.ok) {
        alert(`Logged ${qty}x ${currentSelectedFood.name} for ${mealType}!`);
        loadDailyLogsTimeline();
        loadUserDashboard(currentUserId);
      }
    } catch (err) {
      console.error('Error logging meal:', err);
    }
  });
}

/**
 * Load Today's Logged Meals Timeline
 */
async function loadDailyLogsTimeline() {
  const timeline = document.getElementById('logsTimelineList');
  try {
    const res = await fetch(`${API_BASE}/logs/diet/${currentUserId}`);
    const data = await res.json();

    if (data.logs && data.logs.length > 0) {
      timeline.innerHTML = data.logs.map(log => `
        <div class="log-timeline-item">
          <div class="log-item-left">
            <h4>${log.item_name}</h4>
            <p>${log.meal_type} • ${log.quantity_multiplier}x (${log.base_measure}) • ${log.total_carbs}g Carbs</p>
          </div>
          <div class="log-item-right">
            <span class="log-calories">${Math.round(log.total_calories)} kcal</span>
            <button class="delete-log-btn" onclick="deleteLogEntry('${log.log_id}')">Delete</button>
          </div>
        </div>
      `).join('');
    } else {
      timeline.innerHTML = `<div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">No meals logged for today yet. Use the search panel on the left to add food entries.</div>`;
    }
  } catch (err) {
    console.error('Error loading timeline:', err);
  }
}

window.deleteLogEntry = async function(logId) {
  if (!confirm('Remove this food log entry?')) return;
  try {
    const res = await fetch(`${API_BASE}/logs/diet/${logId}`, { method: 'DELETE' });
    if (res.ok) {
      loadDailyLogsTimeline();
      loadUserDashboard(currentUserId);
    }
  } catch (err) {
    console.error('Delete error:', err);
  }
};

/**
 * Onboarding Modal & Real-Time South Asian BMI Preview
 */
function initOnboardingModal() {
  const modal = document.getElementById('onboardingModal');
  const openBtn = document.getElementById('onboardingBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const form = document.getElementById('onboardingForm');

  openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  // Live BMI Preview calculation
  const heightInput = document.getElementById('obHeight');
  const weightInput = document.getElementById('obWeight');

  function updateBmiPreview() {
    const h = parseFloat(heightInput.value) || 170;
    const w = parseFloat(weightInput.value) || 70;
    const bmi = (w / ((h / 100) * (h / 100))).toFixed(2);

    document.getElementById('previewBmiVal').textContent = `${bmi} kg/m²`;
    const badge = document.getElementById('previewBmiBadge');

    if (bmi >= 25.0) {
      badge.textContent = 'Obese (≥25.0)';
      badge.className = 'risk-badge badge-crimson';
    } else if (bmi >= 23.0) {
      badge.textContent = 'Overweight Trigger (≥23.0)';
      badge.className = 'risk-badge badge-amber';
    } else {
      badge.textContent = 'Normal (18.5-22.9)';
      badge.className = 'risk-badge badge-emerald';
    }
  }

  heightInput.addEventListener('input', updateBmiPreview);
  weightInput.addEventListener('input', updateBmiPreview);
  updateBmiPreview();

  // Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('obName').value,
      age: parseInt(document.getElementById('obAge').value),
      gender: document.getElementById('obGender').value,
      height_cm: parseFloat(document.getElementById('obHeight').value),
      baseline_weight_kg: parseFloat(document.getElementById('obWeight').value),
      target_weight_kg: parseFloat(document.getElementById('obTargetWeight').value) || 68.0,
      waist_circumference_cm: parseFloat(document.getElementById('obWaist').value),
      fasting_blood_sugar_mg_dl: parseFloat(document.getElementById('obFastingSugar').value) || null,
      hba1c_percentage: parseFloat(document.getElementById('obHba1c').value) || null,
      family_history_diabetes: document.getElementById('obFamilyDiabetes').checked,
      known_masld: document.getElementById('obKnownMasld').checked
    };

    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        currentUserId = data.user.id;
        modal.classList.add('hidden');
        loadUserDashboard(currentUserId);
        alert('Baseline profile saved & South Asian risk computed!');
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
  });
}

/**
 * Model Context Protocol (MCP) AI Evaluation Simulation Trigger
 */
function initMcpTrigger() {
  document.getElementById('triggerMcpBtn').addEventListener('click', async () => {
    const resultsBox = document.getElementById('mcpResultsBox');
    resultsBox.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--emerald);">Running MCP AI Agent analysis on diet logs...</div>`;

    try {
      // Fetch user's current logs to feed to MCP endpoint
      const logsRes = await fetch(`${API_BASE}/logs/diet/${currentUserId}`);
      const logsData = await logsRes.json();

      const mcpRes = await fetch(`${API_BASE}/mcp/analyze-diet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          loggedMeals: logsData.logs || []
        })
      });

      const mcpData = await mcpRes.json();

      if (mcpData.aiRecommendations) {
        resultsBox.innerHTML = `
          <div style="margin-bottom:1rem; font-size:0.85rem; color:var(--text-muted);">
            MCP Protocol Version: <strong>${mcpData.mcpProtocolVersion}</strong> • Carb:Protein Ratio: <strong>${mcpData.contextSummary.carbToProteinRatio}:1</strong>
          </div>
          ${mcpData.aiRecommendations.map(rec => `
            <div class="mcp-recommendation-card">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
                <strong style="color:var(--amber); font-size:0.9rem;">${rec.type}</strong>
                <span class="risk-badge badge-${rec.severity === 'HIGH' ? 'crimson' : 'amber'}">${rec.severity} SEVERITY</span>
              </div>
              <p style="font-size:0.85rem; color:var(--text-main); line-height:1.4;">${rec.message}</p>
            </div>
          `).join('')}
        `;
      }
    } catch (err) {
      console.error('MCP Trigger error:', err);
      resultsBox.innerHTML = `<div style="color:var(--crimson); padding:1rem;">Failed to execute MCP Evaluation.</div>`;
    }
  });
}
