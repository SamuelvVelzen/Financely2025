export default function ExpensesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Expenses</h1>
        <p className="text-text-muted">Track and manage your expenses here.</p>
      </div>

      <div className="bg-surface border border-border rounded-[2rem] p-8">
        <p className="text-text-muted text-center">
          No expenses yet. Start by adding your first expense.
        </p>
      </div>
    </div>
  );
}
