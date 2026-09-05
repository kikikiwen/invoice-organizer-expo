import * as FileSystem from "expo-file-system/legacy";

export async function listDirectoryFiles(
  folderUri: string,
  extensions: Set<string>,
): Promise<string[]> {
  const entries = await FileSystem.readDirectoryAsync(folderUri);
  return entries
    .filter((entry) =>
      extensions.has(entry.split(".").pop()?.toLowerCase() ?? ""),
    )
    .sort((left, right) => right.localeCompare(left))
    .map((entry) => `${folderUri}${entry}`);
}
