import { getStrings } from "../i18n/getStrings";

import { timestamp } from "./timestamp";

export function photoFileName(): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${getStrings().filePrefix}_${timestamp()}_${suffix}.jpg`;
}

export function pdfFileName(): string {
  return `${getStrings().filePrefix}_${timestamp()}.pdf`;
}
