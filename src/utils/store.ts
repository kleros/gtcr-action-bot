// Wrap level.get and level.put to parse and stringify JSON values.
export default class Store {
  private readonly db: Level;
  private readonly key: string;
  constructor(db: Level, key: string) {
    this.db = db;
    this.key = key;
  }

  async getDB() {
    let dbState: { [tcrAddress: string]: { [itemID: string]: number } } = {};
    try {
      dbState = JSON.parse(await this.db.get(this.key));
    } catch (err) {
      if (err.type !== "NotFoundError") throw new Error(err);
      // No-op, we just return an empty object which will be
      // saved on put.
    }
    return dbState;
  }

  async addToWatchlist(
    tcrAddress: string,
    itemID: string,
    challengePeriodEnd: number
  ) {
    const tcrState = await this.getTCR(tcrAddress);
    tcrState[itemID] = challengePeriodEnd;
    await this.putTCR(tcrAddress, tcrState);
  }

  async removeFromWatchlist(tcrAddress: string, itemID: string) {
    const tcrState = await this.getTCR(tcrAddress);
    delete tcrState[itemID];
    await this.putTCR(tcrAddress, tcrState);
  }

  private async putDB(dbState: object) {
    this.db.put(this.key, JSON.stringify(dbState));
  }

  private async getTCR(tcrAddress: string) {
    const dbState: { [tcrAddress: string]: { [itemID: string]: number } } =
      await this.getDB();
    return dbState[tcrAddress] || {};
  }

  private async putTCR(
    tcrAddress: string,
    tcrState: { [tcrAddress: string]: number }
  ) {
    const dbState = await this.getDB();
    dbState[tcrAddress] = tcrState;
    await this.putDB(dbState);
  }
}
