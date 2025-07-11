using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.Features.SiteEdit.Tag
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class TagController(IBizService<TagSet> service) : ApiDataController<TagSet>(service)
    {
    }
}
