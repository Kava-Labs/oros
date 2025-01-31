/* eslint-disable  @typescript-eslint/no-explicit-any */
import { Big } from 'big.js';
import Long from 'long';
import type { AminoConverter } from '@cosmjs/stargate';
import type {
  AminoAuctionMsgPlaceBid,
  AminoCdpMsgCreateCDP,
  AminoCdpMsgDeposit,
  AminoCdpMsgWithdraw,
  AminoCdpMsgDrawDebt,
  AminoCdpMsgRepayDebt,
  AminoBep3MsgCreateAtomicSwap,
  AminoBep3MsgClaimAtomicSwap,
  AminoBep3MsgRefundAtomicSwap,
  AminoMsgWithdrawDelegatorReward,
  AminoMsgEarnDeposit,
  AminoMsgConvertERC20ToCoin,
  AminoMsgConvertCoinToERC20,
  AminoMsgConvertCosmosCoinToERC20,
  AminoMsgConvertCosmosCoinFromERC20,
  AminoCommitteeMsgVote,
  AminoHardMsgDeposit,
  AminoHardMsgWithdraw,
  AminoHardMsgBorrow,
  AminoHardMsgRepay,
  AminoHardMsgLiquidate,
  AminoIncentiveMsgClaimUSDXMintingReward,
  AminoIncentiveMsgClaimDelegatorReward,
  AminoIncentiveMsgClaimHardReward,
  AminoIncentiveMsgClaimSwapReward,
  AminoIncentiveMsgClaimEarnReward,
  AminoIncentiveMsgClaimSavingsReward,
  AminoIssuanceMsgIssueTokens,
  AminoIssuanceMsgRedeemTokens,
  AminoIssuanceMsgBlockAddress,
  AminoIssuanceMsgUnblockAddress,
  AminoIssuanceMsgSetPauseStatus,
  AminoSwapMsgDeposit,
  AminoSwapMsgWithdraw,
  AminoSwapMsgSwapExactForTokens,
  AminoSwapMsgSwapForExactTokens,
  AminoMsgEarnWithdraw,
  AminoMsgDelegateMintDeposit,
  AminoMsgWithdrawBurnUndelegate,
  AminoMsgWithdrawBurn,
  AminoMsgMintDeposit,
  AminoMsgDelegate,
  AminoMsgUndelegate,
} from './aminoMsgs';

import type { MsgPlaceBid } from '@kava-labs/javascript-sdk/lib/proto/kava/auction/v1beta1/tx';
import type {
  MsgCreateAtomicSwap,
  MsgClaimAtomicSwap,
  MsgRefundAtomicSwap,
} from '@kava-labs/javascript-sdk/lib/proto/kava/bep3/v1beta1/tx';
import type {
  MsgCreateCDP,
  MsgDeposit,
  MsgWithdraw,
  MsgDrawDebt,
  MsgRepayDebt,
} from '@kava-labs/javascript-sdk/lib/proto/kava/cdp/v1beta1/tx';
import type { MsgVote } from '@kava-labs/javascript-sdk/lib/proto/kava/committee/v1beta1/tx';
import type {
  MsgDeposit as HardMsgDeposit,
  MsgWithdraw as HardMsgWithdraw,
  MsgBorrow,
  MsgRepay,
  MsgLiquidate as HardMsgLiquidate,
} from '@kava-labs/javascript-sdk/lib/proto/kava/hard/v1beta1/tx';
import type {
  MsgClaimUSDXMintingReward,
  MsgClaimHardReward,
  MsgClaimDelegatorReward,
  MsgClaimSwapReward,
  MsgClaimEarnReward,
  MsgClaimSavingsReward,
} from '@kava-labs/javascript-sdk/lib/proto/kava/incentive/v1beta1/tx';
import type {
  MsgIssueTokens,
  MsgRedeemTokens,
  MsgBlockAddress,
  MsgUnblockAddress,
  MsgSetPauseStatus,
} from '@kava-labs/javascript-sdk/lib/proto/kava/issuance/v1beta1/tx';
import type {
  MsgDeposit as SwapMsgDeposit,
  MsgWithdraw as SwapMsgWithdraw,
  MsgSwapExactForTokens,
  MsgSwapForExactTokens,
} from '@kava-labs/javascript-sdk/lib/proto/kava/swap/v1beta1/tx';
import type { MsgWithdrawDelegatorReward } from 'cosmjs-types/cosmos/distribution/v1beta1/tx';
import type {
  MsgDeposit as EarnMsgDeposit,
  MsgWithdraw as EarnMsgWithdraw,
} from '@kava-labs/javascript-sdk/lib/proto/kava/earn/v1beta1/tx';
import type {
  MsgConvertERC20ToCoin,
  MsgConvertCoinToERC20,
  MsgConvertCosmosCoinToERC20,
  MsgConvertCosmosCoinFromERC20,
} from '@kava-labs/javascript-sdk/lib/proto/kava/evmutil/v1beta1/tx';
import type {
  MsgDelegateMintDeposit,
  MsgMintDeposit,
  MsgWithdrawBurn,
  MsgWithdrawBurnUndelegate,
} from '@kava-labs/javascript-sdk/lib/proto/kava/router/v1beta1/tx';
import type {
  MsgDelegate,
  MsgUndelegate,
} from '@kava-labs/javascript-sdk/lib/proto/cosmos/staking/v1beta1/tx';

