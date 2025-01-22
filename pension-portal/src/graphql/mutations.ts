import { gql } from '@apollo/client';

export const REQUEST_WITHDRAWAL = gql`
  mutation RequestWithdrawal($accountId: ID!, $amount: Float!) {
    requestWithdrawal(accountId: $accountId, amount: $amount) {
      success
      message
      transaction {
        id
        amount
        date
        status
      }
    }
  }
`;

export const UPDATE_ACCOUNT_STATUS = gql`
  mutation UpdateAccountStatus($accountId: ID!, $status: PensionStatus!) {
    updateAccountStatus(accountId: $accountId, status: $status) {
      id
      status
      eligibleForWithdrawal
    }
  }
`; 