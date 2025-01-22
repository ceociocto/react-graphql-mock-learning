import { gql } from '@apollo/client';

export const WITHDRAWAL_STATUS_SUBSCRIPTION = gql`
  subscription OnWithdrawalStatusChanged($accountId: ID!) {
    withdrawalStatusChanged(accountId: $accountId) {
      id
      amount
      date
      status
    }
  }
`;

export const ACCOUNT_BALANCE_SUBSCRIPTION = gql`
  subscription OnAccountBalanceChanged($accountId: ID!) {
    accountBalanceChanged(accountId: $accountId) {
      id
      balance
      status
      eligibleForWithdrawal
    }
  }
`; 