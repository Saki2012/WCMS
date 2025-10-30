export const SpecProgId = {
    SpecCategory: "SpecCategory",
    SpecResearch: "SpecResearch",
    SpecUSR: "SpecUSR",
} as const;

// 👉 "Announcement" | "FileArchive" | ...
export type Program = typeof SpecProgId[keyof typeof SpecProgId];

// 👉 "Announcement" | "FileArchive" | ...
export type ProgramKey = keyof typeof SpecProgId;
