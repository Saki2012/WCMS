import type { Lang } from "@/SysCore/i18n/lang";

// #region Property
export interface LibLightBoxSlide { src: string; title?: string; description?: string; download?: string; }


export interface LibLightBoxProps {
    open: boolean;
    index: number;
    slides: LibLightBoxSlide[];
    lang?: Lang;
    onClose: () => void;
}


export interface LibLightBoxRootStyle { [key: `--yarl__${string}`]: string | number; }
// #endregion
