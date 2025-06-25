/*導覽頁
e.x:
首頁｜臺藝校首頁｜網站導覽｜語言切換｜...
*/

export type NavItem = {
  Title: string;
  URL: string;
};

interface Props {
  items: NavItem[];
}

export default function LangSwitch({ items}: Props) {
  return (
    <ul className="">
      {items.map((item) => (
        <LangComp langData={item} />
      ))}
    </ul>
  );
}

function LangComp({ langData }: { langData: NavItem}) {
  return (
    <li className="nav-item">
    <a className="nav-link" href={langData.URL} tabIndex={1} target="_self" title={langData.Title}>{langData.Title}</a>
    </li>
  );
}

