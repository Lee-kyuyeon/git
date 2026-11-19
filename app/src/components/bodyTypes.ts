import type { Muscle } from '@core';

export type BodyShape = { m: Muscle[]; d: string };
export type BodySide = { viewBox: string; shapes: BodyShape[] };
