// Single source of truth for the pointer-arrow shape so the on-screen preview
// and the printed card render it at exactly the same size, position and colour.
//
// Coordinates live in a 96 x 128 viewBox. The arrow is vertically centred
// (centre y = 64) so rotation stays around its visual centre.
// Head: tip (48,2) down to the base at y=40. Tail: the shaft from y=40 to 126.
export const ARROW_W = 27; // width of the arrow in the viewBox, used for positioning and scaling
export const ARROW_H = 32; // = ARROW_W * (128 / 96), keeps the aspect ratio
export const ARROW_VIEWBOX = '0 0 96 128';
export const ARROW_COLOR = '#ff0000';
export const ARROW_PATH = 'M48 2 L65 40 H52 V126 H44 V40 H31 Z';
