export async function loadLiveFeed(loadfromfile = false) {
    if(loadfromfile) {
        console.log("loading debug file " + loadfromfile + "...");
        const data = await fetch("./data-feeds/live_feed.json");
        return data.json();
    }
    else{
        const url = "https://cf.nascar.com/live/feeds/live-feed.json";
        const res = await fetch(url);
        if (!res.ok)
        {
            throw new Error("Failed to load live feed");
            console.log(`Failed to load live feed: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    }
}