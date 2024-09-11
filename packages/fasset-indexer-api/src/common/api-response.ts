import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"


export class ApiError {
  @ApiPropertyOptional()
  className?: string

  @ApiPropertyOptional()
  fieldErrors?: { [key: string]: string }
}

export class ApiResponse<T> {
  data?: T

  @ApiPropertyOptional()
  error?: string

  @ApiProperty()
  status: number

  @ApiPropertyOptional()
  validationErrorDetails?: ApiError

  constructor(data: T, status: number, error?: string) {
    this.status = status
    this.data = data
    this.error = error
  }
}

function replaceBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return obj.toString()
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) {
    return obj.map(replaceBigInts)
  }
  const newObj: any = {}
  Object.keys(obj).forEach(key => {
    newObj[key] = replaceBigInts(obj[key])
  })
  return newObj
}

export async function apiResponse<T>(action: Promise<T>, status: number, sanitize = true): Promise<ApiResponse<T>> {
  try {
    let resp = await action
    //@ts-ignore
    if (typeof resp.toJSON === 'function') {
      // @ts-ignore
      resp = replaceBigInts(resp.toJSON())
    }
    return new ApiResponse<T>(resp, status)
  } catch (reason) {
    if (sanitize) {
      const message = reason instanceof Error && reason.message ? reason.message : "Server error"
      return new ApiResponse<T>(undefined, 500, message)
    }
    return new ApiResponse<T>(undefined, 500, String(reason))
  }
}
