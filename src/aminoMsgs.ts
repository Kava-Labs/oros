import type { AminoMsg, Coin } from '@cosmjs/amino';
import type { VoteType } from '@kava-labs/javascript-sdk/lib/proto/kava/committee/v1beta1/genesis';

export interface AminoAuctionMsgPlaceBid extends AminoMsg {
  readonly type: 'auction/MsgPlaceBid';
  readonly value: {
    readonly auction_id: string;
    readonly bidder: string;
    readonly amount: Coin;
  };
}

export interface AminoBep3MsgCreateAtomicSwap extends AminoMsg {
  readonly type: 'bep3/MsgCreateAtomicSwap';
  readonly value: {
    readonly from: string;
    readonly to: string;
    readonly recipient_other_chain: string;
    readonly sender_other_chain: string;
    readonly random_number_hash: string;
    readonly timestamp: string;
    readonly amount: readonly Coin[];
    readonly height_span: string;
  };
}

export interface AminoBep3MsgClaimAtomicSwap extends AminoMsg {
  readonly type: 'bep3/MsgClaimAtomicSwap';
  readonly value: {
    readonly from: string;
    readonly swap_id: string;
    readonly random_number: string;
  };
}

export interface AminoBep3MsgRefundAtomicSwap extends AminoMsg {
  readonly type: 'bep3/MsgRefundAtomicSwap';
  readonly value: {
    readonly from: string;
    readonly swap_id: string;
  };
}

export interface AminoCdpMsgCreateCDP extends AminoMsg {
  readonly type: 'cdp/MsgCreateCDP';
  readonly value: {
    readonly sender: string;
    readonly collateral: Coin;
    readonly principal: Coin;
    readonly collateral_type: string;
  };
}

export interface AminoCdpMsgDeposit extends AminoMsg {
  readonly type: 'cdp/MsgDeposit';
  readonly value: {
    readonly depositor: string;
    readonly owner: string;
    readonly collateral: Coin;
    readonly collateral_type: string;
  };
}

export interface AminoCdpMsgWithdraw extends AminoMsg {
  readonly type: 'cdp/MsgWithdraw';
  readonly value: {
    readonly depositor: string;
    readonly owner: string;
    readonly collateral: Coin;
    readonly collateral_type: string;
  };
}

export interface AminoCdpMsgDrawDebt extends AminoMsg {
  readonly type: 'cdp/MsgDrawDebt';
  readonly value: {
    readonly sender: string;
    readonly collateral_type: string;
    readonly principal: Coin;
  };
}

export interface AminoCdpMsgRepayDebt extends AminoMsg {
  readonly type: 'cdp/MsgRepayDebt';
  readonly value: {
    readonly sender: string;
    readonly collateral_type: string;
    readonly payment: Coin;
  };
}

export interface AminoCommitteeMsgVote extends AminoMsg {
  readonly type: 'kava/MsgVote';
  readonly value: {
    readonly voter: string;
    readonly proposal_id: string;
    readonly vote_type: VoteType;
  };
}

export interface AminoHardMsgDeposit extends AminoMsg {
  readonly type: 'hard/MsgDeposit';
  readonly value: {
    readonly depositor: string;
    readonly amount: readonly Coin[];
  };
}
export function isAminoHardMsgDeposit(
  msg: AminoMsg,
): msg is AminoHardMsgDeposit {
  return msg.type === 'hard/MsgDeposit';
}

export interface AminoHardMsgWithdraw extends AminoMsg {
  readonly type: 'hard/MsgWithdraw';
  readonly value: {
    readonly depositor: string;
    readonly amount: readonly Coin[];
  };
}
export function isAminoHardMsgWithdraw(
  msg: AminoMsg,
): msg is AminoHardMsgWithdraw {
  return msg.type === 'hard/MsgWithdraw';
}

export interface AminoHardMsgBorrow extends AminoMsg {
  readonly type: 'hard/MsgBorrow';
  readonly value: {
    readonly borrower: string;
    readonly amount: readonly Coin[];
  };
}
export function isAminoHardMsgBorrow(msg: AminoMsg): msg is AminoHardMsgBorrow {
  return msg.type === 'hard/MsgBorrow';
}

export interface AminoHardMsgRepay extends AminoMsg {
  readonly type: 'hard/MsgRepay';
  readonly value: {
    readonly sender: string;
    readonly owner: string;
    readonly amount: readonly Coin[];
  };
}
export function isAminoHardMsgRepay(msg: AminoMsg): msg is AminoHardMsgRepay {
  return msg.type === 'hard/MsgRepay';
}

