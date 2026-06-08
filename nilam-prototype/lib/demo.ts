/**
 * Demo-only UI controls.
 *
 * Some controls exist purely to drive the showcase (e.g. the OCR PROCESSING
 * "Lengkap / Gap" simulator toggle). They must NOT ship in the real product.
 *
 * Gate any such control behind {@link DEMO_CONTROLS}. It defaults to `true`
 * (this prototype is a demo); set the env var `NEXT_PUBLIC_DEMO_CONTROLS=false`
 * in the production build to hide every demo-only control at once.
 */
export const DEMO_CONTROLS = process.env.NEXT_PUBLIC_DEMO_CONTROLS !== "false";
