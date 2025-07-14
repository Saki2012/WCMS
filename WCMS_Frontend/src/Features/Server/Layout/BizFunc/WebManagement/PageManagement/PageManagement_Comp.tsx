
import { useEffect,useState } from "react";
import {Grid} from "../../../../../../SysCore/Components/Grid/Grid_ForServer_Comp"
import type{ ColumnConfig,GridRow,GridProps } from "../../../../../../SysCore/Components/Grid/Grid_ForServer_Data"
import { Classic_GridView } from "../../../Scaffold/Content/GridView_Clsx"
import {SearchComp} from "../../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import type{SearchBarProps} from "../../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp"
import PageManagementProvider from "./PageManagement_Api"
import {DividerComp} from "../../../../../../SysCore/Components/Divider/Divider_Comp"
import {Toolbar,Toolbar_EditPage} from "../../../../../../SysCore/Components/Toolbar/Toolbar_Comp"
import type {ToolbarProp,ToolbarItemsProp} from "../../../../../../SysCore/Components/Toolbar/Toolbar_Data"
import LibTinyMCE from "../../../../../../SysCore/Components/TinyMCE/LibTinyMCE_Comp"


const SearchCompProp:SearchBarProps={
    title:"頁面搜尋",
    subTitle:"搜尋頁面 ...",
    settingTitle: "搜尋設定",
}


/** 頁面清單
 * @returns 
 */
