"use client";

import { useId, useState } from "react";
import {
  dimensionsFor,
  scaleFor,
  type BoatDiagram,
  type BoatTemplate,
} from "@/lib/marine/illustrations";

const ink = "#16384b";
const colors = ["#168783", "#3b659b", "#9a5c37"];
const wide = (name: BoatTemplate) => /pontoon|tritoon/.test(name);
function Hull({
  template,
  top,
  color,
}: {
  template: BoatTemplate;
  top: boolean;
  color: string;
}) {
  const pontoon = wide(template);
  const pwc = template.startsWith("pwc");
  const tower = /tower|wake/.test(template);
  const cabin = template === "cruiser";
  const windshield = !pontoon && !pwc;
  if (top)
    return (
      <>
        <path
          d={
            pontoon
              ? "M7 0 Q0 0 0 12 V88 Q0 100 7 100 H86 Q100 98 100 50 Q100 2 86 0 Z"
              : "M0 9 Q10 0 30 0 Q78 0 100 50 Q78 100 30 100 Q10 100 0 91 Z"
          }
          fill="currentColor"
          fillOpacity=".13"
        />
        <path
          d={
            pontoon
              ? "M10 20 H84 Q91 22 92 41 V62 Q91 80 84 81 H10 Z"
              : "M12 23 Q40 15 72 26 Q87 31 93 50 Q87 69 72 74 Q40 85 12 77 Z"
          }
          fill="none"
          strokeOpacity=".55"
        />
        {pontoon && (
          <>
            <path d="M9 24 H81 M9 77 H81" />
            {template === "tritoon" && (
              <path d="M8 50 H89" strokeDasharray="3 2" />
            )}
          </>
        )}
        {pwc && (
          <>
            <path
              d="M19 47 Q35 32 65 44 L72 50 L64 56 Q35 68 19 53 Z"
              fill="currentColor"
              fillOpacity=".27"
            />
            <path d="M66 38 L69 46 M66 62 L69 54" />
          </>
        )}
        {template === "pwc-compact" && (
          <path d="M28 35 L50 31 M28 65 L50 69" fill="none" />
        )}
        {template === "pwc-touring" && (
          <path d="M12 38 H26 V62 H12 Z M73 40 L79 50 L73 60" fill="none" />
        )}
        {template === "pwc-performance" && (
          <path d="M24 24 L63 28 M24 76 L63 72" fill="none" />
        )}
        {template === "pwc-fishing" && (
          <path d="M10 31 H26 V69 H10 Z M34 18 V29 M34 71 V82" fill="none" />
        )}
        {template === "fishing-pontoon" && (
          <path d="M68 40 h12 v20 H68 Z M18 34 v32" fill="none" />
        )}
        {["bass", "aluminum"].includes(template) && (
          <path
            d={
              template === "bass"
                ? "M15 27 H42 V73 H15 Z M68 38 H85 V62 H68 Z"
                : "M20 25 V75 M34 22 V78 M61 29 V71"
            }
            fill="none"
          />
        )}
        {template === "cruiser" && (
          <path
            d="M50 35 H70 L80 50 L70 65 H50 Z"
            fill="currentColor"
            fillOpacity=".18"
          />
        )}
        {windshield && (
          <path d="M49 22 Q67 50 49 78 M57 25 Q70 50 57 75" fill="none" />
        )}
        <path d="M5 50 H19 M83 50 H96" stroke={color} strokeDasharray="2 2" />
      </>
    );
  return (
    <>
      <path
        d={
          pontoon
            ? "M0 69 L92 69 Q99 69 100 77 L96 89 H5 Q1 87 0 82 Z"
            : pwc
              ? "M0 67 L20 63 Q54 65 84 57 L100 56 Q94 73 77 84 Q46 92 10 88 Z"
              : "M0 62 Q26 65 59 58 L100 51 Q94 73 82 87 Q43 99 8 89 Z"
        }
        fill="currentColor"
        fillOpacity=".16"
      />
      <path
        d={
          pontoon
            ? "M3 64 L4 40 L89 40 L94 63 Z"
            : pwc
              ? "M6 66 Q36 57 51 59 L61 45 L57 43 L58 39 L68 42 L72 55 Q88 55 99 56"
              : "M6 63 L17 55 L50 53 L55 37 L71 43 L75 52 L96 52"
        }
        fill="none"
      />
      {pwc && (
        <path
          d="M19 59 L24 51 Q39 45 51 55 L53 59"
          fill="currentColor"
          fillOpacity=".26"
        />
      )}
      {pontoon && (
        <>
          <path d="M12 43 V62 M33 43 V62 M56 43 V62 M79 43 V62" />
          <path d="M7 77 H94 M11 87 H91" strokeOpacity=".53" />
          {template !== "jet-pontoon" && (
            <path
              d="M2 62 L0 47 L5 43 L9 50 L7 71"
              fill="currentColor"
              fillOpacity=".25"
            />
          )}
        </>
      )}
      {tower && (
        <path d="M29 53 L35 16 Q45 9 59 16 L66 47 M33 17 L63 17" fill="none" />
      )}
      {template === "bass" && (
        <path d="M5 62 L2 40 L8 36 L13 58 M15 54 H40 L45 45" fill="none" />
      )}
      {template === "aluminum" && (
        <path d="M8 66 L57 66 L91 57 M18 75 L63 71" fill="none" />
      )}
      {template === "bowrider" && <path d="M74 52 L81 46 H93" fill="none" />}
      {template === "pwc-fishing" && <path d="M7 65 V49 H20 V62" fill="none" />}
      {cabin && (
        <path
          d="M22 57 L28 31 Q45 25 62 32 L76 51 M34 32 L36 48 L57 48 L55 32"
          fill="currentColor"
          fillOpacity=".12"
        />
      )}
      {template === "center-console" && (
        <path d="M38 55 L43 31 L58 31 L62 52 M35 30 H67" fill="none" />
      )}
      <path
        d="M8 75 Q52 80 91 65"
        fill="none"
        stroke={color}
        strokeOpacity=".85"
      />
    </>
  );
}

