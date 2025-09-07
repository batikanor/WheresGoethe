import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// https://env.t3.gg/docs/nextjs
export const env = createEnv({
  server: {
    NEYNAR_API_KEY: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    REDIS_URL: z.string().min(1),
    REDIS_TOKEN: z.string().min(1),
    IS_LOCAL_DEVELOPMENT: z.enum(["true", "false"]).optional().default("false"),
    // Comma-separated list of addresses allowed to build the mini app (Base Build)
    BASE_BUILDER_ALLOWED_ADDRESSES: z.string().optional().default(""),
    QUIZ_VERSION: z.string().optional().default("1"),
  },
  client: {
    NEXT_PUBLIC_URL: z.string().min(1),
    NEXT_PUBLIC_APP_ENV: z
      .enum(["development", "production"])
      .optional()
      .default("development"),
    NEXT_PUBLIC_MINIKIT_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_FARCASTER_HEADER: z.string().min(1),
    NEXT_PUBLIC_FARCASTER_PAYLOAD: z.string().min(1),
    NEXT_PUBLIC_FARCASTER_SIGNATURE: z.string().min(1),
    NEXT_PUBLIC_IS_LOCAL_DEVELOPMENT: z
      .enum(["true", "false"])
      .optional()
      .default("false"),
    NEXT_PUBLIC_QUIZ_VERSION: z.string().optional().default("1"),
    NEXT_PUBLIC_QUIZ_Q1_PROMPT: z.string().optional().default(""),
    NEXT_PUBLIC_QUIZ_Q1_LAT: z.string().optional().default(""),
    NEXT_PUBLIC_QUIZ_Q1_LNG: z.string().optional().default(""),
    NEXT_PUBLIC_QUIZ_Q2_PROMPT: z.string().optional().default(""),
    NEXT_PUBLIC_QUIZ_Q2_LAT: z.string().optional().default(""),
    NEXT_PUBLIC_QUIZ_Q2_LNG: z.string().optional().default(""),
    NEXT_PUBLIC_QUIZ_Q3_PROMPT: z.string().optional().default(""),
    NEXT_PUBLIC_QUIZ_Q3_LAT: z.string().optional().default(""),
    NEXT_PUBLIC_QUIZ_Q3_LNG: z.string().optional().default(""),
    NEXT_PUBLIC_GOLEMDB_RPC_URL: z.string().optional(),
    NEXT_PUBLIC_GOLEMDB_CONTRACT_ADDRESS: z.string().optional(),
    NEXT_PUBLIC_GOLEMDB_CHAIN_ID: z.string().optional(),
    NEXT_PUBLIC_GOLEMDB_CHAIN_NAME: z
      .string()
      .optional()
      .default("Golem Base L3 Testnet"),
    NEXT_PUBLIC_GOLEMDB_BTL: z.string().optional().default("300"),
    NEXT_PUBLIC_GOLEMDB_FROM_BLOCK: z.string().optional(),
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_MINIKIT_PROJECT_ID: process.env.NEXT_PUBLIC_MINIKIT_PROJECT_ID,
    NEXT_PUBLIC_FARCASTER_HEADER: process.env.NEXT_PUBLIC_FARCASTER_HEADER,
    NEXT_PUBLIC_FARCASTER_PAYLOAD: process.env.NEXT_PUBLIC_FARCASTER_PAYLOAD,
    NEXT_PUBLIC_FARCASTER_SIGNATURE:
      process.env.NEXT_PUBLIC_FARCASTER_SIGNATURE,
    NEXT_PUBLIC_IS_LOCAL_DEVELOPMENT:
      process.env.NEXT_PUBLIC_IS_LOCAL_DEVELOPMENT,
    NEXT_PUBLIC_QUIZ_VERSION: process.env.QUIZ_VERSION,
    NEXT_PUBLIC_QUIZ_Q1_PROMPT: process.env.NEXT_PUBLIC_QUIZ_Q1_PROMPT,
    NEXT_PUBLIC_QUIZ_Q1_LAT: process.env.NEXT_PUBLIC_QUIZ_Q1_LAT,
    NEXT_PUBLIC_QUIZ_Q1_LNG: process.env.NEXT_PUBLIC_QUIZ_Q1_LNG,
    NEXT_PUBLIC_QUIZ_Q2_PROMPT: process.env.NEXT_PUBLIC_QUIZ_Q2_PROMPT,
    NEXT_PUBLIC_QUIZ_Q2_LAT: process.env.NEXT_PUBLIC_QUIZ_Q2_LAT,
    NEXT_PUBLIC_QUIZ_Q2_LNG: process.env.NEXT_PUBLIC_QUIZ_Q2_LNG,
    NEXT_PUBLIC_QUIZ_Q3_PROMPT: process.env.NEXT_PUBLIC_QUIZ_Q3_PROMPT,
    NEXT_PUBLIC_QUIZ_Q3_LAT: process.env.NEXT_PUBLIC_QUIZ_Q3_LAT,
    NEXT_PUBLIC_QUIZ_Q3_LNG: process.env.NEXT_PUBLIC_QUIZ_Q3_LNG,
    NEXT_PUBLIC_GOLEMDB_RPC_URL: process.env.NEXT_PUBLIC_GOLEMDB_RPC_URL,
    NEXT_PUBLIC_GOLEMDB_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_GOLEMDB_CONTRACT_ADDRESS,
    NEXT_PUBLIC_GOLEMDB_CHAIN_ID: process.env.NEXT_PUBLIC_GOLEMDB_CHAIN_ID,
    NEXT_PUBLIC_GOLEMDB_CHAIN_NAME: process.env.NEXT_PUBLIC_GOLEMDB_CHAIN_NAME,
    NEXT_PUBLIC_GOLEMDB_BTL: process.env.NEXT_PUBLIC_GOLEMDB_BTL,
    NEXT_PUBLIC_GOLEMDB_FROM_BLOCK: process.env.NEXT_PUBLIC_GOLEMDB_FROM_BLOCK,
  },
});
