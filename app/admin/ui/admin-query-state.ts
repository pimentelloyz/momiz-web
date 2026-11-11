export type AdminQueryState<T> =
  | { phase: "loading" }
  | { phase: "empty"; data: T }
  | { phase: "ready"; data: T }
  | { phase: "error"; error: unknown };

export async function runAdminQuery<T>(
  operation: () => Promise<T>,
  isEmpty: (data: T) => boolean = () => false,
): Promise<AdminQueryState<T>> {
  try {
    const data = await operation();
    return { phase: isEmpty(data) ? "empty" : "ready", data };
  } catch (error) {
    return { phase: "error", error };
  }
}
