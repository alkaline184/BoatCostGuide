"use client";

import { useId, useState } from "react";
import type { BoatDiagram } from "@/lib/marine/illustrations";

const dimensions = [
  ["length", "Usable space length"],
  ["width", "Usable space width"],
  ["door", "Access opening width"],
  ["ceiling", "Access opening height"],
  ["storedLength", "Stored length including trailer"],
  ["storedWidth", "Stored width including trailer"],
  ["storedHeight", "Stored height including trailer"],
  ["clearance", "Clearance per side or end"],
] as const;

export function BoatFit({ boat }: { boat: BoatDiagram }) {
  const id = useId();
  const [space, setSpace] = useState("garage");
  const [values, setValues] = useState<Record<string, string>>({});
  const number = (key: string) => {
    const value = Number(values[key]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  };
  const length = number("length");
  const width = number("width");
  const door = number("door");
  const ceiling = number("ceiling");
  const storedLength = number("storedLength");
  const storedWidth = number("storedWidth");
  const storedHeight = number("storedHeight");
  const clearance = number("clearance");
  const routing = space !== "slip";
  const boatLength = Math.max(storedLength, boat.length ?? 0);
  const boatWidth = Math.max(storedWidth, boat.beam ?? 0);
  const scale = Math.min(
    500 / Math.max(length, boatLength, 1),
    175 / Math.max(width, boatWidth, 1),
  );
  const exceeds =
    (length > 0 && boatLength > 0 && boatLength + 2 * clearance > length) ||
    (width > 0 && boatWidth > 0 && boatWidth + 2 * clearance > width) ||
    (routing &&
      door > 0 &&
      boatWidth > 0 &&
      boatWidth + 2 * clearance > door) ||
    (routing &&
      ceiling > 0 &&
      storedHeight > 0 &&
      storedHeight + clearance > ceiling);
  const complete =
    length &&
    width &&
    storedLength &&
    storedWidth &&
    (!routing || (door && ceiling && storedHeight));
  return (
    <section className="marine-controls" aria-labelledby={id}>
      <h2 id={id}>Storage and slip dimensions</h2>
      <label>
        Space{" "}
        <select
          value={space}
          onChange={(event) => setSpace(event.target.value)}
        >
          <option value="garage">Garage</option>
          <option value="storage">Storage unit</option>
          <option value="slip">Slip</option>
        </select>
      </label>
      <div className="marine-options marine-fit-grid">
        {dimensions
          .filter(
            ([key]) =>
              routing || !["door", "ceiling", "storedHeight"].includes(key),
          )
          .map(([key, label]) => (
            <label key={key}>
              {routing
                ? label
                : label
                    .replace("Stored ", "Boat ")
                    .replace(" including trailer", "")}{" "}
              (in)
              <input
                type="number"
                min="0"
                step="any"
                value={values[key] ?? ""}
                onChange={(event) =>
                  setValues({ ...values, [key]: event.target.value })
                }
              />
            </label>
          ))}
      </div>
      {length > 0 && width > 0 && (
        <svg
          className="marine-diagram"
          role="img"
          aria-label="Scaled overhead storage footprint"
          viewBox="0 0 560 230"
        >
          <rect
            x="24"
            y="22"
            width={length * scale}
            height={width * scale}
            fill="#dcece9"
            stroke="#244958"
          />
          {boatLength > 0 && boatWidth > 0 && (
            <rect
              x="24"
              y="22"
              width={boatLength * scale}
              height={boatWidth * scale}
              fill="#369095"
              fillOpacity=".4"
              stroke="#244958"
              strokeDasharray="5 3"
            />
          )}
          <text x="24" y="220" fill="#16384b" fontSize="13">
            Space outline · dashed boat or stored footprint
          </text>
        </svg>
      )}
      <p aria-live="polite">
        {exceeds
          ? "A measured dimension exceeds the available space or opening."
          : complete
            ? "Entered dimensions are within the rectangular limits. Check turning room, obstructions, trailer and manufacturer measurements in person."
            : "Add space and measured stored dimensions to assess clearance. Published hull dimensions can flag a known limit."}
      </p>
    </section>
  );
}
