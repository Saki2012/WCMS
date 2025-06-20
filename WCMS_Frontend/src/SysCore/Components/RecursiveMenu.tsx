import { useState } from "react";

type MenuItem = {
  id: string;
  title: string;
  children?: MenuItem[];
};

interface Props {
  items: MenuItem[];
  level?: number;
}

export default function RecursiveMenu({ items, level = 1 }: Props) {
  return (
    <ul className={`menu-level-${level}`}>
      {items.map((item) => (
        <MenuItemComponent key={item.id} item={item} level={level} />
      ))}
    </ul>
  );
}

function MenuItemComponent({ item, level }: { item: MenuItem; level: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li className={`menu-item level-${level}`}>
      <div className="menu-label" onClick={() => setOpen(!open)}>
        <span>{item.title}</span>
        {hasChildren && <span className="arrow">{open ? "▾" : "▸"}</span>}
      </div>

      {hasChildren && open && (
        <RecursiveMenu items={item.children!} level={level + 1} />
      )}
    </li>
  );
}