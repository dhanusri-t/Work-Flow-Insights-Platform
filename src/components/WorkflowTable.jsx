import WorkflowRow from "./WorkflowRow";

export default function WorkflowTable() {
  return (
    <div className="bg-white rounded-2xl shadow">
      <div className="p-6 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">Workflows</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          + New Workflow
        </button>
      </div>

      <table className="w-full text-sm">
        <thead className="text-slate-500 bg-slate-50">
          <tr>
            <th className="text-left px-6 py-3">Workflow</th>
            <th className="text-left px-6 py-3">Status</th>
            <th className="text-left px-6 py-3">Progress</th>
            <th className="text-left px-6 py-3">Updated</th>
          </tr>
        </thead>
        <tbody>
          <WorkflowRow />
          <WorkflowRow />
          <WorkflowRow />
        </tbody>
      </table>
    </div>
  );
}