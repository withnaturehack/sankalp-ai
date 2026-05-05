import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";

async function callNvidiaChat(messages: Array<{ role: string; content: string }>, model = "meta/llama-3.1-8b-instruct", maxTokens = 512): Promise<string | null> {
  try {
    const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${NVIDIA_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens }),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

async function callNvidiaVision(imageBase64: string, prompt: string): Promise<string | null> {
  try {
    const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${NVIDIA_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        }],
        temperature: 0.3,
        max_tokens: 256,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

// ── AI REPLY ENGINE ───────────────────────────────────────────────────────────
function generateAIReply(message: string, history: Array<{ role: string; content: string }>): string {
  const msg = message.toLowerCase().trim();

  if (/^(hi|hello|namaste|namaskar|hey|hola|good morning|good evening|good afternoon|नमस्ते|नमस्कार)/.test(msg)) {
    return "🙏 Namaste! Welcome to SANKALP AI — Uttarakhand's civic intelligence platform.\n\nI can help you with:\n• 📋 Reporting civic issues (potholes, garbage, electricity, water)\n• 🔍 Tracking complaint status\n• 🆘 Emergency SOS & helplines\n• 🏛️ Government schemes & services\n• 🗺️ District & block information\n• 📊 Uttarakhand district statistics\n\nWhat would you like help with today?";
  }

  if (/report|complaint|issue|submit|file|lodge|दर्ज/.test(msg)) {
    if (/pothole|गड्ढा/.test(msg)) {
      return "🕳️ **Reporting a Pothole in Uttarakhand**\n\nSteps:\n1. Go to the **Complaints** tab\n2. Tap **+** to add a new complaint\n3. Select category: **Pothole**\n4. Enable location or enter manually\n5. Add a photo (recommended)\n6. Submit — you'll get a ticket ID\n\n📞 PWD Uttarakhand Helpline: **1800-180-4244**\n\n⚡ Mountain roads get P1 priority due to safety risks.";
    }
    if (/garbage|trash|waste|कूड़ा/.test(msg)) {
      return "🗑️ **Garbage / Waste Complaint**\n\nReport garbage issues:\n1. Open **Complaints** → tap **+**\n2. Select **Garbage Collection**\n3. Pin your location on the map\n4. Photo helps speed up resolution\n\n📱 Also try: **Swachh Bharat Mission App**\n📞 ULB Helpline (Urban Local Body): **1533**\n\nKeeping Uttarakhand's hills clean is everyone's responsibility! 🏔️";
    }
    if (/water|पानी|supply/.test(msg)) {
      return "💧 **Water Supply Complaint**\n\n1. Go to **Complaints** tab → **+**\n2. Category: **Water Supply**\n3. Specify: low pressure / no supply / contamination\n4. Add your block/ward name\n\n📞 Uttarakhand Jal Sansthan: **1916**\n🌐 Online: ujs.uk.gov.in\n\nMountain water pipelines need extra care — report early!";
    }
    if (/electricity|power|current|बिजली|light/.test(msg)) {
      return "⚡ **Electricity / Power Complaint**\n\n1. Complaints tab → **+** → **Electricity**\n2. Select: power cut / low voltage / street light / transformer\n3. Mention landmark for faster dispatch\n\n📞 UPCL Helpline: **1912** (24×7)\n📞 UPCL Toll Free: **1800-180-8752**\n\nHill power outages after storms get automatic P1 priority.";
    }
    if (/streetlight|street light|lamp/.test(msg)) {
      return "💡 **Street Light Complaint**\n\nDark mountain roads are dangerous. Report quickly:\n1. Complaints → **+** → **Street Light**\n2. Drop pin on the exact location\n3. Mention pole number if visible\n\n📞 ULB Electric Wing — contact district office\nAverage fix time: **2–4 working days**\n\nTip: Multiple reports from the same block get **P1 priority** automatically.";
    }
    if (/drain|sewer|sewage|नाली/.test(msg)) {
      return "🌊 **Drain / Sewage Complaint**\n\nFor blocked drains or sewage overflow:\n1. Complaints → **+** → **Drain**\n2. Mark location precisely\n3. Photo helps locate the blockage\n\n📞 Uttarakhand Jal Sansthan: **1800-180-4244**\nMonsoon season in hills: Priority automatically escalated.";
    }
    if (/tree|पेड़|fallen|landslide|भूस्खलन/.test(msg)) {
      return "🌳 **Tree / Landslide Complaint**\n\nFor fallen trees, dangerous branches, or landslide debris:\n1. Complaints → **+** → **Tree / Other**\n2. Mark exact location\n3. AI assesses urgency automatically\n\n📞 SDRF Uttarakhand: **9557444486**\n⚠️ For road-blocking landslides also call **1070** (Disaster)\n\nSafety first — stay away from unstable slopes!";
    }
    return "📋 **Reporting a Civic Issue**\n\nHere's how to file any complaint:\n1. Tap the **Complaints** tab (bottom nav)\n2. Press **+** button\n3. Choose your issue category\n4. Add location, description & photo\n5. Submit — AI assigns priority instantly\n\n📌 Ticket ID generated immediately\n📊 Track real-time status updates\n\nWhat type of issue are you facing?";
  }

  if (/track|status|ticket|complaint id|pending|update|कहाँ/.test(msg)) {
    return "🔍 **Tracking Your Complaint**\n\nTo check status:\n1. Go to **Complaints** tab\n2. Find your complaint or search by ticket ID\n3. Status updates: **Pending → In Progress → Resolved**\n\n📬 You'll receive notifications for every status change.\n\n**Status meanings:**\n🟡 **Pending** — Received, queued for assignment\n🔵 **In Progress** — Field worker dispatched\n🟢 **Resolved** — Issue fixed, please verify\n\nNeed help with a specific ticket number?";
  }

  if (/sos|emergency|help|danger|unsafe|attack|rape|harassment|महिला|women safety|woman/.test(msg)) {
    return "🆘 **EMERGENCY HELP — Uttarakhand**\n\n**IMMEDIATE HELP:**\n📞 **100** — Police Emergency\n📞 **112** — Unified Emergency\n📞 **1090** — Women Helpline (24×7)\n📞 **181** — Women Safety Helpline\n📞 **1070** — State Disaster Helpline\n\n**In the App:**\n→ Go to **SOS** tab → Tap the red button\n→ Your GPS location is shared with nearest police station\n\n⚠️ SOS alert notifies the district command center immediately.";
  }

  if (/ward|block|area|locality|zone|district|जिला/.test(msg)) {
    const wards = storage.getWards();
    const wardNames = wards.slice(0, 5).map(w => `• ${w.name} (${w.district}) — Score: ${w.healthScore}/100`).join("\n");
    return `🗺️ **Uttarakhand Block/Ward Information**\n\nUttarakhand has 13 districts with ${wards.length} blocks monitored by SANKALP AI.\n\n**Sample Block Health Scores:**\n${wardNames}\n\n📊 View all blocks on the **Analytics** tab\n🗺️ See block boundaries on the **Map** tab\n\nEach block score reflects complaints, resolution speed and safety rating.`;
  }

  if (/scheme|yojana|benefit|welfare|subsidy|pension|सरकारी|government|योजना/.test(msg)) {
    return "🏛️ **Uttarakhand Government Schemes**\n\n**Popular Schemes:**\n🔹 **Mukhyamantri Swarojgar Yojana** — Self-employment loans for hill residents\n🔹 **Veer Chandra Singh Garhwali Paryatan Yojana** — Eco-tourism grants\n🔹 **Gaura Devi Kanya Dhan Yojana** — ₹51,000 for girl students\n🔹 **Mukhyamantri Mahila Utthan Yojana** — Women empowerment grants\n🔹 **Deen Dayal Upadhyaya Gramin Kaushalya Yojana** — Skill training\n🔹 **PM Awas Yojana Urban** — Affordable housing\n\n🌐 For applications: **cm.uk.gov.in**\n📞 CM Helpline: **1905**\n\nWant details on any specific scheme?";
  }

  if (/hospital|health|doctor|medical|ambulance|illness|sick|अस्पताल/.test(msg)) {
    return "🏥 **Uttarakhand Health Services**\n\n**Emergency:**\n🚑 Ambulance: **108** (free)\n🚑 AIIMS Rishikesh: **0135-2462900**\n\n**Major Govt Hospitals:**\n• AIIMS Rishikesh — 0135-2462900\n• Doon Medical College, Dehradun — 0135-2656621\n• Sushila Tiwari Hospital, Haldwani — 05946-220052\n• District Hospital Champawat — 05965-230100\n• Base Hospital Srinagar Garhwal — 01346-252206\n\n**Uttarakhand Helplines:**\n📞 Health helpline: **104**\n💊 Free medicines available at government hospitals with Aadhaar.";
  }

  if (/statistic|data|report|count|how many|total|analytics|स्थिति/.test(msg)) {
    const complaints = storage.getComplaints();
    const sos = storage.getSosAlerts();
    const wards = storage.getWards();
    const resolved = complaints.filter(c => c.status === "resolved").length;
    const pending = complaints.filter(c => c.status === "pending").length;
    const active = sos.filter(s => s.status === "active").length;
    const avgHealth = wards.length ? Math.round(wards.reduce((s, w) => s + w.healthScore, 0) / wards.length) : 0;
    return `📊 **SANKALP AI — Live Uttarakhand Stats**\n\n**Complaints:**\n• Total: ${complaints.length}\n• Resolved: ${resolved} (${Math.round(resolved/Math.max(complaints.length,1)*100)}%)\n• Pending: ${pending}\n\n**Safety:**\n• Active SOS Alerts: ${active}\n• Districts monitored: 13\n• Avg District Health Score: ${avgHealth}/100\n\n**AI Performance:**\n• Auto-prioritization: Active\n• Real-time monitoring: ✅\n• Last updated: Just now\n\nView detailed analytics in the **Analytics** tab →`;
  }

  if (/tourism|tourist|kedarnath|badrinath|char dham|valley of flowers|trek|pilgrimage|यात्रा/.test(msg)) {
    return "🏔️ **Uttarakhand Tourism & Pilgrimage**\n\n**Char Dham Helplines:**\n📞 Badrinath: **01381-222308**\n📞 Kedarnath: **01364-233521**\n📞 Gangotri: **01374-222254**\n📞 Yamunotri: **01371-251247**\n\n**Emergency on Char Dham Route:**\n📞 SDRF: **9557444486**\n📞 Disaster: **1070**\n\n**Tourism Dept:**\n🌐 uttarakhandtourism.gov.in\n📞 **1364** (Tourist helpline)\n\nReport issues near tourist sites through the **Complaints** tab — we prioritize tourist area maintenance!";
  }

  if (/disaster|flood|landslide|earthquake|cloudburst|बाढ़|भूस्खलन/.test(msg)) {
    return "⛰️ **Disaster Management — Uttarakhand**\n\n**Emergency Helplines:**\n📞 State EOC (Emergency): **1070**\n📞 SDRF Uttarakhand: **9557444486**\n📞 NDRF: **011-24363260**\n📞 Police: **100**\n📞 Fire: **101**\n📞 Ambulance: **108**\n\n**Uttarakhand Disaster Management Authority:**\n🌐 usdma.uk.gov.in\n\n**In the App:**\n→ Use **SOS** tab for immediate help\n→ Report damaged roads via **Complaints**\n\n⚠️ During monsoon: always check road status before traveling to hill areas.";
  }

  if (/transport|bus|road|highway|nh|roadways|यातायात|सड़क/.test(msg)) {
    return "🚌 **Uttarakhand Transport**\n\n**URSTC Bus Service:**\n📞 URSTC Helpline: **0135-2712355**\n🌐 urstc.uk.gov.in\n\n**Road Status:**\n📞 PWD Helpline: **1800-180-4244**\n🌐 pwduk.uk.gov.in\n\n**Key Highways:**\n• NH-58: Delhi–Badrinath\n• NH-7: Dehradun–Tanakpur\n• NH-109: Rishikesh–Kedarnath\n• NH-34: Tanakpur–Pithoragarh\n\n**Report road damage** → Complaints tab → Pothole / Other\n\n⚠️ Mountain roads may close during heavy rain/landslides — check before travel!";
  }

  if (/thank|thanks|goodbye|bye|धन्यवाद|शुक्रिया/.test(msg)) {
    return "🙏 **Dhanyavaad!** Thank you for using SANKALP AI.\n\nRemember — every complaint you report helps make Uttarakhand cleaner, safer, and better connected.\n\n🌟 Your civic participation earns points on our **Leaderboard**!\n\n_देवभूमि की सेवा में, जन भागीदारी से_ — With public participation, we serve Devbhoomi.\n\nStay safe in the hills and feel free to ask anything anytime! 🏔️🇮🇳";
  }

  if (/point|badge|leaderboard|reward|rank|gamif/.test(msg)) {
    return "🏆 **SANKALP AI — Civic Rewards**\n\nEarn points for civic participation:\n🔹 Report a complaint: **+10 pts**\n🔹 Complaint resolved: **+5 pts**\n🔹 Upvote others: **+1 pt**\n🔹 First report in area: **+20 pts**\n\n**Badges:**\n🥇 New Citizen, Problem Solver, Community Hero, Block Champion, Devbhoomi Guardian\n\nView your rank on the **Profile** tab → Leaderboard.\n\n_देवभूमि बदलेगी, जब जन जागरुक होगा!_ 🌟";
  }

  const responses = [
    `I understand you're asking about "${message.slice(0, 40)}". As SANKALP AI, I specialize in Uttarakhand civic services.\n\nHere's what I can help with:\n• 📋 Filing complaints (potholes, garbage, water, electricity)\n• 🔍 Tracking complaint status\n• 🆘 Emergency helplines & SOS\n• 🏛️ Government schemes & services\n• 📊 Uttarakhand district statistics\n• 🗺️ Finding local facilities\n\nCould you rephrase or choose from the quick options below?`,
    `Great question! For "${message.slice(0, 30)}..." I recommend:\n\n1. **Check the Complaints tab** for civic issues\n2. **Call CM Helpline: 1905** for government queries\n3. **Visit cm.uk.gov.in** for official information\n\nI'm continuously learning to serve Uttarakhand citizens better. Is there a specific area I can help you with?`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function getToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  const user = storage.validateToken(token);
  if (!user) return res.status(401).json({ message: "Invalid or expired token" });
  (req as any).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  const user = storage.validateToken(token);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return res.status(403).json({ message: "Admin access required" });
  }
  (req as any).user = user;
  next();
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  const user = storage.validateToken(token);
  if (!user || user.role !== "super_admin") {
    return res.status(403).json({ message: "Super admin access required" });
  }
  (req as any).user = user;
  next();
}

// Returns the district filter for the current user:
// super_admin → "Uttarakhand" (all), admin → their district, citizen → their district
function getUserDistrict(req: Request): string | undefined {
  const user = (req as any).user;
  if (!user) return undefined;
  if (user.role === "super_admin") return undefined; // no filter = all
  return user.district;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const broadcast = (data: any) => {
    const msg = JSON.stringify(data);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    });
  };
  storage.addWsListener(broadcast);
  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({ type: "connected", message: "SANKALP AI Real-time connected" }));
    ws.on("error", () => {});
  });

  // ── AUTH ──────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, phone, pin, district } = req.body;
      if (!name || !phone || !pin) return res.status(400).json({ message: "Name, phone, and PIN required" });
      if (pin.length !== 6) return res.status(400).json({ message: "PIN must be 6 digits" });
      if (phone.length !== 10) return res.status(400).json({ message: "Phone must be 10 digits" });
      const existing = await storage.findUserByPhone(phone);
      if (existing) return res.status(400).json({ message: "Phone number already registered" });
      const user = await storage.createUser({
        name, phone, pin, role: "citizen",
        district: district || "Dehradun",
        points: 0, badges: ["new_citizen"], level: 1
      });
      const token = storage.createToken(user.id);
      res.json({
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role, district: user.district, points: user.points, badges: user.badges, level: user.level },
        token
      });
    } catch { res.status(500).json({ message: "Registration failed" }); }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, pin } = req.body;
      if (!phone || !pin) return res.status(400).json({ message: "Phone and PIN required" });
      const user = await storage.findUserByPhone(phone);
      if (!user || user.pin !== pin) return res.status(401).json({ message: "Invalid phone or PIN" });
      const token = storage.createToken(user.id);
      res.json({
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role, district: user.district, points: user.points, badges: user.badges, level: user.level },
        token
      });
    } catch { res.status(500).json({ message: "Login failed" }); }
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const u = (req as any).user;
    res.json({ id: u.id, name: u.name, phone: u.phone, role: u.role, district: u.district, points: u.points, badges: u.badges, level: u.level });
  });

  app.post("/api/auth/logout", requireAuth, (req, res) => {
    const token = getToken(req);
    if (token) storage.revokeToken(token);
    res.json({ success: true });
  });

  // ── COMPLAINTS ────────────────────────────────────────────────────────
  app.get("/api/complaints", requireAuth, (req, res) => {
    const user = (req as any).user;
    const district = user.role === "super_admin" ? undefined : user.district;
    res.json(storage.getComplaints(district));
  });

  app.post("/api/complaints", requireAuth, (req, res) => {
    const user = (req as any).user;
    const { category, description, location, geo, ward, wardNumber, priority } = req.body;
    if (!category || !description || !location) return res.status(400).json({ message: "category, description, location required" });
    const complaint = storage.createComplaint({
      category, description, location,
      geo: geo || { lat: 30.3165, lng: 78.0322 },
      ward: ward || "Dehradun Block",
      wardNumber: wardNumber || 1,
      district: user.district || "Dehradun",
      priority: priority || "P3",
      status: "pending",
      submittedBy: user.name,
      submittedByPhone: user.phone,
      isCluster: false,
    }, user.id);
    res.status(201).json(complaint);
  });

  app.put("/api/complaints/:id/upvote", requireAuth, (req, res) => {
    const user = (req as any).user;
    const complaint = storage.upvoteComplaint(req.params.id, user.id);
    if (!complaint) return res.status(404).json({ message: "Not found" });
    res.json(complaint);
  });

  app.put("/api/complaints/:id/resolve", requireAuth, (req, res) => {
    const user = (req as any).user;
    const { rating, feedback, afterPhoto } = req.body;
    const complaint = storage.resolveComplaint(req.params.id, rating, feedback, afterPhoto, user.id);
    if (!complaint) return res.status(404).json({ message: "Not found" });
    res.json(complaint);
  });

  app.put("/api/complaints/:id/reject", requireAuth, (req, res) => {
    const user = (req as any).user;
    const complaint = storage.rejectResolution(req.params.id, user.id);
    if (!complaint) return res.status(404).json({ message: "Not found" });
    res.json(complaint);
  });

  // ── SOS ───────────────────────────────────────────────────────────────
  app.get("/api/sos", requireAuth, (req, res) => {
    const user = (req as any).user;
    const district = user.role === "super_admin" ? undefined : user.district;
    res.json(storage.getSosAlerts(district));
  });

  app.post("/api/sos", requireAuth, (req, res) => {
    const user = (req as any).user;
    const { category, description, location, geo, ward, wardNumber } = req.body;
    if (!category) return res.status(400).json({ message: "category required" });
    const geoPoint = geo || { lat: 30.3165, lng: 78.0322 };
    const alert = storage.createSos({
      category, description: description || "Emergency reported via SANKALP AI",
      location: location || "Location via GPS",
      geo: geoPoint, ward: ward || "Dehradun Block", wardNumber: wardNumber || 1,
      district: user.district || "Dehradun",
      status: "active", triggeredBy: user.name,
    }, user.id);
    res.status(201).json(alert);
  });

  app.put("/api/sos/:id/location", requireAuth, (req, res) => {
    const { lat, lng } = req.body;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ message: "lat and lng (numbers) required" });
    }
    const alert = storage.updateSosLocation(req.params.id, { lat, lng });
    if (!alert) return res.status(404).json({ message: "SOS alert not found" });
    res.json(alert);
  });

  app.put("/api/sos/:id/resolve", requireAdmin, (req, res) => {
    const alert = storage.resolveSos(req.params.id);
    if (!alert) return res.status(404).json({ message: "Not found" });
    res.json(alert);
  });

  // ── CITY DATA ─────────────────────────────────────────────────────────
  app.get("/api/wards", requireAuth, (req, res) => {
    const user = (req as any).user;
    const district = user.role === "super_admin" ? undefined : user.district;
    res.json(storage.getWards(district));
  });

  app.get("/api/workers", requireAuth, (req, res) => {
    const user = (req as any).user;
    const district = user.role === "super_admin" ? undefined : user.district;
    res.json(storage.getWorkers(district));
  });

  app.get("/api/police-stations", requireAuth, (req, res) => {
    const user = (req as any).user;
    const district = user.role === "super_admin" ? undefined : user.district;
    res.json(storage.getPoliceStations(district));
  });

  app.get("/api/risk-zones", requireAuth, (req, res) => {
    const user = (req as any).user;
    const district = user.role === "super_admin" ? undefined : user.district;
    res.json(storage.getRiskZones(district));
  });

  app.get("/api/nearest-police", requireAuth, (req, res) => {
    const user = (req as any).user;
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ message: "lat and lng required" });
    const district = user.role === "super_admin" ? undefined : user.district;
    const stations = storage.getNearestPoliceStations(
      { lat: parseFloat(lat as string), lng: parseFloat(lng as string) }, 3, district
    );
    res.json(stations);
  });

  app.get("/api/leaderboard", requireAuth, (req, res) => {
    res.json(storage.getLeaderboard());
  });

  // ── ADMIN ─────────────────────────────────────────────────────────────
  app.get("/api/admin/stats", requireAdmin, (req, res) => {
    const user = (req as any).user;
    const district = user.role === "super_admin" ? undefined : user.district;
    res.json(storage.getAdminStats(district));
  });

  app.get("/api/admin/complaints", requireAdmin, (req, res) => {
    const user = (req as any).user;
    const district = user.role === "super_admin" ? undefined : user.district;
    const { status, priority, ward } = req.query;
    let complaints = storage.getComplaints(district);
    if (status) complaints = complaints.filter(c => c.status === status);
    if (priority) complaints = complaints.filter(c => c.priority === priority);
    if (ward) complaints = complaints.filter(c => c.wardNumber === Number(ward));
    res.json(complaints);
  });

  app.get("/api/admin/alerts", requireAdmin, (req, res) => {
    const user = (req as any).user;
    const district = user.role === "super_admin" ? undefined : user.district;
    res.json(storage.getSosAlerts(district));
  });

  app.get("/api/admin/workers", requireAdmin, (req, res) => {
    const user = (req as any).user;
    const district = user.role === "super_admin" ? undefined : user.district;
    res.json(storage.getWorkers(district));
  });

  app.get("/api/admin/risk-zones", requireAdmin, (req, res) => {
    const user = (req as any).user;
    const district = user.role === "super_admin" ? undefined : user.district;
    res.json(storage.getRiskZones(district));
  });

  // Super admin: get all districts summary
  app.get("/api/superadmin/districts", requireSuperAdmin, (req, res) => {
    const DISTRICTS = [
      "Dehradun", "Haridwar", "Tehri Garhwal", "Pauri Garhwal",
      "Rudraprayag", "Chamoli", "Uttarkashi", "Pithoragarh",
      "Bageshwar", "Almora", "Champawat", "Nainital", "Udham Singh Nagar"
    ];
    const summary = DISTRICTS.map(district => {
      const stats = storage.getAdminStats(district);
      const wards = storage.getWards(district);
      const avgHealth = wards.length ? Math.round(wards.reduce((s, w) => s + w.healthScore, 0) / wards.length) : 0;
      return { district, ...stats, avgHealthScore: avgHealth, wardCount: wards.length };
    });
    res.json(summary);
  });

  // ── ADMIN EMERGENCY BROADCAST ────────────────────────────────────────
  app.post("/api/admin/emergency-broadcast", requireAdmin, (req, res) => {
    const { message, severity } = req.body;
    broadcast({
      type: "emergency_broadcast",
      message: message || "DISTRICT-WIDE EMERGENCY ALERT: Take immediate precautions. Follow official instructions.",
      severity: severity || "high",
      timestamp: new Date().toISOString(),
    });
    res.json({ success: true });
  });

  // ── WOMEN SAFETY NOTIFY ───────────────────────────────────────────────
  app.post("/api/sos/women-safety", requireAuth, (req, res) => {
    const user = (req as any).user;
    const { geo, location, audioRecording } = req.body;
    const geoPoint = geo || { lat: 30.3165, lng: 78.0322 };
    const nearestStations = storage.getNearestPoliceStations(geoPoint, 2, user.district);
    const alert = storage.createSos({
      category: "women_safety",
      description: "PANIC SOS — Women Safety Emergency triggered via SANKALP AI citizen app",
      location: location || `GPS: ${geoPoint.lat.toFixed(4)}, ${geoPoint.lng.toFixed(4)}`,
      geo: geoPoint,
      ward: user.district || "Dehradun",
      wardNumber: 1,
      district: user.district || "Dehradun",
      status: "active",
      triggeredBy: user.name,
      nearestPoliceStation: nearestStations[0]?.name,
      policeDistance: (nearestStations[0] as any)?.distance,
    }, user.id);
    broadcast({
      type: "women_safety_sos",
      alert,
      nearestStations: nearestStations.slice(0, 2),
      audioAvailable: !!audioRecording,
      timestamp: new Date().toISOString(),
    });
    res.status(201).json({ alert, nearestStations: nearestStations.slice(0, 2) });
  });

  // ── ANNOUNCEMENTS ─────────────────────────────────────────────────────
  app.get("/api/announcements", requireAuth, (req, res) => {
    const user = (req as any).user;
    const district = user.role === "super_admin" ? undefined : user.district;
    const anns = storage.getAnnouncements(district);
    anns.forEach(a => storage.incrementAnnouncementViews(a.id));
    res.json(storage.getAnnouncements(district));
  });

  app.post("/api/announcements", requireAdmin, (req, res) => {
    const user = (req as any).user;
    const { title, body, type, department, priority, targetWards, targetDistrict, expiresAt, link } = req.body;
    if (!title || !body) return res.status(400).json({ message: "title and body required" });
    const ann = storage.createAnnouncement({
      title, body, type: type || "general",
      department: department || "District Administration",
      priority: priority || "normal",
      targetWards, link, expiresAt,
      targetDistrict: user.role === "super_admin" ? targetDistrict : user.district,
      postedBy: user.name,
    });
    res.status(201).json(ann);
  });

  app.delete("/api/announcements/:id", requireAdmin, (req, res) => {
    const ok = storage.deleteAnnouncement(req.params.id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  // ── AI CHAT ───────────────────────────────────────────────────────────
  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ message: "message required" });

    const systemPrompt = "You are SANKALP AI, the official civic intelligence assistant for Uttarakhand, India (Devbhoomi). Help citizens with: filing and tracking civic complaints (potholes, garbage, water, electricity, streetlights, drains, trees), emergency SOS services, government schemes (CM Swarojgar Yojana, Ayushman Bharat, Gaura Devi Kanya Dhan, Veer CS Garhwali Paryatan Yojana), all 13 Uttarakhand districts (Dehradun, Haridwar, Tehri Garhwal, Pauri Garhwal, Rudraprayag, Chamoli, Uttarkashi, Pithoragarh, Bageshwar, Almora, Champawat, Nainital, Udham Singh Nagar), helplines (Police 100, Ambulance 108, Women 1090, Disaster 1070, CM Helpline 1905), Char Dham tourism, and civic participation. Respond in friendly, helpful English. Add relevant helpline numbers. Keep responses under 300 words.";

    const msgs = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((h: any) => ({ role: h.role === "ai" ? "assistant" : h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const nvReply = await callNvidiaChat(msgs);
    if (nvReply) {
      return res.json({ reply: nvReply, timestamp: new Date().toISOString(), powered_by: "NVIDIA Llama" });
    }

    const reply = generateAIReply(message, history || []);
    res.json({ reply, timestamp: new Date().toISOString() });
  });

  // ── AI IMAGE ANALYSIS ─────────────────────────────────────────────────
  app.post("/api/ai/analyze-image", requireAuth, async (req, res) => {
    const { imageBase64, category } = req.body;
    if (!imageBase64) return res.status(400).json({ message: "imageBase64 required" });

    const prompt = `You are a civic issue analyzer for Uttarakhand, India. Analyze this image and respond ONLY with valid JSON (no other text): {"severity":"Low/Medium/High/Critical","issueType":"pothole/garbage/streetlight/water/drain/electricity/other","description":"brief description under 60 words","priority":"P1/P2/P3/P4","department":"which government department handles this"}`;

    const raw = await callNvidiaVision(imageBase64, prompt);
    if (raw) {
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          return res.json({ analysis: JSON.parse(match[0]), raw, powered_by: "NVIDIA Vision" });
        }
      } catch {}
      return res.json({ analysis: { severity: "Medium", issueType: category || "other", description: raw.slice(0, 200), priority: "P3", department: "Municipal Corporation" }, raw });
    }

    res.json({ analysis: { severity: "Medium", issueType: category || "other", description: "Photo received. Pending AI review.", priority: "P3", department: "Municipal Corporation" }, powered_by: "fallback" });
  });

  return httpServer;
}
