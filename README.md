# wbx-client
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
$> wbx-client
 _       ____            _________            __ 
| |     / / /_  _  __   / ____/ (_)__  ____  / /_
| | /| / / __ \| |/_/  / /   / / / _ \/ __ \/ __/
| |/ |/ / /_/ />  <   / /___/ / /  __/ / / / /_  
|__/|__/_.___/_/|_|   \____/_/_/\___/_/ /_/\__/  

wbx>
```

# Usage
```
wbx> help

  Commands:

    help [command...]                     Provides help for a given command.
    exit                                  Exits application.
    connect <network>                     Connect to network. Network is devnet or mainnet
    connect node <url>                    Connect to a server. For example "connect node 5.39.9.251:4000"
    disconnect                            Disconnect from server or network
    network stats                         Get stats from network
    account status <address>              Get account status
    account vote <name>                   Vote for delegate <name>. Remove previous vote if needed. Leave empty to clear vote
    account send <amount> <recipient>     Send <amount> wbx to <recipient>. <amount> format examples: 10, USD10.4, EUR100
    account delegate <username>           Register new delegate with <username>
    account create                        Generate a new random cold account
    account vanity <string>               Generate an address containing lowercased <string> (WARNING you could wait for long)
    message sign <message>                Sign a message
    message verify <message> <publickey>  Verify the <message> signed by the owner of <publickey> (you will be prompted to provide the signature)
    shWBX                                 No you don't want to use this command
```



```
wbx> connect mainnet
Node: 54.183.132.15:4001, height: 4092
wbx mainnet>
```

```
wbx mainnet> account create
Seed    - private: addict correct merry celery pioneer betray glue inflict come start nose busy
WIF     - private: SGWGXizkr6xgqkCfnrUH194JdzqPkZMGBLSsyotZve8CUQaK1LiN
Address - public : WQxu1fFYqHbBx63oduwV5EVivX6f3Gnmqr
```

```
wbx mainnet> account send 100 WXiVw7q88TKSmw3w63vgH8vPZpm5LPRnrW
passphrase: ************************************************************************
Transaction sent successfully with id 7adbf890c88dd345eacbac63e94610fa5f3905528cdc1c36740c3ba3fa3db302
```

```
wbx mainnet> account delegate cyrus
passphrase: **************************************************************************
Transaction sent successfully with id b857f302611e4f36a33ea886f7bcb951633406ba1f5e40393893234a46ce54eb
```

```
wbx mainnet> account status WXiVw7q88TKSmw3w63vgH8vPZpm5LPRnrW

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
