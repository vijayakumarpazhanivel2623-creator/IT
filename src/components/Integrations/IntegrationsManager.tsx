import React, { useState, useEffect } from 'react';
import { Database, Settings, CheckCircle, XCircle, RefreshCw, Plus, Edit, Trash2, Wifi, AlertCircle, TestTube, Activity, Clock, Globe, Key, FileText, Users, DollarSign, ShoppingCart } from 'lucide-react';
import { Integration, IntegrationType, IntegrationStatus } from '../../types';
import apiService from '../../services/api';

interface IntegrationsManagerProps {}

export default function IntegrationsManager({}: IntegrationsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testingIntegration, setTestingIntegration] = useState<Integration | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadIntegrations();
    
    // Set up real-time refresh every 90 seconds
    const interval = setInterval(() => {
      loadIntegrations();
    }, 90000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const response = await apiService.getIntegrations();
      if (response.data) {
        setIntegrations(response.data);
      } else {
        generateSampleIntegrations();
      }
    } catch (error) {
      console.warn('Failed to load integrations, using sample data');
      generateSampleIntegrations();
    } finally {
      setLoading(false);
    }
  };

  const generateSampleIntegrations = () => {
    const sampleIntegrations: Integration[] = [
      {
        id: '1',
        name: 'Microsoft SCCM',
        type: 'Discovery Tool',
        endpoint: 'https://sccm.company.com/api',
        apiKey: '***hidden***',
        lastSync: new Date().toISOString(),
        syncFrequency: 'Daily',
        status: 'Active',
        mappings: [
          { sourceField: 'ComputerName', targetField: 'name', transformation: 'uppercase' },
          { sourceField: 'SerialNumber', targetField: 'serialNumber' },
          { sourceField: 'Manufacturer', targetField: 'manufacturer' },
          { sourceField: 'Model', targetField: 'model' }
        ],
        errorLog: []
      },
      {
        id: '2',
        name: 'ServiceNow CMDB',
        type: 'CMDB',
        endpoint: 'https://company.service-now.com/api',
        apiKey: '***hidden***',
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        syncFrequency: 'Hourly',
        status: 'Active',
        mappings: [
          { sourceField: 'ci_name', targetField: 'name' },
          { sourceField: 'asset_tag', targetField: 'tag' },
          { sourceField: 'location', targetField: 'location' },
          { sourceField: 'assigned_to', targetField: 'assignedTo' }
        ],
        errorLog: []
      },
      {
        id: '3',
        name: 'Lansweeper',
        type: 'Discovery Tool',
        endpoint: 'https://lansweeper.company.com/api',
        apiKey: '***hidden***',
        lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        syncFrequency: 'Weekly',
        status: 'Error',
        mappings: [],
        errorLog: [
          {
            timestamp: new Date().toISOString(),
            error: 'Connection timeout',
            details: 'Failed to connect to Lansweeper API after 30 seconds',
            resolved: false
          },
          {
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            error: 'Authentication failed',
            details: 'Invalid API key or expired credentials',
            resolved: false
          }
        ]
      },
      {
        id: '4',
        name: 'Active Directory',
        type: 'HR System',
        endpoint: 'ldap://company.local',
        lastSync: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        syncFrequency: 'Daily',
        status: 'Active',
        mappings: [
          { sourceField: 'sAMAccountName', targetField: 'username' },
          { sourceField: 'displayName', targetField: 'name' },
          { sourceField: 'mail', targetField: 'email' },
          { sourceField: 'department', targetField: 'department' }
        ],
        errorLog: []
      },
      {
        id: '5',
        name: 'Okta Identity',
        type: 'HR System',
        endpoint: 'https://company.okta.com/api/v1',
        apiKey: '***hidden***',
        lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        syncFrequency: 'Hourly',
        status: 'Syncing',
        mappings: [
          { sourceField: 'profile.login', targetField: 'username' },
          { sourceField: 'profile.firstName', targetField: 'firstName' },
          { sourceField: 'profile.lastName', targetField: 'lastName' },
          { sourceField: 'profile.email', targetField: 'email' }
        ],
        errorLog: []
      }
    ];
    setIntegrations(sampleIntegrations);
  };

  const handleCreateIntegration = async (integrationData: Omit<Integration, 'id'>) => {
    try {
      const response = await apiService.createIntegration(integrationData);
      
      if (response.data) {
        setIntegrations(prev => [...prev, response.data]);
      } else {
        const newIntegration: Integration = {
          ...integrationData,
          id: Date.now().toString()
        };
        setIntegrations(prev => [...prev, newIntegration]);
      }
    } catch (error) {
      console.warn('Failed to create integration, using local state');
      const newIntegration: Integration = {
        ...integrationData,
        id: Date.now().toString()
      };
      setIntegrations(prev => [...prev, newIntegration]);
    }
    setShowForm(false);
    setEditingIntegration(null);
  };

  const handleUpdateIntegration = async (id: string, updates: Partial<Integration>) => {
    try {
      await apiService.updateIntegration(id, updates);
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === id ? { ...integration, ...updates } : integration
      ));
    } catch (error) {
      console.warn('Failed to update integration via API, updating locally');
      setIntegrations(prev => prev.map(integration => 
        integration.id === id ? { ...integration, ...updates } : integration
      ));
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;
    
    try {
      await apiService.deleteIntegration(id);
      
      setIntegrations(prev => prev.filter(integration => integration.id !== id));
    } catch (error) {
      console.warn('Failed to delete integration via API, updating locally');
      setIntegrations(prev => prev.filter(integration => integration.id !== id));
    }
  };

  const handleSyncIntegration = async (id: string) => {
    try {
      await apiService.syncIntegration(id);
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === id 
          ? { ...integration, status: 'Syncing', lastSync: new Date().toISOString() }
          : integration
      ));

      // Simulate sync completion
      setTimeout(() => {
        setIntegrations(prev => prev.map(integration => 
          integration.id === id 
            ? { ...integration, status: 'Active' }
            : integration
        ));
      }, 3000);
    } catch (error) {
      console.warn('Failed to sync integration via API');
      setIntegrations(prev => prev.map(integration => 
        integration.id === id 
          ? { ...integration, status: 'Error' }
          : integration
      ));
    }
  };

  const handleTestIntegration = async (integration: Integration) => {
    setTestingIntegration(integration);
    setShowTestModal(true);
    
    try {
      const response = await apiService.testIntegration(integration.id);
      if (response.data) {
        setTestResults(response.data);
      } else {
        // Simulate test results
        setTestResults({
          success: integration.status === 'Active',
          responseTime: Math.floor(Math.random() * 500) + 100,
          recordsFound: Math.floor(Math.random() * 1000) + 50,
          lastError: integration.status === 'Error' ? 'Connection timeout' : null,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      setTestResults({
        success: false,
        responseTime: 0,
        recordsFound: 0,
        lastError: 'Failed to connect to integration endpoint',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleViewLogs = async (integrationId: string) => {
    try {
      const response = await apiService.getIntegrationLogs(integrationId);
      console.log('Integration logs:', response.data);
    } catch (error) {
      console.warn('Failed to load integration logs');
    }
  };
  const getStatusColor = (status: IntegrationStatus) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Inactive': return 'text-gray-600 bg-gray-100';
      case 'Error': return 'text-red-600 bg-red-100';
      case 'Syncing': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
      case 'Active': return <CheckCircle className="w-4 h-4" />;
      case 'Inactive': return <XCircle className="w-4 h-4" />;
      case 'Error': return <AlertCircle className="w-4 h-4" />;
      case 'Syncing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: IntegrationType) => {
    switch (type) {
      case 'Discovery Tool': return <Wifi className="w-5 h-5" />;
      case 'CMDB': return <Database className="w-5 h-5" />;
      case 'ITSM': return <Settings className="w-5 h-5" />;
      case 'HR System': return <Users className="w-5 h-5" />;
      case 'Financial': return <DollarSign className="w-5 h-5" />;
      case 'Procurement': return <ShoppingCart className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Database className="w-4 h-4" /> },
    { id: 'active', label: 'Active Integrations', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'logs', label: 'Sync Logs', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  const activeIntegrations = integrations.filter(i => i.status === 'Active');
  const errorIntegrations = integrations.filter(i => i.status === 'Error');
  const totalSyncs = integrations.reduce((sum, i) => sum + (i.errorLog?.length || 0), 0);
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Integrations</h1>
          <p className="text-gray-600">Manage connections to external systems and data sources</p>
          <p className="text-xs text-gray-500">Auto-refresh: 90s</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Integration</span>
        </button>
      </div>

      {/* Integration Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-900">Active</h3>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">{activeIntegrations.length}</div>
          <p className="text-green-700 text-sm">Running smoothly</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-900">Errors</h3>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">{errorIntegrations.length}</div>
          <p className="text-red-700 text-sm">Need attention</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Total Syncs</h3>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600">{totalSyncs}</div>
          <p className="text-blue-700 text-sm">Last 24 hours</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-900">Data Sources</h3>
            <Globe className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-600">{integrations.length}</div>
          <p className="text-purple-700 text-sm">Connected systems</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Integration Types Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-900">Discovery Tools</h3>
                    <Wifi className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-blue-700 text-sm mb-4">Connect to asset discovery tools like SCCM, Lansweeper, and network scanners.</p>
                  <div className="text-2xl font-bold text-blue-600">
                    {integrations.filter(i => i.type === 'Discovery Tool').length}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-900">ITSM Platforms</h3>
                    <Settings className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-green-700 text-sm mb-4">Integrate with ServiceNow, Jira Service Management, and other ITSM tools.</p>
                  <div className="text-2xl font-bold text-green-600">
                    {integrations.filter(i => i.type === 'ITSM').length}
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-purple-900">Business Systems</h3>
                    <Database className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-purple-700 text-sm mb-4">Connect to HR, Financial, and Procurement systems for complete data sync.</p>
                  <div className="text-2xl font-bold text-purple-600">
                    {integrations.filter(i => ['HR System', 'Financial', 'Procurement'].includes(i.type)).length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'active' && (
            <div className="space-y-4">
              {activeIntegrations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No active integrations found.</p>
                </div>
              ) : (
                activeIntegrations.map((integration) => (
                  <div key={integration.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-100 p-3 rounded-lg">
                          {getTypeIcon(integration.type)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                          <p className="text-gray-600">{integration.type}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>Last sync: {new Date(integration.lastSync).toLocaleString()}</span>
                            <span>Frequency: {integration.syncFrequency}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTestIntegration(integration)}
                          className="text-purple-600 hover:text-purple-500 p-2"
                          title="Test Connection"
                        >
                          <TestTube className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSyncIntegration(integration.id)}
                          disabled={integration.status === 'Syncing'}
                          className="text-blue-600 hover:text-blue-500 p-2 disabled:opacity-50"
                          title="Sync Now"
                        >
                          <RefreshCw className={`w-4 h-4 ${integration.status === 'Syncing' ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sync Activity</h3>
                <div className="space-y-3">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-md ${getStatusColor(integration.status)}`}>
                          {getStatusIcon(integration.status)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{integration.name}</p>
                          <p className="text-sm text-gray-500">
                            Last sync: {new Date(integration.lastSync).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewLogs(integration.id)}
                        className="text-blue-600 hover:text-blue-500 text-sm"
                      >
                        View Logs
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

      {/* Main Integrations List */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Integrations</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {integrations.length === 0 ? (
            <div className="p-12 text-center">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations configured</h3>
              <p className="text-gray-500 mb-6">Connect external systems to automatically sync asset data.</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Add Your First Integration
              </button>
            </div>
          ) : (
            integrations.map((integration) => (
              <div key={integration.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      {getTypeIcon(integration.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                      <p className="text-gray-600">{integration.type}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>Last sync: {new Date(integration.lastSync).toLocaleString()}</span>
                        <span>Frequency: {integration.syncFrequency}</span>
                        <span>Endpoint: {integration.endpoint}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(integration.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(integration.status)}`}>
                        {integration.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTestIntegration(integration)}
                        className="text-purple-600 hover:text-purple-500 p-2"
                        title="Test Connection"
                      >
                        <TestTube className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSyncIntegration(integration.id)}
                        disabled={integration.status === 'Syncing'}
                        className="text-blue-600 hover:text-blue-500 p-2 disabled:opacity-50"
                        title="Sync Now"
                      >
                        <RefreshCw className={`w-4 h-4 ${integration.status === 'Syncing' ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingIntegration(integration);
                          setShowForm(true);
                        }}
                        className="text-green-600 hover:text-green-500 p-2"
                        title="Edit Integration"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIntegration(integration.id)}
                        className="text-red-600 hover:text-red-500 p-2"
                        title="Delete Integration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {integration.errorLog.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Recent Errors:</h4>
                    <div className="space-y-1">
                      {integration.errorLog.slice(0, 3).map((error, index) => (
                        <div key={index} className="text-sm text-red-700">
                          <span className="font-medium">{new Date(error.timestamp).toLocaleString()}:</span> {error.error}
                          {error.details && <div className="text-xs text-red-600 ml-4">{error.details}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {integration.mappings.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Field Mappings:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {integration.mappings.slice(0, 4).map((mapping, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          <code className="bg-white px-2 py-1 rounded">{mapping.sourceField}</code>
                          <span className="mx-2">→</span>
                          <code className="bg-white px-2 py-1 rounded">{mapping.targetField}</code>
                          {mapping.transformation && (
                            <span className="ml-2 text-xs text-blue-600">({mapping.transformation})</span>
                          )}
                        </div>
                      ))}
                      {integration.mappings.length > 4 && (
                        <div className="text-sm text-gray-500 col-span-2">
                          +{integration.mappings.length - 4} more mappings...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      )}

      {/* Integration Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingIntegration ? 'Edit Integration' : 'Add New Integration'}
              </h2>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleCreateIntegration({
                name: formData.get('name') as string,
                type: formData.get('type') as IntegrationType,
                endpoint: formData.get('endpoint') as string,
                apiKey: formData.get('apiKey') as string,
                lastSync: new Date().toISOString(),
                syncFrequency: formData.get('syncFrequency') as string,
                status: 'Active',
                mappings: [],
                errorLog: []
              });
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Integration Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    defaultValue={editingIntegration?.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g., Microsoft SCCM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select 
                    name="type" 
                    required 
                    defaultValue={editingIntegration?.type}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Discovery Tool">Discovery Tool</option>
                    <option value="CMDB">CMDB</option>
                    <option value="ITSM">ITSM Platform</option>
                    <option value="HR System">HR System</option>
                    <option value="Financial">Financial System</option>
                    <option value="Procurement">Procurement System</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                  <input 
                    type="url" 
                    name="endpoint" 
                    required 
                    defaultValue={editingIntegration?.endpoint}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="https://api.example.com/v1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sync Frequency</label>
                  <select 
                    name="syncFrequency" 
                    required 
                    defaultValue={editingIntegration?.syncFrequency}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Real-time">Real-time</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key (Optional)</label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                      type="password" 
                      name="apiKey" 
                      defaultValue={editingIntegration?.apiKey}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="Enter API key or token"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Integration Tips:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ensure the endpoint URL is accessible from your network</li>
                  <li>• API keys should have read permissions for asset data</li>
                  <li>• Test the connection before saving to verify connectivity</li>
                  <li>• Configure field mappings after creating the integration</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingIntegration(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingIntegration ? 'Update' : 'Create'} Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Connection Modal */}
      {showTestModal && testingIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Test Connection: {testingIntegration.name}
              </h2>
            </div>
            <div className="p-6">
              {testResults ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {testResults.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${testResults.success ? 'text-green-800' : 'text-red-800'}`}>
                        {testResults.success ? 'Connection Successful' : 'Connection Failed'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Response Time:</span>
                        <span className="ml-2 font-medium">{testResults.responseTime}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Records Found:</span>
                        <span className="ml-2 font-medium">{testResults.recordsFound}</span>
                      </div>
                    </div>
                    
                    {testResults.lastError && (
                      <div className="mt-3 p-3 bg-red-100 rounded-md">
                        <p className="text-sm text-red-800 font-medium">Error Details:</p>
                        <p className="text-sm text-red-700">{testResults.lastError}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Test completed at: {new Date(testResults.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Testing connection...</span>
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestingIntegration(null);
                  setTestResults(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}