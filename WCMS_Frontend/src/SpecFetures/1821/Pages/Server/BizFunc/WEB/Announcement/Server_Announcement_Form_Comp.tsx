import type { AnnouncementFormSlotContext } from "@/Features/Pages/Server/BizFunc/WEB/Announcement/Server_Announcement_Form_Comp";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { AnnouncementFields, AnnouncementSetFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";

// #region Public
/** 1821 公告 Form 欄位插槽，依區塊名稱追加或調整客製欄位。 */
export const extendAnnouncementFormSlot = (ctx: AnnouncementFormSlotContext): ReactNode[] =>
{
    switch (ctx.slotName)
    {
        case "Basic":
            return extendBasicFields(ctx);
        default:
            return ctx.getBaseFields();
    }
};
// #endregion

// #region Private
/** 在基本分頁追加學年度欄位。 */
const extendBasicFields = (ctx: AnnouncementFormSlotContext): ReactNode[] =>
{
    return [
        <LibTextBox Style={ctx.theme.TextBox} DefaultInputDisplay="請輸入" {...ctx.setField(AnnouncementSetFields.Announcement, AnnouncementFields.SpecSchoolYear, "number")} />,
        ...ctx.getBaseFields(),
    ];
};
// #endregion
