import React, { useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { WITHDRAWAL_STATUS_SUBSCRIPTION } from '../graphql/subscriptions';
import { TransactionStatus as TxStatus } from '../types/pension';
import './TransactionStatus.css';

interface TransactionStatusProps {
  accountId: string;
  onStatusChange?: (status: TxStatus) => void;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({
  accountId,
  onStatusChange
}) => {
  const { data, loading, error } = useSubscription(
    WITHDRAWAL_STATUS_SUBSCRIPTION,
    {
      variables: { accountId }
    }
  );

  useEffect(() => {
    if (data?.withdrawalStatusChanged) {
      onStatusChange?.(data.withdrawalStatusChanged.status);
    }
  }, [data, onStatusChange]);

  if (loading) return null;
  if (error) return <p className="error-text">订阅错误: {error.message}</p>;

  const transaction = data?.withdrawalStatusChanged;
  if (!transaction) return null;

  const getStatusClass = (status: TxStatus) => {
    switch (status) {
      case TxStatus.PENDING:
        return 'status-pending';
      case TxStatus.APPROVED:
        return 'status-approved';
      case TxStatus.REJECTED:
        return 'status-rejected';
      case TxStatus.COMPLETED:
        return 'status-completed';
      default:
        return '';
    }
  };

  const getStatusText = (status: TxStatus) => {
    switch (status) {
      case TxStatus.PENDING:
        return '处理中';
      case TxStatus.APPROVED:
        return '已批准';
      case TxStatus.REJECTED:
        return '已拒绝';
      case TxStatus.COMPLETED:
        return '已完成';
      default:
        return status;
    }
  };

  return (
    <div className="transaction-status">
      <h4>交易状态更新</h4>
      <div className={`status-badge ${getStatusClass(transaction.status)}`}>
        {getStatusText(transaction.status)}
      </div>
      <div className="transaction-details">
        <p>金额: £{transaction.amount.toLocaleString()}</p>
        <p>时间: {new Date(transaction.date).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default TransactionStatus; 