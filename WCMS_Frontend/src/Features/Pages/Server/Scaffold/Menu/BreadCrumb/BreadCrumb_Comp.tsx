import { useEffect, useState } from 'react'
import BreadCrumbComp from '@/SysCore/Components/BreadCrumb/BreadCrumb_Comp'
import type { BreadCrumbData } from '@/SysCore/Components/BreadCrumb/BreadCrumb_Data'
import type { IBETheme } from '@/Features/Pages/Server/Theme/ITheme'
import getBreadCrumbProvider from '@/Features/Pages/Server/Scaffold/Menu/BreadCrumb/BreadCrumb_Api'


const BreadCrumb = ({ theme }: { theme: IBETheme }) => {
    const [items, setItems] = useState<BreadCrumbData[]>([])
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const resp = await getBreadCrumbProvider().fetchList();
            const list = resp.Data ?? [];
            if (!cancelled) setItems(list);
        })().catch(console.error);
        return () => { cancelled = true; };
    }, []);

    return (
        <BreadCrumbComp items={items} style={theme.BreadCrumb}></BreadCrumbComp>
    )
}

export default BreadCrumb