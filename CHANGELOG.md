# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.0.1](https://github.com/kleros/gtcr-action-bot/compare/v0.1.9...v1.0.1) (2020-07-21)


### Bug Fixes

* increase verbosity and continue instead of returning ([3451cdf](https://github.com/kleros/gtcr-action-bot/commit/3451cdf697990a9c92be9fe3e8ef62bd0aedb830))
* missing dispute check before execution ([d97f240](https://github.com/kleros/gtcr-action-bot/commit/d97f240eb6b0f0e05fe3b2c3695bcb9e1e72c580))
* typo and increase default poll time ([baaea4e](https://github.com/kleros/gtcr-action-bot/commit/baaea4ec213d300277ce0e1ee6e073db4f05185d))

## [1.0.0](https://github.com/kleros/gtcr-action-bot/compare/v0.1.9...v1.0.0) (2020-07-17)


### Bug Fixes

* missing dispute check before execution ([79a9d5e](https://github.com/kleros/gtcr-action-bot/commit/79a9d5e32c97d298d985bea6edb739c7123e3b58))

### [0.1.9](https://github.com/kleros/gtcr-action-bot/compare/v0.1.8...v0.1.9) (2020-07-11)


### Bug Fixes

* incorrect method call signature ([2f2f18f](https://github.com/kleros/gtcr-action-bot/commit/2f2f18f47e6d88b4ecf069977e74a3347f5f39ec))
* method call signature ([538a8bb](https://github.com/kleros/gtcr-action-bot/commit/538a8bb54716c925e80b6d2d8547eafebf11e9f4))

### [0.1.8](https://github.com/kleros/gtcr-action-bot/compare/v0.1.7...v0.1.8) (2020-07-11)


### Bug Fixes

* check for executed request before attempting to execute it ([862e2c9](https://github.com/kleros/gtcr-action-bot/commit/862e2c94383aba7960826439f12a07c74aec2f14))

### [0.1.7](https://github.com/kleros/gtcr-action-bot/compare/v0.1.6...v0.1.7) (2020-05-18)


### Features

* dont withdraw unless there is eth to withdraw ([71b70f8](https://github.com/kleros/gtcr-action-bot/commit/71b70f878a0ecb6b23014a1a23c8c0ec6301a1a2))


### Bug Fixes

* items with multiple requests not executing ([6b13d85](https://github.com/kleros/gtcr-action-bot/commit/6b13d851b676fa1d03732ff304d80a242e5b69a3))
* missing block interval ([3eec8a0](https://github.com/kleros/gtcr-action-bot/commit/3eec8a07b971e7a05805870c5f1065caa6483eaf))

### [0.1.6](https://github.com/kleros/gtcr-action-bot/compare/v0.1.5...v0.1.6) (2020-05-14)


### Bug Fixes

* incorrect nonce math ([5ee11c8](https://github.com/kleros/gtcr-action-bot/commit/5ee11c8a4168c2137058ba5ec8d056740d429d2b))

### [0.1.5](https://github.com/kleros/gtcr-action-bot/compare/v0.1.4...v0.1.5) (2020-05-14)


### Bug Fixes

* compile errors ([1df5554](https://github.com/kleros/gtcr-action-bot/commit/1df555493c98e99a4e70fe07dfa783d2a521b2b9))

### [0.1.4](https://github.com/kleros/gtcr-action-bot/compare/v0.1.3...v0.1.4) (2020-05-14)


### Bug Fixes

* disputed request should not return but continue ([7c02bcb](https://github.com/kleros/gtcr-action-bot/commit/7c02bcbf09fd30240b3a06c92862ed94c65d413f))
* handle getBlock returning null ([6987eac](https://github.com/kleros/gtcr-action-bot/commit/6987eac81f891070979643ca7eb4f864bea07a78))
* handle nonces manually when syncing for the first time ([919c912](https://github.com/kleros/gtcr-action-bot/commit/919c9124d7ab04edff21e0c0ec6dded8681260ed))
* remove unused parameter and update factory ([c512227](https://github.com/kleros/gtcr-action-bot/commit/c5122278ae63b7da67f07ee2fc8cacc4e1b189e6))

### [0.1.3](https://github.com/kleros/gtcr-action-bot/compare/v0.1.2...v0.1.3) (2020-04-16)


### Bug Fixes

* handle database object initialization ([8044593](https://github.com/kleros/gtcr-action-bot/commit/8044593bf0347d4d6ebdc2a90f740a0b3cf1c1f7))

### [0.1.2](https://github.com/kleros/gtcr-action-bot/compare/v0.1.1...v0.1.2) (2020-04-16)


### Bug Fixes

* race conditions, typos and verbosity ([eda2066](https://github.com/kleros/gtcr-action-bot/commit/eda2066c36e1f0535b67be7bcb7480437d10ebc6))
* various bugs and verbosity ([3e499df](https://github.com/kleros/gtcr-action-bot/commit/3e499df2a034c5ef0e475989e8e3a817ddd8b22d))

### 0.1.1 (2020-04-15)


### Features

* add listeners scaffolding ([330c82d](https://github.com/kleros/gtcr-action-bot/commit/330c82dc1339f93b04432ec2e6c39e2fb5badd81))
* add watcher and execute available requests ([05fe6a0](https://github.com/kleros/gtcr-action-bot/commit/05fe6a0621ea365176c2e809f76909e4c4912fa1))
* fetch requests from blockchain ([330d6e0](https://github.com/kleros/gtcr-action-bot/commit/330d6e035dabd689749f37635dddd602e83a2b9a))
* implement request-resolved handler ([4ca2aa6](https://github.com/kleros/gtcr-action-bot/commit/4ca2aa646fa368ca37d6d512367ae899686559f9))
* implement request-submitted handler ([9171572](https://github.com/kleros/gtcr-action-bot/commit/91715721c21fdd26ea67c279abb3fb361df22d36))
* initial commit ([8361b77](https://github.com/kleros/gtcr-action-bot/commit/8361b7786fbec67a90136b8524633a6598c52429))
* read env variables and remove uncofigured linters ([2d39773](https://github.com/kleros/gtcr-action-bot/commit/2d39773a75c211356aba9a7e06102ee2afaf171e))
* remove item from watchlist on request-resolved event ([5595363](https://github.com/kleros/gtcr-action-bot/commit/5595363dbcd36c6ce5242a2e3c63327a75f21380))
* scan blockchain for pending requests ([70b5a99](https://github.com/kleros/gtcr-action-bot/commit/70b5a99848358bf6a777f42ed6c069df5cfbee23))
