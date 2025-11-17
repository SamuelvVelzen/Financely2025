"use client";

import { IPropsWithClassName } from "@/util/type-helpers/props";
import { ReactNode } from "react";
import { Button } from "../button/button";
import { Container } from "./container";

type IEmptyPageProps = {
  emptyText: string;
  icon?: ReactNode;
  button?: { buttonText: string; buttonAction: () => void };
} & IPropsWithClassName;

export function EmptyContainer({
  className = "",
  emptyText,
  button,
  icon,
}: IEmptyPageProps) {
  return (
    <Container
      className={
        "flex flex-col gap-6 text-text-muted items-center " + className
      }>
      {icon && <div className="text-7xl border-4 p-2 rounded-full">{icon}</div>}

      <p>{emptyText}</p>

      {button && (
        <Button clicked={() => button.buttonAction()}>
          {button.buttonText}
        </Button>
      )}
    </Container>
  );
}
