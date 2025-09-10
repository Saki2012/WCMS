using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Data;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.Features.SiteEdit.FileArchive;
using WCMS.Features.SiteEdit.Gallery;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.SiteEdit.Gallery
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class GalleryController : ApiDataController<GallerySet, GallerySet_DTO>{}
}
