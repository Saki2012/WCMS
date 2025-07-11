import { useEffect,useState } from "react";
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
                        <h3><i className="fas fa-braille me-2"></i>頁面列表</h3>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="panel">
                                    <div className="panel-body">
                                        <div className="form">
                                            {/** 搜尋框 */}
                                            <div className="row mx-0">
                                                <div className="col-md-6 col-sm-12 float-md-left float-sm-none form-group">
                                                    <div className="row mx-0">
                                                        <label htmlFor="inputtitle01" className="col-md-3 col-sm-12 float-md-left float-sm-none col-form-label">頁面搜尋</label>
                                                        <div className="col-md-9 col-sm-12 float-md-left float-sm-none">
                                                            <div className="input-group search-box">
                                                                <input type="text" className="form-control" id="" placeholder="搜尋頁面 ..."/>
                                                                <button type="button" className="btn btn-custom btn-rounded btn-search"><i className="far fa-search"></i></button>
                                                                <button type="button" className="btn dropdown-toggle dropdown-toggle-search" data-bs-toggle="dropdown" aria-expanded="false"></button>
                                                                <ul className="dropdown-menu dropdown-menu-end">
                                                                    <li><a className="dropdown-item" href="javascript:void(0);">搜尋頁面標題名稱 01</a></li>
                                                                    <li><a className="dropdown-item" href="javascript:void(0);">搜尋頁面標題名稱 02</a></li>
                                                                    <li><a className="dropdown-item" href="javascript:void(0);">搜尋頁面標題名稱 03</a></li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6 col-sm-12 float-md-left float-sm-none form-group">
                                                    <div className="row mx-0">
                                                        <div className="col-sm-12 float-md-left float-sm-none">
                                                            <div className="custom-control custom-button">
                                                                <a type="button" data-bs-toggle="collapse" href="#collapse-00" role="button" aria-expanded="false" aria-controls="collapse-00" target="_self" title="搜尋設定">
                                                                    <button type="button" className="btn btn-custom btn-rounded btn-sm">搜尋設定</button>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="row mx-0">
                                                <div className="col form-group">
                                                    <div className="row mx-0">
                                                        <div className="col-sm-12 float-md-left float-sm-none collapseBox">
                                                            <div className="collapse" id="collapse-00">
                                                                <div className="card card-body">
                                                                    <div className="row mx-0">
                                                                        <div className="col form-group mb-0">
                                                                            <div className="row mx-0">
                                                                                <div className="col form-group">
                                                                                    <div className="row mx-0">
                                                                                        <label htmlFor="inputtitle01" className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">請選擇 搜尋狀態 :</label>
                                                                                        <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                                                                                            <div className="col-sm-3 col-6 float-left p-0">
                                                                                                <div className="custom-control form-check">
                                                                                                    <input className="form-check-input" type="checkbox" value="" id="checkbox_Top_01"/>
                                                                                                    <label className="form-check-label" htmlFor="checkbox_Top_01">
                                                                                                        <span className="check-txt">置頂</span>
                                                                                                    </label>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="col-sm-3 col-12 float-left p-0">
                                                                                                <div className="custom-control form-check">
                                                                                                    <input className="form-check-input" type="checkbox" value="" id="checkbox_Hot_01"/>
                                                                                                    <label className="form-check-label" htmlFor="checkbox_Hot_01">
                                                                                                        <span className="check-txt">熱門</span>
                                                                                                    </label>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="col-sm-3 col-12 float-left p-0">
                                                                                                <div className="custom-control form-check">
                                                                                                    <input className="form-check-input" type="checkbox" value="" id="checkbox_hide_01"/>
                                                                                                    <label className="form-check-label" htmlFor="checkbox_hide_01">
                                                                                                        <span className="check-txt">隱藏</span>
                                                                                                    </label>
                                                                                                </div>
                                                                                            </div>

                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="row mx-0">
                                                                                <div className="col form-group">
                                                                                    <div className="row mx-0">
                                                                                        <label htmlFor="inputtitle01" className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">請選擇 搜尋類別 :</label>
                                                                                        <div className="col-md-10 col-sm-12 float-md-left float-sm-none">

                                                                                            <div className="col-sm-3 col-6 float-left p-0">
                                                                                                <div className="custom-control form-check">
                                                                                                    <input className="form-check-input" type="checkbox" value="" id="checkbox_01"/>
                                                                                                    <label className="form-check-label" htmlFor="checkbox_01">
                                                                                                        <span className="check-txt">公告類別 01</span>
                                                                                                    </label>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="col-sm-3 col-6 float-left p-0">
                                                                                                <div className="custom-control form-check">
                                                                                                    <input className="form-check-input" type="checkbox" value="" id="checkbox_02"/>
                                                                                                    <label className="form-check-label" htmlFor="checkbox_02">
                                                                                                        <span className="check-txt">公告類別 02</span>
                                                                                                    </label>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="col-sm-3 col-6 float-left p-0">
                                                                                                <div className="custom-control form-check">
                                                                                                    <input className="form-check-input" type="checkbox" value="" id="checkbox_03"/>
                                                                                                    <label className="form-check-label" htmlFor="checkbox_03">
                                                                                                        <span className="check-txt">公告類別 03</span>
                                                                                                    </label>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="col-sm-3 col-6 float-left p-0">
                                                                                                <div className="custom-control form-check">
                                                                                                    <input className="form-check-input" type="checkbox" value="" id="checkbox_04"/>
                                                                                                    <label className="form-check-label" htmlFor="checkbox_04">
                                                                                                        <span className="check-txt">公告類別 04</span>
                                                                                                    </label>
                                                                                                </div>
                                                                                            </div>

                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="row mx-0">
                                                                                <div className="col form-group">
                                                                                    <div className="row mx-0">
                                                                                        <label htmlFor="inputtitle01" className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">請選擇 搜尋標籤 :</label>
                                                                                        <div className="col-md-10 col-sm-12 float-md-left float-sm-none">

                                                                                            <div className="col-sm-3 col-6 float-left p-0">
                                                                                                <div className="custom-control form-check">
                                                                                                    <input className="form-check-input" type="checkbox" value="" id="checkbox_L01"/>
                                                                                                    <label className="form-check-label" htmlFor="checkbox_L01">
                                                                                                        <span className="check-txt">公告標籤 01</span>
                                                                                                    </label>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="col-sm-3 col-6 float-left p-0">
                                                                                                <div className="custom-control form-check">
                                                                                                    <input className="form-check-input" type="checkbox" value="" id="checkbox_L02"/>
                                                                                                    <label className="form-check-label" htmlFor="checkbox_L02">
                                                                                                        <span className="check-txt">公告標籤 02</span>
                                                                                                    </label>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="col-sm-3 col-6 float-left p-0">
                                                                                                <div className="custom-control form-check">
                                                                                                    <input className="form-check-input" type="checkbox" value="" id="checkbox_L03"/>
                                                                                                    <label className="form-check-label" htmlFor="checkbox_L03">
                                                                                                        <span className="check-txt">公告標籤 03</span>
                                                                                                    </label>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="col-sm-3 col-6 float-left p-0">
                                                                                                <div className="custom-control form-check">
                                                                                                    <input className="form-check-input" type="checkbox" value="" id="checkbox_L04"/>
                                                                                                    <label className="form-check-label" htmlFor="checkbox_L04">
                                                                                                        <span className="check-txt">公告標籤 04</span>
                                                                                                    </label>
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
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row mx-0">
                                                <div className="col form-group">
                                                    <div className="row mx-0">
                                                        <div className="col-sm-12 float-md-left float-sm-none">
                                                            <div className="hrBox-bg mb-3">
                                                                <hr className="hr-edgeweak T-double"/>
                                                                <hr className="hr-edgeweak B-double"/>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="row mx-0">
                                                <div className="px-0 mb-2">
                                                    <a className="mr-2 mb-2" href="C_10_New_Page新增_頁面.html" type="button" role="button" target="_self" title="新增頁面">
                                                        <button type="button" className="btn btn-custom btn-rounded btn-sm">新增頁面</button>
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="row mx-0">
                                                <div className="RWD-TABLE-BOX">
                                                    <table className="table table-striped table-bordered table-rwd">
                                                        <thead>
                                                            <tr className="tr-only-hide-titlebar">
                                                                <th id="a" style={{width:"8%"}}>類別名稱</th>
                                                                <th id="b" style={{width:"35%"}}>標題名稱</th>
                                                                <th id="c" style={{width:"15%"}}>狀態</th>
                                                                <th id="d" style={{width:"10%"}}>最後修改人</th>
                                                                <th id="e" style={{width:"17%"}}>最後修改日期</th>
                                                                <th id="f" style={{width:"15%"}}>調整</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr className="transparent">
                                                                <td headers="a" className="table_td_vertical_align" data-th="類別名稱">頁面類別</td>
                                                                <td headers="b" className="table_td_vertical_align" data-th="標題名稱">個別頁面標題名稱 ...</td>
                                                                <td headers="c" className="table_td_vertical_align" data-th="狀態">
                                                                    <div className="all-state">
                                                                        <div className="CustomState">
                                                                            <div className="icon-small top-bg">置頂</div>
                                                                            <div className="icon-small hot-bg">熱門</div>
                                                                            <div className="icon-small new-bg">最新</div>
                                                                            <div className="icon-small hide-bg">隱藏</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td headers="d" className="table_td_vertical_align" data-th="最後修改人">系統管理員</td>
                                                                <td headers="e" className="table_td_vertical_align" data-th="最後修改日期">2025/02/29 下午 01:24:25</td>
                                                                <td headers="f" className="table_td_vertical_align" data-th="調整">
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
                                                                </td>
                                                            </tr>
                                                            <tr className="gray">
                                                                <td headers="a" className="table_td_vertical_align" data-th="類別名稱">頁面類別</td>
                                                                <td headers="b" className="table_td_vertical_align" data-th="標題名稱">個別頁面標題名稱 ...</td>
                                                                <td headers="c" className="table_td_vertical_align" data-th="狀態">
                                                                    <div className="all-state">
                                                                        <div className="CustomState">
                                                                            <div className="icon-small top-bg">置頂</div>
                                                                            <div className="icon-small hot-bg">熱門</div>
                                                                            <div className="icon-small new-bg">最新</div>
                                                                            <div className="icon-small hide-bg">隱藏</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td headers="d" className="table_td_vertical_align" data-th="最後修改人">系統管理員</td>
                                                                <td headers="e" className="table_td_vertical_align" data-th="最後修改日期">2025/02/29 下午 01:24:25</td>
                                                                <td headers="f" className="table_td_vertical_align" data-th="調整">
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
                                                                </td>
                                                            </tr>
                                                            <tr className="transparent">
                                                                <td headers="a" className="table_td_vertical_align" data-th="類別名稱">頁面類別</td>
                                                                <td headers="b" className="table_td_vertical_align" data-th="標題名稱">個別頁面標題名稱 ...</td>
                                                                <td headers="c" className="table_td_vertical_align" data-th="狀態">
                                                                    <div className="all-state">
                                                                        <div className="CustomState">
                                                                            <div className="icon-small top-bg">置頂</div>
                                                                            <div className="icon-small hot-bg">熱門</div>
                                                                            <div className="icon-small new-bg">最新</div>
                                                                            <div className="icon-small hide-bg">隱藏</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td headers="d" className="table_td_vertical_align" data-th="最後修改人">系統管理員</td>
                                                                <td headers="e" className="table_td_vertical_align" data-th="最後修改日期">2025/02/29 下午 01:24:25</td>
                                                                <td headers="f" className="table_td_vertical_align" data-th="調整">
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
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                            <div className="row mx-0 px-0">
                                                <nav className="d-flex justify-content-center align-content-center w-100 px-0" aria-label="Page navigation">
                                                    <ul className="pagination my-3">
                                                        <li className="page-item">
                                                            <a className="page-link" href="javascript:void(0);" aria-label="Previous" title="第一頁">
                                                                <span aria-hidden="true"><i className="far fa-arrow-to-left"></i></span>
                                                            </a>
                                                        </li>
                                                        <li className="page-item">
                                                            <a className="page-link disabled" href="javascript:void(0);" aria-label="Previous" title="上一頁">
                                                                <span aria-hidden="true"><i className="far fa-angle-left"></i></span>
                                                            </a>
                                                        </li>
                                                        <li className="page-item"><a className="page-link" href="javascript:void(0);">1</a></li>
                                                        <li className="page-item"><a className="page-link" href="javascript:void(0);">2</a></li>
                                                        <li className="page-item"><a className="page-link" href="javascript:void(0);">3</a></li>
                                                        <li className="page-item">
                                                            <a className="page-link" href="javascript:void(0);" aria-label="Next" title="下一頁">
                                                                <span aria-hidden="true"><i className="far fa-angle-right"></i></span>
                                                            </a>
                                                        </li>
                                                        <li className="page-item">
                                                            <a className="page-link" href="javascript:void(0);" aria-label="Next" title="最後頁">
                                                                <span aria-hidden="true"><i className="far fa-arrow-to-right"></i></span>
                                                            </a>
                                                        </li>
                                                    </ul>
                                                </nav>
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
                                                        </div>
                                                    </div>
                                                    <div className="tab-pane fade" role="tabpanel" id="Tab_TWEN2">
                                                        <div className="form">
                                                            <div className="row mx-0">
                                                                <div className="col form-group">
                                                                    <div className="row mx-0">
                                                                        <label htmlFor="inputtitle01" className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">英文標題</label>
                                                                        <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                                                                            <input type="text" className="form-control" id="" placeholder="請輸入英文標題 ..."/>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="row mx-0">
                                                                <div className="col form-group">
                                                                    <div className="row mx-0">
                                                                        <label htmlFor="inputtitle01" className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">內容-編輯器</label>
                                                                        <div className="col-md-10 col-sm-12 float-md-left float-sm-none">
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row mx-0">
                                            <div className="col form-group">
                                                <div className="row mx-0">
                                                    <div className="col-sm-12 float-md-left float-sm-none">
                                                        <div className="hrBox-bg my-3">
                                                            <hr className="hr-edgeweak T-double"/>
                                                            <hr className="hr-edgeweak B-double"/>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row mx-0">
                                            <div className="col form-group">
                                                <div className="row mx-0">
                                                    <div className="col-sm-10 offset-sm-2 float-md-left float-sm-none">
                                                        <a className="mr-2 mb-2" href="javascript:void(0);" type="button" role="button" target="_self" title="儲存送出">
                                                            <button type="button" className="btn btn-custom btn-rounded btn-sm">儲存送出</button>
                                                        </a>
                                                        <a className="mr-2 mb-2" href="javascript:void(0);" type="button" role="button" target="_self" title="取消返回">
                                                            <button type="button" className="btn btn-custom btn-rounded btn-sm">取消返回</button>
                                                        </a>
                                                        <a className="mr-2 mb-2" href="javascript:void(0);" type="button" role="button" target="_self" title="預覽畫面">
                                                            <button type="button" className="btn btn-custom btn-rounded btn-sm">預覽畫面</button>
                                                        </a>
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
        </div>
    </div>
  );
}