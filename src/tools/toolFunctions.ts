import { ethers } from "ethers";
import { bech32 } from "bech32";
import { erc20ABI } from './erc20ABI';
import { ASSET_ADDRESSES, kavaEVMProvider } from '../config/evm';

/**
 *
 * @param kavaAddress string
 * @returns string representing eth address from given kava address
 */
export const kavaToEthAddress = (kavaAddress: string) => {
  return ethers.getAddress(
    ethers.hexlify(Buffer.from(bech32.fromWords(bech32.decode(kavaAddress).words)))
  );
}

/**
 *
 * @param ethereumAddress string
 * @returns string representing kava address from give eth address
 */
export const ethToKavaAddress = (ethereumAddress: string) => {
  return bech32.encode(
    "kava",
    bech32.toWords(
      ethers.getBytes(ethers.toQuantity(ethers.getAddress(ethereumAddress)))
    )
  );
}

export const getAccountBalances = async (arg: { address: string }): Promise<string> => {
  const { address } = arg;
  const balanceCalls: (() => Promise<string>)[] = [];

  // KAVA fetching is a bit different
  balanceCalls.push(async () => {
    try {
      const rawBalance = await kavaEVMProvider.getBalance(address);
      const formattedBalance = ethers.formatUnits(rawBalance, 18);
      return `KAVA: ${formattedBalance}`;
    } catch (err) {
      return `KAVA: failed to fetch balance ${JSON.stringify(err)}`
    }
  })

  // add other assets
  for (const asset in ASSET_ADDRESSES) {
    balanceCalls.push(async () => {
      const contract = new ethers.Contract(
        ASSET_ADDRESSES[asset],
        erc20ABI,
        kavaEVMProvider
      );


      try {
        const decimals = await contract.decimals();
        const rawBalance = await contract.balanceOf(address);
        const formattedBalance = ethers.formatUnits(rawBalance, decimals);
        return `${asset}: ${formattedBalance}`;
      } catch (err) {
        return `${asset}: failed to fetch balance ${JSON.stringify(err)}`
      }
    });
  }

  const results = await Promise.allSettled(balanceCalls.map((fn) => fn()))
  return results.reduce((acc, res) => acc += `${res.status === 'fulfilled' ? res.value : res.reason}\n`, '');
}

type TransferParams = {
  assetName: string
  senderAddress: string;
  receiverAddress: string;
  amount: number;
};

export const transferAsset = async (args: TransferParams) => {
  const addressTo = args.receiverAddress.startsWith("kava")
    ? kavaToEthAddress(args.receiverAddress)
    : args.receiverAddress;
  const addressFrom = args.senderAddress.startsWith("kava")
    ? kavaToEthAddress(args.senderAddress)
    : args.senderAddress;

  if (args.assetName === 'KAVA') {
    return window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          to: addressTo,
          from: addressFrom,
          value: ethers.parseEther(String(!args.amount || Number.isNaN(Number(args.amount)) ? "0" : args.amount)).toString(16),
          gasPrice: "0x4a817c800",
          gas: "0x76c0",
          data: "0x",
        },
      ],
    });
  } else {
    const formattedReceivingAddress = ethers.getAddress(addressTo);
    const formattedSendingAddress = ethers.getAddress(addressFrom);

    const rawTxAmount = String(!args.amount || Number.isNaN(Number(args.amount)) ? "0" : args.amount);

    //  todo - better validation and mapping?
    const contractAddress = ASSET_ADDRESSES[args.assetName.toUpperCase()];

    const contract = new ethers.Contract(
      contractAddress,
      erc20ABI,
      kavaEVMProvider
    );

    const decimals = await contract.decimals();

    const formattedTxAmount = ethers.parseUnits(rawTxAmount, Number(decimals));

    const txData = contract.interface.encodeFunctionData('transfer', [formattedReceivingAddress, formattedTxAmount])

    return window.ethereum.request({
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
    });
  }
}
