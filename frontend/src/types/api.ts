export type PaginatedLinks = {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export type PaginatedMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: PaginatedMeta
  links: PaginatedLinks
}

export type ApiEnvelope<T> = {
  data: T
}

export type ApiErrorBody = {
  message: string
  errors?: Record<string, string[]>
}
