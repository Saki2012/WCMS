export const PGID = {
    Banner: "Banner",
    Announcement: "Announcement",
    FileArchive: "FileArchive",
    Gallery: "Gallery",
    PageManagement: "PageManagement",
    WebResource: "WebResource",
    Calendar: "Calendar",
} as const;

// 👉 "Announcement" | "FileArchive" | ...
export type Program = typeof PGID[keyof typeof PGID];

// 👉 "Announcement" | "FileArchive" | ...
export type ProgramKey = keyof typeof PGID;
