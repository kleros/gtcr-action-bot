declare module "level";
declare module "node-fetch";

interface BlockInterval {
  fromBlock: number;
  toBlock: number;
}

interface Level {
  get: Function;
  put: Function;
}
