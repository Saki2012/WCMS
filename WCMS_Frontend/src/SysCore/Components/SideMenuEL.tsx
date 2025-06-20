// src/components/SideMenu.tsx
import { useEffect, useState } from "react";
import RecursiveMenu from "./RecursiveMenu";
// import "./SideMenu.css";



interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideMenu({ isOpen, onClose }: Props) {
  const [apiMenu, setApiMenu] = useState<MenuItem[]>([]);
  useEffect(() => {
    // 模擬 API
    setTimeout(() => {
      setApiMenu([
        { id: "01", title: "最新消息" },
        { id: "02", title: "關於本處" },
        { id: "03", title: "校務發展" },
      ]);
    }, 500);
  }, []);

    const menuData: MenuItem[] = [
  {
    id: "01",
    title: "最新消息",
    children: [
      { id: "01-1", title: "最新公告" },
      {
        id: "01-2",
        title: "計畫徵件",
        children: [
          { id: "01-2-1", title: "國科會計畫" },
          { id: "01-2-2", title: "校內計畫" },
        ],
      },
    ],
  },
];

type MenuItem = {
  id: string;
  title: string;
  children?: MenuItem[];
};

  if (!isOpen) return null;

const combinedMenu = [...apiMenu, ...menuData];

return (
  <div className="side-menu">
    <RecursiveMenu items={combinedMenu} />
  </div>
);
}