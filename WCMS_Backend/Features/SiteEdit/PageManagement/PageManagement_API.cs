using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data;
using WCMS.Features.SiteEdit.Category;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.SiteEdit.PageManagement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class PageManagementController : ApiDataController<PageManagementSet, PageManagementSet_DTO>{}
}
