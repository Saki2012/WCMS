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
import { AccountModelFields, PersonModelFields } from "@/types/SchemaFields";
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import { LibMerge } from '@/SysCore/Utils/Library/LibMergeData';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import PersonProvider from '@/Features/Hooks/BizFunc/AccountManage/Person/Person_Api';
type PersonSet = components["schemas"]["PersonSet_DTO"];

export const Server_Person_List_Comp = (props: { theme: IBETheme }) => {
  const [kw, setKw] = useState<string>("");
  const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
  const provider = useMemo(() => PersonProvider(), []);
  const useDataList = usePersonList(provider, kw);
  const actions = useActions(dirUrl, provider, undefined, undefined, useDataList.refetchCurrent)
  const isLoading: boolean[] = [useDataList.isLoading]
  const errors: (string | null | undefined)[] = [useDataList.error]
  const searchCompProp: SearchBarProps = { title: "人員搜尋", subTitle: "搜尋人員 ...", settingTitle: "搜尋設定", onSubmit: setKw, onReset: () => setKw(""), };
  const prop: FormCompProp = { Title: "會員管理", Theme: props.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions, SearchBar: searchCompProp }
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

const usePersonList = (provider: IDataProvider<PersonSet>, query: string) => {
  let condition: string = "";
  if (!!query) {
    condition = LibMerge(" And ", false, condition, `(${PersonModelFields.PersonName} Like ${query} Or ${PersonModelFields.PersonId} Like ${query})`)
  }
  return useFetchGridListData<PersonSet>({
    getModelDisplayName: () => provider.getModelDisplayName(),
    fetchList: (cond) => provider.fetchList(cond),
    fetchListCount: (cond) => provider.fetchListCount(cond),
    visibleKeys: [],
    buildQueryCondition: (page) => ({
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
      PageNumber: page,
      PageSize: 12,
    }),
    enabled: true,
    deps: [query],
  });
};
