import { ethers } from "ethers";
import { bech32 } from "bech32";
import { erc20ABI } from './erc20ABI';

export const transactionToolCallFunctionNames = ["sendKava", "transferERC20"];

// kava evm rpc url
const kavaEvmRpc = "https://evm.kava-rpc.com";

// kava evm provider
const kavaEVMProvider = new ethers.JsonRpcProvider(kavaEvmRpc);

// evm contract addresses
const assetAddresses: Record<string, string> = {
    WHARD: "0x25e9171C98Fc1924Fa9415CF50750274F0664764",
    USDT: "0x919C1c267BC06a7039e03fcc2eF738525769109c",
    WKAVA: "0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b",
    AXLETH: "0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D",
    AXLWBTC: "0x1a35EE4640b0A3B87705B0A4B45D227Ba60Ca2ad",
    MULTIWBTC: "0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b",
    MULTIUSDC: "0xfA9343C3897324496A05fC75abeD6bAC29f8A40f",
    AXLUSDC: "0xEB466342C4d449BC9f53A865D5Cb90586f405215",
    AXLDAI: "0x5C7e299CF531eb66f2A1dF637d37AbB78e6200C7",
    AXLUSDT: "0x7f5373AE26c3E8FfC4c77b7255DF7eC1A9aF52a6",
    MULTIUSDT: "0xb44a9b6905af7c801311e8f4e76932ee959c663c",
    MULTIDAI: "0x765277EebeCA2e31912C9946eAe1021199B39C61",
    WATOM: "0x15932E26f5BD4923d46a2b205191C4b5d5f43FE3",
    AXLBNB: "0x23A6486099f740B7688A0bb7AED7C912015cA2F0",
    AXLBUSD: "0x4D84E25cEa9447581867fE9f2329B972f532Da2c",
    AXLXRPB: "0x8e20A0a1B4664D1ae5d18cc48bA6FAD4d9569406",
    AXLBTCB: "0x94FC70EF7791EE857A1f420B9A471a55F32382be",
    WBTC: "0xb5c4423a65B953905949548276654C96fcaE6992",
    MBTC: "0x59889b7021243dB5B1e065385F918316cD90D46c",
};

// abi for balanceOf
const balanceOfAbi = [
    {
        constant: true,
        inputs: [
            {
                name: "_owner",
                type: "address",
            },
        ],
        name: "balanceOf",
        outputs: [
            {
                name: "balance",
                type: "uint256",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    // This is hacky, not even sure this part is correct, but it works..
    {
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
    },
];

/**
 *
 * @param kavaAddress string
 * @returns string representing eth address from given kava address
 */
export function kavaToEthAddress(kavaAddress: string) {
    return ethers.getAddress(
        ethers.hexlify(Buffer.from(bech32.fromWords(bech32.decode(kavaAddress).words)))
    );
}

/**
 *
 * @param ethereumAddress string
 * @returns string representing kava address from give eth address
 */
export function ethToKavaAddress(ethereumAddress: string) {
    return bech32.encode(
        "kava",
        bech32.toWords(
            ethers.getBytes(ethers.toQuantity(ethers.getAddress(ethereumAddress)))
        )
    );
}

export async function getAccountBalances(arg: { address: string }): Promise<string> {
    const { address } = arg;
    try {
        const balanceResults: string[] = [];

        // Loop through each token and fetch the balance
        for (const asset in assetAddresses) {
            const contract = new ethers.Contract(
                assetAddresses[asset],
                balanceOfAbi,
                kavaEVMProvider
            );

            // Fetch raw balance and decimals
            const rawBalance = await contract.balanceOf(address);
            const decimals = await contract.decimals();

            // Format balance to a human-readable string
            const formattedBalance = ethers.formatUnits(rawBalance, decimals);

            // Add the result to the balance results array
            balanceResults.push(`${asset}: ${formattedBalance}`);
        }

        return balanceResults.join(", ");
    } catch (error) {
        console.error("Error fetching account balances:", error);
        throw new Error(`failed to fetch account balances: ${JSON.stringify(error)}`);
    }
}

type SendParams = {
    senderAddress: string;
    receiverAddress: string;
    amount: number;
};

export const sendKava = async (args: SendParams) => {
    const to = args.receiverAddress.startsWith("kava")
        ? kavaToEthAddress(args.receiverAddress)
        : args.receiverAddress;
    const from = args.senderAddress.startsWith("kava")
        ? kavaToEthAddress(args.senderAddress)
        : args.senderAddress;

    const value = ethers.parseEther(String(!args.amount || Number.isNaN(Number(args.amount)) ? "0" : args.amount)).toString(16);

    return {
        method: "eth_sendTransaction",
        params: [
            {
                to,
                from,
                value,
                gasPrice: "0x4a817c800",
                gas: "0x76c0",
                data: "0x",
            },
        ],
    };
};

interface TransferErc20Params extends SendParams {
    assetName: string
}

export const transferERC20 = async (args: TransferErc20Params) => {
    const addressTo = args.receiverAddress.startsWith("kava")
        ? kavaToEthAddress(args.receiverAddress)
        : args.receiverAddress;
    const addressFrom = args.senderAddress.startsWith("kava")
        ? kavaToEthAddress(args.senderAddress)
        : args.senderAddress;

    //  if an address is purely lowercase, this will be sure we have the correctly checksummed format
    const formattedReceivingAddress = ethers.getAddress(addressTo);
    const formattedSendingAddress = ethers.getAddress(addressFrom);

    const rawTxAmount = String(!args.amount || Number.isNaN(Number(args.amount)) ? "0" : args.amount);

    try {
        //  todo - better validation and mapping?
        const contractAddress = assetAddresses[args.assetName.toUpperCase()];

        const contract = new ethers.Contract(
            contractAddress,
            erc20ABI,
            kavaEVMProvider
        );

        const decimals = await contract.decimals();

        const formattedTxAmount = ethers.parseUnits(rawTxAmount, Number(decimals));

        const txData = contract.interface.encodeFunctionData('transfer', [formattedReceivingAddress, formattedTxAmount])

        return {
            method: "eth_sendTransaction",
            params: [
                {
                    to: contractAddress,
                    from: formattedSendingAddress,
                    value: '0', // this must be zero
                    gasPrice: "0x4a817c800",
                    gas: "0x16120",
                    data: txData,
                },
            ],
        };
    } catch (e) {
        console.error(`Error: ${e}`);
        throw new Error(`Failed to find contract address for: ${args.assetName}`);
    }

};
