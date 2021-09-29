import 'typescript'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FACTORY_ADDRESS: string
      PROVIDER_URL: string
      BLOCK_TIME_SECONDS: string
      WALLET_KEY: string
      BATCH_WITHDRAW_ADDRESS: string,
      POLL_PERIOD_MINUTES: string,
      LFACTORY_ADDRESS: string,
      LBATCH_WITHDRAW_ADDRESS: string
      GTCR_SUBGRAPH_URL: string
    }
  }
}
