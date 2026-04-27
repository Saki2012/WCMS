import { ImgListComp } from '@/Features/Pages/Server/Scaffold/Content/ImgList_Comp';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibUserCard } from "@/SysCore/Components/FormField/LibFormField";
import { NewPaginatorCanInputPage } from '@/SysCore/Components/Paginator/Paginator_Comp';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import { useServerAccountList } from './Server_Account_List_Hook';

export const Server_Account_List_Comp = ({ theme }: { theme: IBETheme }) => {
    // 宣告變數
    const accountList = useServerAccountList(theme);
    return (
        <ImgListComp prop={accountList.prop}>
            <div className="row">
                {accountList.rawData.map((item) => {
                    const dir = `${accountList.dirUrl}/${item.Account?.InternalId}`;
                    const picSrc = FileManagementAPI.get_Server_Preview_Url(item.Account?.Person?.PersonImgId);
                    const key = item.Account?.InternalId ?? item.Account?.AccountId ?? "";
                    return (
                        <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12" key={key}>
                            <LibUserCard DisplayNameEN={item.Account?.AccountId ?? ""} Style={theme.UserEditCard}
                                DisplayNameTW={item.Account?.AccountName ?? ""} DisplayRole={item.Account?.Role?.RoleName ?? ""} 
                                PicSrc={picSrc} dirUrl={dir}
                            />
                        </div>
                    );
                })}
            </div>
            <NewPaginatorCanInputPage currentPage={accountList.gridProps.CurrentPage} totalPages={accountList.gridProps.TotalPage} onPageChange={accountList.gridProps.onPageChange} style={theme.Paginator}/>
        </ImgListComp>
    );
};