function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function timestamp(): string {
  const date = new Date();
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}
