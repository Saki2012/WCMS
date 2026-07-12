using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;

namespace WCMS.Features.WEB.SiteMenuSetting;

/// <summary>
/// 連結方式
/// </summary>
public enum MenuUrlType : byte
{
    /// <summary>
    /// 外部連結
    /// </summary>
    [LibDesc(DisplayName.Enum_Url)] Url = 1,
    /// <summary>
    /// 內部連結
    /// </summary>
    [LibDesc(DisplayName.Enum_Module)] Module = 2,
}
/// <summary>
/// 模型頁面樣式
/// </summary>
public enum ModulePageType : byte
{
    /// <summary>
    /// 側欄選單版型
    /// </summary>
    [LibDesc(DisplayName.Enum_SidebarMenu)] SidebarMenu = 0,
    /// <summary>
    /// 滿版內容版型
    /// </summary>
    [LibDesc(DisplayName.Enum_FullContent)] FullContent = 1,
}
/// <summary>
/// 模型功能顯示方式
/// </summary>
public enum ModuleDisplayStyle : byte
{
    /// <summary>
    /// 清單列表式
    /// </summary>
    [LibDesc(DisplayName.Enum_List)] List = 1,
    /// <summary>
    /// 圖文式
    /// </summary>
    [LibDesc(DisplayName.Enum_PictureList)] PictureList = 2,
    /// <summary>
    /// QA列表式
    /// </summary>
    [LibDesc(DisplayName.Enum_QAList)] QAList = 3,
    /// <summary>
    /// 瀑布式
    /// </summary>
    [Obsolete, LibDesc(DisplayName.Enum_Waterfall)] Waterfall = 4,
    /// <summary>
    /// 展開式(類別)
    /// </summary>
    [Obsolete, LibDesc(DisplayName.Enum_Expand_Category)] Expand_Category = 5,
    /// <summary>
    /// 展開式(標籤)
    /// </summary>
    [Obsolete, LibDesc(DisplayName.Enum_Expand_Tag)] Expand_Tag = 6,
    /// <summary>
    /// Youtube
    /// </summary>
    [Obsolete, LibDesc(DisplayName.Enum_Youtube)] Youtube = 7,
    /// <summary>
    /// 歷史時間軸
    /// </summary>
    [LibDesc(DisplayName.Enum_TimelineSlider)] TimelineSlider = 8,
}