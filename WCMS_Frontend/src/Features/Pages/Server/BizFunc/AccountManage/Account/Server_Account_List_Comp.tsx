import { ImgListComp } from '@/Features/Pages/Server/Scaffold/Content/ImgList_Comp';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibUserCard } from "@/SysCore/Components/FormField/LibFormField"
import { type SearchBarProps } from '@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp';
import { useLocation, useNavigate } from 'react-router-dom';
import { Paginator } from '@/SysCore/Components/Paginator/Paginator_Comp';
import { useCallback, useMemo, useState } from 'react';
import type { FormCompProp } from '@/Features/Pages/Server/Scaffold/Content/Content_Data';
import type { components } from "@/types/api";
import { AccountFields, PersonModelFields, RoleDataModelFields } from "@/types/SchemaFields";
import { LibMerge } from '@/SysCore/Utils/Library/LibMergeData';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';

import type { UseActionsResult } from '@/Features/Hooks/Common/useActions';
import { useToast } from '@/Features/Hooks/Common/useToastCenter';
import { MessageStatus } from '@/SysCore/Utils/API/APIBase';
import type { ApiAdapterError } from '@/SysCore/Utils/API/APIAdapter';

// ✅ Adapter 取代 Provider
import { AccountAdapter } from '@/Features/Hooks/BizFunc/AccountManage/Account/Account_Api';

type AccountSet = components["schemas"]["AccountSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

export const Server_Account_List_Comp = ({ theme }: { theme: IBETheme }) => {
  // 宣告變數
  const [kw, setKw] = useState<string>("");
  const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);

  const adapter = useMemo(() => AccountAdapter(), []);
  const useDataList = useAccountListByAdapter(adapter, kw);

  const actions = useAccountListActionsFromAdapter(dirUrl, adapter, useDataList.refetchCurrent);

  const isLoading: boolean[] = [useDataList.isLoading]
  const errors: (string | null | undefined)[] = [useDataList.error]
  const searchCompProp: SearchBarProps = { title: "帳號搜尋", subTitle: "搜尋帳號 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
  const prop: FormCompProp = { Title: "會員管理", Theme: theme, IsLoading: isLoading, ErrorList: errors, Actions: actions, SearchBar: searchCompProp }

  // return（⚠️ DOM/Components 完全不動）
  return (
    <ImgListComp prop={prop}>
      <div className="row">
        {useDataList.rawData.map((item) => {
          const dir = `${dirUrl}/${item.Account?.InternalId}`
          const picSrc = `${FileManagementAPI.PREVIEW_URL}/${item.Account?.Person?.PersonImgId}`
          return (
            <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12" >
              <LibUserCard DisplayNameEN={item.Account?.AccountId ?? ""} Style={theme.UserEditCard}
                DisplayNameTW={item.Account?.AccountName ?? ""} DisplayRole={item.Account?.Role?.RoleName ?? ""}
                PicSrc={picSrc} dirUrl={dir} />
            </div>
          )
        })}
      </div>
      <Paginator currentPage={useDataList.gridProps.CurrentPage} totalPages={useDataList.gridProps.TotalPage} onPageChange={useDataList.gridProps.onPageChange} style={theme.Paginator}></Paginator>
    </ImgListComp>
  )
}

/** List data：用 Adapter hooks 取代 useFetchGridListData */
const useAccountListByAdapter = (adapter: ReturnType<typeof AccountAdapter>, query: string) => {
  // 宣告變數
  const { publish } = useToast();

  const onError = useCallback((e: ApiAdapterError) => {
    // 執行 function：toast 錯誤
    publish({ level: MessageStatus.Error, title: e.messageText });
  }, [publish]);

  const condition = useMemo(() => {
    // 執行 function：組 Condition
    let cond = "";
    if (!!query) {
      cond = LibMerge(
        " And ",
        false,
        cond,
        `(${AccountFields.AccountName} Like ${query} Or ${AccountFields.AccountId} Like ${query})`
      );
    }
    return cond;
  }, [query]);

  const baseParam = useMemo<QueryListParam>(() => {
    // 執行 function：組 QueryListParam（維持原本 fields/pageSize）
    return {
      Fields: [
        AccountFields.InternalId,
        AccountFields.AccountId,
        AccountFields.AccountName,
        `${AccountFields.Person}.${PersonModelFields.PersonImgId}`,
        `${AccountFields.Role}.${RoleDataModelFields.RoleName}`
      ],
      Condition: condition,
      OrderBy: [{ Col: AccountFields.CreateTime, Desc: true }],
      PageNumber: 1,
      PageSize: 12,
    };
  }, [condition]);

  const count = adapter.hooks.useQueryCount({
    condition: baseParam,
    deps: [baseParam.Condition ?? ""],
    onError,
  });

  const paged = adapter.hooks.usePagedQueryList({
    baseParam,
    count: count.data ?? 0,
    deps: [baseParam.Condition ?? ""],
    onError,
  });

  const gridProps = useMemo(() => {
    // 執行 function：維持 ImgListComp/Paginator 需要的 shape
    return {
      CurrentPage: paged.pageNumber,
      TotalPage: paged.totalPages,
      onPageChange: (page: number) => paged.onPageChange(page),
    };
  }, [paged.pageNumber, paged.totalPages, paged.onPageChange]);

  const refetchCurrent = useCallback(async () => {
    // 執行 function：同步刷新 count + list
    await count.refetch();
    await paged.refetch();
  }, [count, paged]);

  const isLoading = Boolean(count.isLoading || paged.isLoading);
  const error = count.errorText ?? paged.errorText ?? null;

  // return
  return { rawData: paged.data ?? [], gridProps, isLoading, error, refetchCurrent };
};

/** Actions：用 adapter.hooks.useCudActions 包成 UseActionsResult（不改 ImgListComp 介面） */
const useAccountListActionsFromAdapter = (
  dirUrl: string,
  adapter: ReturnType<typeof AccountAdapter>,
  afterChanged: () => Promise<void>,
): UseActionsResult => {
  // 宣告變數
  const navigate = useNavigate();
  const { publish } = useToast();

  const cud = adapter.hooks.useCudActions({
    onError: (e: ApiAdapterError) => publish({ level: MessageStatus.Error, title: e.messageText }),
  });

  const onAddNew = useCallback(() => {
    // 執行 function：前往新增
    navigate(dirUrl);
  }, [navigate, dirUrl]);

  const onEdit = useCallback((internalId: string) => {
    // 執行 function：前往編輯
    navigate(`${dirUrl}/${internalId}`);
  }, [navigate, dirUrl]);

  const onCancelBack = useCallback(() => {
    // 執行 function：回清單
    navigate(dirUrl.replace(/\/Form$/, "/List"));
  }, [navigate, dirUrl]);

  const onDelete = useCallback(async (internalId: string) => {
    // 執行 function：刪除 + 刷新
    const ok = window.confirm("確定要刪除嗎？");
    if (!ok) return;

    const res = await cud.deleteAsync(internalId);
    (res.SysMessage ?? []).forEach((m) => publish({ level: m.Status, code: m.MessageCode, title: m.Message }));
    if (res.IsSuccess) await afterChanged();
  }, [cud, publish, afterChanged]);

  // return（維持 UseActionsResult 形狀）
  return useMemo(() => ({
    isExecuting: cud.isSaving,
    onSave: async () => false,
    onDelete,
    onInvalid: () => { /* Account List 暫不做 invalid */ },
    onCancelBack,
    onAddNew,
    onEdit,
    onPreview: () => { /* List 不用 */ },
  }), [cud.isSaving, onDelete, onCancelBack, onAddNew, onEdit]);
};
