using WCMS.SysCore.FeatureDriver.Model.Contracts;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.FeatureDriver.Api.Contracts;

public class ApiResponse 
{
    public bool IsSuccess { get { foreach (var msg in SysMessage) if (msg.Status == MessageStatus.Error) return false; return true; } }
    public IList<SysMessageModel> SysMessage { get; set; } = [];
}
/// <summary>
/// 回應結果
/// </summary>
/// <typeparam name="T"></typeparam>
public class ApiResponse<T> : ApiResponse
{
    public IList<T>? Data { get; set; } = [];
}