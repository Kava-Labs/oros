export enum CosmosSdkMessages {
  msgTransfer = 'cosmos-sdk/MsgTransfer',
  msgWithdrawDelegationReward = 'cosmos-sdk/MsgWithdrawDelegationReward',
  msgDelegate = 'cosmos-sdk/MsgDelegate',
  msgUndelegate = 'cosmos-sdk/MsgUndelegate',
  msgBeginRedelegate = 'cosmos-sdk/MsgBeginRedelegate',
  msgVote = 'cosmos-sdk/MsgVote',
  msgSend = 'cosmos-sdk/MsgSend',
}

enum LiquidMessages {
  msgMintDerivative = 'liquid/MsgMintDerivative',
  msgBurnDerivative = 'liquid/MsgBurnDerivative',
}

export enum HardMessages {
  msgWithdraw = 'hard/MsgWithdraw',
  msgDeposit = 'hard/MsgDeposit',
  msgBorrow = 'hard/MsgBorrow',
  msgRepay = 'hard/MsgRepay',
  msgLiquidate = 'hard/MsgLiquidate',
}

export enum CdpMessages {
  msgCreateCdp = 'cdp/MsgCreateCDP',
  msgDeposit = 'cdp/MsgDeposit',
  msgWithdraw = 'cdp/MsgWithdraw',
  msgRepayDebt = 'cdp/MsgRepayDebt',
  msgDrawDebt = 'cdp/MsgDrawDebt',
}

export enum CommitteeMessages {
  msgVote = 'kava/MsgVote',
}

export enum RouterMessages {
  msgMintDeposit = 'router/MsgMintDeposit',
  msgDelegateMintDeposit = 'router/MsgDelegateMintDeposit',
  msgWithdrawBurn = 'router/MsgWithdrawBurn',
  msgWithdrawBurnUndelegate = 'router/MsgWithdrawBurnUndelegate',
}

export enum EvmUtilMessages {
  msgConvertERC20ToCoinType = 'evmutil/MsgConvertERC20ToCoin',
  msgConvertCoinToERC20 = 'evmutil/MsgConvertCoinToERC20',
  msgConvertCosmosCoinToERC20 = 'evmutil/MsgConvertCosmosCoinToERC20',
  msgConvertCosmosCoinFromERC20 = 'evmutil/MsgConvertCosmosCoinFromERC20',
}

export enum EarnMessages {
  msgDeposit = 'earn/MsgDeposit',
  msgWithdraw = 'earn/MsgWithdraw',
}

export enum IncentiveMessages {
  msgClaimUSDXMintingReward = 'incentive/MsgClaimUSDXMintingReward',
  msgClaimHardReward = 'incentive/MsgClaimHardReward',
  msgClaimDelegatorReward = 'incentive/MsgClaimDelegatorReward',
  msgClaimSwapReward = 'incentive/MsgClaimSwapReward',
  msgClaimSavingsReward = 'incentive/MsgClaimSavingsReward',
  msgClaimEarnReward = 'incentive/MsgClaimEarnReward',
}

type IncentiveMessageTypes = {
  msgClaimUSDXMintingReward: IncentiveMessages.msgClaimUSDXMintingReward;
  msgClaimHardReward: IncentiveMessages.msgClaimHardReward;
  msgClaimDelegatorReward: IncentiveMessages.msgClaimDelegatorReward;
  msgClaimSwapReward: IncentiveMessages.msgClaimSwapReward;
  msgClaimSavingsReward: IncentiveMessages.msgClaimSavingsReward;
  msgClaimEarnReward: IncentiveMessages.msgClaimEarnReward;
};

type EarnMessageTypes = {
  msgDeposit: EarnMessages.msgDeposit;
  msgWithdraw: EarnMessages.msgWithdraw;
};

type LiquidMessageTypes = {
  msgMintDerivative: LiquidMessages.msgMintDerivative;
  msgBurnDerivative: LiquidMessages.msgBurnDerivative;
};

type EvmUtilMessageTypes = {
  msgConvertERC20ToCoinType: EvmUtilMessages.msgConvertERC20ToCoinType;
  msgConvertCoinToERC20: EvmUtilMessages.msgConvertCoinToERC20;
  msgConvertCosmosCoinToERC20: EvmUtilMessages.msgConvertCosmosCoinToERC20;
  msgConvertCosmosCoinFromERC20: EvmUtilMessages.msgConvertCosmosCoinFromERC20;
};

type CdpMessageTypes = {
  msgCreateCdp: CdpMessages.msgCreateCdp;
  msgDeposit: CdpMessages.msgDeposit;
  msgWithdraw: CdpMessages.msgWithdraw;
  msgRepayDebt: CdpMessages.msgRepayDebt;
  msgDrawDebt: CdpMessages.msgDrawDebt;
};

