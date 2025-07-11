import type {BreadCrumbData} from '../../../SysCore/Components/BreadCrumb/BreadCrumb_Data'
import type { IBreadCrumbStyle } from '../../../Features/Server/Layout/Scaffold/Menu/BreadCrumb/BreadCrumb_Clsx';


interface Props {
  items: BreadCrumbData[];
  theme: IBreadCrumbStyle;
}

/** 路徑導覽元件
 * @param items 路徑導覽源資料
 * @param theme 主題風格
 * @returns 
 */
const BreadCrumbComp = ({ items, theme }: Props) => {
  return (
      <ul className={theme.ul}>
        {items.map((item, idx) => 
        <li className={theme.li(idx === items.length - 1)} key={idx}>
          {item.DOMContent}
        </li>)}
      </ul>
  );
};

export default BreadCrumbComp
