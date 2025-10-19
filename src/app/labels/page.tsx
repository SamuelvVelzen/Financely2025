export default function LabelsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Labels</h1>
        <p className="text-text-muted">
          Create and manage labels to categorize your transactions.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-[2rem] p-8">
        <p className="text-text-muted text-center">
          No labels yet. Create your first label to organize your finances.
        </p>
      </div>
    </div>
  );
}
