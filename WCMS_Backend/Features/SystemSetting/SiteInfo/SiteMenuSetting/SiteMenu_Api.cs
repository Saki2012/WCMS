using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Data;
using System.Text.RegularExpressions;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SpecFeatures.T1810.SystemSetting;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SystemSetting.SiteInfo.SiteMenuSetting
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SiteMenuController : ApiDataController<SiteMenuSet, SiteMenuSet_DTO>
    {
    }

}
