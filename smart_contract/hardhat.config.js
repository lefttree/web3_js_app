// https://eth-ropsten.alchemyapi.io/v2/-5ggii3UCZsGXfEbX-KZokeZjk4GW_3N

require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    ropsten: {
      url: "https://eth-ropsten.alchemyapi.io/v2/-5ggii3UCZsGXfEbX-KZokeZjk4GW_3N",
      accounts: ['886931a11e230816b503436700d353c494a1f2cb4616218fbca8467de39d84ed']
    }
  }
}