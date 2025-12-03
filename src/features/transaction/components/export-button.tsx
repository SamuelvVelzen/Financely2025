import type { ITransaction } from "@/features/shared/validation/schemas";
import { exportTransactionsToCsv } from "@/features/transaction/utils/export-csv";
import { Button, IButtonProps } from "@/features/ui/button/button";
import { HiArrowUpTray } from "react-icons/hi2";

type IExportButtonProps = {
  data: ITransaction[];
  columns: string[];
  filename: string;
} & Omit<IButtonProps, "clicked" | "type">;

export function ExportButton({
  data,
  columns,
  filename,
  ...props
}: IExportButtonProps) {
  const handleExport = () => {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];
    exportTransactionsToCsv(data, columns, `${filename}_${date}-${time}`);
  };

  return (
    <Button clicked={handleExport} {...props}>
      <HiArrowUpTray className="size-6" /> Export
    </Button>
  );
}
