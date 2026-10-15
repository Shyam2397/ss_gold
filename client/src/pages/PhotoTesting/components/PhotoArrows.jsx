import { useRef } from 'react';
import { ARROW_W, ARROW_H, ARROW_VIEWBOX, ARROW_COLOR, ARROW_PATH } from '../utils/arrowGeometry';

export const createDefaultArrows = () => [
  { id: 'arrow-1', x: 0.28, y: 0.68, angle: -45 },
  { id: 'arrow-2', x: 0.72, y: 0.68, angle: 45 },
];

const clamp01 = (value) => Math.max(0, Math.min(1, value));

export function ArrowGlyph() {
  return (
    <svg
      width={ARROW_W}
      height={ARROW_H}
      viewBox={ARROW_VIEWBOX}
      className="pointer-events-none select-none"
      style={{ shapeRendering: 'geometricPrecision' }}
    >
      <path d={ARROW_PATH} fill={ARROW_COLOR} />
    </svg>
  );
}

/**
 * Two draggable red arrows overlaid on the sample photo.
 * Drag to move; hold Shift and drag to rotate around the arrow's centre.
 * Positions are stored as fractions (0..1) of the photo area so they map 1:1
 * to the printed card.
 */
export default function PhotoArrows({ arrows = [], onChange, containerRef }) {
  const dragRef = useRef(null);

  const start = (event, arrow) => {
    if (!containerRef?.current) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = {
      id: arrow.id,
      mode: event.shiftKey ? 'rotate' : 'move',
      startClientX: event.clientX,
      startClientY: event.clientY,
      origin: { x: arrow.x, y: arrow.y, angle: arrow.angle },
      rect,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const move = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const { rect, origin } = drag;

    if (drag.mode === 'rotate') {
      const cx = rect.left + origin.x * rect.width;
      const cy = rect.top + origin.y * rect.height;
      const nowAngle = (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI;
      if (drag.lastAngle == null) drag.lastAngle = nowAngle;
      let increment = nowAngle - drag.lastAngle;
      increment = (((increment + 180) % 360) + 360) % 360 - 180;
      drag.angle = (drag.angle ?? origin.angle) + increment;
      drag.lastAngle = nowAngle;
      onChange(drag.id, { angle: drag.angle });
    } else {
      const dx = (event.clientX - drag.startClientX) / rect.width;
      const dy = (event.clientY - drag.startClientY) / rect.height;
      onChange(drag.id, { x: clamp01(origin.x + dx), y: clamp01(origin.y + dy) });
    }
  };

  const end = (event) => {
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {arrows.map((arrow) => (
        <div
          key={arrow.id}
          className="absolute z-20 cursor-move touch-none select-none"
          style={{
            left: `${arrow.x * 100}%`,
            top: `${arrow.y * 100}%`,
            width: ARROW_W,
            height: ARROW_H,
            transform: `translate(-50%, -50%) rotate(${arrow.angle}deg)`,
          }}
          onPointerDown={(event) => start(event, arrow)}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <ArrowGlyph />
        </div>
      ))}
    </>
  );
}
