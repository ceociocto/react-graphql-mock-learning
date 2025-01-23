import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../apollo/links/performance';
import './PerformanceMonitor.css';

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState({
    averageResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    recentMetrics: [] as any[]
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics({
        averageResponseTime: performanceMonitor.getAverageResponseTime(),
        cacheHitRate: performanceMonitor.getCacheHitRate(),
        errorRate: performanceMonitor.getErrorRate(),
        recentMetrics: performanceMonitor.getMetrics().slice(-5)
      });
    };

    // 每秒更新一次指标
    const intervalId = setInterval(updateMetrics, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`performance-monitor ${isExpanded ? 'expanded' : ''}`}>
      <div className="monitor-header" onClick={toggleExpand}>
        <h3>性能监控</h3>
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="monitor-content">
          <div className="metrics-summary">
            <div className="metric-item">
              <label>平均响应时间:</label>
              <span className={metrics.averageResponseTime > 1000 ? 'warning' : ''}>
                {metrics.averageResponseTime.toFixed(2)}ms
              </span>
            </div>
            <div className="metric-item">
              <label>缓存命中率:</label>
              <span className={metrics.cacheHitRate < 50 ? 'warning' : ''}>
                {metrics.cacheHitRate.toFixed(1)}%
              </span>
            </div>
            <div className="metric-item">
              <label>错误率:</label>
              <span className={metrics.errorRate > 5 ? 'error' : ''}>
                {metrics.errorRate.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="recent-operations">
            <h4>最近操作</h4>
            <div className="operations-list">
              {metrics.recentMetrics.map((metric, index) => (
                <div key={index} className="operation-item">
                  <div className="operation-name">
                    {metric.operationName} ({metric.operationType})
                  </div>
                  <div className="operation-details">
                    <span className={metric.duration > 1000 ? 'warning' : ''}>
                      {metric.duration}ms
                    </span>
                    <span className={metric.cacheHit ? 'success' : ''}>
                      {metric.cacheHit ? '缓存命中' : '网络请求'}
                    </span>
                    {metric.errorCount > 0 && (
                      <span className="error">
                        {metric.errorCount} 个错误
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor; 