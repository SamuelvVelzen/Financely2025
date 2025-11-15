import { useMe } from "@/features/users/hooks/useUser";
import { HiChevronLeft } from "react-icons/hi2";
import { useSidebar } from "./useSidebar";

export function UserHeaderSidebar() {
  const { data: user, isLoading } = useMe();
  const { toggleSidebar } = useSidebar();

  if (isLoading) {
    return (
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-text mb-1 whitespace-nowrap">
          Loading...
        </h2>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-text mb-1 whitespace-nowrap">
          Hello {user?.name}
        </h2>
        <p className="text-sm text-text-muted whitespace-nowrap">
          {user?.email}
        </p>
      </div>
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex items-center justify-center w-8 h-8 rounded-2xl hover:bg-background motion-safe:transition-colors motion-safe:duration-300 flex-shrink-0 cursor-pointer"
        aria-label="Collapse sidebar">
        <HiChevronLeft className="w-5 h-5 text-text-muted" />
      </button>
    </>
  );
}