export function BoatScene({
  boats,
  top = false,
  blueprint = false,
  overlay = false,
  reference = "none",
}: {
  boats: BoatDiagram[];
  top?: boolean;
  blueprint?: boolean;
  overlay?: boolean;
  reference?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref =
    reference === "adult"
      ? { width: 20, height: 70, name: "Generic adult · 70 in tall" }
      : reference === "pickup"
        ? { width: 220, height: 75, name: "Generic pickup · 220 × 75 in" }
        : reference === "suv"
          ? { width: 190, height: 71, name: "Generic SUV · 190 × 71 in" }
          : null;
  const scale = scaleFor(
    Math.max(
      ...boats.map((boat) => boat.length ?? 0),
      ref?.width ?? 0,
      ref ? ref.height * 6 : 0,
      72,
    ),
  );
  const rows = overlay ? 1 : boats.length;
  const rowHeight = top
    ? Math.max(
        135,
        ...boats.map((b) => dimensionsFor(b, top, scale).height + 58),
      )
    : 110;
  const height = rows * rowHeight + (ref && !top ? 110 : 12);
  const stroke = blueprint ? "#cfeeff" : ink;
  return (
    <svg
      role="img"
      aria-labelledby={id + "title " + id + "description"}
      viewBox={`0 0 600 ${height}`}
      className="marine-diagram"
    >
      <title id={id + "title"}>
        {`${top ? "Top-down" : "Side-profile"} marine schematics`}
      </title>
      <desc id={id + "description"}>
        Illustrative category profiles. Verified lengths share a physical scale.
        Top-down width requires a confirmed beam. Side heights and geometry are
        illustrative.
      </desc>
      <defs>
        <pattern
          id={id + "grid"}
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M20 0 H0 V20"
            fill="none"
            stroke="#6295b1"
            opacity=".35"
            strokeWidth=".65"
          />
        </pattern>
      </defs>
      <rect
        width="600"
        height={height}
        rx="12"
        fill={blueprint ? "#15374b" : "#eff7f7"}
      />
      {blueprint && (
        <rect width="600" height={height} rx="12" fill={`url(#${id}grid)`} />
      )}
      {boats.map((boat, index) => {
        const { width, height: h, measured } = dimensionsFor(boat, top, scale);
        if (overlay && !measured) return null;
        const y = (overlay ? 0 : index) * rowHeight + 21;
        const x = 48;
        const color = colors[index % colors.length];
        return (
          <g key={index} opacity={overlay ? 0.8 : 1}>
            <g
              transform={`translate(${x},${y}) scale(${width / 100},${h / 100})`}
              stroke={stroke}
              strokeWidth={top ? 1.1 : 1.5}
              color={color}
              strokeLinejoin="round"
            >
              <Hull
                template={boat.template}
                top={top}
                color={blueprint ? "#77d8d4" : color}
              />
            </g>
            {measured && (
              <path
                d={`M${x} ${y + h + 8} v8 m0 -4 h${width} m0 -4 v8`}
                stroke={stroke}
                fill="none"
                opacity=".65"
              />
            )}
            {!overlay && (
              <text x={x} y={y + h + 29} fill={stroke} fontSize="12">
                {measured
                  ? `${Math.round(boat.length! * 10) / 10} in long${top ? ` · ${Math.round(boat.beam! * 10) / 10} in beam` : ""}`
                  : "Schematic · dimensions incomplete"}
              </text>
            )}
          </g>
        );
      })}
      {ref && !top && (
        <g
          transform={`translate(48,${rows * rowHeight + 85})`}
          fill="none"
          stroke={stroke}
        >
          {reference === "adult" ? (
            <g transform={`scale(${scale},${scale})`}>
              <circle cx="10" cy="-64" r="5" />
              <path d="M10 -59 V-26 M1 -46 L10 -54 L19 -46 M10 -26 L4 0 M10 -26 L16 0" />
            </g>
          ) : (
            <g transform={`scale(${scale},${scale})`}>
              <path
                d={`M0 -10 V-39 L31 -47 L56 -${ref.height} H129 L156 -46 H${ref.width} V-10 Z`}
              />
              <circle cx="41" cy="-11" r="11" />
              <circle cx={ref.width - 32} cy="-11" r="11" />
            </g>
          )}
          <text y="17" fill={stroke} stroke="none" fontSize="12">
            {ref.name}
          </text>
        </g>
      )}
    </svg>
  );
}
export function DiagramControls({ boats }: { boats: BoatDiagram[] }) {
  const [top, setTop] = useState(false);
  const [blueprint, setBlueprint] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [reference, setReference] = useState("none");
  return (
    <section
      className="marine-controls"
      aria-label="Boat dimensions illustration"
    >
      <div className="marine-options">
        <label>
          View{" "}
          <select
            value={top ? "top" : "side"}
            onChange={(event) => setTop(event.target.value === "top")}
          >
            <option value="side">Side profile</option>
            <option value="top">Top down</option>
          </select>
        </label>
        <label>
          Style{" "}
          <select
            value={blueprint ? "blueprint" : "clean"}
            onChange={(event) =>
              setBlueprint(event.target.value === "blueprint")
            }
          >
            <option value="clean">Clean schematic</option>
            <option value="blueprint">Blueprint</option>
          </select>
        </label>
        {!top && (
          <label>
            Scale reference{" "}
            <select
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            >
              <option value="none">None</option>
              <option value="adult">Adult</option>
              <option value="pickup">Pickup</option>
              <option value="suv">SUV</option>
            </select>
          </label>
        )}
        {boats.length > 1 && (
          <label>
            <input
              type="checkbox"
              checked={overlay}
              onChange={(event) => setOverlay(event.target.checked)}
            />{" "}
            Overlay profiles
          </label>
        )}
      </div>
      {boats.length > 1 && (
        <ul className="marine-legend">
          {boats.map((boat, index) => (
            <li key={index}>
              <span style={{ background: colors[index] }} />
              {boat.label} ·{" "}
              {boat.length === null
                ? "Length unavailable"
                : `${Number(boat.length.toFixed(1))} in`}
              {top && boat.beam === null ? " · beam unavailable" : ""}
            </li>
          ))}
        </ul>
      )}
      <BoatScene
        boats={boats}
        top={top}
        blueprint={blueprint}
        overlay={overlay}
        reference={reference}
      />
      <p className="catalog-note">
        Illustrative category profile scaled to published dimensions. Geometry
        and side height are illustrative. Top views require a verified overall
        beam.
      </p>
    </section>
  );
}
