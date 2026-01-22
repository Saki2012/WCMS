// src/Components/QrCodeWithLogo_Comp.tsx
import { QRCodeCanvas } from "qrcode.react";
import { LangNavLink } from "@/SysCore/i18n/LangLink";

export interface IQrCodeWithLogoProps {
    value: string;
    size?: number;
    logoSrc?: string;
    logoSize?: number;
    ariaLabel?: string;

    enableLink?: boolean;                 // ✅ 是否可點擊
    linkTarget?: "_blank" | "_self";       // ✅ 另開/當前
}

export const QrCodeWithLogo_Comp = (props: IQrCodeWithLogoProps) => {
    // 宣告變數
    const size = props.size ?? 120;
    const logoSize = props.logoSize ?? Math.floor(size * 0.2);
    const ariaLabel = props.ariaLabel ?? "DOI QR Code";
    const enableLink = props.enableLink ?? true;
    const linkTarget = props.linkTarget ?? "_blank";
    const linkTo = props.value ?? "";

    // 執行 function
    const renderQr = () => (
        <div role="img" aria-label={ariaLabel}>
            <QRCodeCanvas
                value={props.value ?? ""}
                size={size}
                level="M"
                includeMargin={true}
                imageSettings={
                    props.logoSrc
                        ? { src: props.logoSrc, height: logoSize, width: logoSize, excavate: true }
                        : undefined
                }
            />
        </div>
    );

    // return
    if (!enableLink || !linkTo) return renderQr();

    return (
        <LangNavLink
            to={linkTo}
            target={linkTarget}
            rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
            aria-label={ariaLabel}
            style={{ display: "inline-flex" }}
        >
            {renderQr()}
        </LangNavLink>
    );
};
