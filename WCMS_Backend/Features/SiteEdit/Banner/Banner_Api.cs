using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Diagnostics;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;

namespace WCMS.Features.SiteEdit.Banner
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class BannerController: ApiDataController<BannerSet, BannerSet_DTO>{}
}
