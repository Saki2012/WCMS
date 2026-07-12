namespace WCMS.SysCore.Auditing.ErrorHandling;

public class BusinessException(string message) : Exception(message)
{
}
