/**
 * ============================================================================
 * SOUTH ASIAN METABOLIC HEALTH & VISCERAL FAT RISK CALCULATOR
 * Standardized according to WHO South Asian BMI Cutoffs & ICMR Guidelines
 * ============================================================================
 */

/**
 * Calculates South Asian Adjusted BMI and returns metabolic status.
 * @param {number} weightKg 
 * @param {number} heightCm 
 * @returns {object} { bmi, category, riskTriggered, message }
 */
function calculateSouthAsianBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) {
    throw new Error('Valid height (cm) and weight (kg) are required.');
  }

  const heightMeters = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightMeters * heightMeters)).toFixed(2));

  let category = '';
  let riskTriggered = false;
  let message = '';

  if (bmi < 18.5) {
    category = 'Underweight';
    riskTriggered = false;
    message = 'BMI is below 18.5. Monitor micronutrient intake and lean muscle mass.';
  } else if (bmi >= 18.5 && bmi <= 22.9) {
    category = 'Normal';
    riskTriggered = false;
    message = 'BMI is within normal range for South Asian populations (18.5 - 22.9). Maintain healthy lifestyle.';
  } else if (bmi >= 23.0 && bmi <= 24.9) {
    category = 'Overweight';
    riskTriggered = true;
    message = 'METABOLIC WARNING TRIGGERED: South Asian BMI >= 23.0 indicates elevated risk for visceral fat accumulation, insulin resistance, and MASLD.';
  } else {
    category = 'Obese';
    riskTriggered = true;
    message = 'HIGH METABOLIC RISK TRIGGERED: South Asian BMI >= 25.0 indicates significant risk for Type-2 Diabetes and MASLD.';
  }

  return {
    bmi,
    category,
    riskTriggered,
    message
  };
}

/**
 * Calculates Visceral Fat Risk Score (0 - 100) and MASLD Probability
 * @param {object} params 
 * @returns {object}
 */
