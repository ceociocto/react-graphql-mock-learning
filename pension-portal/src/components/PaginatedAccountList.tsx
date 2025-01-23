import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PAGINATED_ACCOUNTS } from '../graphql/queries';
import './PaginatedAccountList.css';

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

interface AccountEdge {
  cursor: string;
  node: {
    id: string;
    accountNumber: string;
    balance: number;
    ownerName: string;
    status: string;
    eligibleForWithdrawal: boolean;
  };
}

interface AccountsData {
  paginatedAccounts: {
    edges: AccountEdge[];
    pageInfo: PageInfo;
    totalCount: number;
  };
}

const PAGE_SIZE = 5;

const PaginatedAccountList: React.FC = () => {
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);

  const { loading, error, data, fetchMore } = useQuery<AccountsData>(
    GET_PAGINATED_ACCOUNTS,
    {
      variables: {
        first: PAGE_SIZE,
        after: currentCursor
      }
    }
  );

  const handleNextPage = () => {
    if (data?.paginatedAccounts.pageInfo.hasNextPage) {
      const { endCursor } = data.paginatedAccounts.pageInfo;
      setCurrentCursor(endCursor);
      fetchMore({
        variables: {
          first: PAGE_SIZE,
          after: endCursor
        }
      });
    }
  };

  const handlePreviousPage = () => {
    if (data?.paginatedAccounts.pageInfo.hasPreviousPage) {
      const { startCursor } = data.paginatedAccounts.pageInfo;
      setCurrentCursor(null); // 返回第一页
      fetchMore({
        variables: {
          first: PAGE_SIZE,
          after: null
        }
      });
    }
  };

  if (loading) return <div className="loading">加载账户列表...</div>;
  if (error) return <div className="error">加载出错: {error.message}</div>;

  const { edges, pageInfo, totalCount } = data?.paginatedAccounts || { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 };

  return (
    <div className="paginated-account-list">
      <div className="list-header">
        <h2>养老金账户列表</h2>
        <div className="total-count">
          共 {totalCount} 个账户
        </div>
      </div>

      <div className="account-grid">
        {edges.map(({ node }) => (
          <div key={node.id} className="account-card">
            <h3>{node.ownerName}</h3>
            <p>账号: {node.accountNumber}</p>
            <p>余额: ¥{node.balance.toLocaleString()}</p>
            <p>状态: {node.status}</p>
            <div className={`withdrawal-status ${node.eligibleForWithdrawal ? 'eligible' : 'not-eligible'}`}>
              {node.eligibleForWithdrawal ? '可提取' : '不可提取'}
            </div>
          </div>
        ))}
      </div>

      <div className="pagination-controls">
        <button
          onClick={handlePreviousPage}
          disabled={!pageInfo.hasPreviousPage}
          className="pagination-button"
        >
          上一页
        </button>
        <button
          onClick={handleNextPage}
          disabled={!pageInfo.hasNextPage}
          className="pagination-button"
        >
          下一页
        </button>
      </div>
    </div>
  );
};

export default PaginatedAccountList; 