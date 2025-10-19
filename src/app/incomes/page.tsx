export default function IncomesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Incomes</h1>
        <p className="text-text-muted">
          Track and manage your income sources here.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-[2rem] p-8">
        <p className="text-text-muted text-center">
          No income entries yet. Start by adding your first income source.
        </p>
      </div>
    </div>
  );
}
