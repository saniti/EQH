import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { userOrganizations } from "../drizzle/schema";
import "dotenv/config";

// Create MySQL connection
const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection);

// Australian Racetracks
const australianTracks = [
  // Victoria
  { name: "Flemington Racecourse", type: "Thoroughbred Racing", location: "Melbourne, VIC", description: "Home of the Melbourne Cup, Australia's most famous race" },
  { name: "Caulfield Racecourse", type: "Thoroughbred Racing", location: "Melbourne, VIC", description: "Major metropolitan racing venue" },
  { name: "Moonee Valley Racecourse", type: "Thoroughbred Racing", location: "Melbourne, VIC", description: "Night racing venue, home of the Cox Plate" },
  { name: "Sandown Racecourse", type: "Thoroughbred Racing", location: "Melbourne, VIC", description: "Lakeside racing venue" },
  
  // New South Wales
  { name: "Royal Randwick Racecourse", type: "Thoroughbred Racing", location: "Sydney, NSW", description: "Premier racing venue in Sydney" },
  { name: "Rosehill Gardens Racecourse", type: "Thoroughbred Racing", location: "Sydney, NSW", description: "Major Sydney racing venue" },
  { name: "Canterbury Park Racecourse", type: "Thoroughbred Racing", location: "Sydney, NSW", description: "Night racing venue" },
  { name: "Warwick Farm Racecourse", type: "Thoroughbred Racing", location: "Sydney, NSW", description: "Metropolitan racing venue" },
  
  // Queensland
  { name: "Eagle Farm Racecourse", type: "Thoroughbred Racing", location: "Brisbane, QLD", description: "Premier racing venue in Queensland" },
  { name: "Doomben Racecourse", type: "Thoroughbred Racing", location: "Brisbane, QLD", description: "Major Brisbane racing venue" },
  { name: "Gold Coast Turf Club", type: "Thoroughbred Racing", location: "Gold Coast, QLD", description: "Gold Coast premier venue" },
  
  // South Australia
  { name: "Morphettville Racecourse", type: "Thoroughbred Racing", location: "Adelaide, SA", description: "Premier racing venue in South Australia" },
  { name: "Cheltenham Park Racecourse", type: "Thoroughbred Racing", location: "Adelaide, SA", description: "Metropolitan racing venue" },
  
  // Western Australia
  { name: "Ascot Racecourse", type: "Thoroughbred Racing", location: "Perth, WA", description: "Premier racing venue in Western Australia" },
  { name: "Belmont Park Racecourse", type: "Thoroughbred Racing", location: "Perth, WA", description: "Major Perth racing venue" },
  
  // Tasmania
  { name: "Elwick Racecourse", type: "Thoroughbred Racing", location: "Hobart, TAS", description: "Premier racing venue in Tasmania" },
  { name: "Mowbray Racecourse", type: "Thoroughbred Racing", location: "Launceston, TAS", description: "Northern Tasmania racing venue" },
];

