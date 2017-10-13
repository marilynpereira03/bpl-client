# bpl-client
CLI client for bpl blockchain.
You can connect to devnet, mainnet or your custom private/public bpl-derived blockchain

Featuring:
- connection to network or a node
- get stats of network
- create or get status of account
- create vanity accounts (multi-cpu supported)
- send amount in USD, EUR or other FIAT currency at the market price (BPL only)
- create delegate, vote for delegate
- sign and verify message using your address.

# Installation
You need to have node installed. Then
```
$> npm install -g 
$> bpl-client
  ____  _____  _      
 |  _ \|  __ \| |     
 | |_) | |__) | |     
 |  _ <|  ___/| |     
 | |_) | |    | |____ 
 |____/|_|    |______|
                      
bpl>
```

# Usage
```
bpl> help

  Commands:

    help [command...]                     Provides help for a given command.
    exit                                  Exits application.
    connect <network>                     Connect to network. Network is devnet or mainnet
    connect node <url>                    Connect to a server. For example "connect node 5.39.9.251:4000"
    disconnect                            Disconnect from server or network
    network stats                         Get stats from network
    account status <address>              Get account status
    account vote <name>                   Vote for delegate <name>. Remove previous vote if needed. Leave empty to clear vote
    account send <amount> <recipient>     Send <amount> bpl to <recipient>. <amount> format examples: 10, USD10.4, EUR100
    account delegate <username>           Register new delegate with <username>
    account create                        Generate a new random cold account
    account vanity <string>               Generate an address containing lowercased <string> (WARNING you could wait for long)
    message sign <message>                Sign a message
    message verify <message> <publickey>  Verify the <message> signed by the owner of <publickey> (you will be prompted to provide the signature)
    shBPL                                 No you don't want to use this command
```



```
bpl> connect mainnet
Node: 54.183.132.15:4001, height: 4092
bpl mainnet>
```

```
bpl mainnet> account create
Seed    - private: artist is leader museum solid expect better gather device subject royal lounge
WIF     - private: doQp9Y58MUi9uBfrMpu197Rf5JJfLATX6aCbEyGbzaXmc*****
Address - public : BBRxfCmaHpc7aJfLXAuQbV9mRp6G6uvDhZ
```

```
bpl mainnet> account send 100 BBRxfCmaHpc7aJfLXAuQbV9mRp6G6uvDhZ
passphrase: ************************************************************************
Transaction sent successfully with id 7adbf890c88dd345eacbac63e94610fa5f3905528cdc1c36740c3ba3fa3db302
```

```
bpl mainnet> account delegate cyrus
passphrase: **************************************************************************
Transaction sent successfully with id b857f302611e4f36a33ea886f7bcb951633406ba1f5e40393893234a46ce54eb
```

```
bpl mainnet> account status BDChAoNqWjArVi9DzPFshNrGmCqMB66aCa

.------------------------------------------------------------------------------------------------------------------------.
|   unconfirmedBalance    |         balance         |                             publicKey                              |
|-------------------------|-------------------------|--------------------------------------------------------------------|
| 987447388120.2299079219 | 987447388120.2299079219 | *****************************************************************  |
'------------------------------------------------------------------------------------------------------------------------'
.------------------------------------------------------------------------------------------.
|                                         Delegate                                         |
|------------------------------------------------------------------------------------------|
| username |     vote     | producedblocks | missedblocks | rate | approval | productivity |
|----------|--------------|----------------|--------------|------|----------|--------------|
| cyrus     | 997342166169 |             11 |            0 |   34 |     0.04 |          100 |
```

## Authors
- Raj Singh <rsingh@blockpool.io>
- Brandon Cook <bcook@blockpool.io>
- FX Thoorens <fx@ark.io>
- Guillaume Verbal <doweig@ark.io>

# License
Copyright © 2017 Blockpool | Copyright © 2017 FX Thoorens

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
