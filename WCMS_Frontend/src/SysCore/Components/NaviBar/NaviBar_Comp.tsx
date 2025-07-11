/* 網站導覽列 */

import type { NaviData } from '../../../SysCore/Components/NaviBar/NaviBar_Data'
import type { INaviBarStyle } from '../../../SysCore/Components/NaviBar/NaviBar_Clsx'

interface Props {
  items: NaviData[];
  theme: INaviBarStyle;
}

/** 網站導覽列元件
 * @param items 網站導覽列資料
 * @param theme 主題風格
 * @returns 
 */
const NaviBarComp = ({ items, theme }: Props) => {
  return (
      <ul className={theme.ul}>
        {items.map((item,idx) => 
        <li className={theme.li} key={idx}>
          {item.DOMContent}
        </li>)}
      </ul>
  );
};

export default NaviBarComp