type CommitteeMessageTypes = {
  msgVote: CommitteeMessages.msgVote;
};

type CosmosSdkMessageTypes = {
  msgDelegate: CosmosSdkMessages.msgDelegate;
  msgUndelegate: CosmosSdkMessages.msgUndelegate;
  msgVote: CosmosSdkMessages.msgVote;
  msgBeginRedelegate: CosmosSdkMessages.msgBeginRedelegate;
  msgSend: CosmosSdkMessages.msgSend;
  msgTransfer: CosmosSdkMessages.msgTransfer;
  msgWithdrawDelegationReward: CosmosSdkMessages.msgWithdrawDelegationReward;
};

type HardMessageTypes = {
  msgDeposit: HardMessages.msgDeposit;
  msgWithdraw: HardMessages.msgWithdraw;
};

type RouterMessageTypes = {
  msgMintDeposit: RouterMessages.msgMintDeposit;
  msgDelegateMintDeposit: RouterMessages.msgDelegateMintDeposit;
  msgWithdrawBurn: RouterMessages.msgWithdrawBurn;
  msgWithdrawBurnUndelegate: RouterMessages.msgWithdrawBurnUndelegate;
};

export type MetamaskSupportedMessageTypes =
  | IncentiveMessages
  | EarnMessages
  | EvmUtilMessages
  | RouterMessages
  | CdpMessages
  | CommitteeMessages
  | HardMessages
  | LiquidMessages
  | CosmosSdkMessages;

interface MetamaskMessageTypes {
  cosmosSdk: CosmosSdkMessageTypes;
  liquid: LiquidMessageTypes;
  hard: HardMessageTypes;
  cdp: CdpMessageTypes;
  committee: CommitteeMessageTypes;
  router: RouterMessageTypes;
  evmUtil: EvmUtilMessageTypes;
  earn: EarnMessageTypes;
  incentive: IncentiveMessageTypes;
}

export const metamaskMessageTypes: MetamaskMessageTypes = {
  cosmosSdk: {
    msgTransfer: CosmosSdkMessages.msgTransfer,
    msgWithdrawDelegationReward: CosmosSdkMessages.msgWithdrawDelegationReward,
    msgDelegate: CosmosSdkMessages.msgDelegate,
    msgUndelegate: CosmosSdkMessages.msgUndelegate,
    msgBeginRedelegate: CosmosSdkMessages.msgBeginRedelegate,
    msgVote: CosmosSdkMessages.msgVote,
    msgSend: CosmosSdkMessages.msgSend,
  },
  liquid: {
    msgMintDerivative: LiquidMessages.msgMintDerivative,
    msgBurnDerivative: LiquidMessages.msgBurnDerivative,
  },
  hard: {
    msgWithdraw: HardMessages.msgWithdraw,
    msgDeposit: HardMessages.msgDeposit,
  },
  cdp: {
    msgCreateCdp: CdpMessages.msgCreateCdp,
    msgDeposit: CdpMessages.msgDeposit,
    msgWithdraw: CdpMessages.msgWithdraw,
    msgRepayDebt: CdpMessages.msgRepayDebt,
    msgDrawDebt: CdpMessages.msgDrawDebt,
  },
  committee: {
    msgVote: CommitteeMessages.msgVote,
  },
  router: {
    msgMintDeposit: RouterMessages.msgMintDeposit,
    msgDelegateMintDeposit: RouterMessages.msgDelegateMintDeposit,
    msgWithdrawBurn: RouterMessages.msgWithdrawBurn,
    msgWithdrawBurnUndelegate: RouterMessages.msgWithdrawBurnUndelegate,
  },
  evmUtil: {
    msgConvertERC20ToCoinType: EvmUtilMessages.msgConvertERC20ToCoinType,
    msgConvertCoinToERC20: EvmUtilMessages.msgConvertCoinToERC20,
    msgConvertCosmosCoinToERC20: EvmUtilMessages.msgConvertCosmosCoinToERC20,
    msgConvertCosmosCoinFromERC20:
      EvmUtilMessages.msgConvertCosmosCoinFromERC20,
  },
  earn: {
    msgDeposit: EarnMessages.msgDeposit,
    msgWithdraw: EarnMessages.msgWithdraw,
  },
  incentive: {
    msgClaimUSDXMintingReward: IncentiveMessages.msgClaimUSDXMintingReward,
    msgClaimHardReward: IncentiveMessages.msgClaimHardReward,
    msgClaimDelegatorReward: IncentiveMessages.msgClaimDelegatorReward,
    msgClaimSwapReward: IncentiveMessages.msgClaimSwapReward,
    msgClaimSavingsReward: IncentiveMessages.msgClaimSavingsReward,
    msgClaimEarnReward: IncentiveMessages.msgClaimEarnReward,
  },
};
