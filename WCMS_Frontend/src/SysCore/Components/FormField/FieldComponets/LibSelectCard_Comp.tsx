import type { ILibSelectCardProp } from './LibSelectCard_Data';


const LibSelectCard = (prop: ILibSelectCardProp) => {
    return (
        <div className="panel">
            <div className="panel-body">
                <div className="panel-header bg-secondary text-white">
                    <h4 className="fw-bold text-white">{prop.colDisplayName}</h4>
                </div>
                <div className="panel-ContentBox">
                    <div className="row">
                        {prop.components.map((node, idx) => (
                            <div className="col-12" key={idx}>
                                <div className="form-group">
                                    <div className="row mx-0">{node}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

}

export default LibSelectCard