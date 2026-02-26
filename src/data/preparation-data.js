// Preparation data for Alta Via 1 hiking
// This is dummy/placeholder data to demonstrate the UI structure
// Replace with actual data when available

/**
 * Generates a packing list based on number of days and season
 */
export function generatePackingList(numDays, startDate) {
  const date = new Date(startDate);
  const month = date.getMonth() + 1; // 1-12
  const isSummer = month >= 6 && month <= 9; // June-September
  const isEarlySeason = month >= 4 && month <= 5; // April-May
  const isLateSeason = month >= 10 && month <= 11; // October-November

  const baseItems = [
    "Backpack (40-50L recommended)",
    "Hiking boots (well broken in)",
    "Hiking poles",
    "Headlamp with extra batteries",
    "First aid kit",
    "Map and compass (or GPS device)",
    "Water bottles/hydration system (2-3L capacity)",
    "Sunscreen (SPF 50+)",
    "Sunglasses",
    "Hat or cap",
    "Multi-tool or knife",
    "Emergency whistle",
    "Cash (many huts don't accept cards)",
  ];

  const clothing = [
    "Moisture-wicking base layers (2 sets)",
    "Hiking pants (convertible recommended)",
    "Hiking shirts (2-3)",
    "Fleece or mid-layer jacket",
    "Rain jacket (essential!)",
    "Rain pants",
    "Warm hat",
    "Gloves",
    "Hiking socks (1 pair per day + 2 extra)",
    "Underwear (1 per day)",
  ];

  const summerExtras = [
    "Lightweight sleeping bag liner (huts provide blankets)",
    "Quick-dry towel",
    "Sandals or camp shoes",
    "Swimsuit (for lakes!)",
  ];

  const coldWeatherExtras = [
    "Insulated jacket (down or synthetic)",
    "Warmer sleeping bag liner",
    "Extra warm layers",
    "Warmer gloves",
  ];

  const foodItems = [
    "Energy bars and snacks",
    "Trail mix or nuts",
    "Electrolyte tablets or powder",
    "Emergency food (extra day's worth)",
    "Tea bags or instant coffee (optional)",
  ];

  let items = [...baseItems, ...clothing];

  if (isSummer) {
    items = [...items, ...summerExtras];
  } else {
    items = [...items, ...coldWeatherExtras];
  }

  items = [...items, ...foodItems];

  // Add items based on number of days
  if (numDays > 7) {
    items.push("Extra batteries or power bank");
    items.push("More spare clothing");
  }

  return items;
}

/**
 * Gets food planning suggestions for a day
 */
export function getFoodPlanning(day, hutDetails) {
  const suggestions = [];

  if (hutDetails) {
    if (hutDetails.meals) {
      if (hutDetails.meals.breakfast) {
        suggestions.push("Breakfast available at hut");
      }
      if (hutDetails.meals.lunch) {
        suggestions.push("Lunch available at hut");
      }
      if (hutDetails.meals.dinner) {
        suggestions.push("Dinner available at hut");
      }
      if (hutDetails.meals.packedLunch) {
        suggestions.push("Packed lunch can be ordered the night before");
      }
    }
  }

  // Add general food tips
  suggestions.push("Carry snacks for the trail (energy bars, trail mix)");
  suggestions.push("Stay hydrated - drink regularly, especially on long days");
  
  if (day.stage.ascentM > 800) {
    suggestions.push("Extra snacks recommended for this challenging day");
  }

  if (day.stage.distanceKm > 12) {
    suggestions.push("Consider ordering a packed lunch for this longer day");
  }

  return suggestions;
}

/**
 * Gets weather-based recommendations
 */
export function getWeatherRecommendations(startDate, numDays) {
  const date = new Date(startDate);
  const month = date.getMonth() + 1;
  const isSummer = month >= 6 && month <= 9;
  const isEarlySeason = month >= 4 && month <= 5;
  const isLateSeason = month >= 10 && month <= 11;

  const recommendations = [];

  if (isSummer) {
    recommendations.push({
      type: "weather",
      title: "Summer Conditions",
      items: [
        "Expect warm days (15-25°C) but cool nights at altitude",
        "Afternoon thunderstorms are common - start early",
        "Sun protection is essential",
        "Layers are key - temperature varies significantly",
      ],
    });
  } else if (isEarlySeason || isLateSeason) {
    recommendations.push({
      type: "weather",
      title: "Shoulder Season Conditions",
      items: [
        "Variable weather - be prepared for all conditions",
        "Colder temperatures, especially at higher elevations",
        "Some huts may have limited services",
        "Check trail conditions - snow possible at higher elevations",
        "Pack extra warm layers",
      ],
    });
  }

  recommendations.push({
    type: "general",
    title: "General Weather Tips",
    items: [
      "Weather can change quickly in the mountains",
      "Check forecast before starting each day",
      "Be prepared for rain even in summer",
      "Early starts recommended to avoid afternoon storms",
    ],
  });

  return recommendations;
}

/**
 * Gets essential gear checklist
 */
export function getEssentialGear() {
  return {
    critical: [
      "Map and navigation (GPS or compass)",
      "Headlamp with extra batteries",
      "First aid kit",
      "Emergency shelter (bivy or space blanket)",
      "Fire starter (lighter, matches)",
      "Emergency whistle",
      "Water purification (tablets or filter)",
    ],
    recommended: [
      "Hiking poles (reduce knee strain)",
      "Power bank for phone",
      "Camera or phone for photos",
      "Notebook and pen",
      "Book or e-reader for evenings",
    ],
  };
}
