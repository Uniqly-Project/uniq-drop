# Uniqly Internal Smart Contracts

## UniqDrop 

### Kovan Testnet  

> #### Faucets
>
> 1. Testnet LINK is available from https://kovan.chain.link/
> 2. Testnet ETH is available from https://faucet.kovan.network/

LINK token contract address: 0xa36085F69e2889c224210F603D836748e7dC0088

VRF Coordinator: 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9

Key Hash: 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4

Fee: 0.1 LINK

### ETH Mainnet

LINK token contract address: 0x514910771af9ca656af840dff83e8264ecf986ca

VRF Coordinator: 0xf0d54349aDdcf704F77AE15b96510dEA15cb7952

Key Hash: 0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445

Fee: 2 LINK

Migration steps

-> initMint(50)
-> initMint(50)
-> startSale
-> colculateEthPriceForUniq(n)
-> mintUniqly(n) + eth
———
2. Prize flow
-> check if ETH balance of contract is > 0.1 
-> send LINK to contract
-> getRandom(random uint)
-> checkWin(id tokenu)
-> collectPrize(id tokenu)
——
3. Claim & burn flow
-> api request to admin to burn (owners address, token id, requestor name string) 
-> hash = getMessageHash(address, id, string)
-> signature = web3.accounts.sign(hash, owners privateKey)
-> burn(id, string, signature)

Testing scenarios

1. As an owner I must mint 100 tokens before sale and other users
2. As a user I am not able to start investing before an owner starts sale
3. As a user I need to know how much ETH I need to invest for the next N tokens before minting
4. As a user I am able to mint only from 1 to 30 tokens in one transaction
5. As a user I am not able to invest once the sale is over and max supply reached 10000
6. As a user I must get an array of my tokens
7. As an owner I am able to change BASE_URI many times
8. As an owner I am able to finally block possibility of changing the BASE_URI
9. As an owner I am able to withdraw all ETH invested by users
10. As an owner I collect 7,5% royalty fee for each transaction
————
11. As an owner I am able to draw a random number from VRF once sale is ended
12. As a user I can be a winner of lottery and I am able to check each of my token is the winner of the lottery 
    1. 20 / 10000 chance to be winner and based on VRF we have an array of tokens ids which won
    2. Only 10 people can withdraw money, for instance
        1. USER A has a 3 winner tokenIDs but he can withdraw the prize only once
13. As a user who has won I am able to get 1ETH from the contract as a prize
14. The contract has to be fulfilled at least 10 ETH to cover all prizes
————
15. As a user I am able to burn my own token
16. As a user I am able to claim and store some string(claimerName) in blockchain forever after burning the token
17. To burn a token, the owner agreement is needed based on generated signature 
