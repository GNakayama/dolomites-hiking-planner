/**
 * Generates GPX file content for a hiking itinerary
 * GPX (GPS Exchange Format) is an XML format for GPS data
 */

/**
 * Escapes XML special characters
 */
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates GPX file content for an itinerary
 * @param {Array} itinerary - Array of day objects with stage information
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @returns {string} GPX XML content
 */
export function generateGPX(itinerary, startDate) {
  const routeName = `Alta Via 1 - ${startDate}`;
  const date = new Date(startDate).toISOString();

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Dolomites Alta Via 1 Planner" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(routeName)}</name>
    <time>${date}</time>
  </metadata>
  <rte>
    <name>${escapeXml(routeName)}</name>
    <desc>Alta Via 1 hiking route</desc>
`;

  // Add waypoints for each day
  itinerary.forEach((day, index) => {
    const dayDate = new Date(day.date);
    const waypointName = day.stage.hut === "End in valley" 
      ? `Day ${day.dayIndex} - Finish` 
      : `Day ${day.dayIndex} - ${day.stage.hut}`;
    
    // Note: We don't have actual GPS coordinates, so we use placeholder coordinates
    // In a real implementation, you would have coordinates for each location
    const lat = 46.5 + (index * 0.1); // Placeholder latitude
    const lon = 12.0 + (index * 0.1); // Placeholder longitude
    
    gpx += `    <rtept lat="${lat}" lon="${lon}">
      <name>${escapeXml(waypointName)}</name>
      <desc>Day ${day.dayIndex}: ${day.stage.from} → ${day.stage.to} (${day.stage.distanceKm} km, ${day.stage.ascentM} m ascent)</desc>
      <time>${dayDate.toISOString()}</time>
    </rtept>
`;
  });

  gpx += `  </rte>
</gpx>`;

  return gpx;
}

/**
 * Downloads a GPX file
 * @param {string} gpxContent - GPX XML content
 * @param {string} filename - Filename for the download
 */
export function downloadGPX(gpxContent, filename) {
  const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "alta-via-1-route.gpx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
