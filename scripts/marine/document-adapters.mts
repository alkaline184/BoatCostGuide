import type {
  EditorialBatch,
  EditorialRecord,
} from "../../src/lib/marine/manufacturer-ingestion.ts";

export type DocumentProfile = Pick<
  EditorialRecord,
  "model" | "evidence" | "power" | "intendedUse" | "editorial"
> & {
  adapter: "kawasaki-sheet" | "sun-tracker-specification";
  observedAt: string;
  historical?: boolean;
};

const layouts = {
  "kawasaki-sheet": {
    brand: "kawasaki",
    length: "overall length",
    beam: "overall width",
    weight: "estimated dry weight",
    fuel: "fuel capacity",
    capacity: "seating capacity",
    price: "msrp",
    weightBasis: "Estimated dry weight",
  },
  "sun-tracker-specification": {
    brand: "sun-tracker",
    length: "length",
    beam: "deck width",
    weight: "average dry weight",
    fuel: "fuel capacity",
    capacity: "max. person capacity",
    price: "national base price",
    weightBasis: "Average dry weight",
  },
} as const;

export function documentBatch(
  profile: DocumentProfile,
  text: string,
): EditorialBatch {
  const layout = layouts[profile.adapter];
  if (
    !layout ||
    profile.model.category !== (layout.brand === "kawasaki" ? "pwc" : "pontoon")
  ) {
    throw new Error(
      "Document profile must match the supported manufacturer and category",
    );
  }
  const normalized = text.replaceAll("\u00a0", " ");
  const words = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const title = words(normalized.slice(0, 1800));
  const family = words(profile.model.family);
  const trim = words(profile.model.trim);
  const familyTokens = family.split(" ");
  const last = familyTokens.at(-1) ?? "";
  const overlap =
    last && trim.startsWith(last)
      ? [...familyTokens.slice(0, -1), trim].join(" ")
      : family;
  for (const identity of [String(profile.model.year), trim]) {
    if (!(" " + title + " ").includes(" " + identity + " ")) {
      throw new Error(
        "Could not confirm exact year, family and trim from the document header",
      );
    }
  }
  if (
    !(" " + title + " ").includes(" " + family + " ") &&
    !(" " + title + " ").includes(" " + overlap + " ")
  )
    throw new Error(
      "Could not confirm exact year, family and trim from the document header",
    );
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const field = (label: string, required = true) => {
    const prefix = label.replace(/[.*+?^$${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^${prefix}(?:\\s*:\\s*|\\s{2,})(.+)$`, "i");
    const values = lines.flatMap((line, i) => {
      const inline = pattern.exec(line)?.[1];
      if (inline) return [inline];
      return line.toLowerCase() === label && lines[i + 1] ? [lines[i + 1]] : [];
    });
    if (!values.length && !required) return undefined;
    if (new Set(values).size !== 1)
      throw new Error(`Missing or conflicting document row for ${label}`);
    return values[0];
  };
  const measure = (label: string, unit: string, required = true) => {
    const value = field(label, required);
    if (value === undefined) return undefined;
    const lengths =
      /^([\d.]+)\s*(?:ft\.?|['’])(?:\s*([\d.]+)\s*(?:in\.?|["”]))?/i.exec(
        value,
      );

    if (unit === "in" && lengths)
      return {
        value: [Number(lengths[1]), Number(lengths[2] ?? 0)] as [
          number,
          number,
        ],
        unit: "ft+in",
      };
    const match = /^([\d,.]+)\s*(in\.?|lb\.?s?\.?|(?:US\s+)?gal\.?|cc)/i.exec(
      value,
    );
    if (
      !match ||
      !match[2].toLowerCase().includes(unit === "US gal" ? "gal" : unit)
    )
      throw new Error(`Unrecognized measurement for ${label}`);
    return { value: Number(match[1].replaceAll(",", "")), unit };
  };
  const rawPrice = field(layout.price, false);
  const match = rawPrice && /^\$\s*([\d,]+(?:\.\d{2})?)(?:\s|$)/.exec(rawPrice);
  if (rawPrice && !match) throw new Error("Unrecognized USD price");
  const capacity = /^\d+\b/.exec(field(layout.capacity)!);
  if (!capacity) throw new Error("Unrecognized passenger capacity");
  const storage = measure("storage capacity", "US gal", false);
  const displacement =
    layout.brand === "kawasaki"
      ? measure("displacement", "cc", false)
      : undefined;
  return {
    brand: layout.brand,
    observedAt: profile.observedAt,
    records: [
      {
        model: profile.model,
        evidence: profile.evidence,
        power: profile.power,
        editorial: profile.editorial,
        intendedUse: profile.intendedUse,
        facts: {
          length: measure(layout.length, "in"),
          beam: measure(layout.beam, "in"),
          weight: measure(layout.weight, "lb"),
          fuel: measure(layout.fuel, "US gal"),
          ...(storage ? { storage } : {}),
          ...(displacement ? { displacement } : {}),
        },
        capacity: Number(capacity[0]),
        weightBasis: layout.weightBasis,
        ...(layout.brand === "sun-tracker" ? { widthBasis: "Deck width" } : {}),
        ...(match
          ? {
              price: {
                amount: Number(match[1].replaceAll(",", "")),
                currency: "USD",
                kind:
                  layout.brand === "kawasaki"
                    ? "msrp"
                    : "manufacturer-starting",
                label:
                  layout.brand === "sun-tracker"
                    ? "National base package price"
                    : undefined,
                url: profile.evidence.url,
                historical: profile.historical,
              },
            }
          : {}),
      },
    ],
  };
}
