using static WCMS.SysCore.Enum.SysEnum;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using System.Security.AccessControl;
using WCMS.SysCore.Model;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.Announcement
{
    /// <summary>
    /// 廣告輪播功能模型
    /// </summary>
    [LibDesc]
    public class AnnouncementSet
    {
        [LibDesc] public AnnouncementModel Announcement { get; set; } = new AnnouncementModel();
    }
    /// <summary>
    /// 廣告輪播主表
    /// </summary>
    [LibDesc]
    public class AnnouncementModel: MasterDataModel
    {
        /// <summary>
        /// 企業編號
        /// </summary>
        [LibDesc, Key] public string CustomerCode { get; set; }
    }
}