// United States Racetracks
const usTracks = [
  // Kentucky
  { name: "Churchill Downs", type: "Thoroughbred Racing", location: "Louisville, KY", description: "Home of the Kentucky Derby" },
  { name: "Keeneland", type: "Thoroughbred Racing", location: "Lexington, KY", description: "Historic thoroughbred racing venue" },
  
  // New York
  { name: "Belmont Park", type: "Thoroughbred Racing", location: "Elmont, NY", description: "Home of the Belmont Stakes" },
  { name: "Saratoga Race Course", type: "Thoroughbred Racing", location: "Saratoga Springs, NY", description: "Historic summer racing venue" },
  { name: "Aqueduct Racetrack", type: "Thoroughbred Racing", location: "Queens, NY", description: "Winter racing venue" },
  
  // California
  { name: "Santa Anita Park", type: "Thoroughbred Racing", location: "Arcadia, CA", description: "Historic California racing venue" },
  { name: "Del Mar Racetrack", type: "Thoroughbred Racing", location: "Del Mar, CA", description: "Seaside racing venue" },
  { name: "Golden Gate Fields", type: "Thoroughbred Racing", location: "Berkeley, CA", description: "Bay Area racing venue" },
  { name: "Los Alamitos Race Course", type: "Quarter Horse Racing", location: "Los Alamitos, CA", description: "Premier quarter horse venue" },
  
  // Florida
  { name: "Gulfstream Park", type: "Thoroughbred Racing", location: "Hallandale Beach, FL", description: "Premier Florida racing venue" },
  { name: "Tampa Bay Downs", type: "Thoroughbred Racing", location: "Tampa, FL", description: "Winter racing venue" },
  
  // Maryland
  { name: "Pimlico Race Course", type: "Thoroughbred Racing", location: "Baltimore, MD", description: "Home of the Preakness Stakes" },
  { name: "Laurel Park", type: "Thoroughbred Racing", location: "Laurel, MD", description: "Year-round racing venue" },
  
  // Illinois
  { name: "Arlington Park", type: "Thoroughbred Racing", location: "Arlington Heights, IL", description: "Historic Chicago-area venue" },
  { name: "Hawthorne Race Course", type: "Thoroughbred Racing", location: "Cicero, IL", description: "Year-round racing venue" },
  
  // New Jersey
  { name: "Monmouth Park", type: "Thoroughbred Racing", location: "Oceanport, NJ", description: "Jersey Shore racing venue" },
  { name: "The Meadowlands", type: "Harness Racing", location: "East Rutherford, NJ", description: "Premier harness racing venue" },
  
  // Pennsylvania
  { name: "Parx Racing", type: "Thoroughbred Racing", location: "Bensalem, PA", description: "Year-round racing venue" },
  { name: "Penn National Race Course", type: "Thoroughbred Racing", location: "Grantville, PA", description: "Central Pennsylvania venue" },
  
  // Other States
  { name: "Fair Grounds Race Course", type: "Thoroughbred Racing", location: "New Orleans, LA", description: "Historic Louisiana venue" },
  { name: "Oaklawn Racing Casino Resort", type: "Thoroughbred Racing", location: "Hot Springs, AR", description: "Historic Arkansas venue" },
  { name: "Lone Star Park", type: "Thoroughbred Racing", location: "Grand Prairie, TX", description: "Texas premier venue" },
  { name: "Remington Park", type: "Thoroughbred Racing", location: "Oklahoma City, OK", description: "Oklahoma racing venue" },
];

// Training tracks and facilities
const trainingTracks = [
  { name: "Indoor Training Arena", type: "Training Facility", location: "Various", description: "Climate-controlled indoor training facility" },
  { name: "Outdoor Training Track", type: "Training Facility", location: "Various", description: "Standard outdoor training track" },
  { name: "Cross Country Course", type: "Cross Country", location: "Various", description: "Natural terrain cross country course" },
  { name: "Sand Training Track", type: "Training Facility", location: "Various", description: "All-weather sand surface training track" },
  { name: "Turf Training Track", type: "Training Facility", location: "Various", description: "Natural grass training track" },
];

// Horse breeds
const horseBreeds = [
  "Thoroughbred",
  "Quarter Horse",
  "Arabian",
  "Standardbred",
  "Paint Horse",
  "Appaloosa",
  "Morgan",
  "Tennessee Walking Horse",
  "Warmblood",
  "Australian Stock Horse",
];

// Horse names
const horseNames = [
  "Thunder Strike", "Lightning Bolt", "Midnight Runner", "Golden Star", "Silver Shadow",
  "Storm Chaser", "Desert Wind", "Ocean Wave", "Mountain King", "Prairie Fire",
  "Royal Crown", "Diamond Dust", "Crimson Glory", "Emerald Dream", "Sapphire Sky",
  "Blazing Sun", "Mystic Moon", "Phoenix Rising", "Dragon Fury", "Eagle Eye",
  "Spirit Dancer", "Wild Heart", "Noble Quest", "Victory Lane", "Champion's Pride",
  "Starlight Express", "Moonbeam Magic", "Sunset Rider", "Dawn Breaker", "Twilight Shadow",
];

