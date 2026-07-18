export async function loadLivePoints(loadFromFile = false) {
    if(loadFromFile) {
        console.log("loading debug file " + loadFromFile + "...");
        const data = await fetch("./data-feeds/live_points.json");
        return data.json();
    }
    else{
        const url = "https://cf.nascar.com/live/feeds/live-points.json";
        const res = await fetch(url);
        if (!res.ok)
        {
            throw new Error("Failed to load live points");
            console.log(`Failed to load live points: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    }
}