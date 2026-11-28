import { list, object, str } from "../providers/theboatdb/client.ts";

function quantity(value: unknown) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const match = String(value)
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z ]*)$/);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount > 0
    ? { amount, unit: match[2].trim().toLowerCase() || null }
    : null;
}

export function readExpandedFields(raw: Record<string, unknown>) {
  const powers = list(raw.engines).map((entry) => {
    const engine = object(entry);
    const power = quantity(engine.power);
    const units = [
      power?.unit,
      str(engine.powerType)?.trim().toLowerCase(),
    ].filter((unit): unit is string => !!unit);
    return power &&
      units.length &&
      units.every((unit) => /^(hp|horsepower)$/.test(unit))
      ? power.amount
      : null;
  });
  const fuelValue = object(raw.tanks).fuel;
  const tank = Array.isArray(fuelValue)
    ? fuelValue.length === 1
      ? fuelValue[0]
      : null
    : fuelValue;
  const details = object(tank);
  const volume = quantity(details.capacity ?? details.volume ?? tank);
  return {
    expandedFieldsChecked: true,
    horsepower:
      powers.length && powers.every((power) => power !== null)
        ? powers.reduce<number>((total, power) => total + (power ?? 0), 0)
        : null,
    fuel: volume?.amount ?? null,
    fuelUnit: volume
      ? (volume.unit ?? str(details.unit)?.trim().toLowerCase() ?? null)
      : null,
  };
}
