import 'typescript'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FACTORY_ADDRESS: string
      PROVIDER_URL: string
      BLOCK_TIME_SECONDS: string
      WALLET_KEY: string
      BATCH_WITHDRAW_ADDRESS: string,
      POLL_PERIOD_MINUTES: string
    }
  }
}
