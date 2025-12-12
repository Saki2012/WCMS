using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.Features.SiteEdit.Tag
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class TagController : ApiDataController<TagSet,TagSet_DTO>
    {
        
    }

}
