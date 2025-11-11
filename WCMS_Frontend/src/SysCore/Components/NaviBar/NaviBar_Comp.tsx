/* 網站導覽列 */

import type { NaviData } from '@/SysCore/Components/NaviBar/NaviBar_Data'
import type { INaviBarStyle } from './NaviBar_Clsx'

/** 網站導覽列元件
 * @param items 網站導覽列資料
 * @param theme 主題風格
 * @returns 
 */
const NaviBarComp = ({ items, style }: { items: NaviData[]; style: INaviBarStyle }) => {
  return (
    <ul className={style.ul}>
      {items.map((item, idx) =>
        <li className={style.li} key={idx}>
          {item.DOMContent}
        </li>)}
    </ul>
  );
};

export default NaviBarComp


