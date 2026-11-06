/**
 * The owner claim flow (`/claim`, `/claim/[slug]`, its OTP and ops review) is paused: the OTP is a demo.
 * While false those routes redirect to the owner interest form. The flow's code stays in the repo behind
 * this flag so it can be switched back on. Typed `boolean` so the dormant branches stay type-checked.
 */
export const CLAIM_FLOW_ENABLED: boolean = false;
