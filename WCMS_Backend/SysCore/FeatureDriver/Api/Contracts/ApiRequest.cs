namespace WCMS.SysCore.FeatureDriver.Api.Contracts;

/// <summary>
/// 
/// </summary>
/// <typeparam name="TFormModel"></typeparam>
public class ApiRequest<TFormModel>
{
    public string InternalId { get; set; }
    public TFormModel? Data { get; set; }
}