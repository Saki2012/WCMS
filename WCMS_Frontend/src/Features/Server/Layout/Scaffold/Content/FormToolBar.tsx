import { useFormContext } from './FormContext';

export const FormToolbar = () => {
  const { handleSave } = useFormContext();

  return (
    <div className="btn-toolbar">
      <button onClick={handleSave} className="btn btn-primary">儲存送出</button>
      <button className="btn btn-secondary">取消返回</button>
      <button className="btn btn-outline">預覽畫面</button>
    </div>
  );
};