export function convertAminoDecToProtoDec(aminoDec: string): string {
  return new Big(aminoDec).times('1e18').toFixed(0);
}

export function convertProtoDecToAminoDec(protoDec: string): string {
  return new Big(protoDec).div('1e18').toFixed(18);
}

function omitDefault<T extends string | number | Long>(
  input: T,
): T | undefined {
  if (typeof input === 'string') {
    return input === '' ? undefined : input;
  }

  if (typeof input === 'number') {
    return input === 0 ? undefined : input;
  }

  if (Long.isLong(input)) {
    return input.isZero() ? undefined : input;
  }

  throw new Error(`Got unsupported type '${typeof input}'`);
}

export async function createDefaultTypes(): Promise<
  Record<string, AminoConverter>
> {
  const {
    CdpMessages,
    CommitteeMessages,
    CosmosSdkMessages,
    EarnMessages,
    EvmUtilMessages,
    HardMessages,
    IncentiveMessages,
    RouterMessages,
  } = await import('./messageTypes');

  return {
    '/kava.auction.v1beta1.MsgPlaceBid': {
      aminoType: 'auction/MsgPlaceBid',
      toAmino: ({
        auctionId,
        bidder,
        amount,
      }: MsgPlaceBid): AminoAuctionMsgPlaceBid['value'] => {
        if (!amount) {
          throw new Error('amount must be defined');
        }
        return {
          auction_id: auctionId.toString(),
          bidder: bidder,
          amount: amount,
        };
      },
      fromAmino: ({
        auction_id,
        bidder,
        amount,
      }: AminoAuctionMsgPlaceBid['value']): MsgPlaceBid => ({
        auctionId: Long.fromString(auction_id),
        bidder: bidder,
        amount: amount,
      }),
    },

    '/kava.bep3.v1beta1.MsgCreateAtomicSwap': {
      aminoType: 'bep3/MsgCreateAtomicSwap',
      toAmino: ({
        from,
        to,
        recipientOtherChain,
        senderOtherChain,
        randomNumberHash,
        timestamp,
        amount,
        heightSpan,
      }: MsgCreateAtomicSwap): AminoBep3MsgCreateAtomicSwap['value'] => {
        if (!amount) {
          throw new Error('amount must be defined');
        }
        return {
          from: from,
          to: to,
          recipient_other_chain: recipientOtherChain,
          sender_other_chain: senderOtherChain,
          random_number_hash: randomNumberHash,
          timestamp: timestamp.toString(),
          amount: amount,
          height_span: heightSpan.toString(),
        };
      },
      fromAmino: ({
        from,
        to,
        recipient_other_chain,
        sender_other_chain,
        random_number_hash,
        timestamp,
        amount,
        height_span,
      }: AminoBep3MsgCreateAtomicSwap['value']): MsgCreateAtomicSwap => ({
        from: from,
        to: to,
        recipientOtherChain: recipient_other_chain,
        senderOtherChain: sender_other_chain,
        randomNumberHash: random_number_hash,
        timestamp: Long.fromString(timestamp),
        amount: [...amount],
        heightSpan: Long.fromString(height_span),
      }),
    },
    '/kava.bep3.v1beta1.MsgClaimAtomicSwap': {
      aminoType: 'bep3/MsgClaimAtomicSwap',
      toAmino: ({
        from,
        swapId,
        randomNumber,
      }: MsgClaimAtomicSwap): AminoBep3MsgClaimAtomicSwap['value'] => {
        return {
          from: from,
          swap_id: swapId,
          random_number: randomNumber,
        };
      },
      fromAmino: ({
        from,
        swap_id,
        random_number,
      }: AminoBep3MsgClaimAtomicSwap['value']): MsgClaimAtomicSwap => ({
        from: from,
        swapId: swap_id,
        randomNumber: random_number,
      }),
    },
    '/kava.bep3.v1beta1.MsgRefundAtomicSwap': {
      aminoType: 'bep3/MsgRefundAtomicSwap',
      toAmino: ({
        from,
        swapId,
      }: MsgRefundAtomicSwap): AminoBep3MsgRefundAtomicSwap['value'] => {
        return {
          from: from,
          swap_id: swapId,
        };
      },
      fromAmino: ({
        from,
        swap_id,
      }: AminoBep3MsgRefundAtomicSwap['value']): MsgRefundAtomicSwap => ({
        from: from,
        swapId: swap_id,
      }),
    },
    '/kava.cdp.v1beta1.MsgCreateCDP': {
      aminoType: CdpMessages.msgCreateCdp,
      toAmino: ({
        sender,
        collateral,
        principal,
        collateralType,
      }: MsgCreateCDP): AminoCdpMsgCreateCDP['value'] => {
        if (!collateral) {
          throw new Error('collateral must be defined');
        }
        if (!principal) {
          throw new Error('principal must be defined');
        }
        return {
          sender: sender,
          collateral: collateral,
          principal: principal,
          collateral_type: collateralType,
        };
      },
      fromAmino: ({
        sender,
        collateral,
        principal,
        collateral_type,
      }: AminoCdpMsgCreateCDP['value']): MsgCreateCDP => ({
        sender: sender,
        collateral: collateral,
        principal: principal,
        collateralType: collateral_type,
      }),
    },
    '/kava.cdp.v1beta1.MsgDeposit': {
      aminoType: CdpMessages.msgDeposit,
      toAmino: ({
        depositor,
        owner,
        collateral,
        collateralType,
      }: MsgDeposit): AminoCdpMsgDeposit['value'] => {
        if (!collateral) {
          throw new Error('collateral must be defined');
        }
        return {
          depositor: depositor,
          owner: owner,
          collateral: collateral,
          collateral_type: collateralType,
        };
      },
      fromAmino: ({
        depositor,
        owner,
        collateral,
        collateral_type,
      }: AminoCdpMsgDeposit['value']): MsgDeposit => ({
        depositor: depositor,
        owner: owner,
        collateral: collateral,
        collateralType: collateral_type,
      }),
    },
    '/kava.cdp.v1beta1.MsgWithdraw': {
      aminoType: CdpMessages.msgWithdraw,
      toAmino: ({
        depositor,
        owner,
        collateral,
        collateralType,
      }: MsgWithdraw): AminoCdpMsgWithdraw['value'] => {
        if (!collateral) {
          throw new Error('collateral must be defined');
        }
        return {
          depositor: depositor,
          owner: owner,
          collateral: collateral,
          collateral_type: collateralType,
        };
      },
      fromAmino: ({
        depositor,
        owner,
        collateral,
        collateral_type,
      }: AminoCdpMsgWithdraw['value']): MsgWithdraw => ({
        depositor: depositor,
        owner: owner,
        collateral: collateral,
        collateralType: collateral_type,
      }),
    },
    '/kava.cdp.v1beta1.MsgDrawDebt': {
      aminoType: CdpMessages.msgDrawDebt,
      toAmino: ({
        sender,
        principal,
        collateralType,
      }: MsgDrawDebt): AminoCdpMsgDrawDebt['value'] => {
        if (!principal) {
          throw new Error('principal must be defined');
        }
        return {
          sender: sender,
          principal: principal,
          collateral_type: collateralType,
        };
      },
      fromAmino: ({
        sender,
        principal,
        collateral_type,
      }: AminoCdpMsgDrawDebt['value']): MsgDrawDebt => ({
        sender: sender,
        principal: principal,
        collateralType: collateral_type,
      }),
    },
    '/kava.cdp.v1beta1.MsgRepayDebt': {
      aminoType: CdpMessages.msgRepayDebt,
      toAmino: ({
        sender,
        payment,
        collateralType,
      }: MsgRepayDebt): AminoCdpMsgRepayDebt['value'] => {
        if (!payment) {
          throw new Error('payment must be defined');
        }
        return {
          sender: sender,
          payment: payment,
          collateral_type: collateralType,
        };
      },
      fromAmino: ({
        sender,
        payment,
        collateral_type,
      }: AminoCdpMsgRepayDebt['value']): MsgRepayDebt => ({
        sender: sender,
        payment: payment,
        collateralType: collateral_type,
      }),
    },
    '/kava.committee.v1beta1.MsgVote': {
      aminoType: CommitteeMessages.msgVote,
      toAmino: ({
        voter,
        proposalId,
        voteType,
      }: MsgVote): AminoCommitteeMsgVote['value'] => {
        return {
          voter: voter,
          proposal_id: proposalId.toString(),
          vote_type: voteType,
        };
      },
      fromAmino: ({
        voter,
        proposal_id,
        vote_type,
      }: AminoCommitteeMsgVote['value']): MsgVote => ({
        voter: voter,
        proposalId: Long.fromString(proposal_id),
        voteType: vote_type,
      }),
    },

    '/kava.hard.v1beta1.MsgDeposit': {
      aminoType: HardMessages.msgDeposit,
      toAmino: ({
        depositor,
        amount,
      }: HardMsgDeposit): AminoHardMsgDeposit['value'] => {
        if (!amount) {
          throw new Error('amount must be defined');
        }
        return {
          depositor: depositor,
          amount: amount,
        };
      },
      fromAmino: ({
        depositor,
        amount,
      }: AminoHardMsgDeposit['value']): HardMsgDeposit => ({
        depositor: depositor,
        amount: [...amount],
      }),
    },
    '/kava.hard.v1beta1.MsgWithdraw': {
      aminoType: HardMessages.msgWithdraw,
      toAmino: ({
        depositor,
        amount,
      }: HardMsgWithdraw): AminoHardMsgWithdraw['value'] => {
        if (!amount) {
          throw new Error('amount must be defined');
        }
        return {
          depositor: depositor,
          amount: amount,
        };
      },
      fromAmino: ({
        depositor,
        amount,
      }: AminoHardMsgWithdraw['value']): HardMsgWithdraw => ({
        depositor: depositor,
        amount: [...amount],
      }),
    },
    '/kava.hard.v1beta1.MsgBorrow': {
      aminoType: HardMessages.msgBorrow,
      toAmino: ({
        borrower,
        amount,
      }: MsgBorrow): AminoHardMsgBorrow['value'] => {
        if (!amount) {
          throw new Error('amount must be defined');
        }
        return {
          borrower: borrower,
          amount: amount,
        };
      },
      fromAmino: ({
        borrower,
        amount,
      }: AminoHardMsgBorrow['value']): MsgBorrow => ({
        borrower: borrower,
        amount: [...amount],
      }),
    },
    '/kava.hard.v1beta1.MsgRepay': {
      aminoType: HardMessages.msgRepay,
      toAmino: ({
        sender,
        owner,
        amount,
      }: MsgRepay): AminoHardMsgRepay['value'] => {
        if (!amount) {
          throw new Error('amount must be defined');
        }
        return {
          sender: sender,
          owner: owner,
          amount: amount,
        };
      },
      fromAmino: ({
        sender,
        owner,
        amount,
      }: AminoHardMsgRepay['value']): MsgRepay => ({
        sender: sender,
        owner: owner,
        amount: [...amount],
      }),
    },
    '/kava.hard.v1beta1.MsgLiquidate': {
      aminoType: HardMessages.msgLiquidate,
      toAmino: ({
        keeper,
        borrower,
      }: HardMsgLiquidate): AminoHardMsgLiquidate['value'] => {
        return {
          keeper: keeper,
          borrower: borrower,
        };
      },
      fromAmino: ({
        keeper,
        borrower,
      }: AminoHardMsgLiquidate['value']): HardMsgLiquidate => ({
        keeper: keeper,
        borrower: borrower,
      }),
    },

    '/kava.incentive.v1beta1.MsgClaimUSDXMintingReward': {
      aminoType: IncentiveMessages.msgClaimUSDXMintingReward,
      toAmino: ({
        sender,
        multiplierName,
      }: MsgClaimUSDXMintingReward): AminoIncentiveMsgClaimUSDXMintingReward['value'] => {
        return {
          sender: sender,
          multiplier_name: multiplierName,
        };
      },
      fromAmino: ({
        sender,
        multiplier_name,
      }: AminoIncentiveMsgClaimUSDXMintingReward['value']): MsgClaimUSDXMintingReward => ({
        sender: sender,
        multiplierName: multiplier_name,
      }),
    },
    '/kava.incentive.v1beta1.MsgClaimDelegatorReward': {
      aminoType: IncentiveMessages.msgClaimDelegatorReward,
      toAmino: ({
        sender,
        denomsToClaim,
      }: MsgClaimDelegatorReward): AminoIncentiveMsgClaimDelegatorReward['value'] => {
        return {
          sender: sender,
          denoms_to_claim: denomsToClaim.map((d) => ({
            denom: d.denom,
            multiplier_name: d.multiplierName,
          })),
        };
      },
      fromAmino: ({
        sender,
        denoms_to_claim,
      }: AminoIncentiveMsgClaimDelegatorReward['value']): MsgClaimDelegatorReward => ({
        sender: sender,
        denomsToClaim: denoms_to_claim.map((d) => ({
          denom: d.denom,
          multiplierName: d.multiplier_name,
        })),
      }),
    },
    '/kava.incentive.v1beta1.MsgClaimHardReward': {
      aminoType: IncentiveMessages.msgClaimHardReward,
      toAmino: ({
        sender,
        denomsToClaim,
      }: MsgClaimHardReward): AminoIncentiveMsgClaimHardReward['value'] => {
        return {
          sender: sender,
          denoms_to_claim: denomsToClaim.map((d) => ({
            denom: d.denom,
            multiplier_name: d.multiplierName,
          })),
        };
      },
      fromAmino: ({
        sender,
        denoms_to_claim,
      }: AminoIncentiveMsgClaimHardReward['value']): MsgClaimHardReward => ({
        sender: sender,
        denomsToClaim: denoms_to_claim.map((d) => ({
          denom: d.denom,
          multiplierName: d.multiplier_name,
        })),
      }),
    },
    '/kava.incentive.v1beta1.MsgClaimSwapReward': {
      aminoType: IncentiveMessages.msgClaimSwapReward,
      toAmino: ({
        sender,
        denomsToClaim,
      }: MsgClaimSwapReward): AminoIncentiveMsgClaimSwapReward['value'] => {
        return {
          sender: sender,
          denoms_to_claim: denomsToClaim.map((d) => ({
            denom: d.denom,
            multiplier_name: d.multiplierName,
          })),
        };
      },
      fromAmino: ({
        sender,
        denoms_to_claim,
      }: AminoIncentiveMsgClaimSwapReward['value']): MsgClaimSwapReward => ({
        sender: sender,
        denomsToClaim: denoms_to_claim.map((d) => ({
          denom: d.denom,
          multiplierName: d.multiplier_name,
        })),
      }),
    },
    '/kava.incentive.v1beta1.MsgClaimEarnReward': {
      aminoType: IncentiveMessages.msgClaimEarnReward,
      toAmino: ({
        sender,
        denomsToClaim,
      }: MsgClaimEarnReward): AminoIncentiveMsgClaimEarnReward['value'] => {
        return {
          sender: sender,
          denoms_to_claim: denomsToClaim.map((d) => ({
            denom: d.denom,
            multiplier_name: d.multiplierName,
          })),
        };
      },
      fromAmino: ({
        sender,
        denoms_to_claim,
      }: AminoIncentiveMsgClaimEarnReward['value']): MsgClaimEarnReward => ({
        sender: sender,
        denomsToClaim: denoms_to_claim.map((d) => ({
          denom: d.denom,
          multiplierName: d.multiplier_name,
        })),
      }),
    },
    '/kava.incentive.v1beta1.MsgClaimSavingsReward': {
      aminoType: IncentiveMessages.msgClaimSavingsReward,
      toAmino: ({
        sender,
        denomsToClaim,
      }: MsgClaimSavingsReward): AminoIncentiveMsgClaimSavingsReward['value'] => {
        return {
          sender: sender,
          denoms_to_claim: denomsToClaim.map((d) => ({
            denom: d.denom,
            multiplier_name: d.multiplierName,
          })),
        };
      },
      fromAmino: ({
        sender,
        denoms_to_claim,
      }: AminoIncentiveMsgClaimSavingsReward['value']): MsgClaimSavingsReward => ({
        sender: sender,
        denomsToClaim: denoms_to_claim.map((d) => ({
          denom: d.denom,
          multiplierName: d.multiplier_name,
        })),
      }),
    },

    '/kava.issuance.v1beta1.MsgIssueTokens': {
      aminoType: 'issuance/MsgIssueTokens',
      toAmino: ({
        sender,
        receiver,
        tokens,
      }: MsgIssueTokens): AminoIssuanceMsgIssueTokens['value'] => {
        if (!tokens) {
          throw new Error('tokens must be defined');
        }
        return {
          sender: sender,
          receiver: receiver,
          tokens: tokens,
        };
      },
      fromAmino: ({
        sender,
        receiver,
        tokens,
      }: AminoIssuanceMsgIssueTokens['value']): MsgIssueTokens => ({
        sender: sender,
        receiver: receiver,
        tokens: tokens,
      }),
    },
    '/kava.issuance.v1beta1.MsgRedeemTokens': {
      aminoType: 'issuance/MsgRedeemTokens',
      toAmino: ({
        sender,
        tokens,
      }: MsgRedeemTokens): AminoIssuanceMsgRedeemTokens['value'] => {
        if (!tokens) {
          throw new Error('tokens must be defined');
        }
        return {
          sender: sender,
          tokens: tokens,
        };
      },
      fromAmino: ({
        sender,
        tokens,
      }: AminoIssuanceMsgRedeemTokens['value']): MsgRedeemTokens => ({
        sender: sender,
        tokens: tokens,
      }),
    },
    '/kava.issuance.v1beta1.MsgBlockAddress': {
      aminoType: 'issuance/MsgBlockAddress',
      toAmino: ({
        sender,
        blockedAddress,
        denom,
      }: MsgBlockAddress): AminoIssuanceMsgBlockAddress['value'] => {
        return {
          sender: sender,
          blocked_address: blockedAddress,
          denom: denom,
        };
      },
      fromAmino: ({
        sender,
        blocked_address,
        denom,
      }: AminoIssuanceMsgBlockAddress['value']): MsgBlockAddress => ({
        sender: sender,
        blockedAddress: blocked_address,
        denom: denom,
      }),
    },
    '/kava.issuance.v1beta1.MsgUnblockAddress': {
      aminoType: 'issuance/MsgUnblockAddress',
      toAmino: ({
        sender,
        blockedAddress,
        denom,
      }: MsgUnblockAddress): AminoIssuanceMsgUnblockAddress['value'] => {
        return {
          sender: sender,
          blocked_address: blockedAddress,
          denom: denom,
        };
      },
      fromAmino: ({
        sender,
        blocked_address,
        denom,
      }: AminoIssuanceMsgUnblockAddress['value']): MsgUnblockAddress => ({
        sender: sender,
        blockedAddress: blocked_address,
        denom: denom,
      }),
    },
    '/kava.issuance.v1beta1.MsgSetPauseStatus': {
      aminoType: 'issuance/MsgSetPauseStatus',
      toAmino: ({
        sender,
        denom,
        status,
      }: MsgSetPauseStatus): AminoIssuanceMsgSetPauseStatus['value'] => {
        return {
          sender: sender,
          denom: denom,
          status: status,
        };
      },
      fromAmino: ({
        sender,
        denom,
        status,
      }: AminoIssuanceMsgSetPauseStatus['value']): MsgSetPauseStatus => ({
        sender: sender,
        denom: denom,
        status: status,
      }),
    },
    '/kava.swap.v1beta1.MsgDeposit': {
      aminoType: 'swap/MsgDeposit',
      toAmino: ({
        depositor,
        tokenA,
        tokenB,
        slippage,
        deadline,
      }: SwapMsgDeposit): AminoSwapMsgDeposit['value'] => {
        if (!tokenA) {
          throw new Error('tokenA must be defined');
        }
        if (!tokenB) {
          throw new Error('tokenB must be defined');
        }
        return {
          depositor: depositor,
          token_a: tokenA,
          token_b: tokenB,
          slippage: convertProtoDecToAminoDec(slippage),
          deadline: deadline.toString(),
        };
      },
      fromAmino: ({
        depositor,
        token_a,
        token_b,
        slippage,
        deadline,
      }: AminoSwapMsgDeposit['value']): SwapMsgDeposit => ({
        depositor: depositor,
        tokenA: token_a,
        tokenB: token_b,
        slippage: convertAminoDecToProtoDec(slippage),
        deadline: Long.fromString(deadline),
      }),
    },
    '/kava.swap.v1beta1.MsgWithdraw': {
      aminoType: 'swap/MsgWithdraw',
      toAmino: ({
        from,
        shares,
        minTokenA,
        minTokenB,
        deadline,
      }: SwapMsgWithdraw): AminoSwapMsgWithdraw['value'] => {
        if (!minTokenA) {
          throw new Error('minTokenA must be defined');
        }
        if (!minTokenB) {
          throw new Error('minTokenB must be defined');
        }
        return {
          from: from,
          shares: shares,
          min_token_a: minTokenA,
          min_token_b: minTokenB,
          deadline: deadline.toString(),
        };
      },
      fromAmino: ({
        from,
        shares,
        min_token_a,
        min_token_b,
        deadline,
      }: AminoSwapMsgWithdraw['value']): SwapMsgWithdraw => ({
        from: from,
        shares: shares,
        minTokenA: min_token_a,
        minTokenB: min_token_b,
        deadline: Long.fromString(deadline),
      }),
    },
    '/kava.swap.v1beta1.MsgSwapExactForTokens': {
      aminoType: 'swap/MsgSwapExactForTokens',
      toAmino: ({
        requester,
        exactTokenA,
        tokenB,
        slippage,
        deadline,
      }: MsgSwapExactForTokens): AminoSwapMsgSwapExactForTokens['value'] => {
        if (!exactTokenA) {
          throw new Error('token_a must be defined');
        }
        if (!tokenB) {
          throw new Error('exactTokenB must be defined');
        }
        return {
          requester: requester,
          exact_token_a: exactTokenA,
          token_b: tokenB,
          slippage: convertProtoDecToAminoDec(slippage),
          deadline: deadline.toString(),
        };
      },
      fromAmino: ({
        requester,
        exact_token_a,
        token_b,
        slippage,
        deadline,
      }: AminoSwapMsgSwapExactForTokens['value']): MsgSwapExactForTokens => ({
        requester: requester,
        exactTokenA: exact_token_a,
        tokenB: token_b,
        slippage: convertAminoDecToProtoDec(slippage),
        deadline: Long.fromString(deadline),
      }),
    },
    '/kava.swap.v1beta1.MsgSwapForExactTokens': {
      aminoType: 'swap/MsgSwapForExactTokens',
      toAmino: ({
        requester,
        tokenA,
        exactTokenB,
        slippage,
        deadline,
      }: MsgSwapForExactTokens): AminoSwapMsgSwapForExactTokens['value'] => {
        if (!tokenA) {
          throw new Error('token_a must be defined');
        }
        if (!exactTokenB) {
          throw new Error('exactTokenB must be defined');
        }
        return {
          requester: requester,
          token_a: tokenA,
          exact_token_b: exactTokenB,
          slippage: convertProtoDecToAminoDec(slippage),
          deadline: deadline.toString(),
        };
      },
      fromAmino: ({
        requester,
        token_a,
        exact_token_b,
        slippage,
        deadline,
      }: AminoSwapMsgSwapForExactTokens['value']): MsgSwapForExactTokens => ({
        requester: requester,
        tokenA: token_a,
        exactTokenB: exact_token_b,
        slippage: convertAminoDecToProtoDec(slippage),
        deadline: Long.fromString(deadline),
      }),
    },
    '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward': {
      aminoType: CosmosSdkMessages.msgWithdrawDelegationReward,
      toAmino: ({
        delegatorAddress,
        validatorAddress,
      }: MsgWithdrawDelegatorReward): AminoMsgWithdrawDelegatorReward['value'] => ({
        delegator_address: delegatorAddress,
        validator_address: validatorAddress,
      }),
      fromAmino: ({
        delegator_address,
        validator_address,
      }: AminoMsgWithdrawDelegatorReward['value']): MsgWithdrawDelegatorReward => ({
        delegatorAddress: delegator_address,
        validatorAddress: validator_address,
      }),
    },
    '/cosmos.staking.v1beta1.MsgDelegate': {
      aminoType: CosmosSdkMessages.msgDelegate,
      toAmino: ({
        delegatorAddress,
        validatorAddress,
        amount,
      }: MsgDelegate): AminoMsgDelegate['value'] => ({
        delegator_address: delegatorAddress,
        validator_address: validatorAddress,
        amount: amount,
      }),
      fromAmino: ({
        delegator_address,
        validator_address,
        amount,
      }: AminoMsgDelegate['value']): MsgDelegate => ({
        delegatorAddress: delegator_address,
        validatorAddress: validator_address,
        amount: amount,
      }),
    },
    '/cosmos.staking.v1beta1.MsgUndelegate': {
      aminoType: CosmosSdkMessages.msgUndelegate,
      toAmino: ({
        delegatorAddress,
        validatorAddress,
        amount,
      }: MsgUndelegate): AminoMsgUndelegate['value'] => ({
        delegator_address: delegatorAddress,
        validator_address: validatorAddress,
        amount: amount,
      }),
      fromAmino: ({
        delegator_address,
        validator_address,
        amount,
      }: AminoMsgDelegate['value']): MsgUndelegate => ({
        delegatorAddress: delegator_address,
        validatorAddress: validator_address,
        amount: amount,
      }),
    },
    '/kava.earn.v1beta1.MsgDeposit': {
      aminoType: EarnMessages.msgDeposit,
      toAmino: ({
        amount,
        depositor,
        strategy,
      }: EarnMsgDeposit): AminoMsgEarnDeposit['value'] => ({
        amount: amount as any, // javascript has all as optional
        depositor: depositor,
        strategy: strategy,
      }),
      fromAmino: ({
        amount,
        depositor,
        strategy,
      }: AminoMsgEarnDeposit['value']): EarnMsgDeposit => ({
        amount: amount as any,
        depositor: depositor,
        strategy: strategy,
      }),
    },
    '/kava.earn.v1beta1.MsgWithdraw': {
      aminoType: EarnMessages.msgWithdraw,
      toAmino: ({
        amount,
        from,
        strategy,
      }: EarnMsgWithdraw): AminoMsgEarnWithdraw['value'] => ({
        amount: amount as any,
        from: from,
        strategy: strategy,
      }),
      fromAmino: ({
        amount,
        from,
        strategy,
      }: AminoMsgEarnWithdraw['value']): EarnMsgWithdraw => ({
        amount: amount,
        from: from,
        strategy: strategy,
      }),
    },

    '/kava.evmutil.v1beta1.MsgConvertERC20ToCoin': {
      aminoType: EvmUtilMessages.msgConvertERC20ToCoinType,
      toAmino: ({
        initiator,
        receiver,
        kavaErc20Address,
        amount,
      }: MsgConvertERC20ToCoin): AminoMsgConvertERC20ToCoin['value'] => {
        return {
          initiator: initiator,
          receiver: receiver,
          kava_erc20_address: kavaErc20Address,
          amount: amount,
        };
      },
      fromAmino: ({
        initiator,
        receiver,
        kava_erc20_address,
        amount,
      }: AminoMsgConvertERC20ToCoin['value']): MsgConvertERC20ToCoin => {
        return {
          initiator: initiator,
          receiver: receiver,
          kavaErc20Address: kava_erc20_address,
          amount: amount,
        };
      },
    },
    '/kava.evmutil.v1beta1.MsgConvertCoinToERC20': {
      aminoType: EvmUtilMessages.msgConvertCoinToERC20,
      toAmino: ({
        initiator,
        receiver,
        amount,
      }: MsgConvertCoinToERC20): AminoMsgConvertCoinToERC20['value'] => ({
        initiator: initiator,
        receiver: receiver,
        amount: amount as any,
      }),
      fromAmino: ({
        initiator,
        receiver,
        amount,
      }: AminoMsgConvertCoinToERC20['value']): MsgConvertCoinToERC20 => ({
        initiator: initiator,
        receiver: receiver,
        amount: amount,
      }),
    },
    '/kava.evmutil.v1beta1.MsgConvertCosmosCoinToERC20': {
      aminoType: EvmUtilMessages.msgConvertCosmosCoinToERC20,
      toAmino: ({
        initiator,
        receiver,
        amount,
      }: MsgConvertCosmosCoinToERC20): AminoMsgConvertCosmosCoinToERC20['value'] => ({
        initiator: initiator,
        receiver: receiver,
        amount: amount as any,
      }),
      fromAmino: ({
        initiator,
        receiver,
        amount,
      }: AminoMsgConvertCosmosCoinToERC20['value']): MsgConvertCosmosCoinToERC20 => ({
        initiator: initiator,
        receiver: receiver,
        amount: amount,
      }),
    },
    '/kava.evmutil.v1beta1.MsgConvertCosmosCoinFromERC20': {
      aminoType: EvmUtilMessages.msgConvertCosmosCoinFromERC20,
      toAmino: ({
        initiator,
        receiver,
        amount,
      }: MsgConvertCosmosCoinFromERC20): AminoMsgConvertCosmosCoinFromERC20['value'] => ({
        initiator: initiator,
        receiver: receiver,
        amount: amount as any,
      }),
      fromAmino: ({
        initiator,
        receiver,
        amount,
      }: AminoMsgConvertCosmosCoinFromERC20['value']): MsgConvertCosmosCoinFromERC20 => ({
        initiator: initiator,
        receiver: receiver,
        amount: amount,
      }),
    },
    '/kava.router.v1beta1.MsgMintDeposit': {
      aminoType: RouterMessages.msgMintDeposit,
      toAmino: ({
        depositor,
        validator,
        amount,
      }: MsgMintDeposit): AminoMsgMintDeposit['value'] => ({
        depositor: depositor,
        validator: validator,
        amount: amount as any,
      }),
      fromAmino: ({
        amount,
        depositor,
        validator,
      }: AminoMsgMintDeposit['value']): MsgMintDeposit => ({
        depositor: depositor,
        validator: validator,
        amount: amount as any,
      }),
    },
    '/kava.router.v1beta1.MsgWithdrawBurn': {
      aminoType: RouterMessages.msgWithdrawBurn,
      toAmino: ({
        from,
        validator,
        amount,
      }: MsgWithdrawBurn): AminoMsgWithdrawBurn['value'] => ({
        from: from,
        validator: validator,
        amount: amount as any,
      }),
      fromAmino: ({
        amount,
        from,
        validator,
      }: AminoMsgWithdrawBurn['value']): MsgWithdrawBurn => ({
        from: from,
        validator: validator,
        amount: amount as any,
      }),
    },
    '/kava.router.v1beta1.MsgDelegateMintDeposit': {
      aminoType: RouterMessages.msgDelegateMintDeposit,
      toAmino: ({
        depositor,
        validator,
        amount,
      }: MsgDelegateMintDeposit): AminoMsgDelegateMintDeposit['value'] => ({
        depositor: depositor,
        validator: validator,
        amount: amount as any,
      }),
      fromAmino: ({
        amount,
        depositor,
        validator,
      }: AminoMsgDelegateMintDeposit['value']): MsgDelegateMintDeposit => ({
        depositor: depositor,
        validator: validator,
        amount: amount as any,
      }),
    },
    '/kava.router.v1beta1.MsgWithdrawBurnUndelegate': {
      aminoType: RouterMessages.msgWithdrawBurnUndelegate,
      toAmino: ({
        from,
        validator,
        amount,
      }: MsgWithdrawBurnUndelegate): AminoMsgWithdrawBurnUndelegate['value'] => ({
        from: from,
        validator: validator,
        amount: amount as any,
      }),
      fromAmino: ({
        amount,
        from,
        validator,
      }: AminoMsgWithdrawBurnUndelegate['value']): MsgWithdrawBurnUndelegate => ({
        from: from,
        validator: validator,
        amount: amount as any,
      }),
    },
    '/ibc.applications.transfer.v1.MsgTransfer': {
      aminoType: CosmosSdkMessages.msgTransfer,
      toAmino: ({
        sourcePort,
        sourceChannel,
        token,
        sender,
        receiver,
        timeoutHeight,
        timeoutTimestamp,
        memo,
      }: any) => {
        const msg = {
          source_port: sourcePort,
          source_channel: sourceChannel,
          token: token,
          sender: sender,
          receiver: receiver,
          timeout_height: timeoutHeight
            ? {
                revision_height: omitDefault(
                  timeoutHeight.revisionHeight,
                )?.toString(),
                revision_number: omitDefault(
                  timeoutHeight.revisionNumber,
                )?.toString(),
              }
            : {},
          timeout_timestamp: omitDefault(timeoutTimestamp)?.toString(),
        };
        if (memo && memo.length) {
          // @ts-expect-error memo is a string
          msg.memo = memo;
        }

        return msg;
      },
      fromAmino: ({
        source_port,
        source_channel,
        token,
        sender,
        receiver,
        timeout_height,
        timeout_timestamp,
        memo,
      }: any) => {
        const msg = {
          sourcePort: source_port,
          sourceChannel: source_channel,
          token: token,
          sender: sender,
          receiver: receiver,
          timeoutHeight: timeout_height
            ? {
                revisionHeight: Long.fromString(
                  timeout_height.revision_height || '0',
                  true,
                ),
                revisionNumber: Long.fromString(
                  timeout_height.revision_number || '0',
                  true,
                ),
              }
            : undefined,
          timeoutTimestamp: Long.fromString(timeout_timestamp || '0', true),
        };

        if (memo && memo.length) {
          // @ts-expect-error memo is a string
          msg.memo = memo;
        }
        return msg;
      },
    },
  };
}
