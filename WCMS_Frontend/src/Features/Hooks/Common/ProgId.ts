export const ModuleCode = {};
// 👉 "Announcement" | "FileArchive" | ...
export type ModuleCode = typeof ModuleCode[keyof typeof ModuleCode];
// 👉 "Announcement" | "FileArchive" | ...
export type ModuleCodeKey = keyof typeof PGID;

export const PGID = {
    // #region Dashboard

    // #endregion

    // #region WebManagement
    Banner: "Banner",
    Announcement: "Announcement",
    FileArchive: "FileArchive",
    Gallery: "Gallery",
    PageManagement: "PageManagement",
    WebResource: "WebResource",
    Calendar: "Calendar",
    // #endregion

    // #region

    // #endregion
} as const;

// 👉 "Announcement" | "FileArchive" | ...
export type Program = typeof PGID[keyof typeof PGID];

// 👉 "Announcement" | "FileArchive" | ...
export type ProgramKey = keyof typeof PGID;