// Care types
const careTypes = [
  "Veterinary Checkup",
  "Dental Examination",
  "Farrier Service",
  "Vaccination",
  "Deworming",
  "Physical Therapy",
  "Chiropractic Adjustment",
  "Nutritional Assessment",
  "Grooming Session",
  "Exercise Evaluation",
];

async function seed() {
  console.log("Starting database seeding...");

  try {
    // Get current user ID from environment
    // Use OWNER_OPEN_ID if set, otherwise use local development user ID
    const currentUserId = process.env.OWNER_OPEN_ID || "local-dev-user";
    console.log(`Using owner ID: ${currentUserId}`);
    console.log(`Note: If using local development (no OAuth), make sure this matches the user ID in server/_core/sdk.ts`);
    
    // 1. Create organizations
    console.log("Creating organizations...");
    const org1Id = await db.insert(schema.organizations).values({
      name: "Melbourne Racing Stables",
      contactInfo: {
        phone: "+61 3 9123 4567",
        email: "info@melbourneracing.com.au",
        address: "123 Racing Street, Melbourne VIC 3000",
      },
      ownerId: currentUserId,
      notificationSettings: {
        injuryRiskThreshold: 70,
        emailNotifications: true,
      },
    });

    const org2Id = await db.insert(schema.organizations).values({
      name: "Sydney Equestrian Center",
      contactInfo: {
        phone: "+61 2 9876 5432",
        email: "contact@sydneyequestrian.com.au",
        address: "456 Horse Lane, Sydney NSW 2000",
      },
      ownerId: currentUserId,
      notificationSettings: {
        injuryRiskThreshold: 75,
        emailNotifications: true,
      },
    });

    const org3Id = await db.insert(schema.organizations).values({
      name: "Kentucky Derby Training Facility",
      contactInfo: {
        phone: "+1 502 555 0123",
        email: "info@kentuckyderby.com",
        address: "789 Derby Drive, Louisville, KY 40202",
      },
      ownerId: currentUserId,
      notificationSettings: {
        injuryRiskThreshold: 80,
        emailNotifications: true,
      },
    });

    const orgIds = [
      Number(org1Id[0].insertId),
      Number(org2Id[0].insertId),
      Number(org3Id[0].insertId),
    ];

    console.log(`Created ${orgIds.length} organizations`);

    // Link current user to all organizations for testing
    console.log("Creating user-organization relationships...");
    for (const orgId of orgIds) {
      await db.insert(schema.userOrganizations).values({
        userId: currentUserId,
        organizationId: orgId,
      });
    }
    console.log(`Linked user to ${orgIds.length} organizations`);

    // 2. Create global tracks (Australian)
    console.log("Creating Australian racetracks...");
    for (const track of australianTracks) {
      await db.insert(schema.tracks).values({
        name: track.name,
        type: track.type,
        scope: "global",
        country: "Australia",
        description: `${track.description} - Located in ${track.location}`,
      });
    }

    // 3. Create global tracks (US)
    console.log("Creating US racetracks...");
    for (const track of usTracks) {
      await db.insert(schema.tracks).values({
        name: track.name,
        type: track.type,
        scope: "global",
        country: "USA",
        description: `${track.description} - Located in ${track.location}`,
      });
    }

    // 4. Create training tracks (local to each organization)
    console.log("Creating training facilities...");
    const orgNames = ["Melbourne Racing Stables", "Sydney Equestrian Center", "Kentucky Derby Training Facility"];
    const orgCountries = ["Australia", "Australia", "USA"];
    for (let i = 0; i < orgIds.length; i++) {
      const orgId = orgIds[i];
      const orgName = orgNames[i];
      const country = orgCountries[i];
      for (const track of trainingTracks) {
        await db.insert(schema.tracks).values({
          name: `${track.name} - ${orgName}`,
          type: track.type,
          scope: "local",
          country: country,
          organizationId: orgId,
          description: track.description,
        });
      }
    }

    // 5. Create devices
    console.log("Creating monitoring devices...");
    const deviceIds: number[] = [];
    for (let i = 0; i < 50; i++) {
      const orgId = orgIds[i % orgIds.length];
      const deviceId = await db.insert(schema.devices).values({
        serialNumber: `HHM-${String(i + 1).padStart(4, "0")}`,
        organizationId: orgId,
        status: i % 10 === 0 ? "maintenance" : "active",
      });
      deviceIds.push(Number(deviceId[0].insertId));
    }

    console.log(`Created ${deviceIds.length} devices`);

    // 6. Create horses
    console.log("Creating horses...");
    const horseIds: number[] = [];
    const horseAliases = [
      "Standardbred",
      "Swift Runner",
      "Golden Champion",
      "Night Rider",
      "Storm Chaser",
      "Gentle Giant",
      "Speed Demon",
      "Star Performer",
      "Brave Heart",
      "Swift Wing",
    ];
    for (let i = 0; i < 30; i++) {
      const orgId = orgIds[i % orgIds.length];
      const breed = horseBreeds[i % horseBreeds.length];
      const name = horseNames[i % horseNames.length];
      const alias = horseAliases[i % horseAliases.length];
      const deviceId = deviceIds[i] || null;
      
      const statuses = ["active", "active", "active", "injured", "retired"];
      const status = statuses[i % statuses.length] as any;

      // Generate picture URLs for horses
      const horseColors = ["bay", "chestnut", "black", "gray", "palomino", "roan", "dappled", "sorrel"];
      const horseColor = horseColors[i % horseColors.length];
      const pictureUrl = `https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&h=400&fit=crop&q=80`;

      const horseId = await db.insert(schema.horses).values({
        name,
        alias,
        breed,
        status,
        organizationId: orgId,
        deviceId,
        pictureUrl,
        healthRecords: {
          weight: 450 + Math.floor(Math.random() * 100),
          owner: `Owner ${i + 1}`,
          rider: `Rider ${i + 1}`,
          birthPlace: ["Kentucky", "California", "Texas", "Florida", "New York"][i % 5],
          location: `Stable ${(i % 5) + 1}`,
          color: horseColor,
          gender: i % 2 === 0 ? "Stallion" : "Mare",
          vaccinations: [
            {
              date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
              type: "Influenza",
              notes: "Annual vaccination",
            },
            {
              date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
              type: "Tetanus",
              notes: "Annual vaccination",
            },
          ],
          medications: status === "injured" ? [
            {
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              name: "Anti-inflammatory",
              dosage: "2.2 mg/kg",
            },
          ] : [],
          conditions: status === "injured" ? ["Tendon strain"] : [],
        },
      });

      horseIds.push(Number(horseId[0].insertId));

      // Update device assignment
      if (deviceId) {
        await db.update(schema.devices)
          .set({ horseId: Number(horseId[0].insertId) })
          .where(eq(schema.devices.id, deviceId));
      }
    }

    console.log(`Created ${horseIds.length} horses`);

    // 7. Get track IDs for sessions
    const allTracks = await db.select().from(schema.tracks);
    const trackIds = allTracks.map(t => t.id);

    // 8. Create training sessions
    console.log("Creating training sessions...");
    const sessionIds: number[] = [];
    for (let i = 0; i < 100; i++) {
      const horseId = horseIds[i % horseIds.length];
      const trackId = trackIds[i % trackIds.length];
      const daysAgo = Math.floor(Math.random() * 90);
      const sessionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const injuryRisks = ["low", "low", "low", "medium", "medium", "high", "critical"];
      const injuryRisk = injuryRisks[i % injuryRisks.length] as any;

      // Generate sectional-based performance data (200m intervals)
      const totalDistance = 4800; // 4.8 km
      const sectionalDistance = 200; // 200m per sectional
      const duration = 1602; // 26:42 in seconds
      
      // Generate sectional statistics
      const sectionals = [];
      for (let j = 1; j <= totalDistance / sectionalDistance; j++) {
        const distance = j * sectionalDistance;
        
        // Simulate realistic performance patterns
        let avgSpeed, maxSpeed, strideLength, strideFreq;
        
        if (j <= 5) {
          // Warm-up phase (0-1000m)
          avgSpeed = 0.75 + Math.random() * 2.5;
          maxSpeed = avgSpeed + 1 + Math.random() * 2;
          strideLength = 0.3 + Math.random() * 0.8;
          strideFreq = 2.5 + Math.random() * 0.5;
        } else if (j <= 20) {
          // Main training phase (1000-4000m)
          avgSpeed = 7 + Math.random() * 3;
          maxSpeed = avgSpeed + 1 + Math.random() * 2;
          strideLength = 3.5 + Math.random() * 1.3;
          strideFreq = 1.9 + Math.random() * 0.3;
        } else {
          // Cool-down phase (4000-4800m)
          avgSpeed = 1.5 + Math.random() * 0.5;
          maxSpeed = avgSpeed + 0.5 + Math.random() * 0.8;
          strideLength = 0.6 + Math.random() * 0.3;
          strideFreq = 2.2 + Math.random() * 0.5;
        }
        
        // Determine gait based on speed
        let gait = "Walk/Trot";
        if (avgSpeed > 4) gait = "Trot/Canter";
        if (avgSpeed > 8) gait = "Pace";
        
        sectionals.push({
          sectional: j,
          distance,
          avgSpeed: parseFloat(avgSpeed.toFixed(2)),
          maxSpeed: parseFloat(maxSpeed.toFixed(2)),
          strideLength: parseFloat(strideLength.toFixed(2)),
          strideFreq: parseFloat(strideFreq.toFixed(2)),
          gait,
        });
      }
      
      // Calculate overall metrics
      const avgSpeed = sectionals.reduce((sum, s) => sum + s.avgSpeed, 0) / sectionals.length;
      const maxSpeed = Math.max(...sectionals.map(s => s.maxSpeed));
      
      // Generate speed/heart rate chart data (one point per second)
      const chartData = sectionals.flatMap((s, idx) => {
        const points = [];
        for (let j = 0; j < 10; j++) {
          const timeInSectional = (j / 10) * 200; // 200m per sectional
          points.push({
            time: (idx * 200 + timeInSectional) * 1000, // in milliseconds
            speed: s.avgSpeed + (Math.random() - 0.5) * 2,
            hr: 80 + Math.floor(Math.random() * 40),
          });
        }
        return points;
      });
      
      // Speed zone distances
      const speedZoneDistance = {
        walk: sectionals.filter(s => s.avgSpeed < 2).reduce((sum, s) => sum + 200, 0),
        canter: sectionals.filter(s => s.avgSpeed >= 2 && s.avgSpeed < 4).reduce((sum, s) => sum + 200, 0),
        pace: sectionals.filter(s => s.avgSpeed >= 4 && s.avgSpeed < 8).reduce((sum, s) => sum + 200, 0),
        slowGallop: sectionals.filter(s => s.avgSpeed >= 8 && s.avgSpeed < 9).reduce((sum, s) => sum + 200, 0),
        fastGallop: sectionals.filter(s => s.avgSpeed >= 9 && s.avgSpeed < 10).reduce((sum, s) => sum + 200, 0),
        veryFastGallop: sectionals.filter(s => s.avgSpeed >= 10).reduce((sum, s) => sum + 200, 0),
      };
      
      // Create interval stats from sectionals
      const intervalStats = sectionals.map(s => ({
        sectional: s.sectional,
        distance: s.distance,
        timeSplit: 200000 / s.avgSpeed, // Approximate time for 200m
        travel: 200, // 200m per sectional
        speed: {
          min: s.avgSpeed - 1,
          avg: s.avgSpeed,
          max: s.maxSpeed,
        },
        stride: {
          frequency: s.strideFreq,
          length: s.strideLength,
        },
        hr: {
          min: 70 + Math.floor(Math.random() * 20),
          avg: 85 + Math.floor(Math.random() * 30),
          max: 150 + Math.floor(Math.random() * 20),
        },
      }));
      
      // Create performanceData object
      const performanceData = {
        duration,
        distance: totalDistance,
        avgSpeed: parseFloat(avgSpeed.toFixed(2)),
        maxSpeed: parseFloat(maxSpeed.toFixed(2)),
        avgHeartRate: 85 + Math.floor(Math.random() * 30),
        maxHeartRate: 150 + Math.floor(Math.random() * 20),
        avgTemperature: 36.8 + Math.random() * 1.5,
        maxTemperature: 37.5 + Math.random() * 1.5,
        speedHeartRate: {
          speedHeartRateChart: chartData,
          maxHR: Math.floor(Math.random() * 40) + 150,
          hR13Point3: Math.floor(Math.random() * 30) + 120,
          bpM200Speed: parseFloat((Math.random() * 10 + 30).toFixed(2)),
          maxBPMSpeed: parseFloat((Math.random() * 10 + 40).toFixed(2)),
          heartRateRecovery: {
            perMinute: Array.from({ length: 10 }, () => Math.floor(Math.random() * 50)),
            avG2T5: Math.floor(Math.random() * 30) + 10,
            avG5T10: Math.floor(Math.random() * 20) + 5,
            timeTo100BPM: Math.random() * 5 + 1,
          },
        },
        intervals: {
          stats: intervalStats,
          speedZoneDistance,
        },
        preWorkTime: 0,
        preWorkoutDistance: 0,
        // Legacy fields for compatibility
        heartRate: chartData.map(d => d.hr),
        speed: chartData.map(d => d.speed),
        temperature: Math.floor(Math.random() * 5) + 37,
        gaitAnalysis: {
          stride: Math.floor(Math.random() * 50) + 150,
          symmetry: Math.floor(Math.random() * 20) + 80,
        },
      };

      const sessionId = await db.insert(schema.sessions).values({
        horseId,
        trackId,
        sessionDate,
        performanceData,
        injuryRisk,
        recoveryTarget: injuryRisk === "high" || injuryRisk === "critical" 
          ? new Date(sessionDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          : null,
      });

      sessionIds.push(Number(sessionId[0].insertId));
    }

    console.log(`Created ${sessionIds.length} training sessions`);

    // 9. Create session comments
    console.log("Creating session comments...");
    for (let i = 0; i < 50; i++) {
      const sessionId = sessionIds[i % sessionIds.length];
      const comments = [
        "Excellent performance today, showing great improvement",
        "Horse seemed a bit tired, recommend lighter training tomorrow",
        "Perfect form throughout the session",
        "Noticed slight hesitation on left turns, monitoring closely",
        "Outstanding speed and endurance",
        "Good recovery time, ready for next session",
        "Recommend additional rest before next intensive training",
      ];

      await db.insert(schema.sessionComments).values({
        sessionId,
        userId: "trainer1",
        comment: comments[i % comments.length],
      });
    }

    // 10. Create injury records
    console.log("Creating injury records...");
    const highRiskSessions = sessionIds.filter((_, i) => 
      ["high", "critical"].includes(["low", "low", "low", "medium", "medium", "high", "critical"][i % 7])
    );

    for (let i = 0; i < Math.min(highRiskSessions.length, 20); i++) {
      const sessionId = highRiskSessions[i];
      const bodyParts = [
        ["Front Left Leg", "Tendon"],
        ["Front Right Leg", "Hoof"],
        ["Back Left Leg", "Joint"],
        ["Back Right Leg", "Muscle"],
        ["Back", "Spine"],
      ];

      const affectedParts = bodyParts[i % bodyParts.length];
      const statuses = ["flagged", "flagged", "diagnosed", "dismissed"];
      const status = statuses[i % statuses.length] as any;

      await db.insert(schema.injuryRecords).values({
        sessionId,
        affectedParts,
        status,
        notes: status === "flagged" 
          ? "Noticed abnormal gait pattern during session"
          : status === "diagnosed"
          ? "Confirmed minor strain, prescribed rest and anti-inflammatory medication"
          : "False alarm, no injury detected upon examination",
        medicalDiagnosis: status === "diagnosed" 
          ? "Grade 1 tendon strain, 2-week rest recommended"
          : null,
        veterinarianId: status === "diagnosed" || status === "dismissed" ? "vet1" : null,
        notificationSent: status === "diagnosed",
      });
    }

    // 11. Create upcoming care
    console.log("Creating upcoming care appointments...");
    for (let i = 0; i < 40; i++) {
      const horseId = horseIds[i % horseIds.length];
      const horse = await db.select().from(schema.horses).where(eq(schema.horses.id, horseId)).limit(1);
      const orgId = horse[0].organizationId;
      
      const daysAhead = Math.floor(Math.random() * 60) + 1;
      const scheduledDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
      scheduledDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

      const careType = careTypes[i % careTypes.length];

      await db.insert(schema.upcomingCare).values({
        horseId,
        organizationId: orgId,
        careType,
        scheduledDate,
        description: `Scheduled ${careType.toLowerCase()} for ${horse[0].name}`,
        completed: false,
      });
    }

    // 12. Create invitations
    console.log("Creating sample invitations...");
    for (let i = 0; i < 5; i++) {
      const orgId = orgIds[i % orgIds.length];
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await db.insert(schema.invitations).values({
        email: `newuser${i + 1}@example.com`,
        role: i % 3 === 0 ? "admin" : "user",
        userType: i % 2 === 0 ? "veterinarian" : "standard",
        organizationId: orgId,
        status: "pending",
        token: `invite-token-${Math.random().toString(36).substring(2, 15)}`,
        expiresAt,
      });
    }

    // 13. Create organization requests
    console.log("Creating organization requests...");
    await db.insert(schema.organizationRequests).values({
      userId: "user1",
      requestType: "create",
      status: "pending",
      details: {
        organizationName: "Brisbane Racing Academy",
        reason: "Expanding operations to Queensland",
      },
    });

    await db.insert(schema.organizationRequests).values({
      userId: "user2",
      requestType: "transfer",
      status: "pending",
      details: {
        organizationId: orgIds[0],
        newOwnerId: "user3",
        reason: "Ownership change due to retirement",
      },
    });

    // 14. Create track requests
    console.log("Creating track requests...");
    await db.insert(schema.trackRequests).values({
      userId: "user1",
      requestType: "create",
      status: "pending",
      details: {
        name: "Sunshine Coast Turf Club",
        type: "Thoroughbred Racing",
        description: "New racing venue in Queensland",
      },
    });

    // 15. Set API settings
    console.log("Setting API configuration...");
    await db.insert(schema.apiSettings).values({
      batchSize: 100,
      delayMs: 1000,
      retryAttempts: 3,
      updatedBy: "system",
    });

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\nSummary:");
    console.log(`- Organizations: ${orgIds.length}`);
    console.log(`- Tracks: ${allTracks.length} (${australianTracks.length} Australian + ${usTracks.length} US + ${trainingTracks.length * orgIds.length} training facilities)`);
    console.log(`- Devices: ${deviceIds.length}`);
    console.log(`- Horses: ${horseIds.length}`);
    console.log(`- Training Sessions: ${sessionIds.length}`);
    console.log(`- Session Comments: 50`);
    console.log(`- Injury Records: ~20`);
    console.log(`- Upcoming Care: 40`);
    console.log(`- Invitations: 5`);
    console.log(`- Organization Requests: 2`);
    console.log(`- Track Requests: 1`);

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(async () => {
    console.log("\nSeeding process finished");
    await connection.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error);
    await connection.end();
    process.exit(1);
  });

