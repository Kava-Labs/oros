/* eslint-disable  @typescript-eslint/no-explicit-any */
import type { MetamaskSupportedMessageTypes } from './messageTypes';
import type { CosmosChainConfig } from './config/chainsRegistry';

const msgConvertERC20ToCoinType = {
  MsgValueEVMConvertERC20ToCoin: [
    { name: 'initiator', type: 'string' },
    { name: 'receiver', type: 'string' },
    { name: 'kava_erc20_address', type: 'string' },
    { name: 'amount', type: 'string' },
  ],
};

const msgConvertCoinToERC20 = {
  MsgValueEVMConvertCoinToERC20: [
    { name: 'initiator', type: 'string' },
    { name: 'receiver', type: 'string' },
    { name: 'amount', type: 'Coin' },
  ],
};

// this message type likely won't be needed here because
// this is a cosmos signed message, but it really doesn't
// hurt having here.
const msgConvertCosmosCoinToERC20 = {
  MsgConvertCosmosCoinToERC20: [
    { name: 'initiator', type: 'string' },
    { name: 'receiver', type: 'string' },
    { name: 'amount', type: 'Coin' },
  ],
};

const msgConvertCosmosCoinFromERC20 = {
  MsgConvertCosmosCoinFromERC20: [
    { name: 'initiator', type: 'string' },
    { name: 'receiver', type: 'string' },
    { name: 'amount', type: 'Coin' },
  ],
};

const earnMsgDeposit = {
  MsgValueEarnDeposit: [
    { name: 'depositor', type: 'string' },
    { name: 'amount', type: 'Coin' },
    { name: 'strategy', type: 'int32' },
  ],
};

const earnMsgWithdraw = {
  MsgValueEarnWithdraw: [
    { name: 'from', type: 'string' },
    { name: 'amount', type: 'Coin' },
    { name: 'strategy', type: 'int32' },
  ],
};

const stakingMsgDelegate = {
  MsgValueStakingDelegate: [
    { name: 'delegator_address', type: 'string' },
    { name: 'validator_address', type: 'string' },
    { name: 'amount', type: 'Coin' },
  ],
};

const stakingMsgUndelegate = {
  MsgValueStakingUndelegate: [
    { name: 'delegator_address', type: 'string' },
    { name: 'validator_address', type: 'string' },
    { name: 'amount', type: 'Coin' },
  ],
};

const stakingMsgBeginRedelegate = {
  MsgValueStakingBeginRedelegate: [
    { name: 'delegator_address', type: 'string' },
    { name: 'validator_src_address', type: 'string' },
    { name: 'validator_dst_address', type: 'string' },
    { name: 'amount', type: 'Coin' },
  ],
};

const incentiveSelection = {
  IncentiveSelection: [
    { name: 'denom', type: 'string' },
    { name: 'multiplier_name', type: 'string' },
  ],
};

const height = {
  Height: [
    { name: 'revision_number', type: 'uint64' },
    { name: 'revision_height', type: 'uint64' },
  ],
};

const incentiveMsgClaimUSDXMintingReward = {
  MsgValueIncentiveClaimUSDXMintingReward: [
    { name: 'sender', type: 'string' },
    { name: 'multiplier_name', type: 'string' },
  ],
};

const incentiveMsgClaimHardReward = {
  MsgValueIncentiveClaimHardReward: [
    { name: 'sender', type: 'string' },
    { name: 'denoms_to_claim', type: 'IncentiveSelection[]' },
  ],
};

const incentiveMsgClaimDelegatorReward = {
  MsgValueIncentiveClaimDelegatorReward: [
    { name: 'sender', type: 'string' },
    { name: 'denoms_to_claim', type: 'IncentiveSelection[]' },
  ],
};

const incentiveMsgClaimSwapReward = {
  MsgValueIncentiveClaimSwapReward: [
    { name: 'sender', type: 'string' },
    { name: 'denoms_to_claim', type: 'IncentiveSelection[]' },
  ],
};

const incentiveMsgClaimSavingsReward = {
  MsgValueIncentiveClaimSavingsReward: [
    { name: 'sender', type: 'string' },
    { name: 'denoms_to_claim', type: 'IncentiveSelection[]' },
  ],
};

