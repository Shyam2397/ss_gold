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

  // Keyboard control: arrows move the arrow, Shift + left/right rotate it.
  const handleKeyDown = (event, arrow) => {
    const step = 0.01;
    const rotStep = 5;
    let patch = null;
    if (event.shiftKey) {
      if (event.key === 'ArrowLeft') patch = { angle: arrow.angle - rotStep };
      else if (event.key === 'ArrowRight') patch = { angle: arrow.angle + rotStep };
    } else if (event.key === 'ArrowLeft') patch = { x: clamp01(arrow.x - step) };
    else if (event.key === 'ArrowRight') patch = { x: clamp01(arrow.x + step) };
    else if (event.key === 'ArrowUp') patch = { y: clamp01(arrow.y - step) };
    else if (event.key === 'ArrowDown') patch = { y: clamp01(arrow.y + step) };
    if (!patch) return;
    event.preventDefault();
    event.stopPropagation();
    onChange(arrow.id, patch);
  };

  return (
    <>
      {arrows.map((arrow, index) => (
        <div
          key={arrow.id}
          data-no-refocus="true"
          role="button"
          tabIndex={0}
          aria-label={`Pointer arrow ${index + 1}: drag to move, Shift-drag to rotate`}
          className="absolute z-20 cursor-move touch-none select-none rounded outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
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
          onKeyDown={(event) => handleKeyDown(event, arrow)}
        >
          <ArrowGlyph />
        </div>
      ))}
    </>
  );
}
