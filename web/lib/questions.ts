import type { Question, QuestionOption } from "./types";

export const STATES: QuestionOption[] = [
  "Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar",
  "Chandigarh","Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka",
  "Kerala","Ladakh","Lakshadweep","Madhya Pradesh","Maharashtra","Manipur","Meghalaya",
  "Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
].map((s) => ({ value: s, label: s }));

/** Maps question id → Question definition */
export const QUESTIONS: Record<string, Question> = {
  root: {
    id: "root",
    type: "single_choice",
    prompt: "Who is primarily applying for schemes?",
    hindiPrompt: "योजना किसके लिए है?",
    profileKey: "applicant_type",
    options: [
      { value: "individual", label: "Myself — as an individual", emoji: "👤", hindiLabel: "मैं (व्यक्तिगत)" },
      { value: "business", label: "My Business / Enterprise", emoji: "🏢", hindiLabel: "मेरा व्यवसाय" },
      { value: "family", label: "My Family / Household", emoji: "🏠", hindiLabel: "मेरा परिवार" },
    ],
    nextFn: (v) => (v === "individual" ? "state" : v === "business" ? "biz_state" : "fam_state"),
  },

  // ── Individual branch ────────────────────────────────────────────────────────
  state: {
    id: "state",
    type: "state_search",
    prompt: "Which state or UT do you live in?",
    hindiPrompt: "आप किस राज्य में रहते हैं?",
    profileKey: "state",
    options: STATES,
    nextFn: () => "age",
  },

  age: {
    id: "age",
    type: "number_input",
    prompt: "How old are you?",
    hindiPrompt: "आपकी उम्र क्या है?",
    profileKey: "age",
    min: 5,
    max: 100,
    unit: "years",
    nextFn: () => "gender",
  },

  gender: {
    id: "gender",
    type: "single_choice",
    prompt: "What is your gender?",
    hindiPrompt: "आपका लिंग?",
    profileKey: "gender",
    options: [
      { value: "male", label: "Male", emoji: "♂️", hindiLabel: "पुरुष" },
      { value: "female", label: "Female", emoji: "♀️", hindiLabel: "महिला" },
      { value: "transgender", label: "Transgender", emoji: "⚧", hindiLabel: "तृतीय लिंग" },
      { value: "any", label: "Prefer not to say", emoji: "—", hindiLabel: "नहीं बताना" },
    ],
    nextFn: () => "caste",
  },

  caste: {
    id: "caste",
    type: "single_choice",
    prompt: "What is your caste category?",
    hindiPrompt: "आपकी जाति श्रेणी?",
    profileKey: "caste",
    options: [
      { value: "general", label: "General / Unreserved", hindiLabel: "सामान्य" },
      { value: "obc", label: "OBC — Other Backward Class", hindiLabel: "ओबीसी" },
      { value: "sc", label: "SC — Scheduled Caste", hindiLabel: "अनुसूचित जाति" },
      { value: "st", label: "ST — Scheduled Tribe", hindiLabel: "अनुसूचित जनजाति" },
      { value: "ews", label: "EWS — Economically Weaker Section", hindiLabel: "ईडब्ल्यूएस" },
    ],
    nextFn: () => "special_status",
  },

  special_status: {
    id: "special_status",
    type: "multi_select",
    prompt: "Do any of these apply to you?",
    hindiPrompt: "इनमें से कोई आप पर लागू होता है?",
    profileKey: "special_status",
    multiKey: "special_status",
    options: [
      { value: "bpl", label: "BPL card holder", hindiLabel: "बीपीएल कार्डधारक" },
      { value: "widow", label: "Widow / Widower", hindiLabel: "विधवा / विधुर" },
      { value: "disabled", label: "Person with disability (PwD / Divyang)", hindiLabel: "दिव्यांग" },
      { value: "orphan", label: "Orphan", hindiLabel: "अनाथ" },
      { value: "minority", label: "Minority religion", hindiLabel: "अल्पसंख्यक धर्म" },
      { value: "exserviceman", label: "Ex-Serviceman / family of Ex-Serviceman", hindiLabel: "भूतपूर्व सैनिक" },
      { value: "none", label: "None of the above", hindiLabel: "इनमें से कोई नहीं" },
    ],
    nextFn: () => "specific_circumstances",
  },

  specific_circumstances: {
    id: "specific_circumstances",
    type: "multi_select",
    prompt: "Any of these specific situations?",
    hindiPrompt: "कोई विशेष परिस्थिति?",
    profileKey: "specific_circumstances",
    multiKey: "specific_circumstances",
    optional: true,
    options: [
      { value: "sanitation_child", label: "Parent is a sanitation / Safai Karamchari worker" },
      { value: "nomadic_tribe", label: "Nomadic / Denotified Tribe (NT/DNT/Vimukta Jati)" },
      { value: "prisoner_family", label: "Family member is incarcerated" },
      { value: "acid_victim", label: "Acid attack survivor (self or family)" },
      { value: "hiv_affected", label: "Living with HIV / AIDS (self or family)" },
      { value: "cancer", label: "Cancer patient or survivor (self or family)" },
      { value: "weaver", label: "Handloom weaver or Khadi artisan" },
      { value: "street_vendor", label: "Street vendor / hawker" },
      { value: "none", label: "None of the above" },
    ],
    nextFn: () => "occupation",
  },

  occupation: {
    id: "occupation",
    type: "single_choice",
    prompt: "What best describes your current situation?",
    hindiPrompt: "आपकी वर्तमान स्थिति?",
    profileKey: "occupation",
    options: [
      { value: "student", label: "Student", emoji: "🎓", hindiLabel: "विद्यार्थी" },
      { value: "farmer", label: "Farmer / Agricultural worker", emoji: "🌾", hindiLabel: "किसान" },
      { value: "construction", label: "Construction / Building worker", emoji: "🔨", hindiLabel: "निर्माण मजदूर" },
      { value: "labourer", label: "Factory / Industrial / Daily wage worker", emoji: "⚙️", hindiLabel: "मजदूर" },
      { value: "artist", label: "Artist, Craftsman or Cultural practitioner", emoji: "🎨", hindiLabel: "कलाकार" },
      { value: "fisherman", label: "Fisherman / Fisher", emoji: "🐟", hindiLabel: "मछुआरा" },
      { value: "sportsperson", label: "Sportsperson / Athlete", emoji: "🏃", hindiLabel: "खिलाड़ी" },
      { value: "entrepreneur", label: "Entrepreneur / Self-employed", emoji: "💼", hindiLabel: "उद्यमी" },
      { value: "govt_emp", label: "Government / PSU employee", emoji: "🏛️", hindiLabel: "सरकारी कर्मचारी" },
      { value: "salaried_private", label: "Private sector employee", emoji: "💻", hindiLabel: "निजी कर्मचारी" },
      { value: "unemployed", label: "Unemployed / Looking for work", emoji: "🔍", hindiLabel: "बेरोजगार" },
      { value: "homemaker", label: "Homemaker", emoji: "🏠", hindiLabel: "गृहिणी" },
      { value: "senior", label: "Senior Citizen (60+, retired)", emoji: "👴", hindiLabel: "वरिष्ठ नागरिक" },
      { value: "healthcare", label: "Healthcare professional", emoji: "👨‍⚕️", hindiLabel: "स्वास्थ्य कर्मी" },
      { value: "journalist", label: "Journalist / Media professional", emoji: "📰", hindiLabel: "पत्रकार" },
    ],
    nextFn: (v) => {
      const map: Record<string, string> = {
        student: "student_level",
        farmer: "farmer_type",
        construction: "income_band",
        labourer: "income_band",
        artist: "income_band",
        fisherman: "income_band",
        sportsperson: "income_band",
        entrepreneur: "biz_size",
        govt_emp: "income_band",
        salaried_private: "income_band",
        unemployed: "income_band",
        homemaker: "income_band",
        senior: "income_band",
        healthcare: "income_band",
        journalist: "income_band",
      };
      return map[v as string] ?? "income_band";
    },
  },

  // ── Student sub-branch ───────────────────────────────────────────────────────
  student_level: {
    id: "student_level",
    type: "single_choice",
    prompt: "What level are you currently studying at?",
    hindiPrompt: "आप किस कक्षा में पढ़ रहे हैं?",
    profileKey: "student_level",
    options: [
      { value: "school", label: "Class 1–8 (Primary school)", emoji: "📚" },
      { value: "class10", label: "Class 9–10 (Secondary)", emoji: "📖" },
      { value: "class12", label: "Class 11–12 (Senior Secondary / +2)", emoji: "📝" },
      { value: "diploma", label: "Diploma / ITI / Polytechnic", emoji: "🔧" },
      { value: "ug", label: "Undergraduate (BA / BSc / BTech / MBBS etc.)", emoji: "🎓" },
      { value: "pg", label: "Postgraduate (MA / MSc / MBA / MTech etc.)", emoji: "🏫" },
      { value: "phd", label: "PhD / Doctoral / Research Scholar", emoji: "🔬" },
    ],
    nextFn: (v) => {
      if (v === "school") return "income_band";
      if (v === "class10") return "student_marks";
      if (v === "class12") return "student_stream_12";
      if (v === "diploma") return "student_trade";
      if (v === "ug") return "student_ug_course";
      if (v === "pg") return "student_pg_course";
      if (v === "phd") return "student_phd_field";
      return "income_band";
    },
  },

  student_stream_12: {
    id: "student_stream_12",
    type: "single_choice",
    prompt: "Which Class 12 stream are you in?",
    hindiPrompt: "आप किस स्ट्रीम में पढ़ रहे हैं?",
    profileKey: "stream",
    options: [
      { value: "science", label: "Science", emoji: "🔬" },
      { value: "commerce", label: "Commerce", emoji: "📊" },
      { value: "arts", label: "Arts / Humanities", emoji: "🎨" },
      { value: "vocational", label: "Vocational / Technical", emoji: "🔧" },
    ],
    nextFn: () => "student_marks",
  },

  student_trade: {
    id: "student_trade",
    type: "single_choice",
    prompt: "What trade or field are you studying?",
    hindiPrompt: "आप किस ट्रेड या क्षेत्र में पढ़ रहे हैं?",
    profileKey: "student_trade",
    options: [
      { value: "engineering", label: "Engineering trades", emoji: "⚙️" },
      { value: "non_engineering", label: "Non-engineering trades", emoji: "🧾" },
      { value: "agriculture", label: "Agriculture / Horticulture", emoji: "🌱" },
      { value: "paramedical", label: "Paramedical / Health care", emoji: "🏥" },
      { value: "fashion", label: "Fashion / Textile / Beauty", emoji: "🧵" },
      { value: "other", label: "Other", emoji: "📚" },
    ],
    nextFn: () => "student_marks",
  },

  student_ug_course: {
    id: "student_ug_course",
    type: "single_choice",
    prompt: "What undergraduate course are you pursuing?",
    hindiPrompt: "आप कौन सा स्नातक कोर्स कर रहे हैं?",
    profileKey: "course",
    options: [
      { value: "btech", label: "B.Tech / B.E. (Engineering)", emoji: "⚙️" },
      { value: "mbbs", label: "MBBS / BDS (Medical / Dental)", emoji: "🩺" },
      { value: "bsc", label: "B.Sc. (Science)", emoji: "🔬" },
      { value: "ba", label: "B.A. (Arts / Humanities)", emoji: "📚" },
      { value: "bcom", label: "B.Com. (Commerce)", emoji: "📊" },
      { value: "bagri", label: "B.Agri / B.Hort.", emoji: "🌱" },
      { value: "law", label: "LLB (Law)", emoji: "⚖️" },
      { value: "bba", label: "BBA / BMS / BCA", emoji: "💼" },
      { value: "pharma", label: "B.Pharm / Nursing / Allied Health", emoji: "💊" },
      { value: "arts", label: "BFA / BPA", emoji: "🎭" },
      { value: "other", label: "Other", emoji: "📘" },
    ],
    nextFn: (v) => (v === "btech" ? "student_engg_branch" : "student_marks"),
  },

  student_pg_course: {
    id: "student_pg_course",
    type: "single_choice",
    prompt: "What postgraduate course are you pursuing?",
    hindiPrompt: "आप कौन सा स्नातकोत्तर कोर्स कर रहे हैं?",
    profileKey: "course",
    options: [
      { value: "mtech", label: "M.Tech / M.E. (Engineering)", emoji: "⚙️" },
      { value: "md", label: "MD / MS / MDS", emoji: "🩺" },
      { value: "msc", label: "M.Sc. (Science)", emoji: "🔬" },
      { value: "ma", label: "M.A. (Arts / Humanities)", emoji: "📚" },
      { value: "mcom", label: "M.Com. (Commerce)", emoji: "📊" },
      { value: "magri", label: "M.Agri / M.Hort.", emoji: "🌱" },
      { value: "mba", label: "MBA / PGDM", emoji: "💼" },
      { value: "law", label: "LLM (Law)", emoji: "⚖️" },
      { value: "mpharma", label: "M.Pharm / Nursing / Allied Health", emoji: "💊" },
      { value: "arts", label: "MFA / MPA", emoji: "🎭" },
      { value: "mphil", label: "M.Phil", emoji: "📖" },
      { value: "other", label: "Other", emoji: "📘" },
    ],
    nextFn: (v) => (v === "mtech" ? "student_engg_branch" : "student_marks"),
  },

  student_engg_branch: {
    id: "student_engg_branch",
    type: "single_choice",
    prompt: "Which engineering branch are you officially enrolled in?",
    hindiPrompt: "आपकी इंजीनियरिंग शाखा क्या है?",
    profileKey: "branch",
    options: [
      { value: "cs_it", label: "Computer Science / IT / AI", emoji: "💻" },
      { value: "electronics", label: "Electronics / Electrical", emoji: "🔌" },
      { value: "mechanical", label: "Mechanical / Automobile", emoji: "⚙️" },
      { value: "biotech", label: "Biotech / Chemical / Food Tech", emoji: "🧬" },
      { value: "textile", label: "Textile / Fashion Technology", emoji: "🧵" },
      { value: "other", label: "Other engineering branch", emoji: "📐" },
    ],
    nextFn: () => "student_engg_interests",
  },

  student_engg_interests: {
    id: "student_engg_interests",
    type: "multi_select",
    prompt: "Which technical fields are you open to for scholarships or internships?",
    hindiPrompt: "आप किन तकनीकी क्षेत्रों में रुचि रखते हैं?",
    profileKey: "engg_interests",
    multiKey: "engg_interests",
    optional: true,
    options: [
      { value: "cs_it", label: "CS / IT / AI", emoji: "💻" },
      { value: "electronics", label: "Electronics / Electrical", emoji: "🔌" },
      { value: "mechanical", label: "Mechanical / Automobile", emoji: "⚙️" },
      { value: "biotech", label: "Biotech / Chemical", emoji: "🧬" },
      { value: "textile", label: "Textile / Fashion Tech", emoji: "🧵" },
      { value: "any", label: "Open to any technical field", emoji: "✨" },
    ],
    nextFn: () => "student_marks",
  },

  student_phd_field: {
    id: "student_phd_field",
    type: "single_choice",
    prompt: "What is your research field?",
    hindiPrompt: "आपका शोध क्षेत्र क्या है?",
    profileKey: "phd_field",
    options: [
      { value: "science_tech", label: "Science & Technology / Engineering", emoji: "🔬" },
      { value: "agriculture", label: "Agriculture / Veterinary / Allied Sciences", emoji: "🌱" },
      { value: "medical", label: "Medical / Health Sciences", emoji: "🩺" },
      { value: "social", label: "Social Sciences / Economics", emoji: "🌏" },
      { value: "humanities", label: "Humanities / Language / Literature", emoji: "📚" },
      { value: "management", label: "Management / Commerce", emoji: "💼" },
      { value: "law", label: "Law", emoji: "⚖️" },
      { value: "arts", label: "Fine Arts / Performing Arts", emoji: "🎭" },
      { value: "other", label: "Other / Interdisciplinary", emoji: "📘" },
    ],
    nextFn: () => "student_marks",
  },

  student_marks: {
    id: "student_marks",
    type: "number_input",
    prompt: "What % did you score in your last exam?",
    hindiPrompt: "पिछली परीक्षा में आपने कितने % अंक प्राप्त किए?",
    profileKey: "marks",
    min: 30,
    max: 100,
    unit: "%",
    nextFn: () => "student_achievements",
  },

  student_achievements: {
    id: "student_achievements",
    type: "multi_select",
    prompt: "Do you have any of these achievements?",
    hindiPrompt: "क्या आपके पास कोई उपलब्धि है?",
    profileKey: "achievements",
    multiKey: "achievements",
    optional: true,
    options: [
      { value: "board_topper", label: "Board / University topper or merit list", emoji: "🏆" },
      { value: "olympiad", label: "Science / Maths Olympiad / NTSE / KVPY", emoji: "🔭" },
      { value: "sports_award", label: "National / State sports achievement", emoji: "🥇" },
      { value: "research", label: "Research paper published or patent filed", emoji: "📄" },
      { value: "cultural_award", label: "National / State cultural or arts award", emoji: "🎭" },
      { value: "none", label: "None of the above", emoji: "✖️" },
    ],
    nextFn: () => "income_band",
  },

  // ── Farmer sub-branch ───────────────────────────────────────────────────────
  farmer_type: {
    id: "farmer_type",
    type: "single_choice",
    prompt: "How much agricultural land do you own or cultivate?",
    hindiPrompt: "आपके पास कितनी कृषि भूमि है?",
    profileKey: "land_size",
    options: [
      { value: "marginal", label: "Marginal — up to 1 hectare (2.5 acres)", emoji: "🌱" },
      { value: "small", label: "Small — 1 to 2 hectares (2.5–5 acres)", emoji: "🌿" },
      { value: "medium", label: "Medium / Large — more than 2 hectares", emoji: "🌾" },
      { value: "none", label: "No land — tenant / sharecropper / landless", emoji: "🤲" },
    ],
    nextFn: () => "farmer_activity",
  },

  farmer_activity: {
    id: "farmer_activity",
    type: "multi_select",
    prompt: "What is your primary farming activity?",
    hindiPrompt: "आपकी मुख्य खेती गतिविधि क्या है?",
    profileKey: "farming_activity",
    multiKey: "farming_activity",
    optional: true,
    options: [
      { value: "food_crops", label: "Food crops", emoji: "🌾" },
      { value: "cash_crops", label: "Cash crops", emoji: "💰" },
      { value: "horticulture", label: "Horticulture / Fruits and vegetables", emoji: "🍅" },
      { value: "organic", label: "Organic farming", emoji: "🌱" },
      { value: "dairy", label: "Dairy / Livestock", emoji: "🥛" },
      { value: "poultry", label: "Poultry", emoji: "🥚" },
      { value: "fisheries", label: "Fisheries / Aquaculture", emoji: "🐟" },
      { value: "beekeeping", label: "Beekeeping / Honey", emoji: "🍯" },
    ],
    nextFn: () => "farmer_kcc",
  },

  farmer_kcc: {
    id: "farmer_kcc",
    type: "single_choice",
    prompt: "Do you have a Kisan Credit Card (KCC)?",
    hindiPrompt: "क्या आपके पास किसान क्रेडिट कार्ड है?",
    profileKey: "kcc_status",
    options: [
      { value: "true", label: "Yes", emoji: "✓" },
      { value: "false", label: "No", emoji: "—" },
      { value: "pending", label: "Applied but pending", emoji: "…" },
    ],
    nextFn: () => "income_band",
  },

  // ── Income band ─────────────────────────────────────────────────────────────
  income_band: {
    id: "income_band",
    type: "single_choice",
    prompt: "What is your annual household income?",
    hindiPrompt: "आपकी वार्षिक पारिवारिक आय?",
    profileKey: "income_band",
    options: [
      { value: "below_1l", label: "Below ₹1 Lakh per year", hindiLabel: "₹1 लाख से कम" },
      { value: "1l_to_3l", label: "₹1 Lakh – ₹3 Lakh per year", hindiLabel: "₹1–3 लाख" },
      { value: "3l_to_5l", label: "₹3 Lakh – ₹5 Lakh per year", hindiLabel: "₹3–5 लाख" },
      { value: "5l_to_8l", label: "₹5 Lakh – ₹8 Lakh per year", hindiLabel: "₹5–8 लाख" },
      { value: "above_8l", label: "Above ₹8 Lakh per year", hindiLabel: "₹8 लाख से अधिक" },
    ],
    nextFn: () => "benefit_preferences",
  },

  benefit_preferences: {
    id: "benefit_preferences",
    type: "multi_select",
    prompt: "What kinds of benefits are you most interested in?",
    hindiPrompt: "आप किस तरह के लाभ में रुचि रखते हैं?",
    profileKey: "benefit_preferences",
    multiKey: "benefit_preferences",
    optional: true,
    options: [
      { value: "scholarship", label: "Scholarship / Educational funding", emoji: "🎓" },
      { value: "financial", label: "Financial assistance / Cash benefit", emoji: "💰" },
      { value: "loan", label: "Loan / Credit support", emoji: "🏦" },
      { value: "training", label: "Skill training / Vocational course", emoji: "📚" },
      { value: "healthcare", label: "Healthcare / Medical support", emoji: "🏥" },
      { value: "housing", label: "Housing / Shelter", emoji: "🏠" },
      { value: "insurance", label: "Insurance / Accident coverage", emoji: "🛡️" },
      { value: "pension", label: "Pension / Old-age support", emoji: "👴" },
      { value: "award", label: "Award / Recognition / Grant", emoji: "🏆" },
      { value: "equipment", label: "Equipment / Tools / Agricultural inputs", emoji: "🔧" },
      { value: "subsidy", label: "Subsidy on purchases or services", emoji: "🏷️" },
      { value: "any", label: "Skip / Any", emoji: "⏭️", hindiLabel: "छोड़ें / कोई भी" },
    ],
    nextFn: () => null, // terminal
  },

  // ── Business branch ─────────────────────────────────────────────────────────
  biz_state: {
    id: "biz_state",
    type: "state_search",
    prompt: "Which state is your business registered in?",
    hindiPrompt: "आपका व्यवसाय किस राज्य में पंजीकृत है?",
    profileKey: "state",
    options: STATES,
    nextFn: () => "biz_size",
  },

  biz_size: {
    id: "biz_size",
    type: "single_choice",
    prompt: "What is the size of your business or enterprise?",
    hindiPrompt: "आपके व्यवसाय का आकार क्या है?",
    profileKey: "biz_size",
    options: [
      { value: "micro", label: "Micro enterprise", emoji: "1" },
      { value: "small", label: "Small enterprise", emoji: "2" },
      { value: "medium", label: "Medium enterprise", emoji: "3" },
      { value: "startup", label: "Startup", emoji: "★" },
      { value: "informal", label: "Sole proprietor / Freelancer / Informal business", emoji: "•" },
    ],
    nextFn: () => "biz_sector",
  },

  biz_sector: {
    id: "biz_sector",
    type: "single_choice",
    prompt: "What sector does your business operate in?",
    hindiPrompt: "आपका व्यवसाय किस क्षेत्र में है?",
    profileKey: "sector",
    options: [
      { value: "manufacturing", label: "Manufacturing", emoji: "⚙️" },
      { value: "services", label: "Services / IT / Consultancy", emoji: "💻" },
      { value: "agri", label: "Agriculture / Food processing", emoji: "🌱" },
      { value: "tourism", label: "Tourism / Hospitality", emoji: "🏨" },
      { value: "handicrafts", label: "Handicrafts / Handloom", emoji: "🧵" },
      { value: "retail", label: "Retail / Trading", emoji: "🛒" },
      { value: "other", label: "Other", emoji: "•" },
    ],
    nextFn: () => "biz_registered",
  },

  biz_registered: {
    id: "biz_registered",
    type: "single_choice",
    prompt: "Is your business registered with Udyam?",
    hindiPrompt: "क्या आपका व्यवसाय Udyam में पंजीकृत है?",
    profileKey: "udyam",
    options: [
      { value: "true", label: "Yes, Udyam registered", emoji: "✓" },
      { value: "false", label: "No", emoji: "—" },
      { value: "pending", label: "Applied / In process", emoji: "…" },
    ],
    nextFn: () => "biz_owner_bg",
  },

  biz_owner_bg: {
    id: "biz_owner_bg",
    type: "single_choice",
    prompt: "Does the primary owner belong to any of these groups?",
    hindiPrompt: "मुख्य मालिक इनमें से किसी समूह से हैं?",
    profileKey: "owner_bg",
    options: [
      { value: "woman", label: "Woman entrepreneur" },
      { value: "sc_st", label: "SC / ST category" },
      { value: "disabled", label: "Person with disability" },
      { value: "minority", label: "Minority community" },
      { value: "exserviceman", label: "Ex-Serviceman" },
      { value: "none", label: "None of the above" },
    ],
    nextFn: () => "biz_needs",
  },

  biz_needs: {
    id: "biz_needs",
    type: "multi_select",
    prompt: "What support are you looking for?",
    hindiPrompt: "आप किस सहायता की तलाश में हैं?",
    profileKey: "benefit_preferences",
    multiKey: "benefit_preferences",
    optional: true,
    options: [
      { value: "subsidy", label: "Capital investment subsidy", emoji: "🏷️" },
      { value: "loan", label: "Loan / Credit support", emoji: "🏦" },
      { value: "equipment", label: "Technology / Equipment upgrade", emoji: "🔧" },
      { value: "training", label: "Skill training", emoji: "📚" },
      { value: "certification", label: "Certification reimbursement", emoji: "✓" },
      { value: "export", label: "Export / Trade fair support", emoji: "↗" },
      { value: "marketing", label: "Market development / Branding", emoji: "📣" },
    ],
    nextFn: () => null,
  },

  // ── Family branch ───────────────────────────────────────────────────────────
  fam_state: {
    id: "fam_state",
    type: "state_search",
    prompt: "Which state does your family live in?",
    hindiPrompt: "आपका परिवार किस राज्य में रहता है?",
    profileKey: "state",
    options: STATES,
    nextFn: () => "income_band",
  },
};

export const INITIAL_QUESTION = "root";

export function getNextQuestion(
  questionId: string,
  value: unknown
): string | null {
  const q = QUESTIONS[questionId];
  if (!q) return null;
  if (!q.nextFn) return null;
  return q.nextFn(value);
}

export function totalEstimatedSteps(profile: Record<string, unknown>): number {
  const occ = profile.occupation as string | undefined;
  if (occ === "student") return 10;
  if (occ === "farmer") return 9;
  return 8;
}
