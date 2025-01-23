import DataLoader from 'dataloader';
import { db } from './db';
import { BeneficiaryInfo, Transaction } from './types';

// 批量加载受益人信息的 DataLoader
export const createBeneficiaryLoader = () => new DataLoader<string, BeneficiaryInfo[]>(async (accountIds) => {
  // 一次性获取所有账户的受益人信息
  const accounts = accountIds.map(id => db.accounts.find(acc => acc.id === id));
  
  // 按照请求的顺序返回受益人列表
  return accounts.map(account => account?.beneficiaries || []);
});

// 批量加载交易历史的 DataLoader
export const createTransactionLoader = () => new DataLoader<string, Transaction[]>(async (accountIds) => {
  // 一次性获取所有账户的交易历史
  const accounts = accountIds.map(id => db.accounts.find(acc => acc.id === id));
  
  // 按照请求的顺序返回交易历史
  return accounts.map(account => account?.withdrawalHistory || []);
});

// 批量加载账户信息的 DataLoader
export const createAccountLoader = () => new DataLoader<string, any>(async (accountIds) => {
  // 一次性获取所有请求的账户信息
  return accountIds.map(id => db.accounts.find(acc => acc.id === id));
}); 