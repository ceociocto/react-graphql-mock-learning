import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider, ApolloClient } from '@apollo/client';
import { initializeApollo } from './apollo';
import App from './App';
import './index.css';

function Root() {
  const [client, setClient] = useState<ApolloClient<any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApollo()
      .then(apolloClient => {
        setClient(apolloClient);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to initialize Apollo Client:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="apollo-loading">
        初始化 Apollo Client...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="apollo-error">
        Apollo Client 初始化失败
      </div>
    );
  }

  return (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
