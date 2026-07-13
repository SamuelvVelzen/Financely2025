import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/splits/join/$token")({
  component: () => <Outlet />,
});
