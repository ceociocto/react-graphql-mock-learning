import React, { useState } from 'react';
import { PensionAccount, PensionStatus } from '../types/pension';
import WithdrawalForm from './WithdrawalForm';
import './AccountCard.css';

interface AccountCardProps {
  account: PensionAccount;
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);

  const getStatusColor = (status: PensionStatus) => {
    switch (status) {
      case PensionStatus.ACTIVE:
        return 'status-active';
      case PensionStatus.FROZEN:
        return 'status-frozen';
      case PensionStatus.WITHDRAWN:
        return 'status-withdrawn';
      default:
        return '';
    }
  };

  const getStatusText = (status: PensionStatus) => {
    switch (status) {
      case PensionStatus.ACTIVE:
        return '正常';
      case PensionStatus.FROZEN:
        return '冻结';
      case PensionStatus.WITHDRAWN:
        return '已提取完毕';
      default:
        return status;
    }
  };

  return (
    <div className="account-card">
      <div className="card-header">
        <h3>{account.ownerName}的账户</h3>
        <span className={`status-badge ${getStatusColor(account.status)}`}>
          {getStatusText(account.status)}
        </span>
      </div>
      
      <div className="card-content">
        <p className="account-number">账号: {account.accountNumber}</p>
        <p className="balance">余额: £{account.balance.toLocaleString()}</p>
        <p className="eligibility">
          提取资格: {account.eligibleForWithdrawal ? '✅ 可以提取' : '❌ 不可提取'}
        </p>
      </div>

      {account.eligibleForWithdrawal && (
        <div className="card-actions">
          <button
            className="withdraw-button"
            onClick={() => setShowWithdrawalForm(true)}
          >
            申请提取
          </button>
        </div>
      )}

      {showWithdrawalForm && (
        <WithdrawalForm
          accountId={account.id}
          balance={account.balance}
          onClose={() => setShowWithdrawalForm(false)}
        />
      )}
    </div>
  );
};

export default AccountCard; 