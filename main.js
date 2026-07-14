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
        lookup[v.driver.driver_id] = v;
        debug(`Live data for driver ID ${v.driver.driver_id}`);
    }
    return lookup;
}

function updatePointsTable(points) {
    const tbody = document.getElementById("points-tbody");
    if (!tbody)
    {
        debug("Points table body not found");
        return;
    }
    tbody.innerHTML = "";
    const live = currentFeed ? buildLiveLookup(currentFeed) : {};
    
    // ⭐ Filter to only your drivers
    const filtered = points.filter(p => DRIVER_TO_PLAYER[p.driver_id]);
    // debug(`Filtered points to ${filtered.length} drivers based on player picks`);
    
    // ⭐ Sort only your drivers
    const sorted = filtered.sort((a, b) => {
        const la = live[a.driver_id]?.running_position ?? 999;
        debug(`Driver ID ${a.driver_id} running position: ${la}`);
        const lb = live[b.driver_id]?.running_position ?? 999;
        debug(`Driver ID ${b.driver_id} running position: ${lb}`);
        return la - lb;
    });
    for (const p of sorted) {
        const tr = document.createElement("tr");
        const player = DRIVER_TO_PLAYER[p.driver_id] ?? "—";
        debug(`\nUpdating points for driver ID ${p.driver_id} (Player: ${player})`);
        const liveData = live[p.driver_id];
        debug(`Live data for driver ID ${p.driver_id}: ${JSON.stringify(liveData)}`);
        const runningPos = liveData?.running_position ?? p.points_position;
        debug(`Running position for driver ID ${p.driver_id}: ${runningPos}`);
        const stg1 = liveData?.stage_1_points ?? p.stage_1_points;
        const stg2 = liveData?.stage_2_points ?? p.stage_2_points;
        let total = 0; // Initialize total to 0
        debug('Flag State: ' +  raceComplete); 
        if (raceComplete) {
            total = p.points_earned_this_race;
        }
        else{
            total = stg1 + stg2;
        }

      tr.innerHTML = `
      <td>${runningPos}</td>
      <td>${player}</td>
      <td>${p.first_name} ${p.last_name}</td>
      <td>${p.car_number}</td>
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
    // currentFeed = feed; // ← ADD THIS LINE
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
