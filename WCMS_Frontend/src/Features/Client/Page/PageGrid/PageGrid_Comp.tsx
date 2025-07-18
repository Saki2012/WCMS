import SearchBarComp from '../../../../SysCore/Components/SearchBar/SearchBar_Comp'
import {Grid} from '../../../../SysCore/Components/Grid/Grid_Comp';
import type { IFETheme } from '../../Layout/Theme/ITheme';
import type { GridProps } from '../../../../SysCore/Components/Grid/Grid_Data';

export const PageGridComp =({style}:{style:IFETheme}) => {
  const col1 = {key:"1",title:"123"};
  const gridData:GridProps={
    columns: [
      col1,
    ],
    rows: [
      {
        cells:[{
        col:col1,
        content:"內文"
        },
        ]
      },
      {
        cells:[{
        col:col1,
        content:"內文2"
        },
        ]
      },
      {
        cells:[{
        col:col1,
        content:"內文3"
        },
        ]
      }
    ],
    CurrentPage:1,
    TotalPage:5,
  }
  return (
      <>
        <SearchBarComp></SearchBarComp>
        <Grid gridData={gridData} style={style.GridView} pageStyle={style.Paginator}></Grid>
      </>
    );
}