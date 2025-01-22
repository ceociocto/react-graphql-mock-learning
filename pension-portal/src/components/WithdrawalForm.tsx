import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { REQUEST_WITHDRAWAL } from '../graphql/mutations';
import { GET_PENSION_RULES, GET_ALL_PENSION_ACCOUNTS } from '../graphql/queries';
import './WithdrawalForm.css';

interface WithdrawalFormProps {
  accountId: string;
  balance: number;
  onClose: () => void;
}

const WithdrawalForm: React.FC<WithdrawalFormProps> = ({
  accountId,
  balance,
  onClose
}) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { data: rulesData } = useQuery(GET_PENSION_RULES);
  
  const [requestWithdrawal, { loading }] = useMutation(REQUEST_WITHDRAWAL, {
    refetchQueries: [{ query: GET_ALL_PENSION_ACCOUNTS }],
    onCompleted: (data) => {
      if (data.requestWithdrawal.success) {
        onClose();
      } else {
        setError(data.requestWithdrawal.message);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setError('请输入有效的提取金额');
      return;
    }

    if (withdrawalAmount > balance) {
      setError('提取金额不能超过账户余额');
      return;
    }

    const rules = rulesData?.pensionRules;
    if (rules) {
      const maxAmount = balance * (rules.maximumWithdrawalPercentage / 100);
      if (withdrawalAmount > maxAmount) {
        setError(`提取金额不能超过账户余额的${rules.maximumWithdrawalPercentage}%`);
        return;
      }
    }

    requestWithdrawal({
      variables: {
        accountId,
        amount: withdrawalAmount
      }
    });
  };

  return (
    <div className="withdrawal-form-overlay">
      <div className="withdrawal-form">
        <h3>申请提取养老金</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>可用余额: £{balance.toLocaleString()}</label>
            {rulesData?.pensionRules && (
              <p className="rules-info">
                最大可提取金额: £
                {(balance * (rulesData.pensionRules.maximumWithdrawalPercentage / 100)).toLocaleString()}
                （{rulesData.pensionRules.maximumWithdrawalPercentage}%）
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="amount">提取金额</label>
            <div className="input-group">
              <span className="currency-symbol">£</span>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="输入提取金额"
                step="0.01"
                min="0"
                max={balance}
                required
              />
            </div>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              取消
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? '处理中...' : '确认提取'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawalForm; 