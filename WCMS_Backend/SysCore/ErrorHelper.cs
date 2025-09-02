using Microsoft.AspNetCore.Mvc;
using NLog;
using System;
using System.IO;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Model;
using static GraphQL.Validation.Rules.OverlappingFieldsCanBeMerged;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore
{
    public interface IErrorHelper
    {
        public IList<SysMessageModel> Messages { get; set; }
        public void AddMessage(MessageStatus status, string code);
    }
    public class ErrorHelper:IErrorHelper
    {
        public enum LogType { info, oprate, error }
        public IList<SysMessageModel> Messages { get; set; } = [];
        public void AddMessage(MessageStatus status, string code)
        {
            Messages.Add(new SysMessageModel()
            {
                Status=status,
                MessageCode=code,
                Message="多語系抓code",
            });

        }
    }
}