const incentiveMsgClaimEarnReward = {
  MsgValueIncentiveClaimEarnReward: [
    { name: 'sender', type: 'string' },
    { name: 'denoms_to_claim', type: 'IncentiveSelection[]' },
  ],
};

const routerMsgMintDeposit = {
  MsgValueRouterMintDeposit: [
    { name: 'depositor', type: 'string' },
    { name: 'validator', type: 'string' },
    { name: 'amount', type: 'Coin' },
  ],
};

const routerMsgDelegateMintDeposit = {
  MsgValueRouterDelegateMintDeposit: [
    { name: 'depositor', type: 'string' },
    { name: 'validator', type: 'string' },
    { name: 'amount', type: 'Coin' },
  ],
};

const routerMsgWithdrawBurn = {
  MsgValueRouterWithdrawBurn: [
    { name: 'from', type: 'string' },
    { name: 'validator', type: 'string' },
    { name: 'amount', type: 'Coin' },
  ],
};

const routerMsgWithdrawBurnUndelegate = {
  MsgValueRouterWithdrawBurnUndelegate: [
    { name: 'from', type: 'string' },
    { name: 'validator', type: 'string' },
    { name: 'amount', type: 'Coin' },
  ],
};

const govMsgVote = {
  MsgValueGovVote: [
    { name: 'proposal_id', type: 'uint64' },
    { name: 'voter', type: 'string' },
    { name: 'option', type: 'int32' },
  ],
};

const committeeMsgVote = {
  MsgValueCommitteeVote: [
    { name: 'proposal_id', type: 'uint64' },
    { name: 'voter', type: 'string' },
    { name: 'vote_type', type: 'int32' },
  ],
};

const cdpMsgCreate = {
  MsgValueCdpCreateCDP: [
    { name: 'sender', type: 'string' },
    { name: 'collateral', type: 'Coin' },
    { name: 'principal', type: 'Coin' },
    { name: 'collateral_type', type: 'string' },
  ],
};

const cdpMsgDeposit = {
  MsgValueCdpDeposit: [
    { name: 'depositor', type: 'string' },
    { name: 'owner', type: 'string' },
    { name: 'collateral', type: 'Coin' },
    { name: 'collateral_type', type: 'string' },
  ],
};

const cdpMsgRepayDebt = {
  MsgValueCdpRepayDebt: [
    { name: 'sender', type: 'string' },
    { name: 'collateral_type', type: 'string' },
    { name: 'payment', type: 'Coin' },
  ],
};

const cdpMsgDrawDebt = {
  MsgValueCdpDrawDebt: [
    {
      name: 'sender',
      type: 'string',
    },
    {
      name: 'collateral_type',
      type: 'string',
    },
    {
      name: 'principal',
      type: 'Coin',
    },
  ],
};

const cdpMsgWithdraw = {
  MsgValueCdpWithdraw: [
    {
      name: 'depositor',
      type: 'string',
    },
    {
      name: 'owner',
      type: 'string',
    },
    {
      name: 'collateral',
      type: 'Coin',
    },
    {
      name: 'collateral_type',
      type: 'string',
    },
  ],
};

const hardMsgDeposit = {
  MsgValueHardDeposit: [
    { name: 'depositor', type: 'string' },
    { name: 'amount', type: 'Coin[]' },
  ],
};

const hardMsgWithdraw = {
  MsgValueHardWithdraw: [
    { name: 'depositor', type: 'string' },
    { name: 'amount', type: 'Coin[]' },
  ],
};

const liquidMsgMintDerivative = {
  MsgValueMintDerivative: [
    { name: 'sender', type: 'string' },
    { name: 'validator', type: 'string' },
    { name: 'amount', type: 'Coin' },
  ],
};

const liquidMsgBurnDerivative = {
  MsgValueBurnDerivative: [
    { name: 'sender', type: 'string' },
    { name: 'validator', type: 'string' },
    { name: 'amount', type: 'Coin' },
  ],
};

