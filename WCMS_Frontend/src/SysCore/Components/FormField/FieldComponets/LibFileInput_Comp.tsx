import { useId } from 'react';
import type { ILibFileInputProp } from './LibFileInput_Data';


const LibFileInput = (prop: ILibFileInputProp) => {
    const inputTextId = useId();
    const inputFileId = useId();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        // TODO: 這裡呼叫你的 API 上傳檔案，拿到 internalId
        // 先簡單模擬：用檔名代替 internalId
        const fakeInternalId = file.name;

        prop.onChange?.(fakeInternalId, file.name);
    };
    return (
        <>
            <label htmlFor={inputFileId} className={prop.Style.Labelstyle}> {prop.ColumnDisplayName} </label>
            <div className={prop.Style.SelectStyle}>
                <div className="input-group search-box">
                    <input type="text" className={prop.Style.InputStyle} id={inputTextId} placeholder={`${prop.DefaultInputDisplay}${prop.ColumnDisplayName} ...`}
                        value={prop.InputValue ?? ""} />
                    <button type="button" className="btn btn-custom mb-1" title="刪除附加檔案" onClick={prop.onDelete}>
                        <i className="far fa-times"></i>
                    </button>
                </div>
                <input type="file" className={prop.Style.InputStyle} id={inputFileId} placeholder="附加檔案 ..." onChange={handleFileChange} />
            </div>
        </>
    );
}

export default LibFileInput;
