import React, { useState } from 'react';
import { X, Save, TestTube, Key, Globe, Database, Settings, Users, DollarSign, ShoppingCart } from 'lucide-react';
import { Integration, IntegrationType } from '../../types';

interface IntegrationFormProps {
  integration?: Integration;
  onSave: (integration: Omit<Integration, 'id'>) => void;
  onCancel: () => void;
  onTest?: (integration: Omit<Integration, 'id'>) => Promise<any>;
}

export default function IntegrationForm({ integration, onSave, onCancel, onTest }: IntegrationFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: integration?.name || '',
    type: integration?.type || 'Discovery Tool' as IntegrationType,
    endpoint: integration?.endpoint || '',
    apiKey: integration?.apiKey || '',
    syncFrequency: integration?.syncFrequency || 'Daily',
    mappings: integration?.mappings || [],
    status: integration?.status || 'Active'
  });
  
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      lastSync: new Date().toISOString(),
      errorLog: []
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTestConnection = async () => {
    if (!onTest) return;
    
    setTesting(true);
    setTestResults(null);
    
    try {
      const results = await onTest({
        ...formData,
        lastSync: new Date().toISOString(),
        errorLog: []
      });
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        error: 'Failed to test connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  const addMapping = () => {
    setFormData(prev => ({
      ...prev,
      mappings: [...prev.mappings, { sourceField: '', targetField: '', transformation: '' }]
    }));
  };

  const updateMapping = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      mappings: prev.mappings.map((mapping, i) => 
        i === index ? { ...mapping, [field]: value } : mapping
      )
    }));
  };

  const removeMapping = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mappings: prev.mappings.filter((_, i) => i !== index)
    }));
  };

  const getTypeIcon = (type: IntegrationType) => {
    switch (type) {
      case 'Discovery Tool': return <Globe className="w-5 h-5" />;
      case 'CMDB': return <Database className="w-5 h-5" />;
      case 'ITSM': return <Settings className="w-5 h-5" />;
      case 'HR System': return <Users className="w-5 h-5" />;
      case 'Financial': return <DollarSign className="w-5 h-5" />;
      case 'Procurement': return <ShoppingCart className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'mappings', label: 'Field Mappings', icon: <Database className="w-4 h-4" /> },
    { id: 'test', label: 'Test Connection', icon: <TestTube className="w-4 h-4" /> }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {integration ? 'Edit Integration' : 'Add New Integration'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex">
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <form onSubmit={handleSubmit}>
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Integration Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Microsoft SCCM"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Integration Type *
                      </label>
                      <div className="relative">
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                          <option value="Discovery Tool">Discovery Tool</option>
                          <option value="CMDB">CMDB</option>
                          <option value="ITSM">ITSM Platform</option>
                          <option value="HR System">HR System</option>
                          <option value="Financial">Financial System</option>
                          <option value="Procurement">Procurement System</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          {getTypeIcon(formData.type)}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endpoint URL *
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="url"
                          name="endpoint"
                          value={formData.endpoint}
                          onChange={handleChange}
                          required
                          placeholder="https://api.example.com/v1"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sync Frequency *
                      </label>
                      <select
                        name="syncFrequency"
                        value={formData.syncFrequency}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Real-time">Real-time</option>
                        <option value="Every 15 minutes">Every 15 minutes</option>
                        <option value="Hourly">Hourly</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key / Token
                      </label>
                      <div className="relative">
                        <Key className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="password"
                          name="apiKey"
                          value={formData.apiKey}
                          onChange={handleChange}
                          placeholder="Enter API key or authentication token"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Integration Guidelines:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Ensure the endpoint URL is accessible from your network</li>
                      <li>• API keys should have appropriate read permissions</li>
                      <li>• Test the connection before saving to verify connectivity</li>
                      <li>• Configure field mappings to match your data structure</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'mappings' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Field Mappings</h3>
                    <button
                      type="button"
                      onClick={addMapping}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                    >
                      Add Mapping
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.mappings.map((mapping, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Source Field
                          </label>
                          <input
                            type="text"
                            value={mapping.sourceField}
                            onChange={(e) => updateMapping(index, 'sourceField', e.target.value)}
                            placeholder="e.g., ComputerName"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target Field
                          </label>
                          <select
                            value={mapping.targetField}
                            onChange={(e) => updateMapping(index, 'targetField', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Select target field</option>
                            <option value="name">Name</option>
                            <option value="tag">Asset Tag</option>
                            <option value="serialNumber">Serial Number</option>
                            <option value="manufacturer">Manufacturer</option>
                            <option value="model">Model</option>
                            <option value="location">Location</option>
                            <option value="assignedTo">Assigned To</option>
                            <option value="department">Department</option>
                            <option value="status">Status</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transformation
                          </label>
                          <select
                            value={mapping.transformation || ''}
                            onChange={(e) => updateMapping(index, 'transformation', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">None</option>
                            <option value="uppercase">Uppercase</option>
                            <option value="lowercase">Lowercase</option>
                            <option value="trim">Trim whitespace</option>
                            <option value="capitalize">Capitalize</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeMapping(index)}
                            className="text-red-600 hover:text-red-500 p-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {formData.mappings.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No field mappings configured</p>
                        <button
                          type="button"
                          onClick={addMapping}
                          className="mt-2 text-blue-600 hover:text-blue-500"
                        >
                          Add your first mapping
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'test' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Test Connection</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Connection Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Endpoint:</span>
                        <span className="font-mono text-gray-900">{formData.endpoint || 'Not configured'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="text-gray-900">{formData.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Authentication:</span>
                        <span className="text-gray-900">{formData.apiKey ? 'Configured' : 'None'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testing || !formData.endpoint}
                      className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      <TestTube className={`w-5 h-5 ${testing ? 'animate-pulse' : ''}`} />
                      <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                  </div>

                  {testResults && (
                    <div className={`p-4 rounded-lg ${
                      testResults.success 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2 mb-3">
                        {testResults.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          testResults.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {testResults.success ? 'Connection Successful' : 'Connection Failed'}
                        </span>
                      </div>
                      
                      {testResults.success && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Response Time:</span>
                            <span className="ml-2 font-medium">{testResults.responseTime}ms</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Records Available:</span>
                            <span className="ml-2 font-medium">{testResults.recordsFound}</span>
                          </div>
                        </div>
                      )}
                      
                      {testResults.error && (
                        <div className="mt-3 p-3 bg-red-100 rounded-md">
                          <p className="text-sm text-red-800 font-medium">Error Details:</p>
                          <p className="text-sm text-red-700">{testResults.error}</p>
                          {testResults.details && (
                            <p className="text-xs text-red-600 mt-1">{testResults.details}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{integration ? 'Update' : 'Create'} Integration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}