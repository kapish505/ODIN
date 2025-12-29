import { QueryClient, QueryFunction } from "@tanstack/react-query";

// API configuration - relative path for proxy
const API_BASE_URL = "/api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Construct full URL
  let fullUrl = url;
  if (!url.startsWith("http")) {
    const cleanUrl = url.startsWith("/") ? url.substring(1) : url;
    // If API_BASE_URL is just '/api', we need to append
    fullUrl = url.startsWith("/api") ? url : `${API_BASE_URL}/${cleanUrl}`;
  }

  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      // Construct full URL
      const endpoint = queryKey.join("/");
      // If API_BASE_URL is just '/api', we need to append
      const fullUrl = endpoint.startsWith("http") ? endpoint : (endpoint.startsWith("/api") ? endpoint : `${API_BASE_URL}/${endpoint}`);

      const res = await fetch(fullUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
