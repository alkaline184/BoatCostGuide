import type { CatalogCardRecord } from "./catalog-search";

export const templates = [
  "pwc-compact",
  "pwc-standard",
  "pwc-touring",
  "pwc-performance",
  "pwc-fishing",
  "pontoon",
  "tritoon",
  "jet-pontoon",
  "fishing-pontoon",
  "jet",
  "tower-jet",
  "bowrider",
  "center-console",
  "wake",
  "bass",
  "aluminum",
  "cruiser",
] as const;
export type BoatTemplate = (typeof templates)[number];
export type BoatDiagram = {
  template: BoatTemplate;
  length: number | null;
  beam: number | null;
  label: string;
};
export function inches(value?: { amount: number; unit: string } | null) {
  if (!value || !Number.isFinite(value.amount) || value.amount <= 0)
    return null;
  const factor: Record<string, number> = {
    in: 1,
    ft: 12,
    m: 1 / 0.0254,
    cm: 1 / 2.54,
  };
  return Object.hasOwn(factor, value.unit)
    ? value.amount * factor[value.unit]
    : null;
}
export function diagramFor(record: CatalogCardRecord): BoatDiagram {
  const { specs } = record.variant;
  const name = record.model.name.toLowerCase();
  const template: BoatTemplate =
    record.model.category === "pwc"
      ? /spark|jetblaster/.test(name)
        ? "pwc-compact"
        : /fishpro/.test(name)
          ? "pwc-fishing"
          : /gtx/.test(name)
            ? "pwc-touring"
            : /rxp|rxt|gtr/.test(name)
              ? "pwc-performance"
              : "pwc-standard"
      : record.model.category === "pontoon"
        ? specs.engine.value?.type === "jet"
          ? "jet-pontoon"
          : record.manufacturer.id === "sun-tracker" &&
              /\bXP3\b/.test(record.variant.name ?? "")
            ? "tritoon"
            : /fish/.test(name)
              ? "fishing-pontoon"
              : "pontoon"
        : /\bAR\d/.test(record.model.name)
          ? "tower-jet"
          : "jet";
  return {
    template,
    length: inches(specs.length.value),
    beam: specs.widthBasis?.value ? null : inches(specs.beam.value),
    label: `${record.modelYear.year} ${record.manufacturer.name} ${record.model.name}`,
  };
}
export function scaleFor(maxLength: number) {
  return 500 / Math.max(1, maxLength);
}
export function dimensionsFor(boat: BoatDiagram, top: boolean, scale: number) {
  const measured = boat.length !== null && (!top || boat.beam !== null);
  return {
    width: measured ? boat.length! * scale : 330,
    height: top && measured ? boat.beam! * scale : top ? 84 : 58,
    measured,
  };
}