export interface AminoHardMsgLiquidate extends AminoMsg {
  readonly type: 'hard/MsgLiquidate';
  readonly value: {
    readonly keeper: string;
    readonly borrower: string;
  };
}

export interface AminoIncentiveMsgClaimUSDXMintingReward extends AminoMsg {
  readonly type: 'incentive/MsgClaimUSDXMintingReward';
  readonly value: {
    readonly sender: string;
    readonly multiplier_name: string;
  };
}

export interface DenomToClaim {
  readonly denom: string;
  readonly multiplier_name: string;
}

export interface AminoIncentiveMsgClaimDelegatorReward extends AminoMsg {
  readonly type: 'incentive/MsgClaimDelegatorReward';
  readonly value: {
    readonly sender: string;
    readonly denoms_to_claim: readonly DenomToClaim[];
  };
}

export interface AminoIncentiveMsgClaimHardReward extends AminoMsg {
  readonly type: 'incentive/MsgClaimHardReward';
  readonly value: {
    readonly sender: string;
    readonly denoms_to_claim: readonly DenomToClaim[];
  };
}

export interface AminoIncentiveMsgClaimSwapReward extends AminoMsg {
  readonly type: 'incentive/MsgClaimSwapReward';
  readonly value: {
    readonly sender: string;
    readonly denoms_to_claim: readonly DenomToClaim[];
  };
}

export interface AminoIncentiveMsgClaimEarnReward extends AminoMsg {
  readonly type: 'incentive/MsgClaimEarnReward';
  readonly value: {
    readonly sender: string;
    readonly denoms_to_claim: readonly DenomToClaim[];
  };
}

export interface AminoIncentiveMsgClaimSavingsReward extends AminoMsg {
  readonly type: 'incentive/MsgClaimSavingsReward';
  readonly value: {
    readonly sender: string;
    readonly denoms_to_claim: readonly DenomToClaim[];
  };
}

export interface AminoIssuanceMsgIssueTokens extends AminoMsg {
  readonly type: 'issuance/MsgIssueTokens';
  readonly value: {
    readonly sender: string;
    readonly receiver: string;
    readonly tokens: Coin;
  };
}

export interface AminoIssuanceMsgRedeemTokens extends AminoMsg {
  readonly type: 'issuance/MsgRedeemTokens';
  readonly value: {
    readonly sender: string;
    readonly tokens: Coin;
  };
}

export interface AminoIssuanceMsgBlockAddress extends AminoMsg {
  readonly type: 'issuance/MsgBlockAddress';
  readonly value: {
    readonly sender: string;
    readonly blocked_address: string;
    readonly denom: string;
  };
}

export interface AminoIssuanceMsgUnblockAddress extends AminoMsg {
  readonly type: 'issuance/MsgUnblockAddress';
  readonly value: {
    readonly sender: string;
    readonly blocked_address: string;
    readonly denom: string;
  };
}

export interface AminoIssuanceMsgSetPauseStatus extends AminoMsg {
  readonly type: 'issuance/MsgSetPauseStatus';
  readonly value: {
    readonly sender: string;
    readonly denom: string;
    readonly status: boolean;
  };
}

export interface AminoSwapMsgDeposit extends AminoMsg {
  readonly type: 'swap/MsgDeposit';
  readonly value: {
    readonly depositor: string;
    readonly token_a: Coin;
    readonly token_b: Coin;
    readonly slippage: string;
    readonly deadline: string;
  };
}

export interface AminoSwapMsgWithdraw extends AminoMsg {
  readonly type: 'swap/MsgWithdraw';
  readonly value: {
    readonly from: string;
    readonly shares: string;
    readonly min_token_a: Coin;
    readonly min_token_b: Coin;
    readonly deadline: string;
  };
}

export interface AminoSwapMsgSwapExactForTokens extends AminoMsg {
  readonly type: 'swap/MsgSwapExactForTokens';
  readonly value: {
    readonly requester: string;
    readonly exact_token_a: Coin;
    readonly token_b: Coin;
    readonly slippage: string;
    readonly deadline: string;
  };
}

export interface AminoSwapMsgSwapForExactTokens extends AminoMsg {
  readonly type: 'swap/MsgSwapForExactTokens';
  readonly value: {
    readonly requester: string;
    readonly token_a: Coin;
    readonly exact_token_b: Coin;
    readonly slippage: string;
    readonly deadline: string;
  };
}

export interface AminoMsgWithdrawDelegatorReward extends AminoMsg {
  // NOTE: Type string and names diverge here!
  readonly type: 'cosmos-sdk/MsgWithdrawDelegationReward';
  readonly value: {
    /** Bech32 account address */
    readonly delegator_address: string;
    /** Bech32 account address */
    readonly validator_address: string;
  };
}

