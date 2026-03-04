import { ImgListComp } from '@/Features/Pages/Server/Scaffold/Content/ImgList_Comp';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibUserCard } from "@/SysCore/Components/FormField/LibFormField"
import { type SearchBarProps } from '@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp';
import { useLocation, useNavigate } from 'react-router-dom';
import { Paginator } from '@/SysCore/Components/Paginator/Paginator_Comp';
import { useCallback, useMemo, useState } from 'react';
import type { FormCompProp } from '@/Features/Pages/Server/Scaffold/Content/Content_Data';
import type { components } from "@/types/api";
import { AccountModelFields, PersonModelFields } from "@/types/SchemaFields";
import { LibMerge } from '@/SysCore/Utils/Library/LibMergeData';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import { PersonAdapter } from '@/Features/Hooks/BizFunc/AccountManage/Person/Person_Api';
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";

type PersonSet = components["schemas"]["PersonSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

export const Server_Person_List_Comp = (props: { theme: IBETheme }) => {
  // 宣告變數
  const [kw, setKw] = useState<string>("");
  const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);

  const adapter = useMemo(() => PersonAdapter(), []);

  // 執行 function：列表資料（Count + 分頁）
  const useDataList = usePersonListByAdapter(adapter, kw);

  // 執行 function：後台 actions（改用 adapter CUD）
  const actions = usePersonActionsFromAdapter(dirUrl, adapter, useDataList.refetchCurrent);

  // 宣告變數
  const isLoading: boolean[] = [useDataList.isLoading];
  const errors: (string | null | undefined)[] = [useDataList.error];

  const searchCompProp: SearchBarProps = {
    title: "人員搜尋",
    subTitle: "搜尋人員 ...",
    settingTitle: "搜尋設定",
    onSubmit: setKw,
    onReset: () => setKw(""),
  };

  const prop: FormCompProp = {
    Title: "會員管理",
    Theme: props.theme,
    IsLoading: isLoading,
    ErrorList: errors,
    Actions: actions,
    SearchBar: searchCompProp
  };

  // return（DOM 結構不變）
  return (
    <ImgListComp prop={prop}>
      <div className="row">
        {useDataList.rawData.map((item) => {
          const dir = `${dirUrl}/${item.Person?.InternalId}`
          const picSrc = `${FileManagementAPI.PREVIEW_URL}/${item.Person?.PersonImgId}`
          return (
            <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12" >
              <LibUserCard DisplayNameEN={item.Person?.PersonId ?? ""} Style={props.theme.UserEditCard}
                DisplayNameTW={item.Person?.PersonName ?? ""} DisplayRole={""}
                PicSrc={picSrc} dirUrl={dir} />
            </div>
          )
        })}
      </div>
      <Paginator currentPage={useDataList.gridProps.CurrentPage} totalPages={useDataList.gridProps.TotalPage} onPageChange={useDataList.gridProps.onPageChange} style={props.theme.Paginator}></Paginator>
    </ImgListComp>
  )
}

/** 用 Adapter 取得人員列表（含 Count + 分頁） */
const usePersonListByAdapter = (adapter: ReturnType<typeof PersonAdapter>, query: string) => {
  // 宣告變數
  const { publish } = useToast();

  const onError = useCallback((e: ApiAdapterError) => {
    // 執行 function
    publish({ level: MessageStatus.Error, title: e.messageText });
  }, [publish]);

  const condition = usePersonCondition(query);

  const baseParam = useMemo<QueryListParam>(() => {
    // return
    return {
      Fields: [
        PersonModelFields.InternalId,
        PersonModelFields.PersonId,
        PersonModelFields.PersonName,
        PersonModelFields.PersonImgId,
        PersonModelFields.CreateTime,
        PersonModelFields.ModifyTime,
        PersonModelFields.ModifyUserId,
        `${PersonModelFields.ModifyUser}.${AccountModelFields.AccountName}`,
      ],
      Condition: condition,
      OrderBy: [
        { Col: PersonModelFields.CreateTime, Desc: true },
      ],
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
    // return
    return {
      CurrentPage: paged.pageNumber,
      TotalPage: paged.totalPages,
      onPageChange: (page: number) => paged.onPageChange(page),
    };
  }, [paged.pageNumber, paged.totalPages, paged.onPageChange]);

  const refetchCurrent = useCallback(async () => {
    // 執行 function：刪除/新增後 count 會變，先抓 count 再抓 list
    await count.refetch();
    await paged.refetch();
  }, [count, paged]);

  const isLoading = Boolean(count.isLoading || paged.isLoading);
  const error = count.errorText ?? paged.errorText ?? null;

  // return
  return { rawData: paged.data ?? [], gridProps, isLoading, error, refetchCurrent };
};

/** 組搜尋條件字串 */
const usePersonCondition = (query: string) => {
  // return
  return useMemo(() => {
    // 宣告變數
    let condition: string = "";
    if (!!query) {
      condition = LibMerge(
        " And ",
        false,
        condition,
        `(${PersonModelFields.PersonName} Like ${query} Or ${PersonModelFields.PersonId} Like ${query})`
      );
    }

    // return
    return condition;
  }, [query]);
};

/** 後台 actions：改用 Adapter CUD（不再用 provider/useActions） */
const usePersonActionsFromAdapter = (
  dirUrl: string,
  adapter: ReturnType<typeof PersonAdapter>,
  afterChanged: () => Promise<void>,
): UseActionsResult => {
  // 宣告變數
  const navigate = useNavigate();
  const { publish } = useToast();

  const cud = adapter.hooks.useCudActions({
    onError: (e) => publish({ level: MessageStatus.Error, title: e.messageText }),
  });

  const onAddNew = useCallback(() => {
    // 執行 function
    navigate(dirUrl);
  }, [navigate, dirUrl]);

  const onEdit = useCallback((internalId: string) => {
    // 執行 function
    navigate(`${dirUrl}/${internalId}`);
  }, [navigate, dirUrl]);

  const onCancelBack = useCallback(() => {
    // 執行 function：List 通常不會用到，但保持介面完整
    navigate(dirUrl.replace(/\/Form$/, "/List"));
  }, [navigate, dirUrl]);

  const onDelete = useCallback(async (internalId: string) => {
    // 宣告變數
    const ok = window.confirm("確定要刪除嗎？");
    if (!ok) return;

    // 執行 function
    const res = await cud.deleteAsync(internalId);
    (res.SysMessage ?? []).forEach(m => publish({ level: m.Status, code: m.MessageCode, title: m.Message }));
    if (res.IsSuccess) await afterChanged();
  }, [cud, publish, afterChanged]);

  // return
  return useMemo(() => ({
    isExecuting: cud.isSaving,
    onSave: async () => false,
    onDelete,
    onInvalid: () => { /* List 不做 */ },
    onCancelBack,
    onAddNew,
    onEdit,
    onPreview: () => { /* List 不用 */ },
  }), [cud.isSaving, onDelete, onCancelBack, onAddNew, onEdit]);
};
