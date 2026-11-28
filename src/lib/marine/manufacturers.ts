export const manufacturerSources = {
  "sea-doo": {
    name: "Sea-Doo",
    url: "https://sea-doo.brp.com/us/en/models.html",
    terms: "https://sea-doo.brp.com/us/en/legal-notice.html",
    hosts: ["sea-doo.brp.com"],
    acquisition:
      "Editorial facts from US product pages and labeled archive/spec books. Commercial reuse clearance pending.",
  },
  "yamaha-waverunner": {
    name: "Yamaha WaveRunner",
    url: "https://www.yamahawaverunners.com/",
    terms: "https://www.yamahaboats.com/terms-and-conditions/",
    hosts: ["www.yamahawaverunners.com"],
    acquisition:
      "Editorial facts from US model pages and dated brochures. Commercial reuse clearance pending.",
  },
  "yamaha-boats": {
    name: "Yamaha Boats",
    url: "https://www.yamahaboats.com/",
    terms: "https://www.yamahaboats.com/terms-and-conditions/",
    hosts: ["www.yamahaboats.com"],
    acquisition:
      "Editorial facts from US product and build-and-price pages. Commercial reuse clearance pending.",
  },
  kawasaki: {
    name: "Kawasaki",
    url: "https://www.kawasaki.com/en-us/watercraft/jetski",
    terms: "https://www.kawasaki.com/en-us/about/legal-policies",
    hosts: ["www.kawasaki.com", "content.kawasaki.com"],
    acquisition:
      "Editorial facts from exact-year US specification sheets. Automated extraction and commercial reuse require clearance.",
  },
  "sun-tracker": {
    name: "Sun Tracker",
    url: "https://www.suntrackerboats.com/pontoon-boats.html",
    terms: "https://www.whiterivermg.com/terms.html",
    hosts: ["www.suntrackerboats.com"],
    acquisition:
      "Editorial facts from US product pages and published national base packages. Automated extraction and commercial reuse require clearance.",
  },
  tracker: {
    name: "Tracker",
    url: "https://www.trackerboats.com/",
    terms: "https://www.whiterivermg.com/terms.html",
    hosts: ["www.trackerboats.com"],
    acquisition: "Automated extraction and commercial reuse require clearance.",
  },
  scarab: {
    name: "Scarab",
    url: "https://www.scarabjetboats.com/us/Boat",
    terms: "https://www.scarabjetboats.com/intl/terms-and-conditions",
    hosts: ["www.scarabjetboats.com"],
    acquisition: "Automated extraction and commercial reuse clearance pending.",
  },
} as const;
export type ManufacturerKey = keyof typeof manufacturerSources;
