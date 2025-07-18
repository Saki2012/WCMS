import { DividerComp } from "../../../../../SysCore/Components/Divider/Divider_Comp";
import LoadingErrorHandler from "../../../../../SysCore/Components/LoadingErrorHandler";
import type { ToolbarItemsProp } from "../../../../../SysCore/Components/Toolbar/Toolbar_Data";
import type { IBETheme } from "../../Theme/ITheme";






export const PageFormComp = ({title, theme}:{title:string;theme:IBETheme}) => {
    return (
      <div className="Form-Main-Content">
        <div className="row">
            <div className="col-sm-12">
                <div className="card">
                    <div className="card-header">
                        <h3><i className="fas fa-braille me-2"></i>{title}</h3>
                    </div>
                    <FormBodyComp theme={theme}></FormBodyComp>
                </div>
            </div>
        </div>
    </div>
  );
}

const FormBodyComp=({theme}:{theme:IBETheme})=>{


    const {data:categoryOpts, loading:categoryLoading, error:categoryErr} = useGetCategoryListByProgId("PageManagement","zh-TW")
    const { id } = useParams();//獲取Form資料
    const { data, isLoading, error } = useGetPageFormData( id ?? "");
    const { createData } = useCreatePageFormData();
    const { delData } = useDeletePageForm();
    const [formData, setFormData] = useState<PageManagementSet>();



    const toolbar_EditProp:ToolbarItemsProp={
        Items:[
            {
                Title:"儲存送出",
                Url:"/Server/WebManagement/PageManage/AddNew",
            },
            {
                Title:"取消返回",
                Url:"/Server/WebManagement/PageManage/AddNew",
            },
            {
                Title:"預覽畫面",
                Url:"/Server/WebManagement/PageManage/AddNew",
            },
        ]
    };





    return (
        <LoadingErrorHandler loadingList={[categoryLoading]} errorList={[categoryErr]} >
            

        <div className="panel">
            <div className="panel-body">
                
                <DividerComp></DividerComp>
                <Toolbar_EditPage {...toolbar_EditProp}></Toolbar_EditPage>
            </div>
        </div>
        </LoadingErrorHandler>
    )
}

