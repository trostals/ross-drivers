export async function loadLivePoints() {
    const url = "https://cf.nascar.com/live/feeds/live-points.json";
    const res = await fetch(url);
    if (!res.ok)
    {
        throw new Error("Failed to load live points");
        debug(`Failed to load live points: ${res.status} ${res.statusText}`);  
    }
    return await res.json();
}
