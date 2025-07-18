export interface ToolbarProp{
    Title:string;
    Url:string;
}


export interface ToolbarItemsProp{
    Items:ToolbarProp[]
}



export interface ToolProp{
    Title:string;
    onClick:()=>void;
}


const toolbar_EditProp: ToolProp[] =
   [
    {
      Title: "儲存送出",
      onClick: handleSave, // ✅ 綁定 hook 中送出邏輯
    },
    {
      Title: "取消返回",
      onClick: () => navigate("/PageManagement"),
    },
    {
      Title: "預覽畫面",
      onClick: handlePreview,
    },
  ];

