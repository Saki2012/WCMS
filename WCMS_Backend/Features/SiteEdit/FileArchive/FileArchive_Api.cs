using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Data;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.FileArchive
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class FileArchiveController : ApiDataController<FileArchiveSet, FileArchiveSet_DTO>{}
}
