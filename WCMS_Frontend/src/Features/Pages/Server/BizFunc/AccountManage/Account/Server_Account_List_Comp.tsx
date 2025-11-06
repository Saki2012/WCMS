import { ImgListComp } from '@/Features/Pages/Server/Scaffold/Content/ImgList_Comp';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibUserCard } from "@/SysCore/Components/FormField/LibFormField"
import { type SearchBarProps } from '@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp';
import { useLocation } from 'react-router-dom';
import { Paginator } from '@/SysCore/Components/Paginator/Paginator_Comp';
import { useMemo, useState } from 'react';
import { useActions } from '@/Features/Hooks/Common/useActions';
import type { FormCompProp } from '@/Features/Pages/Server/Scaffold/Content/Content_Data';
import type { IDataProvider } from '@/SysCore/Interface/IApiProvider';
import type { components } from "@/types/api";
import { AccountFields, PersonModelFields } from "@/types/SchemaFields";
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import { LibMerge } from '@/SysCore/Utils/Library/LibMergeData';
import AccountProvider from '@/Features/Hooks/BizFunc/AccountManage/Account/Account_Api';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
type AccountSet = components["schemas"]["AccountSet_DTO"];

export const Server_Account_List_Comp = ({ theme }: { theme: IBETheme }) => {
  const [kw, setKw] = useState<string>("");
  const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
  const provider = useMemo(() => AccountProvider(), []);
  const useDataList = useAccountList(provider, kw);
  const actions = useActions(dirUrl, provider, undefined, undefined, useDataList.refetchCurrent)
  const isLoading: boolean[] = [useDataList.isLoading]
  const errors: (string | null | undefined)[] = [useDataList.error]
  const searchCompProp: SearchBarProps = { title: "帳號搜尋", subTitle: "搜尋帳號 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
  const prop: FormCompProp = { Title: "會員管理", Theme: theme, LoadingList: isLoading, ErrorList: errors, Actions: actions, SearchBar: searchCompProp }

  return (
    <ImgListComp prop={prop}>
      <div className="row">
        {useDataList.rawData.map((item) => {
          const dir = `${dirUrl}/${item.Account?.InternalId}`
          const picSrc = `${FileManagementAPI.PREVIEW_URL}/${item.Account?.Person?.PersonImgId}`
          return (
            <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12" >
              <LibUserCard DisplayNameEN={item.Account?.AccountId ?? ""} Style={theme.UserEditCard}
                DisplayNameTW={item.Account?.AccountName ?? ""} DisplayRole={"role"}
                PicSrc={picSrc} dirUrl={dir} />
            </div>
          )
        })}
      </div>
      <Paginator currentPage={useDataList.gridProps.CurrentPage} totalPages={useDataList.gridProps.TotalPage} onPageChange={useDataList.gridProps.onPageChange} style={theme.Paginator}></Paginator>
    </ImgListComp>
  )
}




const useAccountList = (provider: IDataProvider<AccountSet>, query: string) => {
  let condition: string = "";
  if (!!query) {
    condition = LibMerge(" And ", false, condition, `(${AccountFields.AccountName} Like ${query} Or ${AccountFields.AccountId} Like ${query})`)
  }
  return useFetchGridListData<AccountSet>({
    getModelDisplayName: () => provider.getModelDisplayName(),
    fetchList: (cond) => provider.fetchList(cond),
    fetchListCount: (cond) => provider.fetchListCount(cond),
    visibleKeys: [],
    buildQueryCondition: (page) => ({
      Fields: [
        AccountFields.InternalId,
        AccountFields.AccountId,
        AccountFields.AccountName,
        `${AccountFields.Person}.${PersonModelFields.PersonImgId}`
      ],
      Condition: condition,
      OrderBy: [
        { Col: AccountFields.CreateTime, Desc: true },
      ],
      PageNumber: page,
      PageSize: 12,
    }),
    enabled: true,
    deps: [query],
  });
};
