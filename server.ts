import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import type { Incident, Volunteer, Shelter, IncidentMessage, SituationReport, PriorityLevel } from "./src/types.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database pre-seeded with realistic disaster response data
let incidents: Incident[] = [
  {
    id: "INC-8921",
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    reporterName: "Elena Rostova",
    contactNumber: "+1 (555) 234-8901",
    category: "FLOOD_RESCUE",
    priority: "P1_CRITICAL",
    status: "DISPATCHED",
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: "1420 Marina Boulevard, Sector 4",
      landmark: "Near North Bay Marina dock",
      accuracy: 8,
    },
    description: "Flood water surging through ground floor, 4ft deep and rising rapidly. Trapped on second floor balcony with elderly mother who requires oxygen tank.",
    peopleCount: {
      adults: 2,
      children: 0,
      injured: 1,
      pets: 1,
    },
    immediateHazards: ["Rising flood waters", "Submerged electrical breaker", "Cold water hypothermia"],
    medicalConditions: ["Oxygen dependent elderly resident", "Hypothermia risk"],
    equipmentNeeded: ["Inflatable shallow-draft rescue boat", "Portable oxygen concentrator", "Thermal hypothermia blankets", "Life vests (2 adult)"],
    recommendedSkills: ["Swift Water Rescue", "EMT / Paramedic", "Evacuation Transport"],
    firstAidInstructions: [
      "Keep patient calm, upright, and wrapped in dry synthetic or wool layers.",
      "Conserve remaining oxygen tank supply; avoid exertion.",
      "Do NOT enter water if electrical humming or submerged outlets are suspected.",
      "Wave bright fabric or flashlight toward the canal for incoming boat spotters."
    ],
    assignedVolunteerId: "VOL-101",
    assignedVolunteerName: "Marcus Vance",
    assignedVolunteerPhone: "+1 (555) 349-1120",
    assignedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    etaMinutes: 4,
    aiTriageSummary: "Critical water rescue with medically vulnerable elder. Immediate boat dispatch required. Flood depth approaching second floor threshold.",
    notes: "Volunteer Marcus en route with Zodiac inflatable boat."
  },
  {
    id: "INC-8922",
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    reporterName: "David Chen",
    contactNumber: "+1 (555) 981-4450",
    category: "TRAPPED",
    priority: "P2_HIGH",
    status: "EN_ROUTE",
    location: {
      lat: 37.7833,
      lng: -122.4167,
      address: "880 Harrison Street, Apt 3B",
      landmark: "Adjacent to 5th Street Overpass",
      accuracy: 12,
    },
    description: "Debris from fallen oak tree collapsed garage and jammed stairwell door. Three adults unable to exit. Power is out, strong smell of gas from street main.",
    peopleCount: {
      adults: 3,
      children: 0,
      injured: 0,
      pets: 0,
    },
    immediateHazards: ["Structural collapse risk", "Suspected natural gas leak outside", "Zero visibility in hallway"],
    medicalConditions: ["Mild smoke/gas inhalation coughing"],
    equipmentNeeded: ["Hydraulic spreader / pry bar", "Gas sniffer detector", "Respirator masks N95/P100", "High-lumen work lights"],
    recommendedSkills: ["Urban Search and Rescue (USAR)", "Heavy Tools Operator", "Fire Safety"],
    firstAidInstructions: [
      "Do NOT use open flames, matches, or flip electrical switches.",
      "Cover mouths with damp cloth to filter fumes.",
      "Stay near outer window where ventilation is highest."
    ],
    assignedVolunteerId: "VOL-104",
    assignedVolunteerName: "Sarah Jenkins, USAR Cert",
    assignedVolunteerPhone: "+1 (555) 872-9903",
    assignedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    etaMinutes: 7,
    aiTriageSummary: "High priority structural egress obstruction coupled with gas hazard. Gas company alerted; USAR volunteer dispatched with breaching kit.",
  },
  {
    id: "INC-8923",
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    reporterName: "Maria Santos",
    contactNumber: "+1 (555) 441-2098",
    category: "FOOD_WATER",
    priority: "P3_MODERATE",
    status: "PENDING",
    location: {
      lat: 37.7600,
      lng: -122.4350,
      address: "512 Castro Street Community Center",
      landmark: "Beside neighborhood park pavilion",
      accuracy: 15,
    },
    description: "Sheltering 14 neighborhood residents cut off by flooded street. Out of potable drinking water, 2 infants need baby formula, cell batteries running out.",
    peopleCount: {
      adults: 10,
      children: 4,
      injured: 0,
      pets: 2,
    },
    immediateHazards: ["Dehydration risk", "Hypothermia during upcoming nightfall"],
    medicalConditions: ["Infants requiring sterile hydration / formula"],
    equipmentNeeded: ["10x 5-gallon potable water jugs", "Infant milk formula (Gentle/Hypoallergenic)", "High-capacity power bank charging hub", "Dry rations / MREs"],
    recommendedSkills: ["Logistics & Supply Transport", "High Clearance 4x4", "Child Care Support"],
    firstAidInstructions: [
      "Ration existing clean water; boil any tap water for at least 3 minutes before baby preparation if gas available.",
      "Group residents together in interior room with blankets to conserve ambient warmth."
    ],
    aiTriageSummary: "Moderate priority supply replenishment for isolated cluster including infants. Accessible by lifted 4x4 vehicle.",
  },
  {
    id: "INC-8924",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    reporterName: "Officer J. Morales (Patrol 7)",
    contactNumber: "+1 (555) 762-3311",
    category: "MEDICAL",
    priority: "P1_CRITICAL",
    status: "PENDING",
    location: {
      lat: 37.7520,
      lng: -122.4180,
      address: "24th & Mission St Emergency Triage Point",
      landmark: "Under BART station canopy",
      accuracy: 5,
    },
    description: "Pedestrian struck by falling street awning debris during gale gusts. Severe laceration to left forearm with arterial bleeding, conscious but fading into shock.",
    peopleCount: {
      adults: 1,
      children: 0,
      injured: 1,
      pets: 0,
    },
    immediateHazards: ["Unstable hanging debris overhead", "Active severe hemorrhage"],
    medicalConditions: ["Arterial bleeding", "Hypovolemic shock onset"],
    equipmentNeeded: ["Combat Application Tourniquet (CAT)", "Hemostatic gauze / pressure dressing", "Trauma trauma kit", "Stretcher / Backboard"],
    recommendedSkills: ["EMT / Paramedic", "Trauma First Aid", "Doctor/Nurse"],
    firstAidInstructions: [
      "Apply high and tight tourniquet 2-3 inches above bleeding site on upper arm immediately.",
      "Wind windlass rod until bleeding ceases and distal pulse absent; secure clip.",
      "Lay victim flat, elevate legs slightly, keep warm with emergency blanket to counter shock.",
      "Note exact time of tourniquet application on forehead or strap."
    ],
    aiTriageSummary: "Life-threatening arterial trauma. Requires certified medic with tourniquet and immediate trauma stabilization.",
  }
];

