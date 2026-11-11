"use client";

import { encodeEan13Runs } from "@/lib/barcode";

interface BarcodeSvgProps {
  code: string;
  height?: number;
  className?: string;
}

export function BarcodeSvg({ code, height = 52, className = "" }: BarcodeSvgProps) {
  const { bars, totalWidth, digits, isStandardEan13 } = encodeEan13Runs(code);
  const svgHeight = height + 16;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${svgHeight}`}
      className={className}
      role="img"
      aria-label={`باركود ${digits}`}
      shapeRendering="crispEdges"
    >
      <rect x={0} y={0} width={totalWidth} height={svgHeight} fill="#ffffff" />
      {bars.map((bar, idx) => (
        <rect
          key={idx}
          x={bar.x}
          y={2}
          width={bar.width}
          height={bar.tall ? height + 5 : height}
          fill="#000000"
        />
      ))}

      {isStandardEan13 ? (
        <g
          fill="#000000"
          fontSize="10"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontWeight="700"
        >
          <text x="5" y={svgHeight - 3} textAnchor="middle">
            {digits[0]}
          </text>
          <text x="34" y={svgHeight - 3} textAnchor="middle">
            {digits.slice(1, 7)}
          </text>
          <text x="80" y={svgHeight - 3} textAnchor="middle">
            {digits.slice(7, 13)}
          </text>
        </g>
      ) : (
        <text
          x={totalWidth / 2}
          y={svgHeight - 3}
          textAnchor="middle"
          fill="#000000"
          fontSize="9"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontWeight="700"
        >
          {digits}
        </text>
      )}
    </svg>
  );
}

