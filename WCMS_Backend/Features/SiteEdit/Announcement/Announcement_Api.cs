using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Linq.Dynamic.Core;
using System.Text.Json.Serialization;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.SiteEdit.Announcement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class AnnouncementController : ApiDataController<AnnouncementSet,AnnouncementSet_DTO>{}
}

