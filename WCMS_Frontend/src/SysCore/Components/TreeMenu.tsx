import { useState } from "react";

export type MenuItem = {
  Id: string;
  Title: string;
  URL: string;
  Type: "url" | "module";  
  URL_Open: "1" | "2";
  Children?: MenuItem[];
};

interface Props {
  items: MenuItem[];
  level?: number;
}

export default function RecursiveMenu({ items, level = 1 }: Props) {
  return (
    <ul className={`menu-level-${level}`}>
      {items.map((item) => (
        <MenuItemComponent key={item.Id} item={item} level={level} />
      ))}
    </ul>
  );
}

function MenuItemComponent({ item, level }: { item: MenuItem; level: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.Children && item.Children.length > 0;
  return (
<li className="m-number">
    <a
      href={item.Type === "url" ? item.URL : `/FrontPointOfEntry.aspx?Sn=${item.URL}`}
      target={item.Type === "url" && item.URL_Open === "2" ? "_blank" : undefined}
      rel={item.Type === "url" && item.URL_Open === "2"? "noopener noreferrer": undefined}
      tabIndex={1}
      title={item.Title}
      onClick={(e) => {if (hasChildren) {e.preventDefault();setOpen(!open);}}}
    >
    <h2>{item.Title}</h2>
    {hasChildren && (<><i className="fa" aria-hidden="true" /></>)}
  </a>

  <ul>
    {hasChildren && open && (
      <RecursiveMenu items={item.Children!} level={level + 1} />
    )}
  </ul>
</li>
  );
}