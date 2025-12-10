export const SpecPGID = {
    SpecMusical: "SpecMusical",
} as const;
export type Program = typeof SpecPGID[keyof typeof SpecPGID];
export type ProgramKey = keyof typeof SpecPGID;
