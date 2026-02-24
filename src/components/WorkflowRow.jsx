import { useNavigate } from "react-router-dom";

export default function WorkflowRow() {
  const navigate = useNavigate();

  return (
    <tr
      onClick={() => navigate("/workflows/1")}
      className="hover:bg-slate-50 cursor-pointer"
    >
      <td className="px-6 py-4 font-medium text-indigo-600">
        Employee Onboarding
      </td>
      <td className="px-6 py-4">
        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
          Active
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="text-xs mb-1">6 / 10 tasks</div>
        <div className="h-2 w-32 bg-slate-200 rounded-full">
          <div className="h-2 w-[60%] bg-indigo-600 rounded-full" />
        </div>
      </td>
      <td className="px-6 py-4 text-slate-500">
        2 hours ago
      </td>
    </tr>
  );
}