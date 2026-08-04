export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    let settled = false;
    const attempt = (highAccuracy) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!settled) {
            settled = true;
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
        },
        (err) => {
          if (!settled) {
            // On timeout, retry once with lower accuracy (uses Wi-Fi/network, much faster)
            if (err.code === 3 && highAccuracy) {
              attempt(false);
            } else {
              settled = true;
              reject(new Error(err.message || "Could not get location"));
            }
          }
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 12000 : 15000,
          maximumAge: 60000
        }
      );
    };
    attempt(true);
  });
}