function calculateComprehensiveMetabolicRisk(params) {
  const {
    height_cm,
    baseline_weight_kg,
    gender,
    waist_circumference_cm,
    family_history_diabetes,
    known_masld,
    fasting_blood_sugar_mg_dl,
    hba1c_percentage
  } = params;

  const bmiResult = calculateSouthAsianBMI(baseline_weight_kg, height_cm);
  const heightM = height_cm / 100;
  const whtr = parseFloat((waist_circumference_cm / height_cm).toFixed(3)); // Waist-to-Height Ratio

  // South Asian Waist Circumference Risk Cutoffs
  const isMale = (gender || '').toLowerCase() === 'male';
  const waistThreshold = isMale ? 90 : 80;
  const elevatedWaist = waist_circumference_cm > waistThreshold;

  // Base Visceral Fat Score Calculation (0-100)
  let visceralFatScore = 20; // baseline

  // 1. BMI Component (up to +30 points)
  if (bmiResult.bmi >= 25.0) visceralFatScore += 30;
  else if (bmiResult.bmi >= 23.0) visceralFatScore += 20;
  else if (bmiResult.bmi >= 21.0) visceralFatScore += 10;

  // 2. Waist Circumference / WHtR Component (up to +30 points)
  if (whtr >= 0.6) visceralFatScore += 30;
  else if (whtr >= 0.53) visceralFatScore += 22;
  else if (elevatedWaist) visceralFatScore += 15;

  // 3. Glycemic Biomarkers Component (up to +25 points)
  if (hba1c_percentage) {
    if (hba1c_percentage >= 6.5) visceralFatScore += 25;
    else if (hba1c_percentage >= 5.7) visceralFatScore += 15;
  } else if (fasting_blood_sugar_mg_dl) {
    if (fasting_blood_sugar_mg_dl >= 126) visceralFatScore += 25;
    else if (fasting_blood_sugar_mg_dl >= 100) visceralFatScore += 15;
  }

  // Cap score between 0 and 100
  visceralFatScore = Math.min(100, Math.max(5, visceralFatScore));

  // MASLD Probability Calculation (%)
  let masldProbability = Math.round(visceralFatScore * 0.85);
  if (known_masld) masldProbability = Math.max(90, masldProbability);

  // Determine Risk Category
  let riskLevel = 'Low';
  let riskBadgeColor = 'emerald';
  if (visceralFatScore >= 70) {
    riskLevel = 'High';
    riskBadgeColor = 'crimson';
  } else if (visceralFatScore >= 45) {
    riskLevel = 'Moderate';
    riskBadgeColor = 'amber';
  }

  // South Asian Body Fat % & Visceral Fat Area Calculation
  const age = params.age || 40;
  const genderNum = isMale ? 1 : 0;
  
  // South Asian Modified Deurenberg Body Fat Formula
  const rawBfPercent = (1.20 * bmiResult.bmi) + (0.23 * age) - (10.8 * genderNum) - 5.4;
  const estimatedBodyFatPercentage = Math.min(50, Math.max(10, parseFloat(rawBfPercent.toFixed(1))));

  // Visceral Fat Level (Scale 1 to 20; >9 indicates high abdominal visceral fat)
  let visceralFatLevel = Math.round(whtr * 22);
  if (elevatedWaist) visceralFatLevel = Math.max(10, visceralFatLevel);
  visceralFatLevel = Math.min(20, Math.max(1, visceralFatLevel));

  // Regional Fat Distribution Breakdown
  const anatomicalFatDistribution = {
    visceralAbdominalFatGrams: Math.round(baseline_weight_kg * (estimatedBodyFatPercentage / 100) * 0.45),
    subcutaneousFatGrams: Math.round(baseline_weight_kg * (estimatedBodyFatPercentage / 100) * 0.55),
    highRiskAbdominalOrganFat: elevatedWaist || whtr >= 0.53,
    glowingColor: visceralFatLevel >= 12 ? '#ef4444' : (visceralFatLevel >= 8 ? '#f59e0b' : '#10b981')
  };

  // Desired Weight Goal & South Asian Caloric Deficit Calculation
  const targetWeightKg = parseFloat((params.target_weight_kg || (isMale ? 68.0 : 58.0)).toFixed(1));
  const weightDeltaKg = parseFloat((baseline_weight_kg - targetWeightKg).toFixed(1));
  
  // Calculate target BMI at desired weight
  const targetBmi = parseFloat((targetWeightKg / (heightM * heightM)).toFixed(2));
  
  // Estimated Basal Metabolic Rate (BMR) & Daily Calorie Target with 400 kcal deficit
  const bmr = isMale 
    ? (10 * baseline_weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    : (10 * baseline_weight_kg) + (6.25 * height_cm) - (5 * age) - 161;
  const maintenanceCalories = Math.round(bmr * 1.35); // Light active factor
  const dailyCalorieTargetKcal = Math.max(1200, maintenanceCalories - 400); // 400 kcal daily deficit
  const carbCeilingGrams = Math.round((dailyCalorieTargetKcal * 0.45) / 4); // 45% carb ceiling
  const estimatedWeeksToGoal = weightDeltaKg > 0 ? Math.ceil(weightDeltaKg / 0.65) : 0;

  // Exercise & Lifestyle Action Protocols with Interactive Visual Video Demonstrations
  const exercisePrescriptions = [
    {
      id: 'ex-hiit',
      title: 'High-Intensity Interval Training (HIIT)',
      duration: '20-25 mins (3x/week)',
      frequency: 'Mon / Wed / Fri',
      timing: 'Morning or Early Evening',
      intensity: 'High (80-85% Max HR)',
      focus: 'Mobilizes deep abdominal visceral fat and increases GLUT4 protein expression in skeletal muscle.',
      icon: 'zap',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-jumping-jacks-in-a-gym-41381-large.mp4',
      videoPoster: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
      videoTitle: '20-Min Visceral Fat HIIT Burn Protocol',
      whatToDoSteps: [
        'Warm up: 3-5 minutes of light jogging or jumping jacks.',
        'High Intensity: 45 seconds of fast high-knees, bodyweight squats, or mountain climbers.',
        'Active Recovery: 45 seconds of slow walking.',
        'Repeat interval cycle 8 to 10 times.',
        'Cool down: 3 minutes of static hamstring and quad stretches.'
      ],
      clinicalRationale: 'HIIT preferentially burns visceral adipose tissue (VAT) surrounding liver and pancreatic organs compared to steady-state cardio.'
    },
    {
      id: 'ex-walk',
      title: 'Post-Meal Brisk Walk ("Shatapavali")',
      duration: '15 mins (2-3x daily)',
      frequency: 'Daily after Lunch & Dinner',
      timing: 'Within 15-20 mins of completing a meal',
      intensity: 'Moderate (Brisk Pace ~ 5 km/h)',
      focus: 'Blunts postprandial glucose spikes caused by high-carbohydrate Indian meals (Rice/Roti).',
      icon: 'walk',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-on-a-treadmill-41484-large.mp4',
      videoPoster: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
      videoTitle: 'Post-Meal 1000-Step Glucose Clearing Walk',
      whatToDoSteps: [
        'Finish meal and wait 10-15 minutes.',
        'Walk briskly at a steady pace where talking is possible but singing is difficult.',
        'Aim for 1,200 to 1,500 steps per post-meal walk session.',
        'Avoid sitting or lying down immediately after heavy carbohydrate meals.'
      ],
      clinicalRationale: 'Light muscle contractions directly clear post-meal glucose from bloodstream without requiring heavy insulin secretion, protecting liver from de novo lipogenesis.'
    },
    {
      id: 'ex-strength',
      title: 'Core & Resistance Circuit',
      duration: '30-35 mins (2x/week)',
      frequency: 'Tue / Sat',
      timing: 'Any convenient time',
      intensity: 'Moderate-High',
      focus: 'Reverses sarcopenic obesity (low muscle mass with high visceral fat) common in South Asians.',
      icon: 'activity',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-squats-with-dumbbells-41483-large.mp4',
      videoPoster: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
      videoTitle: 'Skeletal Muscle Glucose Sink Resistance Circuit',
      whatToDoSteps: [
        'Bodyweight Squats: 3 sets of 12-15 reps.',
        'Plank Hold: 3 sets of 30-45 seconds.',
        'Dumbbell / Water Bottle Rows: 3 sets of 12 reps per arm.',
        'Glute Bridges: 3 sets of 15 reps to activate posterior chain.'
      ],
      clinicalRationale: 'Increasing skeletal muscle mass expands the bodys primary glucose sink, directly reducing ectopic fat deposition in liver cells (MASLD).'
    }
  ];

  return {
    bmi: bmiResult.bmi,
    bmiCategory: bmiResult.category,
    southAsianActionTriggered: bmiResult.riskTriggered,
    waistCircumferenceCm: waist_circumference_cm,
    waistThresholdCm: waistThreshold,
    elevatedWaist,
    whtr,
    visceralFatScore,
    masldProbabilityPercentage: masldProbability,
    estimatedBodyFatPercentage,
    visceralFatLevel,
    anatomicalFatDistribution,
    weightGoal: {
      currentWeightKg: baseline_weight_kg,
      targetWeightKg,
      weightDeltaKg,
      targetBmi,
      dailyCalorieTargetKcal,
      carbCeilingGrams,
      estimatedWeeksToGoal
    },
    riskLevel,
    riskBadgeColor,
    summaryMessage: bmiResult.message,
    exercisePrescriptions
  };
}

module.exports = {
  calculateSouthAsianBMI,
  calculateComprehensiveMetabolicRisk
};
