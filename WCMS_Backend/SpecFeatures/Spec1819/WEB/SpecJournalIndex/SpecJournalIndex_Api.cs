using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;

namespace WCMS.SpecFeatures.Spec1819.WEB.SpecJournalIndex;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecJournalIndex, FuncAction.MasterData)]
public class SpecJournalIndexController : ApiDataController<SpecJournalIndex>{ }
