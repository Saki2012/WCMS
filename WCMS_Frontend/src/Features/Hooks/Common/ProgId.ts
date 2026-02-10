export const ModuleCode = {
    Dashboard: "Dashboard",
    WebManagement: "WebManagement",
};
// 👉 "Announcement" | "FileArchive" | ...
export type ModuleCode = typeof ModuleCode[keyof typeof ModuleCode];
