import { useId, useMemo, useState } from 'react';
import type { ILibTextBoxProp } from './LibTextBox_Data';

interface ILibPwdTextBoxProp extends ILibTextBoxProp {
    InputName?: string;
    AutoComplete?: string;
    PreventAutoFill?: boolean;
}

const LibPwdTextBox = (prop: ILibPwdTextBoxProp) => {
    // 控制顯示/隱藏密碼
    const [showPwd, setShowPwd] = useState(false);

    // 防止瀏覽器自動填入：先 readonly，使用者 focus 後才解鎖
    const [isReadOnly, setIsReadOnly] = useState<boolean>(prop.PreventAutoFill ?? true);

    // AA：label 對應 input
    const inputId = useId();

    // 產生穩定且可用的 name（避免被猜成 password/username）
    const inputName = useMemo(() => {
        const raw = prop.InputName ?? `wcms-pwd-${inputId}`;
        return raw.replace(/[^a-zA-Z0-9_-]/g, '');
    }, [prop.InputName, inputId]);

    // 預設關掉 autocomplete（Chrome 仍可能忽略，但配合 readonly 通常會有效）
    const autoComplete = prop.AutoComplete ?? 'off';

    const onUnlock = () => {
        // 解除 readonly，讓使用者可以輸入
        if (isReadOnly) setIsReadOnly(false);
    };

    const onTogglePwd = () => {
        // 切換顯示/隱藏
        setShowPwd(v => !v);
    };

    return (
        <>
            <label htmlFor={inputId} className={prop.Style.Labelstyle}>
                {prop.ColumnDisplayName}
            </label>

            <div className={prop.Style.SelectStyle} style={{ position: 'relative' }}>
                <input
                    id={inputId}
                    name={inputName}
                    type={showPwd ? 'text' : 'password'}
                    className={prop.Style.InputStyle}
                    style={{ paddingRight: 40 }}
                    placeholder={`${prop.DefaultInputDisplay}${prop.ColumnDisplayName} ...`}
                    disabled={prop.disabled ?? false}
                    autoComplete={autoComplete}
                    readOnly={isReadOnly}
                    onFocus={onUnlock}
                    onMouseDown={onUnlock}
                    value={prop.InputValue ?? ''}
                    onChange={(e) => prop.OnChange?.(e.target.value)}
                />

                <button
                    type="button"
                    className="eye-btn"
                    aria-label={showPwd ? '隱藏密碼' : '顯示密碼'}
                    aria-pressed={showPwd}
                    aria-controls={inputId}
                    onClick={onTogglePwd}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        right: 8,
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                    }}
                >
                    <span className="material-symbols-outlined">
                        {showPwd ? 'visibility' : 'visibility_off'}
                    </span>
                </button>
            </div>
        </>
    );
};

export default LibPwdTextBox;
