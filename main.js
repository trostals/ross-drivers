console.log("NASCAR Driver Status Page Loaded");
import { loadLiveFeed } from "./data/load-live-feed.js";
import { loadLivePoints } from "./data/load-live-points.js";
import { PLAYER_PICKS } from "./config.js";

/* -----------------------------------------------------------
   Debug Console Setup
----------------------------------------------------------- */
const db_status = document.getElementById("db_status");

function debug(msg) {
    db_status.innerHTML += msg + "\n";
    db_status.scrollTop = db_status.scrollHeight;
}

let currentFeed = null;
let raceComplete = false;

/* Parse out the player names */
const DRIVER_TO_PLAYER = {};
for (const key in PLAYER_PICKS) {
    const pick = PLAYER_PICKS[key];
    DRIVER_TO_PLAYER[pick.id] = pick.name;
    debug(`Mapping driver ID ${pick.id} to player ${pick.name}`);
}

// Default: 3-stage race
const STAGE_CONFIG = {
    count: 3,
    ends: [80, 160] // Stage 1 ends at lap 80, Stage 2 ends at lap 160
};
/*****************************************************************
Change this for the 4 stage Coca-Cola 600 race, which has 4 stages.
 const STAGE_CONFIG = {
  count: 4,
  ends: [100, 200, 300] // Example values
};
*******************************************************************/
function updateHeader(feed) {
    const lapBadge = document.getElementById("lap-badge");
    const statusPill = document.getElementById("status-pill");
    const lastUpdated = document.getElementById("last-updated");
    if (!lapBadge || !statusPill || !lastUpdated)
        return;
    // Show lap badge
    lapBadge.style.display = "inline-block";
    lapBadge.textContent = `Lap ${feed.lap_number} / ${feed.laps_in_race}`;
    // Status pill
    const label = statusPill.querySelector(".label");
    const dot = statusPill.querySelector(".dot");
    if (label)
        label.textContent = "Live";
    if (dot)
        dot.style.background = "#4caf50"; // green
    // Last updated timestamp
    lastUpdated.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
}

function updateTrackName(feed) {
  const el = document.getElementById("track-name");
  if (!el) return;

  // Try all common NASCAR fields
  const name =
    feed.track_name ||
    feed.track_name_short ||
    feed.venue_name ||
    feed.track ||
    feed.race_track ||
    "Unknown Track";

  el.textContent = name;
}

function updateRaceName(feed) {
  const el = document.getElementById("race-name");
  if (!el) return;

  el.textContent = feed.run_name || "NASCAR Stage Points";
}

function updateStageCards(feed) {
    const lap = feed.lap_number;
    const sc1 = document.getElementById("sc1");
    const sc2 = document.getElementById("sc2");
    const sc3 = document.getElementById("sc3");
    const sc4 = document.getElementById("sc4"); // may not exist
    const ends = STAGE_CONFIG.ends;
    // Stage 1
    sc1.querySelector(".sc-status").textContent =
        lap < ends[0] ? "In Progress" : "Complete";
    // Stage 2
    sc2.querySelector(".sc-status").textContent =
        lap < ends[0] ? "Upcoming" :
            lap < ends[1] ? "In Progress" : "Complete";
    // Stage 3 (exists in both 3-stage and 4-stage races)
    sc3.querySelector(".sc-status").textContent =
        lap < ends[1] ? "Upcoming" :
            lap < (STAGE_CONFIG.count === 4 ? ends[2] : feed.laps_in_race)
                ? "In Progress"
                : "Complete";
    // Stage 4 (only exists in 4-stage races)
    if (STAGE_CONFIG.count === 4 && sc4) {
        sc4.querySelector(".sc-status").textContent =
            lap < ends[2] ? "Upcoming" :
                lap < feed.laps_in_race ? "In Progress" : "Complete";
    }
}
function buildLiveLookup(feed) {
    const lookup = {};
    for (const v of feed.vehicles) {
        lookup[v.vehicle_number] = v;   // MATCH BY CAR NUMBER
        debug(`Live data for car #${v.vehicle_number}`);
    }
    return lookup;
}

function updatePointsTable(points) {
    const tbody = document.getElementById("points-tbody");
    if (!tbody) {
        debug("Points table body not found");
        return;
    }

    tbody.innerHTML = "";

    // Build lookup using CAR NUMBER (not driver_id)
    const live = currentFeed ? buildLiveLookup(currentFeed) : {};
    
    console.log("FULL LIVE FEED VEHICLES:", currentFeed.vehicles);


    // Filter to only your drivers
    const filtered = points.filter(p => DRIVER_TO_PLAYER[p.driver_id]);

    // Sort by running position using car_number
    const sorted = filtered.sort((a, b) => {
        const la = live[a.car_number]?.running_position ?? 999;
        const lb = live[b.car_number]?.running_position ?? 999;
        return la - lb;
    });

    for (const p of sorted) {
        const tr = document.createElement("tr");

        const player = DRIVER_TO_PLAYER[p.driver_id] ?? "—";

        // Lookup live data using CAR NUMBER
        const liveData = live[p.car_number];

        // Running position
        const runningPos = liveData?.running_position ?? p.points_position;

        // Stage points (prefer live feed)
        const stg1 = liveData?.stage_1_points ?? p.stage_1_points;
        const stg2 = liveData?.stage_2_points ?? p.stage_2_points;

        // Total points
        let total = 0;

        if (raceComplete) {
            total = p.points_earned_this_race;
        } else {
            total = stg1 + stg2;
        }

        // Build row
        tr.innerHTML = `
            <td>${runningPos}</td>
            <td>${player}</td>

            <td class="driver-block">
                <div class="driver-name">${p.first_name} ${p.last_name}</div>
                <div class="driver-sub">
                    <span class="car-number">#${liveData?.vehicle_number ?? p.car_number ?? "?"}</span>
                    <span class="dot">•</span>
                    <span class="manufacturer">${liveData?.vehicle_manufacturer ?? "Unknown"}</span>
                </div>
            </td>

            <td>${stg1}</td>
            <td>${stg2}</td>
            <td>${total}</td>
        `;

        tbody.appendChild(tr);
    }
}

async function start() {
    const feed = await loadLiveFeed();
    const points = await loadLivePoints();
    console.log("Live Feed:", feed);
    //debug(`Loaded live feed with ${feed.vehicles.length} vehicles`);
    console.log("Points:", points);
    // debug(`Loaded points ${JSON.stringify(points)}\n`);

    currentFeed = feed; // ← ADD THIS LINE
    
    if (!raceComplete && Number(feed.flag_state) === 9) {
        raceComplete = true;
        console.log("Race is now complete!");
    }
    updateHeader(feed);
    updateTrackName(feed);
    updateRaceName(feed);
    updateStageCards(feed);
    updatePointsTable(points);
}
start();
document.getElementById("btn-refresh")?.addEventListener("click", start);
