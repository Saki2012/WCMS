import { useEffect, useRef } from "react";







export const ThirdMenu_Comp = (props: { item: [] }) => {

    const menuContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = menuContainerRef.current;
        if (!container) return;
        // 只抓第三層這個區塊裡的 list-group-item
        const links = Array.from(
            container.querySelectorAll<HTMLAnchorElement>(".Rightlist-group .list-group-item")
        );
        const handleClick = (ev: MouseEvent) => {
            ev.preventDefault();
            // 移除全部 active
            links.forEach(link => link.classList.remove("active"));
            // 對當前點擊的加上 active
            const current = ev.currentTarget as HTMLAnchorElement | null;
            if (current) {
                current.classList.add("active");
            }
        };
        // 綁定事件
        links.forEach(link => link.addEventListener("click", handleClick));
        // 卸載時移除事件監聽
        return () => {
            links.forEach(link => link.removeEventListener("click", handleClick));
        };
    }, []);

    return (
        <>
            <div id="ContentPlaceContent_ContentThirdMenu" className="col-sm-12 col-12 + px-0 + SubPage-RightMenu" ref={menuContainerRef}>
                <ul className="Rightlist-group">
                    <li><a className="list-group-item active" href="javascript:void(0);" title="">第三層 ITEM A</a></li>
                    <li><a className="list-group-item" href="javascript:void(0);" title="">第三層 ITEM B</a></li>
                    <li><a className="list-group-item" href="javascript:void(0);" title="">第三層 ITEM C</a></li>
                    <li><a className="list-group-item" href="javascript:void(0);" title="">第三層 ITEM D</a></li>
                    <li><a className="list-group-item" href="javascript:void(0);" title="">第三層 ITEM B</a></li>
                    <li><a className="list-group-item" href="javascript:void(0);" title="">第三層 ITEM C</a></li>
                    <li><a className="list-group-item" href="javascript:void(0);" title="">第三層 ITEM D</a></li>
                </ul>
            </div>
        </>
    )
}