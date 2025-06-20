using WCMS.SysCore;

namespace WCMS.Features.SiteEdit.Announcement
{
    public class AnnouncementAPIService: BizService<AnnouncementSet>
    {
        public AnnouncementAPIService(BasicRepository<AnnouncementSet> repo) : base(repo){ }
    }
}