const msgSend = {
  MsgValueBankSend: [
    { name: 'from_address', type: 'string' },
    { name: 'to_address', type: 'string' },
    { name: 'amount', type: 'Coin[]' },
  ],
};

const msgWithdrawDelegatorReward = {
  MsgValueWithdrawDelegatorReward: [
    { name: 'delegator_address', type: 'string' },
    { name: 'validator_address', type: 'string' },
  ],
};

const msgTransfer = {
  MsgValueIBCTransfer: [
    { name: 'source_port', type: 'string' },
    { name: 'source_channel', type: 'string' },
    { name: 'token', type: 'Coin' },
    { name: 'sender', type: 'string' },
    { name: 'receiver', type: 'string' },
    { name: 'timeout_height', type: 'Height' },
    { name: 'timeout_timestamp', type: 'uint64' },
    { name: 'memo', type: 'string' },
  ],
};

const EIP712TxType = {
  Tx: [
    { name: 'account_number', type: 'string' },
    { name: 'chain_id', type: 'string' },
    { name: 'fee', type: 'Fee' },
    { name: 'memo', type: 'string' },
    { name: 'sequence', type: 'string' },
  ],
};

async function getEIP712TypeFromMsgType(
  msgType: MetamaskSupportedMessageTypes,
) {
  const { metamaskMessageTypes } = await import('./messageTypes');

  const {
    incentive,
    earn,
    liquid,
    evmUtil,
    cdp,
    committee,
    cosmosSdk,
    hard,
    router,
  } = metamaskMessageTypes;
  switch (msgType) {
    case evmUtil.msgConvertERC20ToCoinType:
      return msgConvertERC20ToCoinType;
    case evmUtil.msgConvertCoinToERC20:
      return msgConvertCoinToERC20;
    case evmUtil.msgConvertCosmosCoinToERC20:
      return msgConvertCosmosCoinToERC20;
    case evmUtil.msgConvertCosmosCoinFromERC20:
      return msgConvertCosmosCoinFromERC20;
    case earn.msgDeposit:
      return earnMsgDeposit;
    case earn.msgWithdraw:
      return earnMsgWithdraw;

    case incentive.msgClaimUSDXMintingReward:
      return incentiveMsgClaimUSDXMintingReward;
    case incentive.msgClaimHardReward:
      return incentiveMsgClaimHardReward;
    case incentive.msgClaimDelegatorReward:
      return incentiveMsgClaimDelegatorReward;
    case incentive.msgClaimSwapReward:
      return incentiveMsgClaimSwapReward;
    case incentive.msgClaimSavingsReward:
      return incentiveMsgClaimSavingsReward;
    case incentive.msgClaimEarnReward:
      return incentiveMsgClaimEarnReward;
    case router.msgMintDeposit:
      return routerMsgMintDeposit;
    case router.msgDelegateMintDeposit:
      return routerMsgDelegateMintDeposit;
    case router.msgWithdrawBurn:
      return routerMsgWithdrawBurn;
    case router.msgWithdrawBurnUndelegate:
      return routerMsgWithdrawBurnUndelegate;
    case cdp.msgCreateCdp:
      return cdpMsgCreate;
    case cdp.msgDeposit:
      return cdpMsgDeposit;
    case cdp.msgWithdraw:
      return cdpMsgWithdraw;
    case cdp.msgRepayDebt:
      return cdpMsgRepayDebt;
    case cdp.msgDrawDebt:
      return cdpMsgDrawDebt;
    case hard.msgDeposit:
      return hardMsgDeposit;
    case hard.msgWithdraw:
      return hardMsgWithdraw;
    case liquid.msgMintDerivative:
      return liquidMsgMintDerivative;
    case liquid.msgBurnDerivative:
      return liquidMsgBurnDerivative;
    case cosmosSdk.msgSend:
      return msgSend;
    case cosmosSdk.msgWithdrawDelegationReward:
      return msgWithdrawDelegatorReward;
    case cosmosSdk.msgTransfer:
      return msgTransfer;
    case cosmosSdk.msgDelegate:
      return stakingMsgDelegate;
    case cosmosSdk.msgUndelegate:
      return stakingMsgUndelegate;
    case cosmosSdk.msgBeginRedelegate:
      return stakingMsgBeginRedelegate;
    case cosmosSdk.msgVote:
      return govMsgVote;
    case committee.msgVote:
      return committeeMsgVote;
    default:
      throw Error(`Unsupported Message Type: ${msgType}`);
  }
}

