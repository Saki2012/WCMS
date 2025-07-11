import { useEffect, useState } from 'react'
import BreadCrumbComp from '../../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Comp'
import type {BreadCrumbData} from '../../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Data'
import {Classic_BETheme} from "../../../../../../Features/Server/Layout/Theme/ITheme"
import getBreadCrumbProvider from '../../../../../../Features/Server/Layout/Scaffold/Menu/BreadCrumb/BreadCrumb_Api'


const BreadCrumb=()=>{
    const [items, setItems] = useState<BreadCrumbData[]>([])
    useEffect(() => {
        getBreadCrumbProvider().getBreadCrumbList().then(setItems)
    }, [])

    return (
        <BreadCrumbComp items={items} theme={Classic_BETheme.BreadCrumb}></BreadCrumbComp>
    )
}

export default BreadCrumb