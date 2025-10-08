export const Prog = {
    Banner: "Banner",
    Announcement: "Announcement",
    FileArchive: "FileArchive",
    Gallery: "Gallery",
    PageManagement: "PageManagement",
    WebResource: "WebResource",
} as const;

// 👉 "Announcement" | "FileArchive" | ...
export type Program = typeof Prog[keyof typeof Prog];

// 👉 "Announcement" | "FileArchive" | ...
export type ProgramKey = keyof typeof Prog;
