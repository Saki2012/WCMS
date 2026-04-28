import type { IBreadCrumbStyle } from "@/SysCore/Components/BreadCrumb/BreadCrumb_Clsx";
import type { ReactNode } from "react";
/** 路徑導覽元件
 * @param items 路徑導覽源資料
 * @param theme 主題風格
 * @returns
 */
const BreadCrumbComp = (
    { items, style, isUl = true, externalDOM = null }: { items: ReactNode[]; style: IBreadCrumbStyle; isUl?: boolean; externalDOM?: ReactNode; },
) =>
{
    return (
        <>
            {isUl
                ? (
                    <ul className={style.ul}>
                        {items.map((item, idx) => <li className={style.li(idx === items.length - 1)} key={idx}>{item}</li>)}
                        {externalDOM}
                    </ul>
                )
                : (
                    <ol className={style.ul}>
                        {items.map((item, idx) => <li className={style.li(idx === items.length - 1)} key={idx}>{item}</li>)}
                        {externalDOM}
                    </ol>
                )}
        </>
    );
};

export default BreadCrumbComp;
