const UniqGenerator = artifacts.require("UniqGenerator");
const ERC20TestToken = artifacts.require("ERC20TestToken");

const secret = require("../secret.json");

const { soliditySha3, BN } = require("web3-utils");
const { account_private_keys } = require("../keys.json");
const { assert } = require("chai");

contract("UniqGenerator", (accounts) => {
    var uniqgenerator_contract;
    var mytoken_contract;

    const tokenIds = [
        "0x222222229bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174612",
        "0x222222229bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174613",
        "0x222222229bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174614",
        "0x222222229bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174615",
        "0x222222229bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654174616",
    ];
    before(async () => {
        uniqgenerator_contract =  await UniqGenerator.new(
            "https://test.com/baseuris/",
            "UniqGenerator",
            "UniqG",
            accounts[0],
            secret.proxyRegistry,
            1500
        )

        mytoken_contract = await ERC20TestToken.new({ from: accounts[0] });

        await uniqgenerator_contract.setTokenAddress(mytoken_contract.address);
    });

    describe("recoverERC20", () => {
        it("not working if nothing to recover", async () => {
            let thrownError;

            try{
                await uniqgenerator_contract.recoverERC20(mytoken_contract.address)
            } catch (error) {
                thrownError = error;
            }

            assert.include(thrownError.message, "Nothing to recover");
        })

        it("Works fine with normal flow", async () => {
            let thrownError;

            await mytoken_contract.approve(uniqgenerator_contract.address, 5000)
            await uniqgenerator_contract.payForVerification(
                tokenIds[0], 
                {from: accounts[0]}
            );

            await uniqgenerator_contract.recoverERC20(mytoken_contract.address)

            assert.equal(await mytoken_contract.balanceOf(uniqgenerator_contract.address), 0);
        })
    });

    describe("payForVerification", () => {
        it("not working if already minted", async () => {
            let thrownError;
    
            const contractAddressTokenIdSha = soliditySha3(
                accounts[0],
                tokenIds[0]
            );

            //sign we do in the backend.
            const {signature} = web3.eth.accounts.sign(
                contractAddressTokenIdSha,
                account_private_keys[0]
            );
            
            await uniqgenerator_contract.mintVerified(tokenIds[0], signature, {from: accounts[0]});
            try{
                await uniqgenerator_contract.payForVerification(tokenIds[0],{from: accounts[0]})
            } catch (error) {
                thrownError = error;
            }
            assert.include(thrownError.message, "Already minted");
        });

        it("not working if verification already requested", async () => {
            let thrownError;

            await mytoken_contract.approve(uniqgenerator_contract.address, 5000)
            await uniqgenerator_contract.payForVerification(
                tokenIds[1], 
                {from: accounts[0]}
            );
            try{
                await uniqgenerator_contract.payForVerification(tokenIds[1],{from: accounts[0]})
            } catch (error) {
                thrownError = error;
            }
            assert.include(thrownError.message, "Verification already requested");
        });

        it("Works fine with normal flow", async () => {
            let thrownError;
    
            await mytoken_contract.approve(uniqgenerator_contract.address, 5000)
            await uniqgenerator_contract.payForVerification(
                tokenIds[2], 
                {from: accounts[0]}
            );
            
            assert.equal(await uniqgenerator_contract.verificationRequester(tokenIds[2]), accounts[0]);
        });
    });

    describe("mintVerified", () => {
        it("not working if verification Requester mismatch", async () => {
            const contractAddressTokenIdSha = soliditySha3(
                accounts[1],
                tokenIds[0]
            );

            //sign we do in the backend.
            const {signature} = web3.eth.accounts.sign(
                contractAddressTokenIdSha,
                account_private_keys[0]
            );

            try{
                await uniqgenerator_contract.mintVerified(tokenIds[0], signature, {from: accounts[1]});
            } catch (error) {
                thrownError = error;
            }
            assert.include(thrownError.message, "Verification Requester mismatch");
        })

        it("not working if already minted", async () => {
            const contractAddressTokenIdSha = soliditySha3(
                accounts[0],
                tokenIds[0]
            );

            //sign we do in the backend.
            const {signature} = web3.eth.accounts.sign(
                contractAddressTokenIdSha,
                account_private_keys[0]
            );

            try{
                await uniqgenerator_contract.mintVerified(tokenIds[0], signature, {from: accounts[0]});
            } catch (error) {
                thrownError = error;
            }
            assert.include(thrownError.message, "Already minted");
        })

        it("not working if signature mismatch", async () => {
            try{
                await uniqgenerator_contract.mintVerified(
                    tokenIds[1], 
                    "0x1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", 
                    {from: accounts[0]}
                );
            } catch (error) {
                thrownError = error;
            }
            assert.include(thrownError.message, "Signature mismatch");
        })

        it("Works fine with normal flow", async () => {
            const contractAddressTokenIdSha = soliditySha3(
                accounts[0],
                tokenIds[1]
            );

            //sign we do in the backend.
            const {signature} = web3.eth.accounts.sign(
                contractAddressTokenIdSha,
                account_private_keys[0]
            );

            await uniqgenerator_contract.mintVerified(
                tokenIds[1], 
                signature,
                {from: accounts[0]}
            );

            assert.equal(await uniqgenerator_contract.isMintedForHash(tokenIds[1]), true);
        })
    });

    describe("getVerificationPrice", () => {
        it("Works fine with normal flow", async () => {
            await uniqgenerator_contract.editVerificationPrice(1600);
            assert.equal(await uniqgenerator_contract.getVerificationPrice(), 1600)
        })
    });
});