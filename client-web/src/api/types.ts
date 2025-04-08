export type Endpoint = string;
export type EndpointWithParam<T extends string> = `${string}/:${T}${string}`;

export interface RequestParams {
  [key: string]: string | number | boolean | undefined | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface ApiDataResponse<T> extends ApiResponse {
  data: T;
}

export interface ApiPaginatedResponse<T> extends ApiResponse {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiListResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message?: string;
  error?: string;
  statusCode?: number;
  details?: unknown;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
