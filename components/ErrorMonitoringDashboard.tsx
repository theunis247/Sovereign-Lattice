/**
 * Error Monitoring Dashboard Component
 * Provides real-time error monitoring, pattern analysis, and system health visualization
 */

import React, { useState, useEffect } from 'react';
import { errorMonitoringIntegration } from '../services/errorMonitoringIntegration';
import { DiagnosticReport, ErrorPattern } from '../services/productionErrorMonitor';

interface ErrorMonitoringDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

interface SystemHealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  errorRate: number;
  criticalErrors: number;
  lastHourErrors: number;
}

export const ErrorMonitoringDashboard: React.FC<ErrorMonitoringDashboardProps> = ({
  isVisible,
  onClose
}) => {
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus | null>(null);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  // Update data periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateData = () => {
      try {
        // Get system health
        const health = errorMonitoringIntegration.getSystemHealth();
        setSystemHealth(health);

        // Get error patterns
        const timeRange = getTimeRange(selectedTimeRange);
        const category = selectedCategory === 'all' ? undefined : selectedCategory;
        const patterns = errorMonitoringIntegration.getErrorPatterns(category, timeRange);
        setErrorPatterns(patterns);

        // Generate diagnostic report
        const report = errorMonitoringIntegration.generateDiagnosticReport(timeRange);
        setDiagnosticReport(report);
      } catch (error) {
        console.error('Failed to update error monitoring data:', error);
      }
    };

    updateData();
    const interval = setInterval(updateData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isVisible, selectedTimeRange, selectedCategory]);

  const getTimeRange = (range: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (range) {
      case '1h':
        start.setHours(now.getHours() - 1);
        break;
      case '24h':
        start.setDate(now.getDate() - 1);
        break;
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
    }
    
    return {
      start: start.toISOString(),
      end: now.toISOString()
    };
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const timeRange = getTimeRange(selectedTimeRange);
      const data = errorMonitoringIntegration.exportErrorData(exportFormat, timeRange);
      
      const blob = new Blob([data], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-data-${selectedTimeRange}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100';
      case 'warning': return 'bg-yellow-100';
      case 'critical': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Error Monitoring Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Controls */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Range
              </label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="auth">Authentication</option>
                <option value="evolution">Evolution/AI</option>
                <option value="pdf">PDF Generation</option>
                <option value="database">Database</option>
                <option value="network">Network</option>
                <option value="system">System</option>
                <option value="user">User Actions</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Export Format
              </label>
              <div className="flex gap-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
                <button
                  onClick={handleExportData}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>
          </div>

          {/* System Health Status */}
          {systemHealth && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${getStatusBgColor(systemHealth.status)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <span className={`text-lg font-bold ${getStatusColor(systemHealth.status)}`}>
                      {systemHealth.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Error Rate</span>
                    <span className="text-lg font-bold text-gray-900">
                      {systemHealth.errorRate.toFixed(2)}/min
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Critical Errors</span>
                    <span className="text-lg font-bold text-red-600">
                      {systemHealth.criticalErrors}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Last Hour</span>
                    <span className="text-lg font-bold text-gray-900">
                      {systemHealth.lastHourErrors}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diagnostic Report Summary */}
          {diagnosticReport && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Summary Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Total Errors</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(diagnosticReport.summary.totalErrors)}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Resolution Rate</div>
                  <div className="text-2xl font-bold text-green-600">
                    {diagnosticReport.summary.resolutionRate.toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Affected Users</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(diagnosticReport.summary.uniqueUsers)}
                  </div>
                </div>
              </div>

              {/* System Health Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Avg Resolution Time</div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatDuration(diagnosticReport.systemHealth.averageResolutionTime)}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Error Rate</div>
                  <div className="text-lg font-bold text-gray-900">
                    {diagnosticReport.systemHealth.errorRate.toFixed(2)}/hr
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">User Impact</div>
                  <div className="text-lg font-bold text-gray-900">
                    {diagnosticReport.systemHealth.userImpact}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Patterns */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Top Error Patterns</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Error Code
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Count
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Frequency
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Affected Users
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Trend
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Last Seen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {errorPatterns.slice(0, 10).map((pattern, index) => (
                    <tr key={`${pattern.category}_${pattern.code}`} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {pattern.code}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          pattern.category === 'auth' ? 'bg-blue-100 text-blue-800' :
                          pattern.category === 'evolution' ? 'bg-purple-100 text-purple-800' :
                          pattern.category === 'pdf' ? 'bg-green-100 text-green-800' :
                          pattern.category === 'database' ? 'bg-red-100 text-red-800' :
                          pattern.category === 'network' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pattern.category}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {formatNumber(pattern.count)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {pattern.frequency.toFixed(2)}/hr
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {pattern.affectedUsers.size}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          pattern.trend === 'increasing' ? 'bg-red-100 text-red-800' :
                          pattern.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pattern.trend}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {new Date(pattern.lastSeen).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          {diagnosticReport && diagnosticReport.recommendations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {diagnosticReport.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span className="text-sm text-blue-800">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Error Categories Breakdown */}
          {diagnosticReport && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Error Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(diagnosticReport.summary.errorsByCategory).map(([category, count]) => (
                  <div key={category} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1 capitalize">
                      {category}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatNumber(count)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};