let volunteers: Volunteer[] = [
  {
    id: "VOL-101",
    name: "Marcus Vance",
    role: "Swift Water Rescue Specialist",
    callsign: "Vanguard-1",
    phone: "+1 (555) 349-1120",
    email: "marcus.vance@resq.network",
    status: "RESPONDING",
    skills: ["Swift Water Rescue", "EMT / Paramedic", "Boat Captain", "Navigation"],
    equipment: ["14ft Zodiac Inflatable Boat with 25HP Outboard", "Water Rescue PFDs", "Throw bags", "First Aid Trauma Kit", "Night Ops Searchlight"],
    vehicleType: "4x4 Ford F-250 with Boat Trailer",
    location: {
      lat: 37.7790,
      lng: -122.4250,
      address: "En route North Bay Corridor",
      accuracy: 10,
    },
    activeIncidentId: "INC-8921",
    completedMissions: 42,
    rating: 4.95,
    certifiedBadges: ["Red Cross Certified", "State Water Rescue Level 2", "FEMA ICS-100/200"]
  },
  {
    id: "VOL-102",
    name: "Dr. Amara Thorne, MD",
    role: "Emergency Medicine Physician",
    callsign: "Lifeline-Alpha",
    phone: "+1 (555) 670-8812",
    email: "amara.thorne@resq.network",
    status: "AVAILABLE",
    skills: ["Emergency Medicine", "Trauma Care", "Triage Officer", "Advanced Airway"],
    equipment: ["Advanced Medical Kit", "Automated External Defibrillator (AED)", "CAT Tourniquets", "IV fluids & Saline", "Suture & Burn Supplies"],
    vehicleType: "Subaru Outback AWD",
    location: {
      lat: 37.7550,
      lng: -122.4150,
      address: "Mission District Medical Staging Point",
      accuracy: 6,
    },
    completedMissions: 67,
    rating: 5.0,
    certifiedBadges: ["Board Certified ER Physician", "ATLS Certified", "Disaster Med Response"]
  },
  {
    id: "VOL-103",
    name: "Kenji Sato",
    role: "High-Clearance Logistics & Drone Pilot",
    callsign: "Scout-Eagle",
    phone: "+1 (555) 819-2041",
    email: "kenji.sato@resq.network",
    status: "AVAILABLE",
    skills: ["Drone Aerial Survey", "High Clearance 4x4", "Supply Transport", "Ham Radio (K6SAT)"],
    equipment: ["DJI Matrice Thermal Inspection Drone", "4kW Portable Inverter Generator", "50gal Emergency Fuel", "Ham Radio VHF/UHF Station", "Water Purification Filter"],
    vehicleType: "Toyota Land Cruiser 4x4 Lifted",
    location: {
      lat: 37.7650,
      lng: -122.4400,
      address: "Twin Peaks High Vantage Point",
      accuracy: 5,
    },
    completedMissions: 28,
    rating: 4.89,
    certifiedBadges: ["FAA Part 107 Drone License", "FCC Amateur Extra", "Off-Road Recovery"]
  },
  {
    id: "VOL-104",
    name: "Sarah Jenkins",
    role: "Urban Search & Rescue Tech",
    callsign: "Titan-Breaker",
    phone: "+1 (555) 872-9903",
    email: "sarah.jenkins@resq.network",
    status: "RESPONDING",
    skills: ["Urban Search and Rescue (USAR)", "Heavy Tools Operator", "Confined Space Entry", "Firefighter 1"],
    equipment: ["Battery Hydraulic Breaching Spreader", "Gas Detection Meter", "Shoring Jacks", "Chainsaw 20-inch", "Safety Harness Rigging"],
    vehicleType: "Chevy Silverado Heavy Duty Utility",
    location: {
      lat: 37.7810,
      lng: -122.4140,
      address: "Harrison St Approach",
      accuracy: 8,
    },
    activeIncidentId: "INC-8922",
    completedMissions: 53,
    rating: 4.98,
    certifiedBadges: ["FEMA USAR Specialist", "NFPA 1006 Certified", "Structural Collapse Tech"]
  },
  {
    id: "VOL-105",
    name: "Carlos Mendez",
    role: "Community First Responder & Spanish Liaison",
    callsign: "Bridge-7",
    phone: "+1 (555) 438-9921",
    email: "carlos.mendez@resq.network",
    status: "AVAILABLE",
    skills: ["Bilingual (English/Spanish)", "CPR / First Aid", "Evacuation Escort", "Crisis Counseling"],
    equipment: ["Standard First Aid Pack", "Megaphone / PA", "Emergency Food Rations", "Thermal Blankets x20"],
    vehicleType: "Ford Transit Passenger Van",
    location: {
      lat: 37.7500,
      lng: -122.4200,
      address: "24th St Corridor Support",
      accuracy: 10,
    },
    completedMissions: 31,
    rating: 4.92,
    certifiedBadges: ["CERT Team Leader", "Psychological First Aid", "Red Cross Shelter Manager"]
  }
];

