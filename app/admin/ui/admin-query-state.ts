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

export type AdminMutationState =
  | { phase: "idle" }
  | { phase: "pending" }
  | { phase: "error"; error: unknown }
  | { phase: "success"; message: string };

export async function runAdminMutation(
  operation: () => Promise<void>,
  successMessage: string,
): Promise<AdminMutationState> {
  try {
    await operation();
    return { phase: "success", message: successMessage };
  } catch (error) {
    return { phase: "error", error };
  }
}
