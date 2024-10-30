import type { NextConfig } from 'next'

declare global {
  type CustomNextConfig = NextConfig & {
    // Add any custom config options here
  }
}