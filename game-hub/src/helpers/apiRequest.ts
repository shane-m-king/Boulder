export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || "Request failed");
  }

  return json.data as T;
}
