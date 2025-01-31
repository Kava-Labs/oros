import type { GeneratedType } from '@cosmjs/proto-signing';

export const defaultRegistryTypes = async (): Promise<
  ReadonlyArray<[string, GeneratedType]>
> => {
  const { MsgTransfer } = await import(
    'cosmjs-types/ibc/applications/transfer/v1/tx'
  );

  // MsgTransfer.decode
  const msgTransferEncoder = MsgTransfer.encode;
  const msgTransferFromPartial = MsgTransfer.fromPartial;

  MsgTransfer.encode = function (msg, protoWriter) {
    const writer = msgTransferEncoder.apply(this, [msg, protoWriter]);
    // @ts-expect-error memo is a string
    if (msg.memo && msg.memo.length) {
      // @ts-expect-error memo is a string
      writer.uint32(66).string(msg.memo);
    }

    return writer;
  };

  MsgTransfer.fromPartial = function (obj) {
    const msg = msgTransferFromPartial.apply(this, [obj]);
    // @ts-expect-error memo is a string
    if (obj.memo && obj.memo.length) {
      // @ts-expect-error memo is a string
      msg.memo = obj.memo;
    }
    return msg;
  };

  const {
    MsgCreateCDP,
    MsgDeposit,
    MsgWithdraw,
    MsgDrawDebt,
    MsgRepayDebt,
    MsgLiquidate,
  } = await import('@kava-labs/javascript-sdk/lib/proto/kava/cdp/v1beta1/tx');

  const { defaultRegistryTypes: cosmosTypes } = await import(
    '@cosmjs/stargate'
  );
  const { MsgPlaceBid } = await import(
    '@kava-labs/javascript-sdk/lib/proto/kava/auction/v1beta1/tx'
  );

  const { MsgCreateAtomicSwap, MsgClaimAtomicSwap, MsgRefundAtomicSwap } =
    await import('@kava-labs/javascript-sdk/lib/proto/kava/bep3/v1beta1/tx');

  const { MsgSubmitProposal, MsgVote } = await import(
    '@kava-labs/javascript-sdk/lib/proto/kava/committee/v1beta1/tx'
  );

  const {
    MsgDeposit: HardMsgDeposit,
    MsgWithdraw: HardMsgWithdraw,
    MsgBorrow,
    MsgRepay,
  } = await import('@kava-labs/javascript-sdk/lib/proto/kava/hard/v1beta1/tx');

  const {
    MsgClaimUSDXMintingReward,
    MsgClaimHardReward,
    MsgClaimDelegatorReward,
    MsgClaimSwapReward,
    MsgClaimEarnReward,
    MsgClaimSavingsReward,
  } = await import(
    '@kava-labs/javascript-sdk/lib/proto/kava/incentive/v1beta1/tx'
  );

  const {
    MsgIssueTokens,
    MsgRedeemTokens,
    MsgBlockAddress,
    MsgUnblockAddress,
    MsgSetPauseStatus,
  } = await import(
    '@kava-labs/javascript-sdk/lib/proto/kava/issuance/v1beta1/tx'
  );

  const { MsgPostPrice } = await import(
    '@kava-labs/javascript-sdk/lib/proto/kava/pricefeed/v1beta1/tx'
  );

  const {
    MsgDeposit: SwapMsgDeposit,
    MsgWithdraw: SwapMsgWithdraw,
    MsgSwapExactForTokens,
    MsgSwapForExactTokens,
  } = await import('@kava-labs/javascript-sdk/lib/proto/kava/swap/v1beta1/tx');

  const {
    MsgMintDeposit,
    MsgWithdrawBurn,
    MsgDelegateMintDeposit,
    MsgWithdrawBurnUndelegate,
  } = await import(
    '@kava-labs/javascript-sdk/lib/proto/kava/router/v1beta1/tx'
  );

  const { ExtensionOptionsWeb3Tx } = await import(
    '@kava-labs/javascript-sdk/lib/proto/ethermint/types/v1/web3'
  );
  const { PubKey } = await import(
    '@kava-labs/javascript-sdk/lib/proto/ethermint/crypto/v1/ethsecp256k1/keys'
  );

  const {
    MsgConvertERC20ToCoin,
    MsgConvertCoinToERC20,
    MsgConvertCosmosCoinToERC20,
    MsgConvertCosmosCoinFromERC20,
  } = await import(
    '@kava-labs/javascript-sdk/lib/proto/kava/evmutil/v1beta1/tx'
  );

  const { MsgDeposit: EarnMsgDeposit, MsgWithdraw: EarnMsgWithdraw } =
    await import('@kava-labs/javascript-sdk/lib/proto/kava/earn/v1beta1/tx');

  const { MsgDelegate, MsgUndelegate } = await import(
    '@kava-labs/javascript-sdk/lib/proto/cosmos/staking/v1beta1/tx'
  );

  return [
    ...cosmosTypes,
    ['/kava.auction.v1beta1.MsgPlaceBid', MsgPlaceBid],
    ['/kava.bep3.v1beta1.MsgCreateAtomicSwap', MsgCreateAtomicSwap],
    ['/kava.bep3.v1beta1.MsgClaimAtomicSwap', MsgClaimAtomicSwap],
    ['/kava.bep3.v1beta1.MsgRefundAtomicSwap', MsgRefundAtomicSwap],
    ['/kava.cdp.v1beta1.MsgCreateCDP', MsgCreateCDP],
    ['/kava.cdp.v1beta1.MsgDeposit', MsgDeposit],
    ['/kava.cdp.v1beta1.MsgWithdraw', MsgWithdraw],
    ['/kava.cdp.v1beta1.MsgDrawDebt', MsgDrawDebt],
    ['/kava.cdp.v1beta1.MsgRepayDebt', MsgRepayDebt],
    ['/kava.cdp.v1beta1.MsgLiquidate', MsgLiquidate],
    ['/kava.committee.v1beta1.MsgSubmitPropsal', MsgSubmitProposal],
    ['/kava.committee.v1beta1.MsgVote', MsgVote],
    ['/kava.hard.v1beta1.MsgDeposit', HardMsgDeposit],
    ['/kava.hard.v1beta1.MsgWithdraw', HardMsgWithdraw],
    ['/kava.hard.v1beta1.MsgBorrow', MsgBorrow],
    ['/kava.hard.v1beta1.MsgRepay', MsgRepay],
    [
      '/kava.incentive.v1beta1.MsgClaimUSDXMintingReward',
      MsgClaimUSDXMintingReward,
    ],
    ['/kava.incentive.v1beta1.MsgClaimHardReward', MsgClaimHardReward],
    [
      '/kava.incentive.v1beta1.MsgClaimDelegatorReward',
      MsgClaimDelegatorReward,
    ],
    ['/kava.incentive.v1beta1.MsgClaimSwapReward', MsgClaimSwapReward],
    ['/kava.incentive.v1beta1.MsgClaimEarnReward', MsgClaimEarnReward],
    ['/kava.incentive.v1beta1.MsgClaimSavingsReward', MsgClaimSavingsReward],
    ['/kava.issuance.v1beta1.MsgIssueTokens', MsgIssueTokens],
    ['/kava.issuance.v1beta1.MsgRedeemTokens', MsgRedeemTokens],
    ['/kava.issuance.v1beta1.MsgBlockAddress', MsgBlockAddress],
    ['/kava.issuance.v1beta1.MsgUnblockAddress', MsgUnblockAddress],
    ['/kava.issuance.v1beta1.MsgSetPauseStatus', MsgSetPauseStatus],
    ['/kava.pricefeed.v1beta1.MsgPostPrice', MsgPostPrice],
    ['/kava.swap.v1beta1.MsgDeposit', SwapMsgDeposit],
    ['/kava.swap.v1beta1.MsgWithdraw', SwapMsgWithdraw],
    ['/kava.swap.v1beta1.MsgSwapExactForTokens', MsgSwapExactForTokens],
    ['/kava.swap.v1beta1.MsgSwapForExactTokens', MsgSwapForExactTokens],
    ['/ethermint.types.v1.ExtensionOptionsWeb3Tx', ExtensionOptionsWeb3Tx],
    ['/ethermint.crypto.v1.ethsecp256k1.PubKey', PubKey],
    ['/kava.evmutil.v1beta1.MsgConvertERC20ToCoin', MsgConvertERC20ToCoin],
    ['/kava.evmutil.v1beta1.MsgConvertCoinToERC20', MsgConvertCoinToERC20],
    [
      '/kava.evmutil.v1beta1.MsgConvertCosmosCoinToERC20',
      MsgConvertCosmosCoinToERC20,
    ],
    [
      '/kava.evmutil.v1beta1.MsgConvertCosmosCoinFromERC20',
      MsgConvertCosmosCoinFromERC20,
    ],
    ['/kava.earn.v1beta1.MsgDeposit', EarnMsgDeposit],
    ['/kava.earn.v1beta1.MsgWithdraw', EarnMsgWithdraw],
    ['/kava.router.v1beta1.MsgMintDeposit', MsgMintDeposit],
    ['/kava.router.v1beta1.MsgWithdrawBurn', MsgWithdrawBurn],
    ['/kava.router.v1beta1.MsgDelegateMintDeposit', MsgDelegateMintDeposit],
    [
      '/kava.router.v1beta1.MsgWithdrawBurnUndelegate',
      MsgWithdrawBurnUndelegate,
    ],
    ['cosmos.distribution.v1beta1.MsgDelegate', MsgDelegate],
    ['cosmos.distribution.v1beta1.MsgUndelegate', MsgUndelegate],
    ['/ibc.applications.transfer.v1.MsgTransfer', MsgTransfer],
  ];
};
