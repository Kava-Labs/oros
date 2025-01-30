import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing';
import { ExtensionOptionsWeb3Tx } from '@kava-labs/javascript-sdk/lib/proto/ethermint/types/v1/web3';
import { PubKey } from '@kava-labs/javascript-sdk/lib/proto/ethermint/crypto/v1/ethsecp256k1/keys';
import { signatureToPubkey } from '@hanchon/signature-to-pubkey';
import { TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import Long from 'long';
import { makeSignDoc as makeSignDocAmino } from '@cosmjs/amino';
import { fromBase64 } from '@cosmjs/encoding';
import {
  EncodeObject,
  makeAuthInfoBytes,
  Registry,
  TxBodyEncodeObject,
} from '@cosmjs/proto-signing';
import { AminoTypes } from '@cosmjs/stargate';
import { createDefaultTypes } from './aminoTypes';
import { defaultRegistryTypes } from './registry';

import {
  metamaskMessageTypes,
  MetamaskSupportedMessageTypes,
} from './messageTypes';
import { chainRegistry, CosmosChainConfig } from './config/chainsRegistry';
import { ChainType } from './types/chain';
import { bech32 } from 'bech32';
import { ethers } from 'ethers';

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

function getEIP712TypeFromMsgType(msgType: MetamaskSupportedMessageTypes) {
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

function shouldIncludeNestedTypes(messageType: any) {
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

export const msgsToEIP712 = (msg: any[]) => {
  // get the message types that the user is trying to do transactions with
  let EIP712Types: any = {};
  let msgTypes: any = {};
  let txTypes: any = [];
  let eipFormmatedMessages: any = {};
  let includeIncentiveSelection = false;
  let includeHeight = false;

  msg.forEach(function (message, index) {
    const messageType = message.type;

    const eip712MsgType = getEIP712TypeFromMsgType(messageType);

    if (shouldIncludeNestedTypes(messageType)) {
      if (!includeIncentiveSelection) {
        includeIncentiveSelection = true;
      }

      if (!includeHeight) {
        includeHeight = true;
      }
    }

    const eip712MsgTypeName = Object.keys(eip712MsgType)[0];
    const msgKey = `Msg${index + 1}`;
    const msgName = msgKey.toLowerCase();

    EIP712Types[msgKey] = [
      { name: 'type', type: 'string' },
      { name: 'value', type: eip712MsgTypeName },
    ];

    msgTypes = { ...msgTypes, ...eip712MsgType };

    txTypes.push({ name: msgName, type: msgKey });

    eipFormmatedMessages[msgName] = message;
  });

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

  let rawTx: TxRaw = TxRaw.fromPartial({});

  const registry = new Registry(defaultRegistryTypes);

  const aminoTypes = new AminoTypes({
    additions: createDefaultTypes(),
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
  let anyPubKey: any;
  let pubkey: string = '';
  let sequence = '0';
  let accountNumber = '0';
  let baseURL = chainConfig.rpcUrls[0];

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
    let pubKeySignature = await window.ethereum.request({
      method: 'personal_sign',
      params: [metamaskAddress, 'generate_pubkey'],
    });

    let pubKeyMessage = Buffer.from([
      50, 215, 18, 245, 169, 63, 252, 16, 225, 169, 71, 95, 254, 165, 146, 216,
      40, 162, 115, 78, 147, 125, 80, 182, 25, 69, 136, 250, 65, 200, 94, 178,
    ]);

    pubkey = signatureToPubkey(pubKeySignature as string, pubKeyMessage);
  }

  let pubkeyfromPartial = PubKey.fromPartial({
    key: fromBase64(pubkey),
  });

  // encode it and turn it into proto ready format
  const pubkeyOptions: EncodeObject = {
    typeUrl: '/ethermint.crypto.v1.ethsecp256k1.PubKey',
    value: pubkeyfromPartial,
  };

  anyPubKey = registry.encodeAsAny(pubkeyOptions);

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
  const { types, eipFormmatedMessages } = msgsToEIP712(messages);
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

  const extensionOptions: EncodeObject = {
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
  const body: TxBody = {
    messages: protoMessages,
    memo,
    extensionOptions: encodedExtensionOptions,
    timeoutHeight: new Long(0),
    nonCriticalExtensionOptions: [],
  };

  // sign the transaction body and return proto bytes
  const signedTxBodyEncodeObject: TxBodyEncodeObject = {
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

  const tx_bytes = TxRaw.encode(rawTx).finish();
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
    throw new Error(`failed to broadcast transaction`);
  }

  const txData = await res.json();

  return txData.tx_response.txhash;
};
