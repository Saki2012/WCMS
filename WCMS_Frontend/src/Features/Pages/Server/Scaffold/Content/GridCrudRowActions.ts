// src/SysCore/Components/Grid/Enhancers/GridCrudRowActions.ts
import type { Lang } from "@/SysCore/i18n/lang";
import type { GridAdjustAction } from "./GridAdjustCellEnhance";

type LangText = Partial<Record<Lang, string>>;

const TXT = {
  edit: { "zh-tw": "編輯", en: "Edit" },
  del: { "zh-tw": "刪除", en: "Delete" },
  invalid: { "zh-tw": "失效", en: "Disable" },
  editAria: { "zh-tw": "編輯資料", en: "Edit item" },
  delAria: { "zh-tw": "刪除資料", en: "Delete item" },
  invalidAria: { "zh-tw": "將資料設為失效", en: "Disable item" },
  noPermission: { "zh-tw": "無此權限", en: "No permission" },
} as const;

export interface GridCrudHandlers {
  onEdit: (internalId: string) => void;
  onDelete: (internalId: string) => Promise<void> | void;
  onInvalid?: (internalId: string) => Promise<void> | void;
}

export interface GridCrudPermMasks {
  update?: number;
  delete?: number;
  invalid?: number;
}

/** 共用：建立 CRUD row actions（固定塞按鈕，權限不足 → disabled） */
export const createGridCrudRowActions = <TItem,>(opt: {lang: Lang;handlers: GridCrudHandlers;masks?: GridCrudPermMasks;
  confirmDelete?: (internalId: string) => Promise<boolean> | boolean;confirmInvalid?: (internalId: string) => Promise<boolean> | boolean;
}): GridAdjustAction<TItem>[] =>
{
  const confirmDelete = opt.confirmDelete ?? (() => true);
  const confirmInvalid = opt.confirmInvalid ?? (() => true);

  const edit: GridAdjustAction<TItem> = {
    id: "edit",
    label: TXT.edit as LangText,
    ariaLabel: TXT.editAria as LangText,
    requiredMask: opt.masks?.update,
    onClick: ({ internalId }) => opt.handlers.onEdit(internalId),
  };

  const del: GridAdjustAction<TItem> = {
    id: "delete",
    label: TXT.del as LangText,
    ariaLabel: TXT.delAria as LangText,
    requiredMask: opt.masks?.delete,
    onClick: async ({ internalId }) =>
    {
      const ok = await confirmDelete(internalId);
      if (!ok) return;
      await opt.handlers.onDelete(internalId);
    },
  };
// 2026-02-12 目前只需編輯+刪除兩個按鈕
// 需要添加動作的就從這邊往下加
//   const invalid: GridAdjustAction<TItem> = {
//     id: "invalid",
//     label: TXT.invalid as LangText,
//     ariaLabel: TXT.invalidAria as LangText,
//     requiredMask: opt.masks?.invalid,
//     getDisabledReason: (ctx) =>
//     {
//       // 你未來若要依 item 狀態顯示不同文字/禁用，也可以在這邊擴充
//       return null;
//     },
//     onClick: async ({ internalId }) =>
//     {
//       if (!opt.handlers.onInvalid) return;
//       const ok = await confirmInvalid(internalId);
//       if (!ok) return;
//       await opt.handlers.onInvalid(internalId);
//     },
//   };

  return [edit, del];
};
