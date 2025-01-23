import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ACCOUNT_BENEFICIARIES } from '../graphql/queries';
import { ADD_BENEFICIARY } from '../graphql/mutations';
import './BeneficiaryList.css';

interface BeneficiaryInfo {
  id: string;
  name: string;
  relationship: string;
  percentage: number;
  contactNumber: string;
}

interface BeneficiaryListProps {
  accountId: string;
}

const BeneficiaryList: React.FC<BeneficiaryListProps> = ({ accountId }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    percentage: '',
    contactNumber: ''
  });
  const [error, setError] = useState<string>('');

  const { loading, data, refetch } = useQuery(GET_ACCOUNT_BENEFICIARIES, {
    variables: { accountId }
  });

  const [addBeneficiary] = useMutation(ADD_BENEFICIARY, {
    onCompleted: () => {
      setShowAddForm(false);
      setFormData({ name: '', relationship: '', percentage: '', contactNumber: '' });
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const percentage = parseFloat(formData.percentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      setError('分配比例必须在0-100之间');
      return;
    }

    addBeneficiary({
      variables: {
        accountId,
        name: formData.name,
        relationship: formData.relationship,
        percentage,
        contactNumber: formData.contactNumber
      }
    });
  };

  if (loading) return <div className="loading">加载受益人信息...</div>;

  const beneficiaries = data?.accountBeneficiaries || [];
  const totalPercentage = beneficiaries.reduce(
    (sum: number, ben: BeneficiaryInfo) => sum + ben.percentage,
    0
  );

  return (
    <div className="beneficiary-list">
      <div className="beneficiary-header">
        <h3>受益人信息</h3>
        <div className="total-percentage">
          总分配比例: {totalPercentage}%
        </div>
      </div>

      <div className="beneficiary-grid">
        {beneficiaries.map((beneficiary: BeneficiaryInfo) => (
          <div key={beneficiary.id} className="beneficiary-card">
            <h4>{beneficiary.name}</h4>
            <p>关系: {beneficiary.relationship}</p>
            <p>分配比例: {beneficiary.percentage}%</p>
            <p>联系电话: {beneficiary.contactNumber}</p>
          </div>
        ))}
      </div>

      {!showAddForm && totalPercentage < 100 && (
        <button
          className="add-beneficiary-button"
          onClick={() => setShowAddForm(true)}
        >
          添加受益人
        </button>
      )}

      {showAddForm && (
        <form className="beneficiary-form" onSubmit={handleSubmit}>
          <h4>添加受益人</h4>
          <div className="form-group">
            <label>姓名:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>关系:</label>
            <input
              type="text"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>分配比例 (%):</label>
            <input
              type="number"
              value={formData.percentage}
              onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
              min="0"
              max={100 - totalPercentage}
              step="0.1"
              required
            />
          </div>
          <div className="form-group">
            <label>联系电话:</label>
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="form-actions">
            <button type="button" onClick={() => setShowAddForm(false)}>
              取消
            </button>
            <button type="submit">
              确认添加
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BeneficiaryList; 