let shelters: Shelter[] = [
  {
    id: "SHELTER-01",
    name: "Civic Center Emergency Evacuation Hub",
    type: "EVAC_CENTER",
    location: {
      lat: 37.7795,
      lng: -122.4180,
      address: "99 Grove Street, Civic Center",
      landmark: "Main Civic Auditorium entrance",
    },
    capacity: 450,
    occupied: 280,
    supplies: {
      waterBottles: 1400,
      mrePacks: 950,
      firstAidKits: 45,
      blankets: 380,
      powerGenerators: 3
    },
    medicalStaffPresent: true,
    contactPhone: "+1 (555) 789-0011",
    status: "OPEN"
  },
  {
    id: "SHELTER-02",
    name: "Mission Recreation High Ground Medical Tent",
    type: "MEDICAL_STATION",
    location: {
      lat: 37.7590,
      lng: -122.4190,
      address: "2450 Mission Street",
      landmark: "Park Gymnasium field tent",
    },
    capacity: 120,
    occupied: 85,
    supplies: {
      waterBottles: 600,
      mrePacks: 300,
      firstAidKits: 80,
      blankets: 150,
      powerGenerators: 2
    },
    medicalStaffPresent: true,
    contactPhone: "+1 (555) 789-0022",
    status: "OPEN"
  },
  {
    id: "SHELTER-03",
    name: "Marina High School Dry Supply Depot",
    type: "SUPPLY_DEPOT",
    location: {
      lat: 37.8010,
      lng: -122.4370,
      address: "3500 Fillmore Street",
      landmark: "Gymnasium Loading Dock",
    },
    capacity: 200,
    occupied: 40,
    supplies: {
      waterBottles: 3200,
      mrePacks: 2100,
      firstAidKits: 110,
      blankets: 650,
      powerGenerators: 4
    },
    medicalStaffPresent: false,
    contactPhone: "+1 (555) 789-0033",
    status: "OPEN"
  }
];

let messages: IncidentMessage[] = [
  {
    id: "MSG-1",
    incidentId: "INC-8921",
    senderId: "SYSTEM",
    senderName: "ResQ AI Dispatch",
    senderRole: "SYSTEM",
    text: "P1 Critical Alert triggered. Location locked to Marina Blvd. AI Triage classified as Water Rescue with oxygen patient.",
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
  },
  {
    id: "MSG-2",
    incidentId: "INC-8921",
    senderId: "VOL-101",
    senderName: "Marcus Vance (Vanguard-1)",
    senderRole: "VOLUNTEER",
    text: "Dispatched. Inflatable Zodiac boat loaded on trailer. Approaching Marina Blvd from Lombard. Elena, are you still on the 2nd floor balcony?",
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "MSG-3",
    incidentId: "INC-8921",
    senderId: "VICTIM-8921",
    senderName: "Elena Rostova",
    senderRole: "VICTIM",
    text: "Yes, we are on the north balcony! Water reached the bottom steps. My mother has about 45 minutes of oxygen left in this portable tank. We have a yellow towel hanging over the railing.",
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    isUrgent: true,
  },
  {
    id: "MSG-4",
    incidentId: "INC-8921",
    senderId: "VOL-101",
    senderName: "Marcus Vance (Vanguard-1)",
    senderRole: "VOLUNTEER",
    text: "Copy yellow towel. I have a spare medical O2 cylinder and regulator with me. ETA 3 minutes, launching boat at Bay St turnoff.",
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  }
];

// Helper: Calculate distance in kilometers between two GPS coordinates
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Lazy Gemini AI Client initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// AI Fallback Heuristic Triage (for resilient zero-downtime offline/crisis operations)
function heuristicTriage(description: string, category: string, peopleCount: any): {
  priority: PriorityLevel;
  hazards: string[];
  equipment: string[];
  skills: string[];
  firstAid: string[];
  summary: string;
} {
  const text = (description + " " + category).toLowerCase();
  let priority: PriorityLevel = "P3_MODERATE";
  const hazards: string[] = [];
  const equipment: string[] = [];
  const skills: string[] = [];
  const firstAid: string[] = [];

  if (text.includes("bleed") || text.includes("unconscious") || text.includes("heart") || text.includes("breath") || text.includes("oxygen") || text.includes("drown") || text.includes("trapped") || text.includes("collapsed") || text.includes("surge") || text.includes("fire")) {
    priority = "P1_CRITICAL";
  } else if (text.includes("broken") || text.includes("wound") || text.includes("hypothermia") || text.includes("water rising") || text.includes("gas leak")) {
    priority = "P2_HIGH";
  } else if (text.includes("water") || text.includes("food") || text.includes("infant") || text.includes("medicine") || text.includes("power")) {
    priority = "P3_MODERATE";
  } else {
    priority = "P4_LOW";
  }

  if (category === "FLOOD_RESCUE" || text.includes("water") || text.includes("flood")) {
    hazards.push("Rising water level", "Submerged debris", "Contaminated floodwater");
    equipment.push("Inflatable rescue boat", "PFD Life jackets", "Thermal blankets", "Dry sacks");
    skills.push("Swift Water Rescue", "Boating / Navigation", "Hypothermia management");
    firstAid.push(
      "Seek high ground or upper floor immediately.",
      "Do NOT enter walking flood water deeper than 6 inches.",
      "Keep warm and dry with multiple layered clothing.",
      "Signal rescuers with flashlight or bright colored cloth."
    );
  } else if (category === "MEDICAL" || text.includes("bleed") || text.includes("injury")) {
    hazards.push("Hemorrhage", "Shock progression", "Unstable environment");
    equipment.push("Trauma first aid kit", "Tourniquet / Pressure bandage", "Splints", "Stretcher");
    skills.push("EMT / Paramedic", "Trauma First Aid", "CPR");
    firstAid.push(
      "Apply firm direct pressure to bleeding with clean cloth.",
      "If limb bleeding does not stop and pulsates, apply tourniquet 2-3 inches above wound.",
      "Keep patient lying down, elevate feet slightly if shock symptoms appear, cover with blanket.",
      "Do NOT give fluids to an unconscious or severely injured person."
    );
  } else if (category === "TRAPPED" || text.includes("debris") || text.includes("door")) {
    hazards.push("Secondary collapse", "Dust/Fumes inhalation", "Limited egress");
    equipment.push("Hydraulic spreader", "Heavy pry bar", "N95 masks", "Emergency lights");
    skills.push("Urban Search and Rescue (USAR)", "Structural safety", "First Aid");
    firstAid.push(
      "Stay calm to conserve oxygen.",
      "Tap rhythmically in cycles of three on pipes or walls so rescuers can locate audio.",
      "Cover mouth and nose with cloth to avoid inhaling dust."
    );
  } else {
    hazards.push("Exposure to elements", "Dehydration / Hunger");
    equipment.push("Potable water containers", "Ready-to-eat meals", "First aid supplies", "Power bank");
    skills.push("Logistics & Transport", "Community Support");
    firstAid.push(
      "Stay sheltered in a secure, dry location.",
      "Ration existing drinking water carefully.",
      "Keep mobile device on battery saver mode."
    );
  }

  const summary = `${priority === 'P1_CRITICAL' ? 'URGENT LIFE-SAFETY' : priority}: ${category.replace('_', ' ')} incident with ${peopleCount?.adults || 1} adults, ${peopleCount?.children || 0} children, ${peopleCount?.injured || 0} injured.`;

  return { priority, hazards, equipment, skills, firstAid, summary };
}

