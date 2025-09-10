using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data;
using WCMS.Features.SiteEdit.Banner;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;

namespace WCMS.Features.SiteEdit.Tag
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class TagController : ApiDataController<TagSet,TagSet_DTO>
    {
        
    }

}
