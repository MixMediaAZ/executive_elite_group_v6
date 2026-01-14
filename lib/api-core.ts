/**
 * Pure API helpers with no auth/runtime coupling.
 *
 * Keep this file free of NextAuth / database imports so it is easy to test.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'

export interface ApiErrorResponse {
  error: string
  details?: unknown
  timestamp?: string
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return schema.parse(body)
}

export function successResponse<T>(
  data?: T,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json<ApiSuccessResponse<T>>(
    { success: true, data, message },
    { status: 200 }
  )
}

export function createdResponse<T>(
  data?: T,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json<ApiSuccessResponse<T>>(
    { success: true, data, message },
    { status: 201 }
  )
}

export function errorResponse(
  error: string,
  status: number = 500,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json<ApiErrorResponse>(
    { error, details, timestamp: new Date().toISOString() },
    { status }
  )
}

