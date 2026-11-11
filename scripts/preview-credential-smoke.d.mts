export function validatePreviewCredentialEnvironment(
  env: Record<string, string | undefined>,
): string[];

export function runPreviewCredentialSmoke(
  env: NodeJS.ProcessEnv,
  args?: string[],
): number;
