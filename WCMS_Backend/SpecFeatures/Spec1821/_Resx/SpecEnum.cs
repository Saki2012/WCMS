using WCMS.Features.WEB.Announcement;
using WCMS.Features.WEB.FileArchive;

namespace WCMS.SpecFeatures.Spec1821._Resx;

/// <summary>
/// 招生首頁模組類型
/// </summary>
public enum SpecHomePageModuleType : byte
{
    /// <summary>
    /// 公告
    /// </summary>
    [LibDesc(SpecModelDisplayName.ModuleType_Announcement)] Announcement = 1,
    /// <summary>
    /// 檔案室
    /// </summary>
    [LibDesc(SpecModelDisplayName.ModuleType_FileArchive)] FileArchive = 2,
}
