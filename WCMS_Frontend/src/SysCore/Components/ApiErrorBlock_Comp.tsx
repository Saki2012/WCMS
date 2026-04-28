import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";

export const ApiErrorBlock_Comp = (props: { title: string; env: ApiResponse<any> | null | undefined; }) =>
{
    const env = props.env;
    if (!env || env.IsSuccess) return null;
    return (
        <div role="alert" aria-live="polite" className="alert alert-danger">
            <div className="fw-bold">{props.title}</div>
            <ul className="mb-0">{(env.SysMessage ?? []).map((m, i) => <li key={i}>{`${m.MessageCode ?? ""}: ${m.Message ?? ""}`}</li>)}</ul>
        </div>
    );
};
