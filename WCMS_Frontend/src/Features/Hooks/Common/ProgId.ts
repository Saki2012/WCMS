export const ProgId = {
    Banner: "Banner",
    Announcement: "Announcement",
    FileArchive: "FileArchive",
    Gallery: "Gallery",
    PageManagement: "PageManagement",
    WebResource: "WebResource",
    Calendar: "Calendar",
} as const;

// 👉 "Announcement" | "FileArchive" | ...
export type Program = typeof ProgId[keyof typeof ProgId];

// 👉 "Announcement" | "FileArchive" | ...
export type ProgramKey = keyof typeof ProgId;
