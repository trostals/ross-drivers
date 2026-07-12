export async function loadLiveFeed() {
    const url = "https://cf.nascar.com/live/feeds/live-feed.json";
    const res = await fetch(url);
    if (!res.ok)
    {
        throw new Error("Failed to load live feed");
        debug(`Failed to load live feed: ${res.status} ${res.statusText}`); 
    }
    return await res.json();
}
