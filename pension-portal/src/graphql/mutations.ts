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

export const ADD_BENEFICIARY = gql`
  mutation AddBeneficiary(
    $accountId: ID!
    $name: String!
    $relationship: String!
    $percentage: Float!
    $contactNumber: String!
  ) {
    addBeneficiary(
      accountId: $accountId
      name: $name
      relationship: $relationship
      percentage: $percentage
      contactNumber: $contactNumber
    ) {
      id
      name
      relationship
      percentage
      contactNumber
    }
  }
`; 