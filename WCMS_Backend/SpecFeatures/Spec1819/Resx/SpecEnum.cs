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
}