export const PageListComp = () => {
    return (
      <div className="Form-Main-Content">
            <div className="row">
                <div className="col-sm-12">
                    <div className="card">
                        <div className="card-header">
                            <h3><i className="fas fa-braille me-2"></i>{"頁面列表"}</h3>
                        </div>
                        <ListBodyComp></ListBodyComp>
                    </div>
                </div>
            </div>
        </div>
    );
}
const ListBodyComp=()=>{
    const [rows, setRows] = useState<GridRow[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const fetchPageData = async (page: number) => {
        const res = await PageManagementProvider().fetchList({ page });
        const list = res || [];
        const mapped: GridRow[] = list.map(item => ({
        cells: [
            { col: testColumns[0], content: item.PageManagement.CategoryId },
            { col: testColumns[1], content: item.PageManagement.CategoryId },
            { col: testColumns[2], content: item.PageManagement.DataStatus },
            { col: testColumns[3], content: item.PageManagement.ModifyUserId },
            { col: testColumns[4], content: item.PageManagement.ModifyTime },
        ]
        }));
        setRows(mapped);
    };
    useEffect(() => {
        fetchPageData(currentPage);
    }, [currentPage]);

    const testColumns: ColumnConfig[] = [
    { key: "category", title: "類別名稱", width: "8%" },
    { key: "title", title: "標題名稱", width: "35%" },
    { key: "status", title: "狀態", width: "15%" },
    { key: "modifier", title: "最後修改人", width: "10%" },
    { key: "modifiedDate", title: "最後修改日期", width: "17%" },
    { key: "actions", title: "調整", width: "15%" },
    ];

    const testRows: GridRow[] = [
        {
            cells: [
                { col: testColumns[0], content: "頁面類別" },
                { col: testColumns[1], content: "個別頁面標題名稱 ..." },
                { col: testColumns[2], content: <div className="icon-small new-bg">最新</div> },
                { col: testColumns[3], content: "系統管理員" },
                { col: testColumns[4], content: "2025/02/29 下午 01:24:25" },
                { col: testColumns[5], content: 
                    <div className="all-btn Edit Icon">
                        <a id="edit" className="icon" href="C_10_New_Page新增_頁面.html" target="_self" title="">
                            <button type="button" className="Ipencil btn btn-ctm btn-ctm-rounded" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="內容編輯">
                                <i className="far fa-edit"></i>
                            </button>
                        </a>
                        <a id="trash" className="icon" href="javascript:void(0);" title="" data-bs-toggle="modal" data-bs-target="#All_Delete">
                            <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="刪除輪播">
                                <i className="far fa-trash-alt"></i>
                            </button>
                        </a>                                                                               
                    </div>
                },
            ],
        },
        {
            cells: [
                { col: testColumns[0], content: "頁面類別" },
                { col: testColumns[1], content: "另一個頁面標題" },
                { col: testColumns[2], content: <div className="icon-small hot-bg">熱門</div> },
                { col: testColumns[3], content: "管理者A" },
                { col: testColumns[4], content: "2025/06/15 上午 11:04:00" },
                { col: testColumns[5], content: 
                    <div className="all-btn Edit Icon">
                        <a id="edit" className="icon" href="C_10_New_Page新增_頁面.html" target="_self" title="">
                            <button type="button" className="Ipencil btn btn-ctm btn-ctm-rounded" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="內容編輯">
                                <i className="far fa-edit"></i>
                            </button>
                        </a>
                        <a id="trash" className="icon" href="javascript:void(0);" title="" data-bs-toggle="modal" data-bs-target="#All_Delete">
                            <button type="button" className="Itrash btn btn-ctm btn-ctm-rounded" title="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="刪除輪播">
                                <i className="far fa-trash-alt"></i>
                            </button>
                        </a>                                                                               
                    </div>
                },
            ],
        },
    ];
    
    const gridData: GridProps = {
    style: Classic_GridView,
    columns: testColumns,
    rows: testRows
    };

    const toolbarProp:ToolbarProp={
        Title:"新增頁面",
        Url:"/Server/WebManagement/PageManage/AddNew",
    }

    return (
        <div className="card-body">
            <div className="row">
                <div className="col-sm-12">
                    <div className="panel">
                        <div className="panel-body">
                            <div className="form"> 
                                <SearchComp {...SearchCompProp}></SearchComp>
                                <DividerComp></DividerComp>
                                <Toolbar {...toolbarProp}></Toolbar>
                                <Grid gridData={gridData}></Grid>
                            </div>
                        </div>
                    </div>
                </div>
            </div>                            
        </div>
    );
}
/** 頁面表單
 * @returns 
 */
export const PageFormComp = () => {
    return (
      <div className="Form-Main-Content">
        <div className="row">
            <div className="col-sm-12">
                <div className="card">
                    <div className="card-header">
                        <h3><i className="fas fa-braille me-2"></i>新增頁面</h3>
                    </div>
                    <FormBodyComp></FormBodyComp>
                </div>
            </div>
        </div>
    </div>
  );
}

const FormBodyComp=()=>{
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
        <div className="card-body">
            <div className="row">
                <div className="col-sm-12">
                    <div className="panel">
                        <div className="panel-body">
                            <div className="form">
                                <div className="row mx-0">
                                    <ul className="nav nav-tabs" id="Main_Tab" role="tablist">
                                        <li className="nav-item" role="presentation">
                                            <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#Tab_Setup1" type="button" role="tab" aria-selected="true">
                                                <h4 className="tab-name">基本</h4>
                                            </button>
                                        </li>
                                    </ul>
                                    <div className="tab-content px-0" id="myTabContent_Setup">
                                        <div className="tab-pane fade show active" role="tabpanel" id="Tab_Setup1">
                                            <div className="form">
                                                <div className="row mx-0">
                                                    <div className="col form-group">
                                                        <div className="row mx-0">
                                                            <label htmlFor="inputtitle01" className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">類別選擇</label>
                                                            <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                                                                <select className="form-select" defaultValue="">
                                                                    <option value="">請選擇</option>
                                                                    <option value="1">頁面類別 01</option>
                                                                    <option value="2">頁面類別 02</option>
                                                                    <option value="1">頁面類別 03</option>
                                                                    <option value="2">頁面類別 04</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-body">
                            <div className="form">
                                <div className="row mx-0">
                                    <LangLabel></LangLabel>
                                    <Content></Content>
                                </div>
                            </div>

                            <DividerComp></DividerComp>
                            <Toolbar_EditPage {...toolbar_EditProp}></Toolbar_EditPage>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

const LangLabel=()=>{
    return (
    <ul className="nav nav-tabs" id="Main_Tab" role="tablist">
        <li className="nav-item" role="presentation">
            <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#Tab_TWEN1" type="button" role="tab" aria-selected="true">
                <h4 className="tab-name">繁體中文</h4>
            </button>
        </li>
        <li className="nav-item" role="presentation">
            <button className="nav-link" data-bs-toggle="tab" data-bs-target="#Tab_TWEN2" type="button" role="tab" aria-selected="false">
                <h4 className="tab-name">English</h4>
            </button>
        </li>
    </ul>
    )
}

const Content=()=>{
    const [content, setContent] = useState('');
    return (
        <div className="tab-content px-0" id="myTabContent_TWEN">
            <div className="tab-pane fade show active" role="tabpanel" id="Tab_TWEN1">
                <div className="form">
                    <div className="row mx-0">
                        <div className="col form-group">
                            <div className="row mx-0">
                                <label htmlFor="inputtitle01" className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">中文標題</label>
                                <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                                    <input type="text" className="form-control" id="" placeholder="請輸入中文標題 ..."/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row mx-0">
                        <div className="col form-group">
                            <div className="row mx-0">
                                <label htmlFor="inputtitle01" className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">內容-編輯器</label>
                                <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                                    <textarea id="editor01-tw" style={{visibility: 'hidden', display: 'none'}}></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    <LibTinyMCE value={content} onChange={setContent} />
                </div>
            </div>
        </div>
    )
}