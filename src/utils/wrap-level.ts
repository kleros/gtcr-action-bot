// Wrap level.get and level.put to parse and stringify JSON values.
export default function wrapLevel(db: Level) {
  return ({
    get: async (key: string) => JSON.parse(await db.get(key)),
    put: async (key: string, value: object) => db.put(key, JSON.stringify(value))
  })
}
