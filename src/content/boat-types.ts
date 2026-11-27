export const boatTypes = [
  {
    id: "pontoon",
    name: "Pontoon boats",
    use: "Room for the whole crew",
    detail:
      "Compare deck layouts and rated passenger capacity. Price a slip or trailer that fits the boat’s overall width, including its tubes.",
    image: "/marine/pontoon.webp",
  },
  {
    id: "wake",
    name: "Wake boats",
    use: "Built around tow sports",
    detail:
      "Compare ballast, the surf system and seating with riders aboard. Ask about towing fuel burn and service access for the propulsion system.",
    image: "/marine/wake.webp",
  },
  {
    id: "jet",
    name: "Jet boats",
    use: "Propeller-free propulsion",
    detail:
      "Compare low-speed handling and intake access on a test ride. Check how the boat is serviced after use in shallow or debris-filled water.",
    image: "/marine/jet.webp",
  },
  {
    id: "center-console",
    name: "Center consoles",
    use: "Open decks for fishing",
    detail:
      "Look at deck access, shade and storage when everyone is on board. Ask for the fuel burn with the actual engine setup and planned cruising load.",
    image: "/marine/center-console.webp",
  },
  {
    id: "bowrider",
    name: "Bowriders",
    use: "Day trips and watersports",
    detail:
      "Test access to the bow and how much useful seating remains with gear aboard. Check loaded tow weight and where the boat will be stored.",
    image: "/marine/bowrider.webp",
  },
  {
    id: "pwc",
    name: "Personal watercraft",
    use: "Compact days on the water",
    detail:
      "Check rated capacity, storage and the trailer package. Budget for registration, safety gear and the manufacturer’s seasonal maintenance schedule.",
    image: "/marine/pwc.webp",
  },
  {
    id: "cabin-cruiser",
    name: "Cabin cruisers",
    use: "Stay out overnight",
    detail:
      "Inspect sleeping space and electrical, water and ventilation systems. Ask a marina for slip and haul-out quotes using the boat’s actual dimensions.",
    image: "/marine/cabin-cruiser.webp",
  },
  {
    id: "bass",
    name: "Bass boats",
    use: "Freshwater tournament layout",
    detail:
      "Compare casting deck space, livewells and trolling motor setup. Include electronics, batteries and trailer upkeep when setting your budget.",
    image: "/marine/bass.webp",
  },
] as const;
export type BoatCategory = (typeof boatTypes)[number]["id"];
