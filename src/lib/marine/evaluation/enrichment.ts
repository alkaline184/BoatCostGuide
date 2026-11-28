import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReviewRow } from "../shopping";

const makerNames: Record<string, string> = {
  "sea-doo": "Sea Doo",
  "yamaha-boats": "Yamaha Boats",
  "yamaha-waverunner": "Yamaha WaveRunner",
};
export const identity = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]/g, "");
export type OemFacts = {
  maker: string;
  model: string;
  year: number;
  source: string;
  lengthIn?: number;
  beamIn?: number;
  dryWeightLb?: number;
  passenger?: number;
  fuelUsGal?: number;
  horsepower?: number;
  engineCount?: number;
  priceUsd?: number;
  priceBasis?: string;
};

function currentFacts(review: ReviewRow[]): OemFacts[] {
  return review.map((row) => ({
    maker: makerNames[row.brand],
    model:
      row.brand === "sea-doo"
        ? [
            row.family,
            row.trim.startsWith("For 2")
              ? row.trim.replace(" · ", " ")
              : row.trim.split(" · ")[0],
          ].join(" ")
        : row.family,
    year: row.year,
    source: row.url,
    lengthIn: row.length,
    beamIn: row.beam,
    dryWeightLb: row.weight,
    passenger: row.capacity,
    fuelUsGal: row.fuel,
    horsepower: row.hp,
    engineCount: row.engines,
    priceUsd: row.price,
    priceBasis:
      row.price === undefined ? undefined : "Manufacturer starting price, USD",
  }));
}

const kawasakiBase =
  "https://www.kawasaki.com/en-us/watercraft/jet-ski/sit-down/jet-ski-stx-160/";
const kawasaki: OemFacts[] = (
  [
    ["STX 160X", "160x", 130.3, 46.5, 798.2, 14599],
    ["STX 160LX", "160lx", 134.6, 46.7, 837.9, 16799],
    ["STX 160LX-S", "160lx-s", 134.6, 46.7, 826.9, 15799],
  ] as const
).map(([model, slug, lengthIn, beamIn, dryWeightLb, priceUsd]) => ({
  maker: "Kawasaki",
  model,
  year: 2027,
  source: kawasakiBase + "2027-jet-ski-stx-" + slug,
  lengthIn,
  beamIn,
  dryWeightLb,
  fuelUsGal: 20.6,
  engineCount: 1,
  priceUsd,
  priceBasis: "US base MSRP, USD",
}));
export const gtx2025: OemFacts = {
  maker: "Sea Doo",
  model: "GTX 170",
  year: 2025,
  source: "https://sea-doo.brp.com/us/en/models/previous-models/2025/gtx.html",
  lengthIn: 135.9,
  beamIn: 49.2,
  dryWeightLb: 776,
  passenger: 3,
  fuelUsGal: 18.5,
  horsepower: 170,
  engineCount: 1,
  priceUsd: 15399,
  priceBasis: "Archived US starting price, USD",
};
export const gtx2025Sheet =
  "https://sea-doo.brp.com/content/dam/global/en/sea-doo/my25/documents/specs-sheets/na/en/SEA-MY25-TOUR-GTX-SPEC-ENNA-Page-PDFx.pdf";
const sunTracker: OemFacts[] = (
  [
    ["Bass Buggy 16 XL Select", 221, 96, 7],
    ["Bass Buggy 18 DLX", 240, 98, 8],
    ["Fishin Barge 20 DLX", 263, 102, 10],
    ["Fishin Barge 22 DLX", 290, 102, 11],
    ["Fishin Barge 22 XP3", 290, 102, 11],
    ["Party Barge 18 DLX", 240, 98, 9],
    ["Party Barge 20 DLX", 263, 102, 10],
    ["Party Barge 22 DLX", 290, 102, 11],
    ["Party Barge 22 XP3", 290, 102, 11],
  ] as const
).map(([model, lengthIn, beamIn, passenger]) => ({
  maker: "Sun Tracker",
  model,
  year: 2027,
  source: "https://www.suntrackerboats.com/pontoon-boats.html",
  lengthIn,
  beamIn,
  passenger,
  engineCount: 1,
}));

