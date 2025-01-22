import { gql } from '@apollo/client';

export const GET_ALL_PENSION_ACCOUNTS = gql`
  query GetAllPensionAccounts {
    allPensionAccounts {
      id
      accountNumber
      balance
      ownerName
      status
      eligibleForWithdrawal
      withdrawalHistory {
        id
        amount
        date
        status
      }
    }
  }
`;

export const GET_PENSION_RULES = gql`
  query GetPensionRules {
    pensionRules {
      minimumAge
      maximumWithdrawalPercentage
      taxFreeAmount
    }
  }
`;

export const GET_ACCOUNT_TRANSACTIONS = gql`
  query GetAccountTransactions($accountId: ID!) {
    accountTransactions(accountId: $accountId) {
      id
      amount
      date
      status
    }
  }
`; 