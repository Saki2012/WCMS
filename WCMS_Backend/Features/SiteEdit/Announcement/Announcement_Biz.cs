using Microsoft.AspNetCore.Mvc;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;

namespace WCMS.Features.SiteEdit.Announcement
{
    public class AnnouncementBiz(IRepositoryMapProvider repo) : BizService<AnnouncementSet>(repo), IBizService<AnnouncementSet>
    {
    }
}
