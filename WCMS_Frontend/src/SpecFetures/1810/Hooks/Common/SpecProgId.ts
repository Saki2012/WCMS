export const SpecPGID = {
    SpecCategory: "SpecCategory",
    SpecResearch: "SpecResearch",
    SpecUSR: "SpecUSR",
} as const;

// 👉 "Announcement" | "FileArchive" | ...
export type Program = typeof SpecPGID[keyof typeof SpecPGID];

// 👉 "Announcement" | "FileArchive" | ...
export type ProgramKey = keyof typeof SpecPGID;