async function shouldIncludeNestedTypes(messageType: any) {
  const { metamaskMessageTypes } = await import('./messageTypes');
  const { incentive, cosmosSdk } = metamaskMessageTypes;
  const nestedAttributeMessageType = [
    incentive.msgClaimHardReward,
    incentive.msgClaimDelegatorReward,
    incentive.msgClaimSwapReward,
    incentive.msgClaimSavingsReward,
    incentive.msgClaimEarnReward,
    cosmosSdk.msgTransfer,
  ];
  return nestedAttributeMessageType.includes(messageType);
}

export const msgsToEIP712 = async (msg: any[]) => {
  // get the message types that the user is trying to do transactions with
  const EIP712Types: any = {};
  let msgTypes: any = {};
  const txTypes: any = [];
  const eipFormmatedMessages: any = {};
  let includeIncentiveSelection = false;
  let includeHeight = false;

  for (let i = 0; i < msg.length; i++) {
    const message = msg[i];
    const messageType = message.type;

    const eip712MsgType = await getEIP712TypeFromMsgType(messageType);

    if (await shouldIncludeNestedTypes(messageType)) {
      if (!includeIncentiveSelection) {
        includeIncentiveSelection = true;
      }

      if (!includeHeight) {
        includeHeight = true;
      }
    }

    const eip712MsgTypeName = Object.keys(eip712MsgType)[0];
    const msgKey = `Msg${i + 1}`;
    const msgName = msgKey.toLowerCase();

    EIP712Types[msgKey] = [
      { name: 'type', type: 'string' },
      { name: 'value', type: eip712MsgTypeName },
    ];

    msgTypes = { ...msgTypes, ...eip712MsgType };

    txTypes.push({ name: msgName, type: msgKey });

    eipFormmatedMessages[msgName] = message;
  }

  let types = {
    Coin: [
      { name: 'denom', type: 'string' },
      { name: 'amount', type: 'string' },
    ],
  };

  // we can't add the nested incentive selection unless
  // the message type is a rewards driven one.
  if (includeIncentiveSelection) {
    types = { ...types, ...incentiveSelection };
  }

  if (includeHeight) {
    types = { ...types, ...height };
  }

  return {
    types: {
      ...types,
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
      ],
      Fee: [
        { name: 'feePayer', type: 'string' },
        { name: 'amount', type: 'Coin[]' },
        { name: 'gas', type: 'string' },
      ],
      ...EIP712Types,
      ...msgTypes,
      Tx: [...EIP712TxType.Tx, ...txTypes],
    },
    eipFormmatedMessages,
  };
};

export type EIP712SignerParams = {
  messages: any[];
  gas?: string;
  fee?: { denom: string; amount: string }[];
  chainConfig: CosmosChainConfig;
  memo: string;
};

