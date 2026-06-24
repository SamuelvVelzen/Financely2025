import { createLink, type LinkComponentProps } from "@tanstack/react-router";
import { BasicLinkComponent } from "./basic-link";

export const BaseLink = createLink(BasicLinkComponent);

export type IBaseLinkProps = LinkComponentProps<typeof BasicLinkComponent>;
