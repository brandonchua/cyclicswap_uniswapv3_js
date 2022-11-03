const { ethers } = require('ethers')
//import { ethers } from 'ethers';

require('dotenv').config()
//import {} from 'dotenv/config'

const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const WALLET_SECRET = process.env.WALLET_SECRET
const INFURA_TEST_URL = process.env.INFURA_TEST_URL

const { abi: V3SwapRouterABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')

const V3SwapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
const WETHAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';
const USDCAddress = '0x07865c6E87B9F70255377e024ace6630C1Eaa37F';
const UNIAddress = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';

const swapRouterContract = new ethers.Contract(
	V3SwapRouterAddress,
	V3SwapRouterABI
)

const provider = new ethers.providers.JsonRpcProvider(INFURA_TEST_URL)
const wallet = new ethers.Wallet(WALLET_SECRET)
const signer = wallet.connect(provider)

//Start - Copied from https://github.com/Uniswap/v3-periphery/blob/main/test/shared/path.ts
const FEE_SIZE = 3

function encodePath(path, fees) {
  if (path.length != fees.length + 1) {
    throw new Error('path/fee lengths do not match')
  }

  let encoded = '0x'
  for (let i = 0; i < fees.length; i++) {
    // 20 byte encoding of the address
    encoded += path[i].slice(2)
    // 3 byte encoding of the fee
    encoded += fees[i].toString(16).padStart(2 * FEE_SIZE, '0')
  }
  // encode the final token
  encoded += path[path.length - 1].slice(2)

  return encoded.toLowerCase()
}
//End - Copied from https://github.com/Uniswap/v3-periphery/blob/main/test/shared/path.ts

async function cyclicSwap() {
	const deadline = Math.floor(Date.now()/1000) + (60 * 10)

	const path = encodePath([WETHAddress, UNIAddress, WETHAddress], [3000, 3000])
	console.log('path', path)

	// [tokenAddress, fee, tokenAddress2, fee, tokenAddress3]

	//Copied from https://docs.uniswap.org/protocol/reference/periphery/interfaces/ISwapRouter
	const params = {
		path: path,
		recipient: WALLET_ADDRESS,
		deadline: deadline,
		amountIn: ethers.utils.parseEther('0.01'),
		amountOutMinimum: 0
	}

	const encodedData = swapRouterContract.interface.encodeFunctionData("exactInput", [params])

	const txArgs = {
		to: V3SwapRouterAddress,
		from: WALLET_ADDRESS,
		data: encodedData,
		gasLimit: ethers.utils.hexlify(10000000)
	}

	const tx = await signer.sendTransaction(txArgs)
	console.log('tx',tx)
	const receipt = await tx.wait()
	console.log('receipt', receipt)
	
}

async function main() {
	await cyclicSwap()
}

main()