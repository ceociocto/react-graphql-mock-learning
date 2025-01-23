import { ApolloLink } from '@apollo/client';

// 性能指标接口
interface PerformanceMetrics {
  operationName: string;
  operationType: string;
  startTime: number;
  endTime: number;
  duration: number;
  cacheHit: boolean;
  errorCount: number;
}

// 创建性能监控存储
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxStoredMetrics = 100;

  addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics.shift();
    }
    this.logMetric(metric);
  }

  private logMetric(metric: PerformanceMetrics) {
    console.log(
      `GraphQL Operation Performance:
      Operation: ${metric.operationName} (${metric.operationType})
      Duration: ${metric.duration}ms
      Cache Hit: ${metric.cacheHit}
      Errors: ${metric.errorCount}`
    );

    // 如果操作时间过长，发出警告
    if (metric.duration > 1000) {
      console.warn(
        `⚠️ Slow GraphQL operation detected: ${metric.operationName} took ${metric.duration}ms`
      );
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getAverageResponseTime() {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / this.metrics.length;
  }

  getCacheHitRate() {
    if (this.metrics.length === 0) return 0;
    const cacheHits = this.metrics.filter(metric => metric.cacheHit).length;
    return (cacheHits / this.metrics.length) * 100;
  }

  getErrorRate() {
    if (this.metrics.length === 0) return 0;
    const totalErrors = this.metrics.reduce((sum, metric) => sum + metric.errorCount, 0);
    return (totalErrors / this.metrics.length) * 100;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// 创建性能监控链接
export const performanceLink = new ApolloLink((operation, forward) => {
  const startTime = Date.now();
  let cacheHit = false;

  // 检查是否命中缓存
  const context = operation.getContext();
  if (context.response && context.response.fromCache) {
    cacheHit = true;
  }

  return forward(operation).map(response => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    performanceMonitor.addMetric({
      operationName: operation.operationName || 'anonymous',
      operationType: operation.query.definitions[0].kind,
      startTime,
      endTime,
      duration,
      cacheHit,
      errorCount: (response.errors?.length || 0)
    });

    return response;
  });
}); 