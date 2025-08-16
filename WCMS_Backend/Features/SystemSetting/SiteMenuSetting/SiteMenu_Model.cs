using MessagePack.Resolvers;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SystemSetting.SiteMenuSetting
{
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenuSet
    {
        /// <summary>
        /// 首頁
        /// </summary>
        public SiteMenu_IndexModel SiteMenu_Index { get; set; } = new();
        /// <summary>
        /// 首頁資訊
        /// </summary>
        public List<SiteMenu_IndexInfoModel> SiteMenu_IndexInfo = [];
        /// <summary>
        /// 連結項目
        /// </summary>
        public List<SiteMenu_Item> SiteMenu_Item { get; set; } = [];
        /// <summary>
        /// 連結標題(多國語言)
        /// </summary>
        public List<SiteMenu_Item_Title> SiteMenu_Item_Title { get; set; } = [];
        /// <summary>
        /// 超連結
        /// </summary>
        public List<SiteMenu_Item_Url> SiteMenu_Item_Url { get; set; } = [];
        /// <summary>
        /// 功能模組
        /// </summary>
        public List<SiteMenu_Item_Module> SiteMenu_Item_Module { get; set; } = [];
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_IndexModel:MasterDataModel
    {
        /// <summary>
        /// 首頁代碼
        /// </summary>
        [Key] public string ? SiteIndex { get; set; }
        /// <summary>
        /// Goole分析碼
        /// </summary>
        public string GoogleAnalytics { get; set; }
        /// <summary>
        /// 是否啟用站台
        /// </summary>
        public bool Enable { get; set; } = true;
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_IndexInfoModel : DetailRowModel
    {
        /// <summary>
        /// 首頁代碼
        /// </summary>
        [Key] public string? SiteIndex { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [Key] public int? RowId { get; set; }
        /// <summary>
        /// 語系
        /// </summary>
        public string? Lang { get; set; }
        /// <summary>
        /// 網站標題
        /// </summary>
        public string Title { get; set; }
        /// <summary>
        /// 網站描述
        /// </summary>
        public string Description { get; set; }
        /// <summary>
        /// Header
        /// </summary>
        public string? SiteHeader { get; set; }
        /// <summary>
        /// Footer
        /// </summary>
        public string? SiteFooter { get; set; }
        /// <summary>
        /// 網站關鍵字
        /// </summary>
        public string Keyword { get; set; }
    }
    /// <summary>
    /// 
    /// </summary>
    [Index(nameof(SiteIndex), nameof(FullUrl), IsUnique = true, Name = "UX_SiteMenu_Item_NaturalKey")]
    public class SiteMenu_Item:DetailRowModel
    {
        /// <summary>
        /// 主站Url，最主要的會是Empty，新的子站則是https://xxx.com/{SiteIndex}
        /// </summary>
        [Key] public string? SiteIndex { get; set; }
        /// <summary>
        /// url主鍵
        /// </summary>
        [Key]public int? ItemRowId { get; set; }
        /// <summary>
        /// 上層url外鍵(一定會跟著SiteIndex一起)
        /// </summary>
        public int? ParentRowId { get; set; }
        /// <summary>
        /// 當前頁面Url E.x.:AllNews
        /// </summary>
        public string? ItemSiteUrl { get; set; }
        /// <summary>
        /// 完整的Url，整個系統唯一值，後端賦值處理
        /// </summary>
        public string? FullUrl { get; set; }
        /// <summary>
        /// 層級
        /// </summary>
        public byte Level { get; set; }
        /// <summary>
        /// 順序(Key:同Parent底下做排序)
        /// </summary>
        public byte DisplayOrder { get; set; }
        /// <summary>
        /// 屬於function或是url連結?
        /// </summary>
        public MenuUrlType ItemType { get; set; } //Url Or Func
        /// <summary>
        /// 開啟分頁方式
        /// </summary>
        public WindowTarget WindowTarget { get; set; }
        /// <summary>
        /// 是否顯示在清單上
        /// </summary>
        public bool IsShowOnMenu { get; set; }
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_Item_Title : DetailRowModel
    {
        [Key] public string? SiteIndex { get; set; }
        [Key] public int? ItemRowId { get; set; }
        [Key] public int? RowId { get; set; }
        public string Lang { get; set; }
        public string Title { get; set; }
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_Item_Url : DetailRowModel
    {
        [Key] public string? SiteIndex { get; set; }
        [Key] public int? ItemRowId { get; set; }
        public MenuUrlType RedirectType { get; set; } //0:無, 1:外部,2:內部模型功能(直接轉FullUrl、但是是用下拉的看Title/Url)
        public string? RedirectUrl { get; set; }
    }
    /// <summary>
    /// 
    /// </summary>
    public class SiteMenu_Item_Module : DetailRowModel
    {
        [Key] public string? SiteIndex { get; set; }
        [Key] public int? ItemRowId { get; set; }
        public string? BannerId { get; set; }
        public string? ModuleProgId { get; set; } //功能代碼
        public string? ModuleOptions { get; set; }//動態參數，存Json格式
    }
    /// <summary>
    /// SiteMenu_Func參數
    /// </summary>
    public class ModuleOptions
    {
        /// <summary>
        /// 檔案室參數
        /// </summary>
        public class FileArchive
        {
            /// <summary>
            /// 類別
            /// </summary>
            public string Category { get; set; }
            /// <summary>
            /// 標籤
            /// </summary>
            public string Tag { get; set; }
            /// <summary>
            /// 樣式
            /// </summary>
            [AllowedEnum(ModuleDisplayStyle.None, ModuleDisplayStyle.List, ModuleDisplayStyle.Expand_Category, ModuleDisplayStyle.Expand_Tag)]
            public ModuleDisplayStyle Style { get; set; }
        }
        /// <summary>
        /// 相簿參數
        /// </summary>
        public class Gallery 
        {
            /// <summary>
            /// 類別
            /// </summary>
            public string Category { get; set; }
            /// <summary>
            /// 標籤
            /// </summary>
            public string Tag { get; set; }
            /// <summary>
            /// 樣式
            /// </summary>
            [AllowedEnum(ModuleDisplayStyle.None, ModuleDisplayStyle.List, ModuleDisplayStyle.Waterfall)]
            public ModuleDisplayStyle Style { get; set; }
        }
        /// <summary>
        /// 頁面參數
        /// </summary>
        public class PageManagement 
        {
            /// <summary>
            /// 對應頁面功能
            /// </summary>
            public string PageId { get; set; }
        }
        /// <summary>
        /// 公告參數
        /// </summary>
        public class Announcement 
        {
            /// <summary>
            /// 類別
            /// </summary>
            public string Category { get; set; }
            /// <summary>
            /// 標籤
            /// </summary>
            public string Tag { get; set; }
            /// <summary>
            /// 樣式
            /// </summary>
            [AllowedEnum(ModuleDisplayStyle.None, ModuleDisplayStyle.List, ModuleDisplayStyle.PictureList,ModuleDisplayStyle.QAList)]
            public ModuleDisplayStyle Style { get; set; }
        }
        /// <summary>
        /// 網路資源參數
        /// </summary>
        public class WebResource 
        {
            /// <summary>
            /// 類別
            /// </summary>
            public string Category { get; set; }
            /// <summary>
            /// 標籤
            /// </summary>
            public string Tag { get; set; }
            /// <summary>
            /// 樣式
            /// </summary>
            [AllowedEnum(ModuleDisplayStyle.None, ModuleDisplayStyle.List, ModuleDisplayStyle.PictureList, ModuleDisplayStyle.Youtube)]
            public ModuleDisplayStyle Style { get; set; }
        }
    }
}
