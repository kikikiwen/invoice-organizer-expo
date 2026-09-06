import { getStrings } from "../i18n/getStrings";

import { timestamp } from "./timestamp";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function invoiceDate(): string {
  const date = new Date();
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

const INVOICE_PDF_NAME = /^invoice_(\d{8})_(\d{3})\.pdf$/i;

export function parseInvoicePdfName(
  name: string,
): { date: string; sequence: number } | null {
  const match = name.match(INVOICE_PDF_NAME);
  if (!match) {
    return null;
  }
  return { date: match[1], sequence: Number(match[2]) };
}

export function photoFileName(): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${getStrings().filePrefix}_${timestamp()}_${suffix}.jpg`;
}

export function pdfFileName(sequence: number): string {
  const number = String(sequence).padStart(3, "0");
  return `invoice_${invoiceDate()}_${number}.pdf`;
}
