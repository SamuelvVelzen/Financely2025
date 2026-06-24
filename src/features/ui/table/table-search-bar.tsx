import { TextInput } from "@/features/ui/input/text-input";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { useTableSearchContext } from "./context/table-search-context";

export type ITableSearchBarProps = IPropsWithClassName & {
  placeholder?: string;
  showResultCount?: boolean;
};

export function TableSearchBar({
  className,
  placeholder = "Search...",
  showResultCount = true,
}: ITableSearchBarProps) {
  const searchContext = useTableSearchContext();

  if (!searchContext) {
    return null;
  }

  const {
    query,
    setQuery,
    filteredCount,
    totalCount,
    isSearching,
  } = searchContext;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <TextInput
        value={query}
        onChange={(value) => setQuery(String(value ?? ""))}
        placeholder={placeholder}
        prefixIcon={<HiMagnifyingGlass className="size-5" />}
        className="max-w-md"
      />
      {showResultCount && isSearching && (
        <span className="text-sm text-text-muted whitespace-nowrap">
          {filteredCount} of {totalCount}
        </span>
      )}
    </div>
  );
}