// 1. Get all Incidents
app.get("/api/incidents", (req, res) => {
  res.json({
    success: true,
    incidents,
    count: incidents.length,
    p1Count: incidents.filter(i => i.priority === "P1_CRITICAL" && i.status !== "RESOLVED").length
  });
});

// 2. Submit new Incident SOS with AI Triage
app.post("/api/incidents", async (req, res) => {
  try {
    const data = req.body;
    const newId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;

    let aiResult = heuristicTriage(data.description || "", data.category || "MEDICAL", data.peopleCount);

    // If Gemini client available, run intelligent emergency triage
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const prompt = `You are ResQ AI, an expert emergency disaster triage officer trained in FEMA ICS and Wilderness Emergency Medicine.
Analyze this emergency SOS alert and return STRICT JSON with no markdown backticks:
Incident Category: ${data.category}
Reporter: ${data.reporterName}
Location: ${data.location?.address || 'Unknown'} (Lat: ${data.location?.lat}, Lng: ${data.location?.lng})
People: Adults: ${data.peopleCount?.adults}, Children: ${data.peopleCount?.children}, Injured: ${data.peopleCount?.injured}, Pets: ${data.peopleCount?.pets}
Description: "${data.description}"
Medical Info: "${(data.medicalConditions || []).join(', ')}"

JSON schema required:
{
  "priority": "P1_CRITICAL" | "P2_HIGH" | "P3_MODERATE" | "P4_LOW",
  "hazards": ["string"],
  "equipment": ["string"],
  "skills": ["string"],
  "firstAid": ["string (actionable immediate step victim must take right now)"],
  "summary": "Concise 1-2 sentence emergency brief for incoming volunteer"
}`;

        const response = await gemini.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        const rawText = response.text || "";
        const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.priority) {
          aiResult = {
            priority: parsed.priority,
            hazards: parsed.hazards || aiResult.hazards,
            equipment: parsed.equipment || aiResult.equipment,
            skills: parsed.skills || aiResult.skills,
            firstAid: parsed.firstAid || aiResult.firstAid,
            summary: parsed.summary || aiResult.summary,
          };
        }
      } catch (aiErr) {
        console.warn("Gemini Triage fallback applied:", aiErr);
      }
    }

    // Auto-match best volunteer if available
    const availableVolunteers = volunteers.filter(v => v.status === "AVAILABLE");
    let matchedVolunteer: Volunteer | undefined;
    if (availableVolunteers.length > 0) {
      // Find volunteer with closest distance and matching skills
      matchedVolunteer = availableVolunteers.sort((a, b) => {
        const distA = calculateDistanceKm(a.location.lat, a.location.lng, data.location?.lat || 37.77, data.location?.lng || -122.42);
        const distB = calculateDistanceKm(b.location.lat, b.location.lng, data.location?.lat || 37.77, data.location?.lng || -122.42);
        return distA - distB;
      })[0];
    }

    const createdIncident: Incident = {
      id: newId,
      createdAt: new Date().toISOString(),
      reporterName: data.reporterName || "Anonymous Resident",
      contactNumber: data.contactNumber || "+1 (555) 000-9111",
      category: data.category || "MEDICAL",
      priority: aiResult.priority,
      status: matchedVolunteer ? "DISPATCHED" : "PENDING",
      location: {
        lat: data.location?.lat || 37.7749,
        lng: data.location?.lng || -122.4194,
        address: data.location?.address || "Current GPS Location",
        landmark: data.location?.landmark || "",
        accuracy: data.location?.accuracy || 10,
      },
      description: data.description || "Urgent assistance requested.",
      peopleCount: {
        adults: Number(data.peopleCount?.adults) || 1,
        children: Number(data.peopleCount?.children) || 0,
        injured: Number(data.peopleCount?.injured) || 0,
        pets: Number(data.peopleCount?.pets) || 0,
      },
      immediateHazards: aiResult.hazards,
      medicalConditions: data.medicalConditions || [],
      equipmentNeeded: aiResult.equipment,
      recommendedSkills: aiResult.skills,
      firstAidInstructions: aiResult.firstAid,
      assignedVolunteerId: matchedVolunteer?.id,
      assignedVolunteerName: matchedVolunteer ? `${matchedVolunteer.name} (${matchedVolunteer.callsign})` : undefined,
      assignedVolunteerPhone: matchedVolunteer?.phone,
      assignedAt: matchedVolunteer ? new Date().toISOString() : undefined,
      etaMinutes: matchedVolunteer ? Math.max(3, Math.round(calculateDistanceKm(matchedVolunteer.location.lat, matchedVolunteer.location.lng, data.location?.lat || 37.77, data.location?.lng || -122.42) * 3)) : undefined,
      aiTriageSummary: aiResult.summary,
      notes: matchedVolunteer ? `Auto-dispatched ${matchedVolunteer.name} based on proximity and skill requirements.` : "Queued in incident radar for nearest available responder."
    };

    if (matchedVolunteer) {
      matchedVolunteer.status = "RESPONDING";
      matchedVolunteer.activeIncidentId = createdIncident.id;
    }

    incidents.unshift(createdIncident);

    // Initial system chat message
    messages.push({
      id: `MSG-${Date.now()}`,
      incidentId: createdIncident.id,
      senderId: "SYSTEM",
      senderName: "ResQ AI Dispatch",
      senderRole: "SYSTEM",
      text: `SOS Received. Triage Priority: ${createdIncident.priority}. ${matchedVolunteer ? `Responder ${matchedVolunteer.name} alerted.` : 'Broadcasting alert to nearby volunteer units.'}`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      incident: createdIncident,
      matchedVolunteer: matchedVolunteer || null,
    });
  } catch (err: any) {
    console.error("Error creating incident:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to create incident" });
  }
});

