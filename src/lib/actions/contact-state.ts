/**
 * Shape and initial value for the contact form.
 *
 * Kept out of contact.ts because a "use server" module may only export async
 * functions — exporting a plain object from one throws at call time.
 */

export type ContactValues = {
  name: string;
  email: string;
  eventType: string;
  date: string;
  message: string;
};

export type ContactState = {
  status: "idle" | "ok" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
  /**
   * Echoed back on failure. React resets an uncontrolled form once a Server
   * Action resolves, so without this a visitor loses everything they typed
   * the moment they mistype their email.
   */
  values?: ContactValues;
  /** Changes every submit; used to re-key the inputs so `values` is applied. */
  stamp?: number;
};

export const initialContactState: ContactState = { status: "idle", stamp: 0 };
