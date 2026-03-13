using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SpecFeatures.Spec1819.Resx
{
    /// <summary>
    /// 
    /// </summary>
    [LibDesc()]
    public enum PublishStatus : byte
    {
        [LibDesc(SpecModelDisplayName.Spec_PublishStatus_Unpublished)] Unpublished = 0,
        [LibDesc(SpecModelDisplayName.Spec_PublishStatus_Published)] Published = 1,
        //[LibDesc()] Archived = 2
    }
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

}
