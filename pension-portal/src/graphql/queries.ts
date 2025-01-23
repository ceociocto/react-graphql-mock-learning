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
      beneficiaries {
        id
        name
        relationship
        percentage
        contactNumber
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

export const GET_ACCOUNT_BENEFICIARIES = gql`
  query GetAccountBeneficiaries($accountId: ID!) {
    accountBeneficiaries(accountId: $accountId) {
      id
      name
      relationship
      percentage
      contactNumber
    }
  }
`;

export const GET_PENSION_ACCOUNTS = gql`
  query GetPensionAccounts($ids: [ID!]!) {
    pensionAccounts(ids: $ids) {
      id
      accountNumber
      balance
      ownerName
      status
      eligibleForWithdrawal
      beneficiaries {
        id
        name
        relationship
        percentage
      }
    }
  }
`;

export const GET_PAGINATED_ACCOUNTS = gql`
  query GetPaginatedAccounts(
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    paginatedAccounts(
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      edges {
        cursor
        node {
          id
          accountNumber
          balance
          ownerName
          status
          eligibleForWithdrawal
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_PAGINATED_TRANSACTIONS = gql`
  query GetPaginatedTransactions(
    $accountId: ID!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    paginatedTransactions(
      accountId: $accountId
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      edges {
        cursor
        node {
          id
          amount
          date
          status
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`; 