export const eip712SignAndBroadcast = async (opts: EIP712SignerParams) => {
  const { SignMode } = await import(
    'cosmjs-types/cosmos/tx/signing/v1beta1/signing'
  );
  const { ExtensionOptionsWeb3Tx } = await import(
    '@kava-labs/javascript-sdk/lib/proto/ethermint/types/v1/web3'
  );
  const { PubKey } = await import(
    '@kava-labs/javascript-sdk/lib/proto/ethermint/crypto/v1/ethsecp256k1/keys'
  );
  const { signatureToPubkey } = await import('@hanchon/signature-to-pubkey');
  const { TxRaw } = await import('cosmjs-types/cosmos/tx/v1beta1/tx');
  const { default: Long } = await import('long');
  const { makeSignDoc: makeSignDocAmino } = await import('@cosmjs/amino');
  const { toBase64, fromBase64 } = await import('@cosmjs/encoding');
  const { makeAuthInfoBytes, Registry } = await import('@cosmjs/proto-signing');
  const { AminoTypes } = await import('@cosmjs/stargate');
  const { createDefaultTypes } = await import('./aminoTypes');
  const { defaultRegistryTypes } = await import('./registry');

  const { chainRegistry } = await import('./config/chainsRegistry');
  const { ChainType } = await import('./types/chain');
  const { bech32 } = await import('bech32');
  const { ethers } = await import('ethers');

  if (!chainRegistry[ChainType.EVM][opts.chainConfig.evmChainName ?? '']) {
    throw new Error(
      `cosmos ${opts.chainConfig.name} chain must be linked to an evm chain`,
    );
  }

  if (Array.isArray(opts.messages)) {
    // todo: uncomment this once we get IBC set up and fillIbcMsgHeight implemented
    // const transfer = opts.messages.find(
    //   (m) => m.type === metamaskMessageTypes.cosmosSdk.msgTransfer,
    // );
    // if (transfer) {
    //   opts.memo = 'app.kava.io';
    //   transfer.value.memo = opts.memo;
    //   transfer.value.timeout_height = await fillIbcMsgHeight(
    //     transfer.value.source_channel,
    //   );
    // }
  }

  const { messages, memo, chainConfig } = opts;

  const gas = opts.gas ? opts.gas : chainConfig.defaultGasWanted;
  const fee = opts.fee ? opts.fee : [];

  let rawTx = TxRaw.fromPartial({});

  const registry = new Registry(await defaultRegistryTypes());

  const aminoTypes = new AminoTypes({
    additions: await createDefaultTypes(),
  });

  // get the Eth address from metamask
  const accounts: any = await window.ethereum.request({
    method: 'eth_accounts',
  });

  const metamaskAddress = accounts[0];
  const signerAddress = bech32.encode(
    chainConfig.bech32Prefix,
    bech32.toWords(
      ethers.getBytes(ethers.toQuantity(ethers.getAddress(metamaskAddress))),
    ),
  );

  // if the user has already completed a transaction, we no longer need to
  // send their pub_key across. If it is their first transaction with the wallet
  // on the kava chain then we need to send a dummy tx to their metamask in order
  // to generate a public key and send it with the data
  let pubkey: string = '';
  let sequence = '0';
  let accountNumber = '0';
  const baseURL = chainConfig.rpcUrls[0];

  try {
    const res = await fetch(
      `${baseURL}/cosmos/auth/v1beta1/account_info/${signerAddress}`,
    );
    const account = await res.json();
    if (account.info) {
      if (account.info.pub_key) {
        pubkey = account.info.pub_key.key;
      }
      if (account.info.sequence) {
        sequence = account.info.sequence;
      }
      if (account.info.account_number) {
        accountNumber = account.info.account_number;
      }
    }
  } catch (err) {
    console.error(err);
  }

  if (!pubkey.length) {
    // get the pubkey from mm for the given address if the user doens't have
    // and existing pub_key on their kava account
    const pubKeySignature = await window.ethereum.request({
      method: 'personal_sign',
      params: [metamaskAddress, 'generate_pubkey'],
    });

    const pubKeyMessage = Buffer.from([
      50, 215, 18, 245, 169, 63, 252, 16, 225, 169, 71, 95, 254, 165, 146, 216,
      40, 162, 115, 78, 147, 125, 80, 182, 25, 69, 136, 250, 65, 200, 94, 178,
    ]);

    pubkey = signatureToPubkey(pubKeySignature as string, pubKeyMessage);
  }

  const pubkeyfromPartial = PubKey.fromPartial({
    key: fromBase64(pubkey),
  });

  // encode it and turn it into proto ready format
  const pubkeyOptions = {
    typeUrl: '/ethermint.crypto.v1.ethsecp256k1.PubKey',
    value: pubkeyfromPartial,
  };

  const anyPubKey = registry.encodeAsAny(pubkeyOptions);

  // set the signmode
  const signMode = SignMode.SIGN_MODE_LEGACY_AMINO_JSON;

  // make an auth info section and return it as proto data
  const signedAuthInfoBytes = makeAuthInfoBytes(
    [
      {
        pubkey: anyPubKey,
        sequence: Number(sequence),
      },
    ],
    fee,
    Number(gas),
    signMode,
  );

  // build the types for signing so metamask knows how to parse
  // render, and sign the messages
  const { types, eipFormmatedMessages } = await msgsToEIP712(messages);
  // build the data structure for metamask to sign
  const eipToSign = {
    types,
    primaryType: 'Tx',
    domain: {
      name: chainConfig.name,
      version: '1.0.0',
      chainId: chainRegistry[ChainType.EVM][chainConfig.evmChainName!].chainID,
      verifyingContract: '',
      salt: '',
    },
    message: {
      account_number: accountNumber,
      chain_id: chainConfig.chainID,
      fee: {
        amount: fee,
        feePayer: signerAddress,
        gas,
      },
      memo,
      ...eipFormmatedMessages,
      sequence,
    },
  };
  // have user sign with stringified json here and return it to a variable
  // this triggers the actual metamask window to open
  let signature = await window.ethereum.request({
    method: 'eth_signTypedData_v4',
    params: [metamaskAddress, JSON.stringify(eipToSign)],
  });

  // use the signature to get the feePayerSignature
  signature = signature.slice(2); // Remove the 0x prefix
  const feePayerSignature = Buffer.from(signature, 'hex').toString('base64');

  // extension options are used with metamask EIP related data. Build the
  // extension options and encode them using the registry
  const encodedPartial = ExtensionOptionsWeb3Tx.fromPartial({
    typedDataChainId: String(
      chainRegistry[ChainType.EVM][chainConfig.evmChainName!].chainID,
    ),
    feePayer: signerAddress,
    feePayerSig: Uint8Array.from(atob(feePayerSignature), (c) =>
      c.charCodeAt(0),
    ),
  });

  const extensionOptions = {
    typeUrl: '/ethermint.types.v1.ExtensionOptionsWeb3Tx',
    value: encodedPartial,
  };

  const encodedExtensionOptions = [registry.encodeAsAny(extensionOptions)];

  // build messages in amino so they can be moved into proto after
  const signDoc = makeSignDocAmino(
    messages,
    { amount: fee, gas },
    chainConfig.chainID,
    memo,
    accountNumber,
    sequence,
  );

  // get the message and run them through the proto definitions
  const bodyMsgs: any = signDoc.msgs;
  const protoMessages = bodyMsgs.map((msg: any) => aminoTypes.fromAmino(msg));

  // use the proto messages and extension options to build the transaction body
  const body = {
    messages: protoMessages,
    memo,
    extensionOptions: encodedExtensionOptions,
    timeoutHeight: new Long(0),
    nonCriticalExtensionOptions: [],
  };

  // sign the transaction body and return proto bytes
  const signedTxBodyEncodeObject = {
    typeUrl: '/cosmos.tx.v1beta1.TxBody',
    value: body,
  };
  const signedTxBodyBytes = registry.encode(signedTxBodyEncodeObject);

  // build the tx with the different proto pieces
  rawTx = TxRaw.fromPartial({
    bodyBytes: signedTxBodyBytes,
    authInfoBytes: signedAuthInfoBytes,
    signatures: [new Uint8Array()],
  });

  // const authInfo = AuthInfo.decode(rawTx.authInfoBytes);
  // const feeAmount = authInfo.fee?.amount ? authInfo.fee.amount : fee;
  // const gasLimit = authInfo.fee?.gasLimit?.low
  //   ? authInfo.fee.gasLimit.low
  //   : gas;

  const tx_bytes = toBase64(TxRaw.encode(rawTx).finish());
  const mode = 'BROADCAST_MODE_SYNC';

  const res = await fetch(baseURL + '/cosmos/tx/v1beta1/txs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      tx_bytes,
      mode,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    if (error.length) {
      throw new Error(error);
    }

    throw new Error(`failed to broadcast transaction`);
  }

  const txData = await res.json();

  if (txData.tx_response.code !== 0) {
    if (txData.tx_response.raw_log) {
      throw new Error(txData.tx_response.raw_log);
    } else {
      throw new Error(`failed to broadcast transaction`);
    }
  }

  return txData.tx_response.txhash;
};
