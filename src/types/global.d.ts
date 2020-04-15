declare module 'level'

interface BlockInterval {
  fromBlock: number
  toBlock: number
}

interface Level {
  get: Function
  put: Function
}