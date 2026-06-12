import type { AnnouncementListGridSpecSlot } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_List_Comp";
import { AnnouncementFields } from "@/types/SchemaFields";

// #region Protected Slot
/** SPEC1816 公告清單：前台表格不顯示標籤欄位。 */
export const extendAnnouncementListGridSpec: AnnouncementListGridSpecSlot = {
    resolveGridColumns: (columns) =>
    {
        return columns.filter(col => col.key !== AnnouncementFields.Tags);
    },
};
// #region
