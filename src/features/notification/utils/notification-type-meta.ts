import type { INotificationType } from "@/features/shared/validation/enums";
import type { IconType } from "@/features/ui/icons/icon-type";
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
} from "react-icons/hi2";

export const NOTIFICATION_TYPE_META: Record<
  INotificationType,
  {
    label: string;
    icon: IconType;
    iconClassName: string;
    accentClassName: string;
  }
> = {
  INFO: {
    label: "Info",
    icon: HiOutlineInformationCircle,
    iconClassName: "text-info",
    accentClassName: "bg-info",
  },
  SUCCESS: {
    label: "Success",
    icon: HiOutlineCheckCircle,
    iconClassName: "text-success",
    accentClassName: "bg-success",
  },
  WARNING: {
    label: "Warning",
    icon: HiOutlineExclamationTriangle,
    iconClassName: "text-warning",
    accentClassName: "bg-warning",
  },
  ERROR: {
    label: "Error",
    icon: HiOutlineExclamationCircle,
    iconClassName: "text-danger",
    accentClassName: "bg-danger",
  },
};
