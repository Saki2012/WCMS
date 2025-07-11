const SearchBarComp =() => {
    return (
      <div id="div_Search" className="col-sm-12 col-12 mb-4">
        <div className="row mx-0">
            <div className="col-sm-5 col-12 text-left mt-0 mb-2 mr-xl-2 mr-lg-2 mr-md-2 mr-sm-2 mr-0 p-0">       
                
                <input type="text" id="tb_search" name="tb_search" className="form-control" placeholder="搜尋" aria-label="搜尋內容"/>

            </div>
            <div className="col-sm-2 col-6 text-left mt-0 mb-2 mr-xl-2 mr-lg-2 mr-md-2 mr-sm-2 mr-0 p-0">

                <select id="ddl_Tag" name="ddl_Tag" className="form-select" aria-label="搜尋標籤" value={""} onChange={(e)=>""}>
                    <option value="">請選擇</option><option value="tag1">標籤一</option><option value="tag2">標籤二</option><option value="tag3">標籤三</option>
                </select>

            </div>    
            <div className="col-sm-2 col-12 text-center mt-0 mb-2 p-0">

                <button type="submit" id="btn_search" className="btn-search-custom btn-custom-color" onClick={(e)=>''}>
                搜尋
                </button>

            </div>
            <div className="col-sm-2 col-12 text-center mt-0 mb-2 p-0">

                <button type="button" id="btn_clear" className="btn-search-custom btn-custom-color" onClick={(e)=>''}>
                清除
                </button>

            </div>
        </div>
    </div>
    );
}

export default SearchBarComp

