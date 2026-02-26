// Booking links and information for Alta Via 1 huts
// Note: These are placeholder URLs - replace with actual booking links
// Most Italian rifugios use their own websites or booking platforms

export const HUT_BOOKING_LINKS = {
  "Rifugio Biella": {
    bookingUrl: "https://www.rifugiobiella.it/", // Placeholder - replace with actual booking page
    website: "https://www.rifugiobiella.it/",
    note: "Check availability on their website",
  },
  "Rifugio Pederù": {
    bookingUrl: "https://www.rifugiopederu.it/", // Placeholder
    website: "https://www.rifugiopederu.it/",
    note: "Contact via website or phone",
  },
  "Rifugio Fanes": {
    bookingUrl: "https://www.rifugiofanes.it/", // Placeholder
    website: "https://www.rifugiofanes.it/",
    note: "Book through their website",
  },
  "Rifugio Lagazuoi": {
    bookingUrl: "https://www.rifugiolagazuoi.com/", // Placeholder
    website: "https://www.rifugiolagazuoi.com/",
    note: "Popular hut - book early",
  },
  "Rifugio Averau": {
    bookingUrl: "https://www.rifugioaverau.it/", // Placeholder
    website: "https://www.rifugioaverau.it/",
    note: "Check availability online",
  },
  "Rifugio Nuvolau": {
    bookingUrl: "https://www.rifugionuvolau.it/", // Placeholder
    website: "https://www.rifugionuvolau.it/",
    note: "Contact for booking",
  },
  "Rifugio Città di Fiume": {
    bookingUrl: "https://www.rifugiocittadifiume.it/", // Placeholder
    website: "https://www.rifugiocittadifiume.it/",
    note: "Book via website",
  },
  "Rifugio Coldai": {
    bookingUrl: "https://www.rifugiocoldai.it/", // Placeholder
    website: "https://www.rifugiocoldai.it/",
    note: "Check availability",
  },
  "Rifugio Tissi": {
    bookingUrl: "https://www.rifugiotissi.it/", // Placeholder
    website: "https://www.rifugiotissi.it/",
    note: "Contact for reservations",
  },
  "Rifugio Vazzoler": {
    bookingUrl: "https://www.rifugiovazzoler.it/", // Placeholder
    website: "https://www.rifugiovazzoler.it/",
    note: "Book online",
  },
  "Rifugio Carestiato": {
    bookingUrl: "https://www.rifugiocarestiato.it/", // Placeholder
    website: "https://www.rifugiocarestiato.it/",
    note: "Check website for availability",
  },
  "Rifugio Palmieri": {
    bookingUrl: "https://www.rifugiopalmieri.it/", // Placeholder
    website: "https://www.rifugiopalmieri.it/",
    note: "Contact via website",
  },
  "Rifugio Sommariva al Pramperet": {
    bookingUrl: "https://www.rifugiosommariva.it/", // Placeholder
    website: "https://www.rifugiosommariva.it/",
    note: "Book through website",
  },
  "Rifugio 7 Alpini": {
    bookingUrl: "https://www.rifugio7alpini.it/", // Placeholder
    website: "https://www.rifugio7alpini.it/",
    note: "Check availability",
  },
};

/**
 * Gets booking information for a hut
 */
export function getHutBookingInfo(hutName) {
  return HUT_BOOKING_LINKS[hutName] || null;
}
