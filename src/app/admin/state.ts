/**
 * Shapes and initial values for the admin forms.
 *
 * These live outside actions.ts on purpose: a "use server" module may only
 * export async functions, so exporting a plain object from it throws
 * "A 'use server' file can only export async functions, found object" the
 * moment the action is invoked.
 */

export type LoginState = { error?: string };
export const initialLoginState: LoginState = {};

export type SaveState = { status: "idle" | "ok" | "error"; message?: string };
export const initialSaveState: SaveState = { status: "idle" };
