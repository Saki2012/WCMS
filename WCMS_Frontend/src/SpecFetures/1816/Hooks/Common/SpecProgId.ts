export const SpecProgId = {
    SpecOpenScheduleRule: "SpecOpenScheduleRule",
} as const;

// 👉 "Announcement" | "FileArchive" | ...
export type Program = typeof SpecProgId[keyof typeof SpecProgId];

// 👉 "Announcement" | "FileArchive" | ...
export type ProgramKey = keyof typeof SpecProgId;