const yamaha2023Wave =
  "https://www.yamahawaverunners.com/globalassets/z-old/_waverunners/all-waverunners/2023waverunnerbrochure2.pdf";
const yamaha2023Boats =
  "https://www.yamahaboats.com/globalassets/z-old/_boats/all-boats/2023boatbrochure2.pdf";
const seaArchive = "https://sea-doo.brp.com/us/en/models/previous-models/2025/";
const archives: OemFacts[] = [
  ...(["VX", "VX Deluxe", "VX Cruiser", "VX Cruiser HO"] as const).map(
    (model, index) => ({
      maker: "Yamaha WaveRunner",
      model,
      year: 2023,
      source: yamaha2023Wave,
      lengthIn: 132.7,
      beamIn: 48.8,
      passenger: 3,
      dryWeightLb: [719, 683, 688, 785][index],
      fuelUsGal: 18.5,
      engineCount: 1,
    }),
  ),
  ...(["SX220", "AR220", "222SD", "252SD", "255XD"] as const).map(
    (model, index) => ({
      maker: "Yamaha Boats",
      model,
      year: 2023,
      source: yamaha2023Boats,
      lengthIn: index < 3 ? 264 : 294,
      beamIn: 102,
      passenger: index < 3 ? 10 : 12,
      fuelUsGal: index < 3 ? 70 : 75,
      engineCount: 2,
    }),
  ),
  {
    maker: "Yamaha WaveRunner",
    model: "JetBlaster",
    year: 2022,
    source:
      "https://www.yamahawaverunners.com/news-folder/2022-Yamaha-JetBlaster-WaveRunner/",
    lengthIn: 123.6,
    beamIn: 44.5,
    fuelUsGal: 13.2,
    engineCount: 1,
  },
  {
    maker: "Sea Doo",
    model: "GTI 130",
    year: 2025,
    source: seaArchive + "gti.html",
    lengthIn: 130.7,
    beamIn: 49.2,
    dryWeightLb: 741,
    passenger: 3,
    fuelUsGal: 18.5,
    horsepower: 130,
    engineCount: 1,
    priceUsd: 11699,
    priceBasis: "Archived US starting price, USD",
  },
  {
    maker: "Sea Doo",
    model: "GTR 230",
    year: 2025,
    source: seaArchive + "gtr.html",
    lengthIn: 130.7,
    beamIn: 49.2,
    dryWeightLb: 776,
    passenger: 3,
    fuelUsGal: 18.5,
    horsepower: 230,
    engineCount: 1,
    priceUsd: 14299,
    priceBasis: "Archived US starting price, USD",
  },
  {
    maker: "Kawasaki",
    model: "STX 160X",
    year: 2026,
    source: kawasakiBase + "2026-jet-ski-stx-160x",
    lengthIn: 130.3,
    beamIn: 46.5,
    dryWeightLb: 798.2,
    fuelUsGal: 20.6,
    engineCount: 1,
    passenger: 3,
    priceUsd: 13899,
    priceBasis: "Archived US base MSRP, USD",
  },
  {
    maker: "Sea Doo",
    model: "Switch Compact 130",
    year: 2025,
    source: seaArchive + "switch.html",
    lengthIn: 153.6,
    beamIn: 93.5,
    passenger: 5,
    fuelUsGal: 29,
    horsepower: 130,
    engineCount: 1,
    priceUsd: 23799,
    priceBasis: "Archived US starting price, USD",
  },
];

export async function loadOemFacts() {
  const rows = JSON.parse(
    await readFile(join(process.cwd(), "catalog", "review.json"), "utf8"),
  ) as ReviewRow[];
  const current = currentFacts(rows);
  const verifiedOemFacts = [
    ...current,
    gtx2025,
    ...kawasaki,
    ...sunTracker,
    ...archives,
  ];
  const enrichmentPilot = [
    gtx2025,
    ...kawasaki,
    ...current.filter(
      (row) =>
        row.year === 2027 &&
        ((row.maker === "Sea Doo" &&
          ["GTI 130", "GTR 230"].includes(row.model)) ||
          (row.maker === "Yamaha Boats" &&
            ["SX180", "AR182", "222SD", "275SD"].includes(row.model))),
    ),
  ];

  return { verifiedOemFacts, enrichmentPilot };
}
