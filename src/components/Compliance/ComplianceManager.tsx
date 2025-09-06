import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, FileText, Calendar, Users, Plus, Edit, Trash2, RefreshCw, Activity, Database, Search, Filter } from 'lucide-react';
import { ComplianceCheck, ComplianceStatus, ComplianceType, PolicyViolation } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';

interface ComplianceManagerProps {
  assets: any[];
  licenses: any[];
}

export default function ComplianceManager({ assets, licenses }: ComplianceManagerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filterType, setFilterType] = useState<ComplianceType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'all'>('all');
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [policyViolations, setPolicyViolations] = useState<PolicyViolation[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadComplianceData();
    
    // Set up auto-refresh every 2 minutes
    const interval = setInterval(() => {
      if (realTimeEnabled) {
        loadComplianceData();
      }
    }, 120000);
    
    setAutoRefreshInterval(interval);
    
    // Set up real-time subscriptions
    let complianceSubscription: any = null;
    let violationsSubscription: any = null;
    
    if (realTimeEnabled) {
      // Subscribe to compliance checks changes
      complianceSubscription = supabaseService.subscribeToComplianceChecks((payload) => {
        setConnectionStatus('connected');
        console.log('Real-time compliance update:', payload);
        handleRealTimeComplianceUpdate(payload);
      });

      // Subscribe to policy violations changes
      violationsSubscription = supabase
        .channel('policy_violations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'policy_violations' }, (payload) => {
          setConnectionStatus('connected');
          console.log('Real-time violation update:', payload);
          handleRealTimeViolationUpdate(payload);
        })
        .subscribe();
    }
    
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
      if (complianceSubscription) {
        supabase.removeChannel(complianceSubscription);
      }
      if (violationsSubscription) {
        supabase.removeChannel(violationsSubscription);
      }
    };
  }, [realTimeEnabled]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await loadComplianceData();
      await runComplianceChecks();
      setLastSync(new Date().toISOString());
    } catch (error) {
      console.error('Manual sync failed:', error);
      setConnectionStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  const runComplianceChecks = async () => {
    try {
      // Run automated compliance checks
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Check license compliance
      const licenseViolations = licenses.filter(license => {
        const usedSeats = license.seats - license.availableSeats;
        return usedSeats > license.seats;
      });

      // Create violations for license overuse
      for (const license of licenseViolations) {
        await supabaseService.createPolicyViolation({
          type: 'License Overuse',
          severity: 'High',
          description: `License ${license.name} is overused by ${license.seats - license.availableSeats} seats`,
          detected_date: new Date().toISOString(),
          assigned_to: 'IT Manager',
          status: 'Open'
        });
      }

      // Check warranty expiry
      const expiringAssets = assets.filter(asset => {
        if (!asset.warrantyExpiry) return false;
        const expiryDate = new Date(asset.warrantyExpiry);
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return expiryDate <= thirtyDaysFromNow;
      });

      // Create alerts for expiring warranties
      for (const asset of expiringAssets) {
        await supabaseService.createAlert({
          type: 'warning',
          title: 'Warranty Expiring Soon',
          message: `Asset ${asset.name} (${asset.tag}) warranty expires on ${asset.warrantyExpiry}`,
          priority: 'medium',
          read: false,
          entity_id: asset.id,
          entity_type: 'asset'
        });
      }

      // Update compliance check status
      const overallStatus = licenseViolations.length === 0 && expiringAssets.length === 0 ? 'Compliant' : 'Non-Compliant';
      
      await supabaseService.createComplianceCheck({
        type: 'License Compliance',
        status: overallStatus,
        last_checked: new Date().toISOString(),
        next_check: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        auditor: 'System Automated Check',
        notes: `Automated compliance check completed. Found ${licenseViolations.length} license violations and ${expiringAssets.length} expiring warranties.`
      });

    } catch (error) {
      console.error('Failed to run compliance checks:', error);
    }
  };

  const handleRealTimeComplianceUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          const transformedCheck: ComplianceCheck = {
            id: newRecord.id,
            type: newRecord.type as ComplianceType,
            status: newRecord.status as ComplianceStatus,
            lastChecked: newRecord.last_checked,
            nextCheck: newRecord.next_check,
            violations: [],
            auditor: newRecord.auditor,
            notes: newRecord.notes
          };
          setComplianceChecks(prev => [transformedCheck, ...prev]);
        }
        break;
      case 'UPDATE':
        if (newRecord) {
          const transformedCheck: ComplianceCheck = {
            id: newRecord.id,
            type: newRecord.type as ComplianceType,
            status: newRecord.status as ComplianceStatus,
            lastChecked: newRecord.last_checked,
            nextCheck: newRecord.next_check,
            violations: [],
            auditor: newRecord.auditor,
            notes: newRecord.notes
          };
          setComplianceChecks(prev => prev.map(check => 
            check.id === newRecord.id ? transformedCheck : check
          ));
        }
        break;
      case 'DELETE':
        if (oldRecord) {
          setComplianceChecks(prev => prev.filter(check => check.id !== oldRecord.id));
        }
        break;
    }
  };

  const handleRealTimeViolationUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          const transformedViolation: PolicyViolation = {
            id: newRecord.id,
            type: newRecord.type,
            severity: newRecord.severity,
            description: newRecord.description,
            detectedDate: newRecord.detected_date,
            resolvedDate: newRecord.resolved_date,
            assignedTo: newRecord.assigned_to,
            status: newRecord.status
          };
          setPolicyViolations(prev => [transformedViolation, ...prev]);
        }
        break;
      case 'UPDATE':
        if (newRecord) {
          const transformedViolation: PolicyViolation = {
            id: newRecord.id,
            type: newRecord.type,
            severity: newRecord.severity,
            description: newRecord.description,
            detectedDate: newRecord.detected_date,
            resolvedDate: newRecord.resolved_date,
            assignedTo: newRecord.assigned_to,
            status: newRecord.status
          };
          setPolicyViolations(prev => prev.map(violation => 
            violation.id === newRecord.id ? transformedViolation : violation
          ));
        }
        break;
      case 'DELETE':
        if (oldRecord) {
          setPolicyViolations(prev => prev.filter(violation => violation.id !== oldRecord.id));
        }
        break;
    }
  };

  const loadComplianceData = async () => {
    setLoading(true);
    setConnectionStatus('disconnected');
    try {
      // Load compliance checks from Supabase
      const checksData = await supabaseService.getComplianceChecks();
      if (checksData) {
        const transformedChecks = checksData.map(check => ({
          id: check.id,
          type: check.type as ComplianceType,
          status: check.status as ComplianceStatus,
          lastChecked: check.last_checked,
          nextCheck: check.next_check,
          violations: [],
          auditor: check.auditor,
          notes: check.notes
        }));
        setComplianceChecks(transformedChecks);
        setConnectionStatus('connected');
      } else {
        generateSampleComplianceData();
        setConnectionStatus('error');
      }

      // Load policy violations from Supabase
      const violationsData = await supabaseService.getPolicyViolations();
      if (violationsData) {
        const transformedViolations = violationsData.map(violation => ({
          id: violation.id,
          type: violation.type,
          severity: violation.severity,
          description: violation.description,
          detectedDate: violation.detected_date,
          resolvedDate: violation.resolved_date,
          assignedTo: violation.assigned_to,
          status: violation.status
        }));
        setPolicyViolations(transformedViolations);
        setConnectionStatus('connected');
      } else {
        generateSampleViolations();
        setConnectionStatus('error');
      }
      setLastSync(new Date().toISOString());
    } catch (error) {
      console.warn('Failed to load compliance data from Supabase, using sample data');
      setConnectionStatus('error');
      generateSampleComplianceData();
      generateSampleViolations();
    } finally {
      setLoading(false);
    }
  };

  const generateSampleComplianceData = () => {
    const sampleChecks: ComplianceCheck[] = [
      {
        id: '1',
        type: 'License Compliance',
        status: 'Compliant',
        lastChecked: new Date().toISOString(),
        nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        violations: [],
        auditor: 'System Administrator',
        notes: 'All software licenses are properly tracked and within limits'
      },
      {
        id: '2',
        type: 'Security Compliance',
        status: 'Non-Compliant',
        lastChecked: new Date().toISOString(),
        nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        violations: [],
        auditor: 'Security Team',
        notes: 'Some assets missing security patches'
      }
    ];
    setComplianceChecks(sampleChecks);
  };

  const generateSampleViolations = () => {
    const sampleViolations: PolicyViolation[] = [
      {
        id: '1',
        type: 'License Overuse',
        severity: 'Critical',
        description: 'Microsoft Office licenses exceeded by 5 seats',
        detectedDate: new Date().toISOString(),
        assignedTo: 'IT Manager',
        status: 'Open'
      },
      {
        id: '2',
        type: 'Unauthorized Software',
        severity: 'High',
        description: 'Unauthorized software detected on 3 workstations',
        detectedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: 'Security Team',
        status: 'In Progress'
      }
    ];
    setPolicyViolations(sampleViolations);
  };

  const handleCreateComplianceCheck = async (checkData: Omit<ComplianceCheck, 'id'>) => {
    try {
      const response = await supabaseService.createComplianceCheck({
        type: checkData.type,
        status: checkData.status,
        last_checked: checkData.lastChecked,
        next_check: checkData.nextCheck,
        auditor: checkData.auditor,
        notes: checkData.notes || ''
      });
      
      if (response) {
        const transformedCheck: ComplianceCheck = {
          id: response.id,
          type: response.type as ComplianceType,
          status: response.status as ComplianceStatus,
          lastChecked: response.last_checked,
          nextCheck: response.next_check,
          violations: [],
          auditor: response.auditor,
          notes: response.notes
        };
        setComplianceChecks(prev => [...prev, transformedCheck]);
      } else {
        const newCheck: ComplianceCheck = {
          ...checkData,
          id: Date.now().toString()
        };
        setComplianceChecks(prev => [...prev, newCheck]);
      }
    } catch (error) {
      console.error('Failed to create compliance check:', error);
    }
  };

  const handleResolveViolation = async (violationId: string) => {
    try {
      await supabaseService.resolvePolicyViolation(violationId);
      
      setPolicyViolations(prev => prev.map(violation => 
        violation.id === violationId 
          ? { ...violation, status: 'Resolved', resolvedDate: new Date().toISOString() }
          : violation
      ));
    } catch (error) {
      console.error('Failed to resolve violation:', error);
    }
  };

  const filteredChecks = complianceChecks.filter(check => {
    const matchesType = filterType === 'all' || check.type === filterType;
    const matchesStatus = statusFilter === 'all' || check.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      check.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.auditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (check.notes && check.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesStatus && matchesSearch;
  });

  const filteredViolations = policyViolations.filter(violation => {
    const matchesSearch = searchTerm === '' ||
      violation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      violation.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case 'Compliant': return 'text-green-600 bg-green-100';
      case 'Non-Compliant': return 'text-red-600 bg-red-100';
      case 'Under Review': return 'text-yellow-600 bg-yellow-100';
      case 'Remediation Required': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case 'Compliant': return <CheckCircle className="w-5 h-5" />;
      case 'Non-Compliant': return <XCircle className="w-5 h-5" />;
      case 'Under Review': return <AlertTriangle className="w-5 h-5" />;
      case 'Remediation Required': return <AlertTriangle className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const complianceScore = complianceChecks.length > 0 ? 
    (complianceChecks.filter(c => c.status === 'Compliant').length / complianceChecks.length) * 100 : 100;

  const criticalViolations = policyViolations.filter(v => v.severity === 'Critical' && v.status === 'Open');
  const openViolations = policyViolations.filter(v => v.status === 'Open');

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance & Audits</h1>
          <p className="text-gray-600">Monitor compliance status and manage policy violations</p>
          <div className="flex items-center space-x-4 mt-1">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConnectionStatusColor()}`}>
              <Activity className="w-3 h-3 inline mr-1" />
              {connectionStatus.toUpperCase()}
            </div>
            <p className="text-xs text-gray-500">Real-time: {realTimeEnabled ? 'ON' : 'OFF'}</p>
            {lastSync && <p className="text-xs text-gray-400">Last sync: {new Date(lastSync).toLocaleTimeString()}</p>}
            <button
              onClick={() => setRealTimeEnabled(!realTimeEnabled)}
              className={`text-xs px-2 py-1 rounded ${
                realTimeEnabled 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {realTimeEnabled ? 'Disable' : 'Enable'} Real-time
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        <div className="flex items-center space-x-4">
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{complianceScore.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Compliance Score</div>
          </div>
          <button
            onClick={() => handleCreateComplianceCheck({
              type: 'License Compliance',
              status: 'Under Review',
              lastChecked: new Date().toISOString(),
              nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              violations: [],
              auditor: 'System Administrator'
            })}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Check</span>
          </button>
        </div>
      </div>
      </div>

      {/* Compliance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {complianceChecks.filter(c => c.status === 'Compliant').length}
              </div>
              <div className="text-sm font-medium text-green-700">Compliant</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">{criticalViolations.length}</div>
              <div className="text-sm font-medium text-red-700">Critical Issues</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{openViolations.length}</div>
              <div className="text-sm font-medium text-yellow-700">Open Violations</div>
            </div>
            <XCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{complianceChecks.length}</div>
              <div className="text-sm font-medium text-blue-700">Total Checks</div>
            </div>
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: <Shield className="w-4 h-4" /> },
              { id: 'checks', label: 'Compliance Checks', icon: <CheckCircle className="w-4 h-4" /> },
              { id: 'violations', label: 'Policy Violations', icon: <AlertTriangle className="w-4 h-4" /> },
              { id: 'audits', label: 'Audit Reports', icon: <FileText className="w-4 h-4" /> }
            ].map((tab) => (
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
              {/* Real-time Status Panel */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Database Connection</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConnectionStatusColor()}`}>
                        {connectionStatus}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Real-time Updates</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${realTimeEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {realTimeEnabled ? 'ENABLED' : 'DISABLED'}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Auto Checks</span>
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ACTIVE
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compliance Score Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Score Breakdown</h3>
                  <div className="space-y-4">
                    {['License Compliance', 'Security Compliance', 'Regulatory Compliance', 'Policy Compliance'].map((type) => {
                      const typeChecks = complianceChecks.filter(c => c.type === type);
                      const typeScore = typeChecks.length > 0 ? 
                        (typeChecks.filter(c => c.status === 'Compliant').length / typeChecks.length) * 100 : 100;
                      
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-700">{type}</span>
                            <span className="text-sm text-gray-500">{typeScore.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                typeScore >= 90 ? 'bg-green-600' : 
                                typeScore >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${typeScore}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Violations */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Violations</h3>
                  <div className="space-y-3">
                    {policyViolations.slice(0, 5).map((violation) => (
                      <div key={violation.id} className="flex items-start space-x-3 p-3 bg-white rounded-md">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                          violation.severity === 'Critical' ? 'text-red-600' :
                          violation.severity === 'High' ? 'text-orange-600' :
                          violation.severity === 'Medium' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{violation.description}</p>
                          <p className="text-xs text-gray-500">
                            {violation.type} • {new Date(violation.detectedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checks' && (
            <div className="space-y-4">
              {/* Enhanced Filters */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search checks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as ComplianceType | 'all')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="License Compliance">License Compliance</option>
                  <option value="Security Compliance">Security Compliance</option>
                  <option value="Regulatory Compliance">Regulatory Compliance</option>
                  <option value="Policy Compliance">Policy Compliance</option>
                </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ComplianceStatus | 'all')}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="Compliant">Compliant</option>
                    <option value="Non-Compliant">Non-Compliant</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Remediation Required">Remediation Required</option>
                  </select>
                  <button
                    onClick={runComplianceChecks}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Run Checks</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredChecks.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No compliance checks found</h3>
                    <p className="text-gray-500 mb-4">No checks match your current filters.</p>
                    <button
                      onClick={() => {
                        setFilterType('all');
                        setStatusFilter('all');
                        setSearchTerm('');
                      }}
                      className="text-blue-600 hover:text-blue-500"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  filteredChecks.map((check) => (
                    <div key={check.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-md ${getStatusColor(check.status)}`}>
                            {getStatusIcon(check.status)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{check.type}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                                {check.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Last checked: {new Date(check.lastChecked).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Next check: {new Date(check.nextCheck).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Auditor: {check.auditor}
                            </p>
                            {check.notes && (
                              <p className="text-sm text-gray-500 mt-2">{check.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => console.log('Edit check:', check.id)}
                            className="text-blue-600 hover:text-blue-500 p-2"
                            title="Edit Check"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => console.log('Delete check:', check.id)}
                            className="text-red-600 hover:text-red-500 p-2"
                            title="Delete Check"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'violations' && (
            <div className="space-y-4">
              {/* Violation Filters */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search violations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {filteredViolations.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No policy violations found</h3>
                  <p className="text-gray-500">No violations match your current filters.</p>
                </div>
              ) : (
                filteredViolations.map((violation) => (
                <div key={violation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                        violation.severity === 'Critical' ? 'text-red-600' :
                        violation.severity === 'High' ? 'text-orange-600' :
                        violation.severity === 'Medium' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{violation.description}</h4>
                        <div className="mt-1 space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              violation.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                              violation.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                              violation.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {violation.severity}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              violation.status === 'Open' ? 'bg-red-100 text-red-800' :
                              violation.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {violation.status}
                            </span>
                          </div>
                          <p>Type: {violation.type}</p>
                          <p>Detected: {new Date(violation.detectedDate).toLocaleDateString()}</p>
                          <p>Assigned to: {violation.assignedTo}</p>
                          {violation.resolvedDate && (
                            <p>Resolved: {new Date(violation.resolvedDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {violation.status === 'Open' && (
                        <button
                          onClick={() => handleResolveViolation(violation.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => console.log('Edit violation:', violation.id)}
                        className="text-blue-600 hover:text-blue-500 p-2"
                        title="Edit Violation"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'audits' && (
            <div className="space-y-6">
              {/* Audit Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{assets.length}</div>
                      <div className="text-sm font-medium text-blue-700">Assets Tracked</div>
                    </div>
                    <Database className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{licenses.length}</div>
                      <div className="text-sm font-medium text-green-700">Licenses Monitored</div>
                    </div>
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round((complianceChecks.filter(c => c.status === 'Compliant').length / Math.max(complianceChecks.length, 1)) * 100)}%
                      </div>
                      <div className="text-sm font-medium text-purple-700">Audit Score</div>
                    </div>
                    <Shield className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">License Audit Report</h4>
                    <p className="text-sm text-gray-600 mb-3">Complete audit of all software licenses</p>
                    <div className="text-xs text-gray-500 mb-3">
                      Last run: {lastSync ? new Date(lastSync).toLocaleDateString() : 'Never'}
                    </div>
                    <button 
                      onClick={() => runComplianceChecks()}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Generate Report
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Security Compliance</h4>
                    <p className="text-sm text-gray-600 mb-3">Security policy compliance status</p>
                    <div className="text-xs text-gray-500 mb-3">
                      Status: {criticalViolations.length === 0 ? 'Compliant' : 'Issues Found'}
                    </div>
                    <button 
                      onClick={() => runComplianceChecks()}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Generate Report
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Asset Compliance</h4>
                    <p className="text-sm text-gray-600 mb-3">Asset management compliance audit</p>
                    <div className="text-xs text-gray-500 mb-3">
                      Assets: {assets.length} | Compliant: {assets.filter(a => a.status === 'Active').length}
                    </div>
                    <button 
                      onClick={() => runComplianceChecks()}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Audit Activity */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Audit Activity</h3>
                <div className="space-y-3">
                  {complianceChecks.slice(0, 5).map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-md ${getStatusColor(check.status)}`}>
                          {getStatusIcon(check.status)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{check.type}</p>
                          <p className="text-xs text-gray-500">
                            {check.auditor} • {new Date(check.lastChecked).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                        {check.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}