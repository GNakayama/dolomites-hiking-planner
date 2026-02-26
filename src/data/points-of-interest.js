// Points of interest, scenic detours, and tips for Alta Via 1
// This is dummy/placeholder data to demonstrate the UI structure
// Replace with actual data when available

export const POINTS_OF_INTEREST = {
  "Lago di Braies": {
    name: "Lago di Braies",
    type: "scenic",
    description: "The iconic emerald lake - perfect for photos at sunrise",
    detour: null, // Starting point, no detour needed
    bestTime: "Early morning (6-8 AM) for best light and fewer crowds",
    tips: [
      "Arrive early to avoid crowds",
      "The lake is most beautiful in morning light",
      "Consider staying nearby the night before to catch sunrise",
    ],
    historical: "Popular tourist destination, featured in many films",
  },
  "Rifugio Biella": {
    name: "Rifugio Biella",
    type: "viewpoint",
    description: "First rifugio with great views back to Lago di Braies",
    detour: null,
    bestTime: "Afternoon",
    tips: [
      "Good spot for first break",
      "Take photos looking back at the lake",
    ],
    historical: null,
  },
  "Rifugio Pederù": {
    name: "Rifugio Pederù",
    type: "hut",
    description: "Family-friendly rifugio in the valley",
    detour: null,
    bestTime: null,
    tips: null,
    historical: null,
  },
  "Rifugio Fanes": {
    name: "Rifugio Fanes",
    type: "area",
    description: "Beautiful high-altitude plateau",
    detour: {
      name: "Fanes Waterfall",
      time: "+30 minutes",
      difficulty: "Easy",
      description: "Short detour to see a beautiful waterfall",
    },
    bestTime: "Morning",
    tips: [
      "The Fanes plateau is one of the most scenic sections",
      "Wildflowers are spectacular in July",
    ],
    historical: "Part of the Fanes-Sennes-Braies Nature Park",
  },
  "Rifugio Lagazuoi": {
    name: "Rifugio Lagazuoi",
    type: "viewpoint",
    description: "Highest rifugio on the route with spectacular 360° views",
    detour: {
      name: "WWI Tunnels",
      time: "+1 hour",
      difficulty: "Moderate",
      description: "Explore the WWI tunnels and fortifications. Bring a headlamp!",
    },
    bestTime: "Sunset (stay overnight for sunrise)",
    tips: [
      "Book early - this is the most popular rifugio",
      "Sunset views are absolutely stunning",
      "Consider staying here even if it makes your day shorter",
      "The rifugio has a cable car access (if you want to skip the climb)",
    ],
    historical: "WWI front line - tunnels and fortifications still visible",
  },
  "Rifugio Averau": {
    name: "Rifugio Averau",
    type: "hut",
    description: "Classic mountain rifugio",
    detour: null,
    bestTime: null,
    tips: null,
    historical: null,
  },
  "Rifugio Nuvolau": {
    name: "Rifugio Nuvolau",
    type: "viewpoint",
    description: "Historic rifugio with panoramic views",
    detour: null,
    bestTime: "Sunset",
    tips: [
      "One of the oldest rifugios in the Dolomites",
      "Great views of the surrounding peaks",
    ],
    historical: "Built in 1883, one of the oldest mountain huts in the region",
  },
  "Rifugio Città di Fiume": {
    name: "Rifugio Città di Fiume",
    type: "hut",
    description: "Well-located rifugio",
    detour: null,
    bestTime: null,
    tips: null,
    historical: null,
  },
  "Rifugio Coldai": {
    name: "Rifugio Coldai",
    type: "viewpoint",
    description: "Beautiful location near Lago Coldai",
    detour: {
      name: "Lago Coldai",
      time: "+20 minutes",
      difficulty: "Easy",
      description: "Short walk to a beautiful alpine lake",
    },
    bestTime: "Morning or afternoon",
    tips: [
      "The lake is worth the short detour",
      "Great spot for a picnic",
    ],
    historical: null,
  },
  "Rifugio Tissi": {
    name: "Rifugio Tissi",
    type: "hut",
    description: "Basic mountain hut",
    detour: null,
    bestTime: null,
    tips: [
      "Basic facilities - bring essentials",
      "No electricity - pack a headlamp",
    ],
    historical: null,
  },
  "Rifugio Vazzoler": {
    name: "Rifugio Vazzoler",
    type: "hut",
    description: "Good facilities after a challenging day",
    detour: null,
    bestTime: null,
    tips: null,
    historical: null,
  },
  "Rifugio Carestiato": {
    name: "Rifugio Carestiato",
    type: "hut",
    description: "Standard rifugio",
    detour: null,
    bestTime: null,
    tips: null,
    historical: null,
  },
  "Rifugio Palmieri": {
    name: "Rifugio Palmieri",
    type: "hut",
    description: "Well-maintained rifugio",
    detour: null,
    bestTime: null,
    tips: null,
    historical: null,
  },
  "Rifugio Sommariva al Pramperet": {
    name: "Rifugio Sommariva al Pramperet",
    type: "hut",
    description: "Final rifugio before the descent",
    detour: null,
    bestTime: null,
    tips: [
      "Last chance for a mountain hut experience",
      "Enjoy the final night in the mountains",
    ],
    historical: null,
  },
  "Rifugio 7 Alpini": {
    name: "Rifugio 7 Alpini",
    type: "hut",
    description: "Last rifugio before Belluno",
    detour: null,
    bestTime: null,
    tips: [
      "Final rifugio - celebrate your journey!",
      "Good food and atmosphere",
    ],
    historical: "Named after the 7th Alpini Regiment",
  },
  "La Pissa (Belluno)": {
    name: "La Pissa (Belluno)",
    type: "finish",
    description: "End of Alta Via 1 - congratulations!",
    detour: null,
    bestTime: null,
    tips: [
      "You've completed the Alta Via 1!",
      "Belluno is a beautiful town - consider staying a night",
      "Visit the historic center before heading home",
    ],
    historical: "Belluno is known as the 'Pearl of the Dolomites'",
  },
};

/**
 * Gets points of interest for a location/hut
 */
export function getPointOfInterest(locationName) {
  return POINTS_OF_INTEREST[locationName] || null;
}

/**
 * Gets points of interest for a stage (from/to locations)
 */
export function getStagePointsOfInterest(stage) {
  const pois = [];
  
  // Check if 'from' location has POI
  const fromPOI = getPointOfInterest(stage.from);
  if (fromPOI) {
    pois.push({ ...fromPOI, location: stage.from, position: "start" });
  }
  
  // Check if 'to' location has POI
  const toPOI = getPointOfInterest(stage.to);
  if (toPOI) {
    pois.push({ ...toPOI, location: stage.to, position: "end" });
  }
  
  // Check if hut has POI
  if (stage.hut && stage.hut !== "End in valley") {
    const hutPOI = getPointOfInterest(stage.hut);
    if (hutPOI && !pois.find(p => p.location === stage.hut)) {
      pois.push({ ...hutPOI, location: stage.hut, position: "hut" });
    }
  }
  
  return pois;
}
