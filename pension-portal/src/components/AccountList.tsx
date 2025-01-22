import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_PENSION_ACCOUNTS } from '../graphql/queries';
import { PensionAccount } from '../types/pension';
import AccountCard from './AccountCard';
import './AccountList.css';

const AccountList: React.FC = () => {
  const { loading, error, data } = useQuery(GET_ALL_PENSION_ACCOUNTS);

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>加载账户信息...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <h3>出错了！</h3>
      <p>{error.message}</p>
    </div>
  );

  return (
    <div className="account-list">
      <h2>养老金账户列表</h2>
      <div className="account-grid">
        {data.allPensionAccounts.map((account: PensionAccount) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
};

export default AccountList; 