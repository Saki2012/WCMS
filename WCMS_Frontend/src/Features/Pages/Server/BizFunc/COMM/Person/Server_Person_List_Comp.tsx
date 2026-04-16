import { ImgListComp } from '@/Features/Pages/Server/Scaffold/Content/ImgList_Comp';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibUserCard } from "@/SysCore/Components/FormField/LibFormField";
import { Paginator } from '@/SysCore/Components/Paginator/Paginator_Comp';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import { useServerPersonList } from './Server_Person_List_Hook';

export const Server_Person_List_Comp = (props: { theme: IBETheme }) => {
    const vm = useServerPersonList(props.theme);
    return (
        <ImgListComp prop={vm.prop}>
            <div className="row">
                {vm.rawData.map((item) => {
                    const dir = `${vm.dirUrl}/${item.Person?.InternalId}`;
                    const picSrc = FileManagementAPI.get_Server_Preview_Url(item.Person?.PersonImgId);
                    const key = item.Person?.InternalId ?? item.Person?.PersonId ?? "";
                    return (
                        <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12" key={key}>
                            <LibUserCard DisplayNameEN={item.Person?.PersonId ?? ""} Style={props.theme.UserEditCard}
                                DisplayNameTW={item.Person?.PersonName ?? ""} 
                                DisplayRole={""} PicSrc={picSrc} dirUrl={dir}
                            />
                        </div>
                    );
                })}
            </div>
            <Paginator currentPage={vm.gridProps.CurrentPage} totalPages={vm.gridProps.TotalPage} onPageChange={vm.gridProps.onPageChange} style={props.theme.Paginator}/>
        </ImgListComp>
    );
};