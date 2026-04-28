import { useId } from "react";
import type { ILibFileProp } from "./LibFile_Data";

interface LibFileithParentClassProp extends ILibFileProp
{
    parentClass?: string; // 新增
}

const LibFile = ({ children, ...prop }: LibFileithParentClassProp) =>
{
    const inputId = useId();
    const hasChildren = !!children;
    return (
        <>
            <div className="">
                <div className="row">
                    <div className={hasChildren ? "col-12" : "d-none"}>
                        <div className="row">
                            <label htmlFor={inputId} className={prop.Style.Labelstyle}>圖片預覽</label>
                            <div className="px-3 mt-2 col-xxl-4 col-xl-5 col-lg-9 col-md-10 col-sm-12 col-12">{children}</div>
                        </div>
                    </div>
                    <div className="col-12">
                        <div className="row">
                            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
                            <div className={prop.Style.SelectStyle}>
                                <input
                                    type="file"
                                    accept={prop.accept}
                                    className={prop.Style.InputStyle}
                                    id={inputId}
                                    multiple={prop.Multiple}
                                    onChange={(e) =>
                                    {
                                        if (!e.target.files)
                                        {
                                            return;
                                        }
                                        const filesArray = Array.from(e.target.files);
                                        prop.onChange?.(filesArray); // 傳 File[]
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LibFile;
