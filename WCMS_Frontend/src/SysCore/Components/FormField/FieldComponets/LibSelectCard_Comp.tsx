interface ILibSelectCardProp
{
    ColDisplayName: string; // 上方顯示欄位名稱
    children?: React.ReactNode;
}

const LibSelectCard = (prop: ILibSelectCardProp) =>
{
    return (
        <>
            <div className="panel-header bg-secondary text-white">
                <h4 className="fw-bold text-white">{prop.ColDisplayName}</h4>
            </div>
            <div className="panel-ContentBox">
                <div className="row">
                    <div className="col-12">
                        <div className="form-group">
                            <div className="row mx-0">{prop.children}</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LibSelectCard;
