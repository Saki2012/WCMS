//搜尋框 之後再整合

/** 搜尋歷史紀錄 */
const SearchHistoryList=()=>{
    return (
        <>
            <button type="button" className="btn dropdown-toggle dropdown-toggle-search" data-bs-toggle="dropdown" aria-expanded="false"></button>
            <ul className="dropdown-menu dropdown-menu-end">
                <li><a className="dropdown-item" href="javascript:void(0);">搜尋頁面標題名稱 01</a></li>
                <li><a className="dropdown-item" href="javascript:void(0);">搜尋頁面標題名稱 02</a></li>
                <li><a className="dropdown-item" href="javascript:void(0);">搜尋頁面標題名稱 03</a></li>
            </ul>
        </>
    );
}

/** 搜尋條件 */
const SearchCondition=(prop:SearchBarProps)=>{
    return (
        <div className="row mx-0">
            <div className="col form-group">
                <div className="row mx-0">                                                                
                    <div className="col-sm-12 float-md-left float-sm-none collapseBox">
                        <div className="collapse" id="collapse-00">
                            <div className="card card-body">
                                <div className="row mx-0">
                                    <div className="col form-group mb-0">


                                        {/** 動態塞設定 */}

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
    )
}

/** 搜尋Bar */
const SearchBar=(prop:SearchBarProps)=>{
    return (
        <div className="row mx-0">
            <div className="col-md-6 col-sm-12 float-md-left float-sm-none form-group">
                <div className="row mx-0">
                    <label htmlFor="inputtitle01" className="col-md-3 col-sm-12 float-md-left float-sm-none col-form-label">{prop.title}</label>
                    <div className="col-md-9 col-sm-12 float-md-left float-sm-none">
                        <div className="input-group search-box">
                            <input type="text" className="form-control" id="" placeholder={prop.subTitle}/>
                            <button type="button" className="btn btn-custom btn-rounded btn-search"><i className="far fa-search"></i></button>
                            <SearchHistoryList></SearchHistoryList>
                        </div>
                    </div>
                </div>   
            </div>
            {/** 以下按鈕點開後展開搜尋條件 */}
            <div className="col-md-6 col-sm-12 float-md-left float-sm-none form-group">
                <div className="row mx-0">   
                    <div className="col-sm-12 float-md-left float-sm-none">
                        <div className="custom-control custom-button">
                            <a type="button" data-bs-toggle="collapse" href="#collapse-00" role="button" aria-expanded="false" aria-controls="collapse-00" target="_self" title={prop.settingTitle}>
                                <button type="button" className="btn btn-custom btn-rounded btn-sm">{prop.settingTitle}</button>
                            </a>
                        </div>
                    </div>
                </div>   
            </div>
        </div>
    );
}

export interface SearchBarProps {
  title: string;
  subTitle:string;
  settingTitle: string;
  // 可以繼續新增其他需要的參數
}

export const SearchComp=(prop:SearchBarProps)=>{
    return (
        <>
            <SearchBar {...prop}/>
            <SearchCondition {...prop}/>
        </>
    );
}