export interface ISearchQuery {
    keyword?: string;
    tag?: string;
    from?: string; // yyyy-MM-dd
    to?: string;   // yyyy-MM-dd
}

export interface SearchBarProps {
    value: ISearchQuery;
    tags?: { id: string; name: string }[];
    onChange: <K extends keyof ISearchQuery>(k: K, v: ISearchQuery[K]) => void;
    onSubmit: () => void;
    onReset?: () => void;
}

export const SearchBarComp: React.FC<SearchBarProps> = ({ value, tags, onChange, onSubmit, onReset }) => {
    return (
        <form role="search" aria-label="資料搜尋" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
            <div id="div_Search" className="col-sm-12 col-12 mb-4">
                <div className="row mx-0">
                    <div className="col-sm-5 col-12 text-left mt-0 mb-2 mr-xl-2 mr-lg-2 mr-md-2 mr-sm-2 mr-0 p-0">
                        <input type="text" id="tb_search" name="tb_search" className="form-control" placeholder="搜尋" aria-label="搜尋內容"
                            value={value.keyword ?? ''} onChange={(e) => onChange('keyword', e.target.value)} />
                    </div>
                    <div className="col-sm-2 col-6 text-left mt-0 mb-2 mr-xl-2 mr-lg-2 mr-md-2 mr-sm-2 mr-0 p-0">
                        <select id="ddl_Tag" name="ddl_Tag" className="form-select" aria-label="搜尋標籤" value={value.tag ?? ""}
                            onChange={(e) => onChange("tag", e.target.value)}>
                            <option value="">請選擇</option>
                            {tags?.map(tag => (<option key={tag.id} value={tag.id}>{tag.name}</option>))}
                        </select>
                    </div>

                    <div className="col-sm-2 col-12 text-center mt-0 mb-2 p-0">
                        <button type="submit" id="btn_search" className="btn-search-custom btn-custom-color" >
                            搜尋
                        </button>
                    </div>
                    <div className="col-sm-2 col-12 text-center mt-0 mb-2 p-0">
                        {onReset && <button type="button" id="btn_clear" className="btn-search-custom btn-custom-color" onClick={onReset}>清除</button>}
                    </div>
                </div>
            </div>
        </form>
    );
}
