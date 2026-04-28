/** 目前說只有公告/檔案室/網路資源/相簿會用到 */
export const GetDataStatusContent = (contentStatus: number): React.ReactNode =>
{
    const statusItems: React.ReactNode[] = [];
    if (contentStatus & 1) statusItems.push(<div key="top" className="icon-small top-bg">置頂</div>);
    if (contentStatus & 2) statusItems.push(<div key="hot" className="icon-small hot-bg">熱門</div>);
    if (contentStatus & 4) statusItems.push(<div key="hide" className="icon-small hide-bg">隱藏</div>);
    return <div className="CustomState">{statusItems}</div>;
};
