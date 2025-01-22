import { ApolloProvider } from '@apollo/client';
import { client } from './apollo';
import AccountList from './components/AccountList';
import './App.css';

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="app">
        <header className="app-header">
          <h1>英国养老金管理系统</h1>
        </header>
        <main className="app-main">
          <AccountList />
        </main>
      </div>
    </ApolloProvider>
  );
}

export default App;