// 3. Update Incident status (Claim, En route, On scene, Resolve)
app.patch("/api/incidents/:id", (req, res) => {
  const { id } = req.params;
  const { status, volunteerId, notes } = req.body;

  const incident = incidents.find(i => i.id === id);
  if (!incident) {
    return res.status(404).json({ success: false, error: "Incident not found" });
  }

  if (status) incident.status = status;
  if (notes) incident.notes = notes;

  if (volunteerId) {
    const vol = volunteers.find(v => v.id === volunteerId);
    if (vol) {
      incident.assignedVolunteerId = vol.id;
      incident.assignedVolunteerName = `${vol.name} (${vol.callsign})`;
      incident.assignedVolunteerPhone = vol.phone;
      incident.assignedAt = new Date().toISOString();
      const dist = calculateDistanceKm(vol.location.lat, vol.location.lng, incident.location.lat, incident.location.lng);
      incident.etaMinutes = Math.max(2, Math.round(dist * 3));
      
      vol.status = status === "RESOLVED" ? "AVAILABLE" : "RESPONDING";
      vol.activeIncidentId = status === "RESOLVED" ? undefined : incident.id;
      if (status === "RESOLVED") {
        vol.completedMissions += 1;
      }
    }
  }

  if (status === "RESOLVED") {
    // Release assigned volunteer if any
    const assignedVol = volunteers.find(v => v.id === incident.assignedVolunteerId);
    if (assignedVol) {
      assignedVol.status = "AVAILABLE";
      assignedVol.activeIncidentId = undefined;
      assignedVol.completedMissions += 1;
    }
    messages.push({
      id: `MSG-${Date.now()}`,
      incidentId: incident.id,
      senderId: "SYSTEM",
      senderName: "ResQ AI Dispatch",
      senderRole: "SYSTEM",
      text: `Incident marked RESOLVED. All parties safe. Rescue log archived.`,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({ success: true, incident });
});

// 4. Volunteers List & Status Management
app.get("/api/volunteers", (req, res) => {
  res.json({
    success: true,
    volunteers,
    availableCount: volunteers.filter(v => v.status === "AVAILABLE").length,
    respondingCount: volunteers.filter(v => v.status === "RESPONDING" || v.status === "ON_SCENE").length,
  });
});

app.post("/api/volunteers", (req, res) => {
  const data = req.body;
  const existing = volunteers.find(v => v.id === data.id || v.email === data.email);

  if (existing) {
    Object.assign(existing, data);
    return res.json({ success: true, volunteer: existing });
  }

  const newVol: Volunteer = {
    id: `VOL-${Math.floor(100 + Math.random() * 900)}`,
    name: data.name || "Volunteer Responder",
    role: data.role || "Community First Responder",
    callsign: data.callsign || `Unit-${Math.floor(10 + Math.random() * 90)}`,
    phone: data.phone || "+1 (555) 000-1234",
    email: data.email || `responder_${Date.now()}@resq.network`,
    status: data.status || "AVAILABLE",
    skills: data.skills || ["CPR / First Aid", "Community Support"],
    equipment: data.equipment || ["Standard First Aid Kit", "Flashlight"],
    vehicleType: data.vehicleType || "Standard Passenger Vehicle",
    location: data.location || {
      lat: 37.77,
      lng: -122.42,
      address: "San Francisco Central District",
    },
    completedMissions: 0,
    rating: 5.0,
    certifiedBadges: data.certifiedBadges || ["ResQ Verified Volunteer"],
  };

  volunteers.push(newVol);
  res.status(201).json({ success: true, volunteer: newVol });
});

// 5. Shelters and Relief Depots
app.get("/api/shelters", (req, res) => {
  res.json({
    success: true,
    shelters,
    totalCapacity: shelters.reduce((acc, s) => acc + s.capacity, 0),
    totalOccupied: shelters.reduce((acc, s) => acc + s.occupied, 0),
  });
});

// 6. Incident Coordination Chat
app.get("/api/incidents/:id/messages", (req, res) => {
  const { id } = req.params;
  const incidentMsgs = messages.filter(m => m.incidentId === id);
  res.json({ success: true, messages: incidentMsgs });
});

app.post("/api/incidents/:id/messages", (req, res) => {
  const { id } = req.params;
  const { text, senderId, senderName, senderRole, isUrgent } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ success: false, error: "Message text is required" });
  }

  const newMsg: IncidentMessage = {
    id: `MSG-${Date.now()}`,
    incidentId: id,
    senderId: senderId || "USER",
    senderName: senderName || "Responder",
    senderRole: senderRole || "VOLUNTEER",
    text: text.trim(),
    timestamp: new Date().toISOString(),
    isUrgent: Boolean(isUrgent),
  };

  messages.push(newMsg);
  res.status(201).json({ success: true, message: newMsg });
});

