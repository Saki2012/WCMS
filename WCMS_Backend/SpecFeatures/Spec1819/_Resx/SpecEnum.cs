using WCMS.Features._Resx;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SpecFeatures.Spec1819._Resx;

/// <summary>
/// 說明檔案類型
/// </summary>
public enum SpecDocumentType:byte
{
    /// <summary>
    /// 無
    /// </summary>
    [LibDesc(ModelDisplayName.Common_None)] None = 0,
    /// <summary>
    /// 勘誤
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_Errata)] Errata = 1,
    /// <summary>
    /// 校正
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_Correction)] Correction = 2,
    /// <summary>
    /// 公告事項
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_Announcements)] Announcements = 3,
    /// <summary>
    /// 倫理聲明
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_Ethics_Statement)] Ethics_Statement = 4,
}
/// <summary>
/// 期刊作者類型
/// </summary>
public enum SpecAuthorType : byte
{
    /// <summary>
    /// 期刊作者
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JournalAuthor)] JournalAuthor = 0,
    /// <summary>
    /// 通訊作者
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_CommunicateAuthor)]CommunicateAuthor=1,
}
