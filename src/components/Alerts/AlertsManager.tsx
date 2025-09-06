import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, X, Filter, Search, MoreVertical, Info, XCircle } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';
import { apiService } from '../../services/api';

interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  entity_id?: string;
  entity_type?: string;
  created_at: string;
  updated_at: string;
}

const AlertsManager: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadAlerts();
    
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      loadAlerts();
    }, 30000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const alertsData = await supabaseService.getAlerts();
      if (alertsData) {
        // Transform database alerts to match component interface
        const transformedAlerts = alertsData.map(alert => ({
          id: alert.id,
          title: alert.title,
          message: alert.message,
          type: alert.type as 'info' | 'warning' | 'error' | 'success',
          priority: alert.priority as 'low' | 'medium' | 'high' | 'critical',
          read: alert.read,
          entity_id: alert.entity_id,
          entity_type: alert.entity_type,
          created_at: alert.created_at,
          updated_at: alert.updated_at
        }));
        setAlerts(transformedAlerts);
      } else {
        // Demo data for when backend is not available
        generateSampleAlerts();
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
      generateSampleAlerts();
    } finally {
      setLoading(false);
    }
  };

  const generateSampleAlerts = () => {
    const sampleAlerts: Alert[] = [
      {
        id: '1',
        title: 'License Expiring Soon',
        message: 'Microsoft Office 365 license expires in 7 days',
        type: 'warning',
        priority: 'high',
        read: false,
        entity_id: 'lic-001',
        entity_type: 'license',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '2',
        title: 'Asset Maintenance Due',
        message: 'Server maintenance required for DELL-SRV-001',
        type: 'info',
        priority: 'medium',
        read: false,
        entity_id: 'srv-001',
        entity_type: 'asset',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: '3',
        title: 'Security Vulnerability',
        message: 'Critical security update available for Windows Server',
        type: 'error',
        priority: 'critical',
        read: true,
        entity_id: 'srv-002',
        entity_type: 'asset',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '4',
        title: 'Low Stock Alert',
        message: 'Printer toner cartridges running low (2 remaining)',
        type: 'warning',
        priority: 'medium',
        read: false,
        entity_id: 'cons-001',
        entity_type: 'consumable',
        created_at: new Date(Date.now() - 43200000).toISOString(),
        updated_at: new Date(Date.now() - 43200000).toISOString()
      },
      {
        id: '5',
        title: 'Backup Completed',
        message: 'Daily system backup completed successfully',
        type: 'success',
        priority: 'low',
        read: true,
        entity_id: null,
        entity_type: null,
        created_at: new Date(Date.now() - 21600000).toISOString(),
        updated_at: new Date(Date.now() - 21600000).toISOString()
      }
    ];
    setAlerts(sampleAlerts);
  };

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve' | 'dismiss') => {
    try {
      let updateData: any = { read: true };
      
      switch (action) {
        case 'acknowledge':
          updateData = { read: true };
          break;
        case 'resolve':
          updateData = { read: true };
          break;
        case 'dismiss':
          updateData = { read: true };
          break;
      }

      await supabaseService.updateAlert(alertId, updateData);
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, read: true, updated_at: new Date().toISOString() }
          : alert
      ));
    } catch (error) {
      console.error(`Failed to ${action} alert:`, error);
      // Update locally if database update fails
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, read: true, updated_at: new Date().toISOString() }
          : alert
      ));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedAlerts.length === 0) return;

    try {
      // Update each selected alert
      const updatePromises = selectedAlerts.map(alertId => 
        supabaseService.updateAlert(alertId, { read: true })
      );
      
      await Promise.all(updatePromises);
      
      setAlerts(prev => prev.map(alert => 
        selectedAlerts.includes(alert.id)
          ? { ...alert, read: true, updated_at: new Date().toISOString() }
          : alert
      ));
      
      setSelectedAlerts([]);
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      // Update locally if database update fails
      setAlerts(prev => prev.map(alert => 
        selectedAlerts.includes(alert.id)
          ? { ...alert, read: true, updated_at: new Date().toISOString() }
          : alert
      ));
      setSelectedAlerts([]);
    }
  };

  const handleCreateAlert = async (alertData: Omit<Alert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Ensure user is authenticated before creating alert
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        apiService.logout();
        return;
      }

      const newAlert = await supabaseService.createAlert({
        type: alertData.type,
        title: alertData.title,
        message: alertData.message,
        priority: alertData.priority,
        read: alertData.read,
        entity_id: alertData.entity_id,
        entity_type: alertData.entity_type
      });
      
      const transformedAlert: Alert = {
        id: newAlert.id,
        title: newAlert.title,
        message: newAlert.message,
        type: newAlert.type as Alert['type'],
        priority: newAlert.priority as Alert['priority'],
        read: newAlert.read,
        entity_id: newAlert.entity_id,
        entity_type: newAlert.entity_type,
        created_at: newAlert.created_at,
        updated_at: newAlert.updated_at
      };
      
      setAlerts(prev => [transformedAlert, ...prev]);
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !alert.read) ||
      (filter === 'read' && alert.read) ||
      (filter === 'critical' && alert.priority === 'critical') ||
      (filter === 'high' && alert.priority === 'high');
    
    const matchesSearch = searchTerm === '' || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.entity_type && alert.entity_type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="text-gray-600">Monitor and manage system alerts</p>
          <p className="text-xs text-gray-500">Auto-refresh: 30s</p>
        </div>
        <button
          onClick={() => handleCreateAlert({
            title: 'Test Alert',
            message: 'This is a test alert created manually',
            type: 'info',
            priority: 'medium',
            read: false
          })}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Test Alert
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Alerts</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="critical">Critical</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {selectedAlerts.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedAlerts.length} selected</span>
              <button
                onClick={() => handleBulkAction('acknowledge')}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Mark as Read
              </button>
              <button
                onClick={() => handleBulkAction('resolve')}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Resolve
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{alerts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Unread</p>
              <p className="text-2xl font-semibold text-gray-900">
                {alerts.filter(a => !a.read).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Read</p>
              <p className="text-2xl font-semibold text-gray-900">
                {alerts.filter(a => a.read).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Critical</p>
              <p className="text-2xl font-semibold text-gray-900">
                {alerts.filter(a => a.priority === 'critical').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'No alerts to display' : `No ${filter} alerts found`}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white p-4 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
                alert.read ? 'border-gray-200 opacity-75' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.includes(alert.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAlerts(prev => [...prev, alert.id]);
                      } else {
                        setSelectedAlerts(prev => prev.filter(id => id !== alert.id));
                      }
                    }}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className={`text-sm font-medium truncate ${
                        alert.read ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {alert.title}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(alert.priority)}`}>
                        {alert.priority}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(alert.type)}`}>
                        {alert.type}
                      </span>
                      {!alert.read && (
                        <span className="inline-flex w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    
                    <p className={`text-sm mb-2 ${alert.read ? 'text-gray-500' : 'text-gray-600'}`}>
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {alert.entity_type && (
                        <span>Type: {alert.entity_type}</span>
                      )}
                      <span>Created: {new Date(alert.created_at).toLocaleDateString()}</span>
                      <span>Updated: {new Date(alert.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {!alert.read && (
                    <>
                      <button
                        onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Mark as Read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAlertAction(alert.id, 'resolve')}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Resolve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => handleAlertAction(alert.id, 'dismiss')}
                    className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <button className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Alert Categories Summary */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['info', 'warning', 'error', 'success'].map((type) => {
            const typeAlerts = alerts.filter(a => a.type === type);
            const unreadCount = typeAlerts.filter(a => !a.read).length;
            
            return (
              <div key={type} className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="mb-2">
                  {getAlertIcon(type as Alert['type'])}
                </div>
                <div className="text-2xl font-bold text-gray-900">{typeAlerts.length}</div>
                <div className="text-sm text-gray-600 capitalize">{type} Alerts</div>
                {unreadCount > 0 && (
                  <div className="text-xs text-blue-600 mt-1">{unreadCount} unread</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AlertsManager;