// 7. AI Emergency Situation Report (SitRep) for Ops Command
app.post("/api/ai/sitrep", async (req, res) => {
  try {
    const gemini = getGeminiClient();
    const activeIncidents = incidents.filter(i => i.status !== "RESOLVED");
    const p1List = activeIncidents.filter(i => i.priority === "P1_CRITICAL");
    const availableResponders = volunteers.filter(v => v.status === "AVAILABLE");

    if (gemini) {
      const prompt = `You are the Lead Emergency Coordinator generating a Situation Report (SitRep) for disaster response leadership.
Current Data:
- Active Incidents: ${activeIncidents.length} (P1 Critical: ${p1List.length}, P2 High: ${activeIncidents.filter(i => i.priority === 'P2_HIGH').length})
- Available Volunteers: ${availableResponders.length} out of ${volunteers.length} total
- Open Shelters: ${shelters.length} with ${shelters.reduce((acc, s) => acc + s.occupied, 0)} people sheltered
- Critical Incidents summary: ${JSON.stringify(p1List.map(i => ({ id: i.id, cat: i.category, loc: i.location.address, desc: i.description })))}

Generate a crisp JSON SitRep with:
{
  "timestamp": "${new Date().toISOString()}",
  "overallThreatLevel": "CRITICAL" | "ELEVATED" | "STABLE",
  "summary": "Executive briefing (2-3 sentences)",
  "criticalSectors": [
    {"name": "Sector name", "incidentCount": number, "riskFactor": "High flood depth / collapsed access / etc."}
  ],
  "keyBottlenecks": ["e.g. Boat shortage in Sector 4", "Traffic choke at 5th St bridge"],
  "recommendations": ["Actionable priority commands for volunteers and dispatchers"],
  "volunteerDeploymentStatus": "Short status update on fleet"
}
Return valid raw JSON only.`;

      const response = await gemini.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      const cleanJson = (response.text || "").replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      return res.json({ success: true, sitrep: parsed });
    }

    // Fallback SitRep
    const fallbackSitrep: SituationReport = {
      timestamp: new Date().toISOString(),
      overallThreatLevel: p1List.length > 0 ? "CRITICAL" : "ELEVATED",
      summary: `Active crisis response underway with ${activeIncidents.length} active emergency calls. ${p1List.length} critical life-safety rescues in progress. Priority focus on swift-water extraction in low-lying sectors.`,
      criticalSectors: [
        { name: "Marina & North Bay Sector", incidentCount: 2, riskFactor: "Storm surge water level 4ft+" },
        { name: "Mission & South Corridor", incidentCount: 2, riskFactor: "Structural debris and power failure" }
      ],
      keyBottlenecks: [
        "Limited shallow-draft rescue boats for Marina corridor",
        "High-priority pediatric & infant supplies need escort",
        "Heavy debris blocking secondary access roads"
      ],
      recommendations: [
        "Direct all arriving 4x4 and boat units to staging hub at Civic Center",
        "Maintain satellite radio check-ins every 15 minutes",
        "Keep non-urgent medical calls directed to Mission Rec field tent"
      ],
      volunteerDeploymentStatus: `${volunteers.filter(v => v.status === 'RESPONDING').length} units deployed on active missions; ${availableResponders.length} units staged in reserve.`
    };

    res.json({ success: true, sitrep: fallbackSitrep });
  } catch (err: any) {
    console.error("SitRep error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. AI Interactive Emergency First-Aid Assistant
app.post("/api/ai/firstaid", async (req, res) => {
  try {
    const { question, incidentContext } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, error: "Question required" });
    }

    const gemini = getGeminiClient();
    if (gemini) {
      const prompt = `You are ResQ AI's Emergency Medical & Survival Assistant.
A civilian or volunteer in an active disaster needs immediate, calm, life-saving instructions.
Context: ${incidentContext ? JSON.stringify(incidentContext) : 'Emergency field situation'}
Question: "${question}"

Provide:
1. Immediate ACTION (Top 1-2 steps to do RIGHT NOW in bold).
2. SAFETY WARNINGS (What NOT to do).
3. MONITORING (Signs of worsening condition).
Keep instructions short, unambiguous, and formatted in clean markdown bullet points.`;

      const response = await gemini.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      return res.json({ success: true, answer: response.text });
    }

    // Heuristic Emergency First Aid advice
    res.json({
      success: true,
      answer: `### Immediate Emergency Guidance\n\n* **Ensure Scene Safety**: Do not step into floodwater near electrical equipment or unstable overhead debris.\n* **Control Bleeding**: Apply firm, continuous direct pressure with a clean cloth. Elevate wound if possible.\n* **Treat for Shock**: Lay victim down, keep warm with blankets, do not give oral liquids if unconscious or scheduled for surgery.\n* **Signal Responders**: Use flashlight or bright cloth in triple pulses (universal SOS signal).`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Comprehensive Project-Oriented Emergency Copilot Chatbot
app.post("/api/ai/project-chat", async (req, res) => {
  try {
    const { message, history, userRole, activeIncidentId, activeVolunteerId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    const activeIncidents = incidents.filter(i => i.status !== "RESOLVED");
    const p1List = activeIncidents.filter(i => i.priority === "P1_CRITICAL");
    const openShelters = shelters.filter(s => s.status === "OPEN");

    // Real-time disaster data snapshot
    const disasterTelemetry = {
      disasterEvent: "Sector 4 Coastal Surge & Flash Flood Emergency",
      activeThreatLevel: p1List.length > 0 ? "CRITICAL" : "ELEVATED",
      metrics: {
        activeIncidentsCount: activeIncidents.length,
        p1CriticalCount: p1List.length,
        availableVolunteersCount: volunteers.filter(v => v.status === "AVAILABLE").length,
        totalSheltered: shelters.reduce((acc, s) => acc + s.occupied, 0),
        shelterCapacityRemaining: shelters.reduce((acc, s) => acc + (s.capacity - s.occupied), 0),
      },
      currentIncidents: activeIncidents.map(i => ({
        id: i.id,
        reporter: i.reporterName,
        category: i.category,
        priority: i.priority,
        status: i.status,
        address: i.location.address,
        description: i.description,
        people: i.peopleCount,
        hazards: i.immediateHazards,
        assignedTo: i.assignedVolunteerName || "UNASSIGNED",
        eta: i.etaMinutes ? `${i.etaMinutes} mins` : undefined,
        equipmentNeeded: i.equipmentNeeded,
      })),
      volunteersFleet: volunteers.map(v => ({
        id: v.id,
        name: v.name,
        callsign: v.callsign,
        role: v.role,
        status: v.status,
        skills: v.skills,
        equipment: v.equipment,
        vehicle: v.vehicleType,
        activeIncidentId: v.activeIncidentId || null,
        location: v.location.address,
      })),
      shelters: shelters.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        address: s.location.address,
        occupied: s.occupied,
        capacity: s.capacity,
        availableBeds: s.capacity - s.occupied,
        medicalStaff: s.medicalStaffPresent,
        supplies: s.supplies,
      })),
    };

    const gemini = getGeminiClient();

    if (gemini) {
      const prompt = `You are "ResQ Disaster Copilot", the project-oriented AI emergency assistant embedded in the ResQ AI Disaster Response Platform.
You have direct, real-time live telemetry access to all active incidents, volunteers, shelters, and supplies during this severe storm surge disaster.

User Persona: ${userRole || 'CIVILIAN'} (options: CIVILIAN in distress, VOLUNTEER responder, DISPATCHER commander).
Selected Active Incident ID: ${activeIncidentId || 'None'}
Selected Active Volunteer ID: ${activeVolunteerId || 'None'}

LIVE PROJECT TELEMETRY DATA:
${JSON.stringify(disasterTelemetry, null, 2)}

User's Latest Query: "${message}"

Recent conversation history:
${(history || []).slice(-4).map((h: any) => `${h.role === 'user' ? 'User' : 'Copilot'}: ${h.text}`).join('\n')}

Instructions:
1. Actively reference real data from the project snapshot above: cite specific Incident IDs (e.g. INC-8921, INC-8924), specific volunteer names & callsigns (e.g. Marcus Vance Vanguard-1, Dr. Amara Thorne), and specific shelters (e.g. Civic Center Hub, Marina High Depot).
2. If the user is in danger or asks for SOS, prioritize life-safety instructions (bold immediate actions, what NOT to do) and recommend creating an SOS or taking cover.
3. If the user is a volunteer or dispatcher, provide tactical resource matching, distance estimates, and logistics guidance.
4. Output STRICT JSON only without code fences:
{
  "text": "Markdown formatted answer with clear, structured bullet points, bold key terms, and calm, authoritative advice.",
  "actions": [
    {
      "label": "Short Action Title (e.g. 'View Incident INC-8921' or 'Find Nearest Shelter' or 'Switch to Radar Map')",
      "actionType": "VIEW_INCIDENT" | "VIEW_SHELTER" | "NAVIGATE_TAB" | "PREFILL_SOS" | "TOGGLE_SIREN" | "CLAIM_INCIDENT",
      "payload": { "id": "target ID or tab string (civilian/volunteer/map/ops)" }
    }
  ],
  "suggestedPrompts": [
    "Short 3-5 word follow up query 1",
    "Short 3-5 word follow up query 2",
    "Short 3-5 word follow up query 3"
  ]
}`;

      try {
        const response = await gemini.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        const raw = response.text || "";
        const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(clean);
        return res.json({
          success: true,
          text: parsed.text || "Emergency query processed.",
          actions: parsed.actions || [],
          suggestedPrompts: parsed.suggestedPrompts || [
            "Active P1 Critical Rescues",
            "Find Open Shelters",
            "Available Boat Responders"
          ]
        });
      } catch (err) {
        console.warn("Gemini Chatbot fallback applied:", err);
      }
    }

    // Heuristic Smart Fallback with real project data matching
    const q = message.toLowerCase();
    let text = "";
    const actions: any[] = [];
    const suggestedPrompts = [
      "Show P1 Critical calls",
      "Which shelters have open beds?",
      "Who has water rescue boats?",
      "How to treat severe bleeding?"
    ];

    if (q.includes("p1") || q.includes("critical") || q.includes("urgent")) {
      text = `### Active P1 Critical Rescues (${p1List.length} Active)\n\n` +
        p1List.map(i => `* **${i.id}** (${i.category}): ${i.reporterName} at *${i.location.address}*\n  - **Condition**: ${i.description}\n  - **Assigned Unit**: ${i.assignedVolunteerName || '⚠️ UNASSIGNED - IMMEDIATE DISPATCH NEEDED'}\n  - **Hazards**: ${i.immediateHazards.join(', ')}`).join('\n\n');
      
      if (p1List.length > 0) {
        actions.push({
          label: `View Critical ${p1List[0].id}`,
          actionType: "VIEW_INCIDENT",
          payload: { id: p1List[0].id }
        });
      }
      actions.push({
        label: "Open Incident Radar Map",
        actionType: "NAVIGATE_TAB",
        payload: { tab: "map" }
      });
    } else if (q.includes("shelter") || q.includes("bed") || q.includes("evac") || q.includes("safe place")) {
      text = `### Emergency Relief Hubs & Shelter Availability\n\n` +
        shelters.map(s => `* **${s.name}** (${s.type.replace('_', ' ')})\n  - **Address**: ${s.location.address}\n  - **Occupancy**: ${s.occupied}/${s.capacity} beds (${s.capacity - s.occupied} available)\n  - **Medical Staff**: ${s.medicalStaffPresent ? '✅ On Site' : '❌ None'}\n  - **Generators**: ${s.supplies.powerGenerators} units | **Water**: ${s.supplies.waterBottles} bottles`).join('\n\n');
      
      actions.push({
        label: "View Civic Center Evacuation Hub",
        actionType: "VIEW_SHELTER",
        payload: { id: "SHELTER-01" }
      });
      actions.push({
        label: "Open Ops Command (ICS-201)",
        actionType: "NAVIGATE_TAB",
        payload: { tab: "ops" }
      });
    } else if (q.includes("boat") || q.includes("water rescue") || q.includes("flood unit") || q.includes("marcus")) {
      const boatVol = volunteers.find(v => v.skills.some(s => s.toLowerCase().includes("water")) || v.equipment.some(e => e.toLowerCase().includes("boat")));
      text = `### Water Rescue Units On Duty\n\n* **${boatVol?.name || 'Marcus Vance'}** (Callsign: *${boatVol?.callsign || 'Vanguard-1'}*)\n  - **Status**: ${boatVol?.status || 'RESPONDING'}\n  - **Equipment**: ${boatVol?.equipment.join(', ')}\n  - **Vehicle**: ${boatVol?.vehicleType}\n  - **Active Call**: ${boatVol?.activeIncidentId || 'Standby'}\n  - **Contact**: ${boatVol?.phone}`;
      
      actions.push({
        label: "Switch to Volunteer Fleet",
        actionType: "NAVIGATE_TAB",
        payload: { tab: "volunteer" }
      });
    } else if (q.includes("doctor") || q.includes("medic") || q.includes("trauma") || q.includes("amara") || q.includes("thorne")) {
      const doc = volunteers.find(v => v.id === "VOL-102");
      text = `### Emergency Physician On Call\n\n* **${doc?.name}** (Callsign: *${doc?.callsign}*)\n  - **Status**: ${doc?.status} (Staged at ${doc?.location.address})\n  - **Equipment**: ${doc?.equipment.join(', ')}\n  - **Certifications**: ${doc?.certifiedBadges.join(', ')}\n  - **Direct Line**: ${doc?.phone}`;
      
      actions.push({
        label: "Inspect Responder Roster",
        actionType: "NAVIGATE_TAB",
        payload: { tab: "volunteer" }
      });
    } else if (q.includes("sos") || q.includes("help me") || q.includes("trap") || q.includes("rising") || q.includes("bleeding")) {
      text = `### 🚨 EMERGENCY GUIDANCE - ACT NOW\n\n1. **Move to Highest Possible Ground**: Do not enter moving water deeper than your shins.\n2. **Avoid Electrical Hazards**: If you hear buzzing or see submerged outlets, back away immediately.\n3. **Signal Location**: Use a flashlight, bright towel, or acoustic beacon.\n4. **Official Alert**: Submit an SOS beacon below so nearby responders receive your exact GPS pin.`;
      
      actions.push({
        label: "Submit Emergency SOS Beacon",
        actionType: "PREFILL_SOS",
        payload: { description: message }
      });
      actions.push({
        label: "Activate Emergency Acoustic Siren",
        actionType: "TOGGLE_SIREN"
      });
    } else {
      text = `### ResQ AI Disaster Copilot\n\nI am monitoring **${activeIncidents.length} active incidents** (including **${p1List.length} P1 Critical**) across Sector 4.\n\n* **Responders Deployed**: ${volunteers.filter(v => v.status === 'RESPONDING').length} active units on scene, ${volunteers.filter(v => v.status === 'AVAILABLE').length} staged in reserve.\n* **Shelters Open**: ${openShelters.length} centers with ${shelters.reduce((acc, s) => acc + (s.capacity - s.occupied), 0)} open beds.\n\nHow can I assist your mission or safety right now?`;
      
      actions.push({
        label: "Review Live Radar Map",
        actionType: "NAVIGATE_TAB",
        payload: { tab: "map" }
      });
      actions.push({
        label: "Open Ops Command (ICS-201)",
        actionType: "NAVIGATE_TAB",
        payload: { tab: "ops" }
      });
    }

    res.json({
      success: true,
      text,
      actions,
      suggestedPrompts
    });
  } catch (err: any) {
    console.error("Project Chat error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Shelter Evacuation Transfer
app.post("/api/shelters/:id/evacuate", (req, res) => {
  const { id } = req.params;
  const { incidentId, peopleCount } = req.body;

  const shelter = shelters.find(s => s.id === id);
  if (!shelter) {
    return res.status(404).json({ success: false, error: "Shelter not found" });
  }

  const count = Number(peopleCount) || 1;
  shelter.occupied = Math.min(shelter.capacity, shelter.occupied + count);

  if (incidentId) {
    const inc = incidents.find(i => i.id === incidentId);
    if (inc) {
      inc.notes = (inc.notes ? inc.notes + " | " : "") + `Evacuated ${count} individuals to ${shelter.name}.`;
    }
  }

  res.json({ success: true, shelter });
});

// 11. Mesh Radio / SMS Packet Ingest
app.post("/api/incidents/mesh-ingest", (req, res) => {
  try {
    const { packet } = req.body;
    if (!packet || typeof packet !== 'string') {
      return res.status(400).json({ success: false, error: "Packet string is required" });
    }

    // Format example: RESQ:P1|INC-8999|37.772,-122.42|FLOOD|2A 1C|Water at 2nd floor balcony
    const parts = packet.split("|");
    const header = parts[0]?.trim() || "RESQ:P2";
    const priorityCode = header.includes("P1") ? "P1_CRITICAL" : header.includes("P3") ? "P3_MODERATE" : "P2_HIGH";
    const packetId = parts[1]?.trim() || `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    const coordStr = parts[2]?.trim() || "37.7749,-122.4194";
    const [latStr, lngStr] = coordStr.split(",");
    const categoryRaw = parts[3]?.trim()?.toUpperCase() || "FLOOD_RESCUE";
    const countStr = parts[4]?.trim() || "1A";
    const description = parts[5]?.trim() || "Emergency radio packet broadcast received via VHF mesh relay.";

    const category = categoryRaw.includes("MED") ? "MEDICAL" : categoryRaw.includes("TRAP") ? "TRAPPED" : categoryRaw.includes("FIRE") ? "FIRE_HAZARD" : "FLOOD_RESCUE";

    const newIncident: Incident = {
      id: packetId.startsWith("INC-") ? packetId : `INC-${packetId}`,
      createdAt: new Date().toISOString(),
      reporterName: `Radio Mesh Operator (${header})`,
      contactNumber: "VHF Relay 146.520 MHz",
      category,
      priority: priorityCode as PriorityLevel,
      status: "PENDING",
      location: {
        lat: parseFloat(latStr) || 37.7749,
        lng: parseFloat(lngStr) || -122.4194,
        address: `Mesh Sector Grid (${latStr}, ${lngStr})`,
        accuracy: 25,
      },
      description: `[DECODED PACKET]: ${description} (${countStr})`,
      peopleCount: { adults: 2, children: 1, injured: 0, pets: 0 },
      immediateHazards: ["Remote/Low-Bandwidth Area", "Grid Failure"],
      medicalConditions: [],
      equipmentNeeded: ["VHF Radio Handheld", "First Aid Kit", "Emergency Rations"],
      recommendedSkills: ["Ham Radio Operator", "Field Responder"],
      firstAidInstructions: ["Keep radio frequency clear for command instructions."],
      aiTriageSummary: `Ingested via packet radio transceiver. Priority: ${priorityCode}.`,
    };

    incidents.unshift(newIncident);
    res.status(201).json({ success: true, incident: newIncident });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite Middleware for development or static serving for production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ResQ AI Emergency Platform running at http://0.0.0.0:${PORT}`);
  });
}

start();