export interface AminoMsgEarnDeposit extends AminoMsg {
  readonly type: 'earn/MsgDeposit';
  readonly value: {
    readonly depositor: string;
    readonly amount: Coin;
    readonly strategy: number;
  };
}

export interface AminoMsgEarnWithdraw extends AminoMsg {
  readonly type: 'earn/MsgWithdraw';
  readonly value: {
    readonly from: string;
    readonly amount: Coin;
    readonly strategy: number;
  };
}

export interface AminoMsgConvertERC20ToCoin extends AminoMsg {
  readonly type: 'evmutil/MsgConvertERC20ToCoin';
  readonly value: {
    readonly initiator: string;
    readonly receiver: string;
    readonly kava_erc20_address: string;
    readonly amount: string;
  };
}

export interface AminoMsgConvertCoinToERC20 extends AminoMsg {
  readonly type: 'evmutil/MsgConvertCoinToERC20';
  readonly value: {
    readonly initiator: string;
    readonly receiver: string;
    readonly amount: Coin;
  };
}

export interface AminoMsgConvertCosmosCoinFromERC20 extends AminoMsg {
  readonly type: 'evmutil/MsgConvertCosmosCoinFromERC20';
  readonly value: {
    readonly initiator: string;
    readonly receiver: string;
    readonly amount: Coin;
  };
}

export interface AminoMsgConvertCosmosCoinToERC20 extends AminoMsg {
  readonly type: 'evmutil/MsgConvertCosmosCoinToERC20';
  readonly value: {
    readonly initiator: string;
    readonly receiver: string;
    readonly amount: Coin;
  };
}

export function isBridgeMessageWithStringAmount(
  msg: AminoMsg,
): msg is AminoMsgDelegate | AminoMsgUndelegate {
  const erc20ConvertMessages = [
    'evmutil/MsgConvertCosmosCoinToERC20',
    'evmutil/MsgConvertCosmosCoinFromERC20',
    'evmutil/MsgConvertERC20ToCoin',
    // 'evmutil/MsgConvertCoinToERC20',   don't include this message because it still has the Coin fully packed up,
  ];

  return erc20ConvertMessages.includes(msg.type);
}

export interface AminoMsgMintDeposit extends AminoMsg {
  readonly type: 'router/MsgMintDeposit';
  readonly value: {
    readonly depositor: string;
    readonly validator: string;
    readonly amount: Coin;
  };
}

export interface AminoMsgWithdrawBurn extends AminoMsg {
  readonly type: 'router/MsgWithdrawBurn';
  readonly value: {
    readonly from: string;
    readonly validator: string;
    readonly amount: Coin;
  };
}

export interface AminoMsgDelegateMintDeposit extends AminoMsg {
  readonly type: 'router/MsgDelegateMintDeposit';
  readonly value: {
    readonly depositor: string;
    readonly validator: string;
    readonly amount: Coin;
  };
}

export interface AminoMsgWithdrawBurnUndelegate extends AminoMsg {
  readonly type: 'router/MsgWithdrawBurnUndelegate';
  readonly value: {
    readonly from: string;
    readonly validator: string;
    readonly amount: Coin;
  };
}

export interface AminoMsgDelegate extends AminoMsg {
  readonly type: 'cosmos-sdk/MsgDelegate';
  readonly value: {
    readonly delegator_address: string;
    readonly validator_address: string;
    readonly amount: Coin | undefined;
  };
}
export interface AminoMsgUndelegate extends AminoMsg {
  readonly type: 'cosmos-sdk/MsgUnDelegate';
  readonly value: {
    readonly delegator_address: string;
    readonly validator_address: string;
    readonly amount: Coin | undefined;
  };
}

export function isStakingMessage(
  msg: AminoMsg,
): msg is AminoMsgDelegate | AminoMsgUndelegate {
  const stakingMessages = [
    'cosmos-sdk/MsgDelegate',
    'cosmos-sdk/MsgUndelegate',
  ];

  return stakingMessages.includes(msg.type);
}

export const isAminoMsgConvertCoinToERC20 = (
  msg: AminoMsg,
): msg is AminoMsgConvertCoinToERC20 => {
  return msg.type === 'evmutil/MsgConvertCoinToERC20';
};

export const isAminoMsgConvertERC20ToCoin = (
  msg: AminoMsg,
): msg is AminoMsgConvertERC20ToCoin => {
  return msg.type === 'evmutil/MsgConvertERC20ToCoin';
};
