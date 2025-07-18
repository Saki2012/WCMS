import { useEffect, useState } from 'react'
import BreadCrumbComp from '../../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Comp'
import type {BreadCrumbData} from '../../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Data'
import type { IBETheme } from '../../../Theme/ITheme'
import getBreadCrumbProvider from '../../../../../../Features/Server/Layout/Scaffold/Menu/BreadCrumb/BreadCrumb_Api'


const BreadCrumb=({theme}:{theme:IBETheme})=>{
    const [items, setItems] = useState<BreadCrumbData[]>([])
    useEffect(() => {
        getBreadCrumbProvider().getBreadCrumbList().then(setItems)
    }, [])

    return (
        <BreadCrumbComp items={items} style={theme.BreadCrumb}></BreadCrumbComp>
    )
}

export default BreadCrumb