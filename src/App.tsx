import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/EnhancedDashboard';
import AssetsList from './components/Assets/AssetsList';
import LicensesList from './components/Licenses/LicensesList';
import AccessoriesList from './components/Accessories/AccessoriesList';
import ConsumablesList from './components/Consumables/ConsumablesList';
import ComponentsList from './components/Components/ComponentsList';
import PeopleList from './components/People/PeopleList';
import PredefinedKitsList from './components/PredefinedKits/PredefinedKitsList';
import RequestableItemsList from './components/RequestableItems/RequestableItemsList';
import AlertsManager from './components/Alerts/AlertsManager';
import ComplianceManager from './components/Compliance/ComplianceManager';
import MaintenanceManager from './components/Maintenance/MaintenanceManager';
import FinancialManager from './components/Financial/FinancialManager';
import AnalyticsManager from './components/Analytics/AnalyticsManager';
import IntegrationsManager from './components/Integrations/IntegrationsManager';
import ReportsManager from './components/Reports/ReportsManager';
import ImportManager from './components/Import/ImportManager';
import SettingsManager from './components/Settings/SettingsManager';

// Common components
import ViewModal from './components/Common/ViewModal';

// Forms
import AssetForm from './components/Assets/AssetForm';
import EnhancedAssetForm from './components/Assets/EnhancedAssetForm';
import LicenseForm from './components/Licenses/LicenseForm';
import AccessoryForm from './components/Accessories/AccessoryForm';
import ConsumableForm from './components/Consumables/ConsumableForm';
import ComponentForm from './components/Components/ComponentForm';
import UserForm from './components/People/UserForm';
import PredefinedKitForm from './components/PredefinedKits/PredefinedKitForm';
import RequestableItemForm from './components/RequestableItems/RequestableItemForm';

import { useLocalStorage } from './hooks/useLocalStorage';
import apiService from './services/api';
import supabaseService from './services/supabaseService';
import { 
  Asset, 
  License, 
  Accessory, 
  Consumable, 
  Component, 
  User, 
  PredefinedKit, 
  RequestableItem,
  DashboardMetrics,
  UserProfile,
  ImportRecord,
  Report
} from './types';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<string>('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [viewType, setViewType] = useState<string>('');

  // Data states
  const [assets, setAssets] = useLocalStorage<Asset[]>('assets', []);
  const [licenses, setLicenses] = useLocalStorage<License[]>('licenses', []);
  const [accessories, setAccessories] = useLocalStorage<Accessory[]>('accessories', []);
  const [consumables, setConsumables] = useLocalStorage<Consumable[]>('consumables', []);
  const [components, setComponents] = useLocalStorage<Component[]>('components', []);
  const [users, setUsers] = useLocalStorage<User[]>('users', []);
  const [predefinedKits, setPredefinedKits] = useLocalStorage<PredefinedKit[]>('predefinedKits', []);
  const [requestableItems, setRequestableItems] = useLocalStorage<RequestableItem[]>('requestableItems', []);
  const [imports, setImports] = useLocalStorage<ImportRecord[]>('imports', []);
  const [reports, setReports] = useLocalStorage<Report[]>('reports', []);

  // Load data from Supabase on component mount
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        loadDataFromSupabase();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadDataFromSupabase();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadDataFromSupabase();
    }
  }, [user]);

  const loadDataFromSupabase = async () => {
    if (!user) return;
    
    // loadDataFromSupabase();
  };

  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', {
    id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@company.com',
    username: 'admin',
    department: 'IT',
    jobTitle: 'System Administrator',
    location: 'Main Office',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    permissions: ['admin'],
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      notifications: true
    }
  });

  const metrics: DashboardMetrics = {
    assets: assets.length,
    licenses: licenses.length,
    accessories: accessories.length,
    consumables: consumables.length,
    components: components.length,
    people: users.length,
    predefinedKits: predefinedKits.length,
    requestableItems: requestableItems.length,
    alerts: 3,
    expiringWarranties: assets.filter(a => a.warrantyExpiry && new Date(a.warrantyExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length,
    expiringLicenses: licenses.filter(l => l.expiryDate && new Date(l.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length,
    maintenanceDue: 2,
    complianceIssues: 1,
    totalValue: assets.reduce((sum, asset) => sum + (asset.purchaseCost || 0), 0) +
                licenses.reduce((sum, license) => sum + (license.cost || 0), 0) +
                accessories.reduce((sum, acc) => sum + (acc.purchaseCost || 0), 0) +
                components.reduce((sum, comp) => sum + (comp.purchaseCost || 0), 0)
  };

  const handleCreateNew = (type: string) => {
    setFormType(type);
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: any, type: string) => {
    setFormType(type);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSave = async (data: any) => {
    if (!user) {
      alert('You must be logged in to perform this action');
      return;
    }

    try {
      let response: any;
      
      // Validate editingItem ID if it exists
      if (editingItem && (!editingItem.id || editingItem.id === '' || editingItem.id.trim() === '')) {
        console.error('Cannot update item: Invalid or empty ID', editingItem);
        alert('Cannot update item: Invalid ID. Please try creating a new item instead.');
        return;
      }
     
      switch (formType) {
        case 'asset':
          if (editingItem) {
            // Additional validation for UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(editingItem.id)) {
              console.error('Invalid UUID format for asset ID:', editingItem.id);
              alert('Cannot update asset: Invalid ID format. Please try creating a new asset instead.');
              return;
            }
            response = await supabaseService.updateAsset(editingItem.id, {
              asset_tag: data.tag,
              name: data.name,
              category: data.category,
              model: data.model,
              serial_number: data.serialNumber,
              status: data.status,
              assigned_to: data.assignedTo,
              location: data.location,
              purchase_date: data.purchaseDate,
              purchase_cost: data.purchaseCost,
              warranty_expires: data.warrantyExpiry,
              notes: data.notes
            });
            setAssets(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...data } : item));
          } else {
            response = await supabaseService.createAsset({
              asset_tag: data.tag,
              name: data.name,
              category: data.category,
              model: data.model,
              serial_number: data.serialNumber,
              status: data.status || 'available',
              assigned_to: data.assignedTo,
              location: data.location,
              purchase_date: data.purchaseDate,
              purchase_cost: data.purchaseCost,
              warranty_expires: data.warrantyExpiry,
              notes: data.notes
            });
            const newAsset = { ...data, id: response.id };
            setAssets(prev => [...prev, newAsset]);
          }
          break;
        case 'license':
          if (editingItem) {
            // Additional validation for UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(editingItem.id)) {
              console.error('Invalid UUID format for license ID:', editingItem.id);
              alert('Cannot update license: Invalid ID format. Please try creating a new license instead.');
              return;
            }
            response = await supabaseService.updateLicense(editingItem.id, {
              name: data.name,
             type: data.licenseSoftwareType || 'subscription',
              seats_total: data.seats,
              seats_used: data.seats - data.availableSeats,
              expiry_date: data.expiryDate,
              cost: data.cost,
              vendor: data.vendor,
              status: 'active',
              notes: (data.notes ? data.notes + ' | ' : '') + 'Category: ' + data.category
            });
            setLicenses(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...data } : item));
          } else {
            response = await supabaseService.createLicense({
              name: data.name,
             type: data.licenseSoftwareType || 'subscription',
              seats_total: data.seats,
              seats_used: data.seats - data.availableSeats,
              expiry_date: data.expiryDate,
              cost: data.cost,
              vendor: data.vendor,
              status: 'active',
              notes: (data.notes ? data.notes + ' | ' : '') + 'Category: ' + data.category
            });
            const newLicense = { ...data, id: response.id };
            setLicenses(prev => [...prev, newLicense]);
          }
          break;
        case 'accessory':
          if (editingItem) {
            // Additional validation for UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(editingItem.id)) {
              console.error('Invalid UUID format for accessory ID:', editingItem.id);
              alert('Cannot update accessory: Invalid ID format. Please try creating a new accessory instead.');
              return;
            }
            response = await supabaseService.updateAccessory(editingItem.id, {
              name: data.name,
              category: data.category,
              brand: data.manufacturer,
              model: data.model,
              quantity: data.quantity,
              available: data.availableQuantity,
              location: data.location,
              unit_cost: data.purchaseCost,
              status: 'in_stock',
              notes: data.notes || ''
            });
            setAccessories(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...data } : item));
          } else {
            response = await supabaseService.createAccessory({
              name: data.name,
              category: data.category,
              brand: data.manufacturer,
              model: data.model,
              quantity: data.quantity,
              available: data.availableQuantity,
              location: data.location,
              unit_cost: data.purchaseCost,
              status: 'in_stock',
              notes: data.notes || ''
            });
            const newAccessory = { ...data, id: response.id };
            setAccessories(prev => [...prev, newAccessory]);
          }
          break;
        case 'consumable':
          if (editingItem) {
            // Additional validation for UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(editingItem.id)) {
              console.error('Invalid UUID format for consumable ID:', editingItem.id);
              alert('Cannot update consumable: Invalid ID format. Please try creating a new consumable instead.');
              return;
            }
            response = await supabaseService.updateConsumable(editingItem.id, {
              name: data.name,
              category: data.category,
              brand: data.manufacturer,
              model: data.model,
              quantity: data.quantity,
              min_stock: data.minQuantity,
              location: data.location,
              unit_cost: 0,
              status: 'in_stock',
              notes: data.notes || ''
            });
            setConsumables(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...data } : item));
          } else {
            response = await supabaseService.createConsumable({
              name: data.name,
              category: data.category,
              brand: data.manufacturer,
              model: data.model,
              quantity: data.quantity,
              min_stock: data.minQuantity,
              location: data.location,
              unit_cost: 0,
              status: 'in_stock',
              notes: data.notes || ''
            });
            const newConsumable = { ...data, id: response.id };
            setConsumables(prev => [...prev, newConsumable]);
          }
          break;
        case 'component':
          if (editingItem) {
            // Additional validation for UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(editingItem.id)) {
              console.error('Invalid UUID format for component ID:', editingItem.id);
              alert('Cannot update component: Invalid ID format. Please try creating a new component instead.');
              return;
            }
            response = await supabaseService.updateComponent(editingItem.id, {
              name: data.name,
              category: data.category,
              brand: data.manufacturer,
              model: data.model,
              quantity: data.quantity,
              available: data.quantity,
              location: data.location,
              unit_cost: data.purchaseCost,
              status: 'available',
              notes: data.notes || ''
            });
            setComponents(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...data } : item));
          } else {
            response = await supabaseService.createComponent({
              name: data.name,
              category: data.category,
              brand: data.manufacturer,
              model: data.model,
              quantity: data.quantity,
              available: data.quantity,
              location: data.location,
              unit_cost: data.purchaseCost,
              status: 'available',
              notes: data.notes || ''
            });
            const newComponent = { ...data, id: response.id };
            setComponents(prev => [...prev, newComponent]);
          }
          break;
        case 'user':
          // Use people table for user operations
          if (editingItem) {
            // Additional validation for UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(editingItem.id)) {
              console.error('Invalid UUID format for user ID:', editingItem.id);
              alert('Cannot update user: Invalid ID format. Please try creating a new user instead.');
              return;
            }
            response = await supabaseService.updatePerson(editingItem.id, {
              name: `${data.firstName} ${data.lastName}`,
              email: data.email,
              department: data.department,
              role: data.jobTitle,
              location: data.location,
              phone: data.phone,
              status: data.activated ? 'active' : 'inactive',
              hire_date: null
            });
            setUsers(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...data } : item));
          } else {
            response = await supabaseService.createPerson({
              name: `${data.firstName} ${data.lastName}`,
              email: data.email,
              department: data.department,
              role: data.jobTitle,
              location: data.location,
              phone: data.phone,
              status: data.activated ? 'active' : 'inactive',
              hire_date: null
            });
            const newUser = { ...data, id: response.id };
            setUsers(prev => [...prev, newUser]);
          }
          break;
        case 'kit':
          if (editingItem) {
            // Additional validation for UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(editingItem.id)) {
              console.error('Invalid UUID format for kit ID:', editingItem.id);
              alert('Cannot update kit: Invalid ID format. Please try creating a new kit instead.');
              return;
            }
            response = await supabaseService.updatePredefinedKit(editingItem.id, data);
            setPredefinedKits(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...data } : item));
          } else {
            response = await supabaseService.createPredefinedKit(data);
            const newKit = { ...data, id: response.id, createdDate: response.created_at };
            setPredefinedKits(prev => [...prev, newKit]);
          }
          break;
        case 'requestable':
          if (editingItem) {
            // Additional validation for UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(editingItem.id)) {
              console.error('Invalid UUID format for requestable item ID:', editingItem.id);
              alert('Cannot update requestable item: Invalid ID format. Please try creating a new requestable item instead.');
              return;
            }
            response = await supabaseService.updateRequestableItem(editingItem.id, data);
            setRequestableItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...data } : item));
          } else {
            response = await supabaseService.createRequestableItem(data);
            const newRequestable = { ...data, id: response.id };
            setRequestableItems(prev => [...prev, newRequestable]);
          }
          break;
      }
    } catch (error) {
      console.error('Error saving item:', error);
      // Check if it's a UUID-related error
      if (error instanceof Error && error.message.includes('invalid input syntax for type uuid')) {
        alert('Database error: Invalid ID format detected. Please refresh the page and try again.');
      }
    }
    
    setShowForm(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: string, type: string) => {
    if (!user) {
      alert('You must be logged in to perform this action');
      return;
    }

    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      switch (type) {
        case 'asset':
          await supabaseService.deleteAsset(id);
          setAssets(prev => prev.filter(item => item.id !== id));
          break;
        case 'license':
          await supabaseService.deleteLicense(id);
          setLicenses(prev => prev.filter(item => item.id !== id));
          break;
        case 'accessory':
          await supabaseService.deleteAccessory(id);
          setAccessories(prev => prev.filter(item => item.id !== id));
          break;
        case 'consumable':
          await supabaseService.deleteConsumable(id);
          setConsumables(prev => prev.filter(item => item.id !== id));
          break;
        case 'component':
          await supabaseService.deleteComponent(id);
          setComponents(prev => prev.filter(item => item.id !== id));
          break;
        case 'user':
          await supabaseService.deletePerson(id);
          setUsers(prev => prev.filter(item => item.id !== id));
          break;
        case 'kit':
          await supabaseService.deletePredefinedKit(id);
          setPredefinedKits(prev => prev.filter(item => item.id !== id));
          break;
        case 'requestable':
          await supabaseService.deleteRequestableItem(id);
          setRequestableItems(prev => prev.filter(item => item.id !== id));
          break;
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleView = (item: any, type?: string) => {
    setViewingItem(item);
    setViewType(type || formType);
    setShowViewModal(true);
  };

  const handleImport = async (file: File, type: string) => {
    try {
      const importRecord = await supabaseService.createImportRecord({
        file_name: file.name,
        type: type as any,
        status: 'processing',
        records_processed: 0,
        total_records: 0,
        errors: [],
        import_date: new Date().toISOString()
      });

      const transformedRecord = {
        ...importRecord,
        fileName: importRecord.file_name,
        recordsProcessed: importRecord.records_processed,
        totalRecords: importRecord.total_records,
        importDate: importRecord.import_date
      };

      setImports(prev => [...prev, transformedRecord]);

      // Simulate import processing
      setTimeout(async () => {
        try {
          await supabaseService.updateImportRecord(importRecord.id, {
            status: 'completed',
            records_processed: 10,
            total_records: 10
          });
          setImports(prev => prev.map(imp => 
            imp.id === importRecord.id 
              ? { ...imp, status: 'completed', recordsProcessed: 10, totalRecords: 10 }
              : imp
          ));
        } catch (error) {
          console.error('Failed to update import record:', error);
        }
      }, 3000);
    } catch (error) {
      console.error('Failed to create import record:', error);
    }
  };

  const handleRunReport = (reportId: string) => {
    console.log('Running report:', reportId);
  };

  const handleCreateReport = () => {
    console.log('Creating new report');
  };

  const handleSaveSettings = (settings: any) => {
    console.log('Saving settings:', settings);
  };

  const handleProfileUpdate = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const handleDeploy = (kit: PredefinedKit) => {
    if (!user) {
      alert('You must be logged in to perform this action');
      return;
    }
    console.log('Deploying kit:', kit);
  };

  const handleRequest = (item: RequestableItem) => {
    if (!user) {
      alert('You must be logged in to perform this action');
      return;
    }
    console.log('Requesting item:', item);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <Dashboard 
            metrics={metrics} 
            onSectionChange={setActiveSection}
            onCreateNew={handleCreateNew}
          />
        );
      case 'assets':
        return (
          <AssetsList
            assets={assets}
            onCreateNew={() => handleCreateNew('asset')}
            onEdit={(asset) => handleEdit(asset, 'asset')}
            onDelete={(id) => handleDelete(id, 'asset')}
            onView={(asset) => handleView(asset, 'asset')}
          />
        );
      case 'licenses':
        return (
          <LicensesList
            licenses={licenses}
            onCreateNew={() => handleCreateNew('license')}
            onEdit={(license) => handleEdit(license, 'license')}
            onDelete={(id) => handleDelete(id, 'license')}
            onView={(license) => handleView(license, 'license')}
          />
        );
      case 'accessories':
        return (
          <AccessoriesList
            accessories={accessories}
            onCreateNew={() => handleCreateNew('accessory')}
            onEdit={(accessory) => handleEdit(accessory, 'accessory')}
            onDelete={(id) => handleDelete(id, 'accessory')}
            onView={(accessory) => handleView(accessory, 'accessory')}
          />
        );
      case 'consumables':
        return (
          <ConsumablesList
            consumables={consumables}
            onCreateNew={() => handleCreateNew('consumable')}
            onEdit={(consumable) => handleEdit(consumable, 'consumable')}
            onDelete={(id) => handleDelete(id, 'consumable')}
            onView={(consumable) => handleView(consumable, 'consumable')}
          />
        );
      case 'components':
        return (
          <ComponentsList
            components={components}
            onCreateNew={() => handleCreateNew('component')}
            onEdit={(component) => handleEdit(component, 'component')}
            onDelete={(id) => handleDelete(id, 'component')}
            onView={(component) => handleView(component, 'component')}
          />
        );
      case 'people':
        return (
          <PeopleList
            users={users}
            onCreateNew={() => handleCreateNew('user')}
            onEdit={(user) => handleEdit(user, 'user')}
            onDelete={(id) => handleDelete(id, 'user')}
            onView={(user) => handleView(user, 'user')}
          />
        );
      case 'predefined-kits':
        return (
          <PredefinedKitsList
            kits={predefinedKits}
            onCreateNew={() => handleCreateNew('kit')}
            onEdit={(kit) => handleEdit(kit, 'kit')}
            onDelete={(id) => handleDelete(id, 'kit')}
            onView={(kit) => handleView(kit, 'kit')}
            onDeploy={handleDeploy}
          />
        );
      case 'requestable-items':
        return (
          <RequestableItemsList
            items={requestableItems}
            onCreateNew={() => handleCreateNew('requestable')}
            onEdit={(item) => handleEdit(item, 'requestable')}
            onDelete={(id) => handleDelete(id, 'requestable')}
            onView={(item) => handleView(item, 'requestable')}
            onRequest={handleRequest}
          />
        );
      case 'alerts':
        return <AlertsManager />;
      case 'compliance':
        return <ComplianceManager assets={assets} licenses={licenses} />;
      case 'maintenance':
        return <MaintenanceManager assets={assets} />;
      case 'financial':
        return (
          <FinancialManager 
            assets={assets}
            licenses={licenses}
            accessories={accessories}
            consumables={consumables}
            components={components}
          />
        );
      case 'analytics':
        return (
          <AnalyticsManager
            assets={assets}
            licenses={licenses}
            accessories={accessories}
            consumables={consumables}
            components={components}
            users={users}
          />
        );
      case 'integrations':
        return <IntegrationsManager />;
      case 'reports':
        return (
          <ReportsManager
            reports={reports}
            onRunReport={handleRunReport}
            onCreateReport={handleCreateReport}
            assets={assets}
            licenses={licenses}
            accessories={accessories}
            consumables={consumables}
            components={components}
            users={users}
            predefinedKits={predefinedKits}
            requestableItems={requestableItems}
          />
        );
      case 'import':
        return <ImportManager imports={imports} onImport={handleImport} />;
      case 'settings':
        return <SettingsManager onSave={handleSaveSettings} />;
      default:
        return (
          <Dashboard 
            metrics={metrics} 
            onSectionChange={setActiveSection}
            onCreateNew={handleCreateNew}
          />
        );
    }
  };

  const renderForm = () => {
    if (!showForm) return null;

    const commonProps = {
      onSave: handleSave,
      onCancel: () => {
        setShowForm(false);
        setEditingItem(null);
      }
    };

    switch (formType) {
      case 'asset':
        return (
          <EnhancedAssetForm
            asset={editingItem}
            {...commonProps}
          />
        );
      case 'license':
        return (
          <LicenseForm
            license={editingItem}
            {...commonProps}
          />
        );
      case 'accessory':
        return (
          <AccessoryForm
            accessory={editingItem}
            {...commonProps}
          />
        );
      case 'consumable':
        return (
          <ConsumableForm
            consumable={editingItem}
            {...commonProps}
          />
        );
      case 'component':
        return (
          <ComponentForm
            component={editingItem}
            {...commonProps}
          />
        );
      case 'user':
        return (
          <UserForm
            user={editingItem}
            {...commonProps}
          />
        );
      case 'kit':
        return (
          <PredefinedKitForm
            kit={editingItem}
            availableAssets={assets}
            availableAccessories={accessories}
            availableLicenses={licenses}
            availableConsumables={consumables}
            {...commonProps}
          />
        );
      case 'requestable':
        return (
          <RequestableItemForm
            item={editingItem}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          userProfile={{
            ...userProfile,
            email: user.email || userProfile.email,
            firstName: user.user_metadata?.first_name || userProfile.firstName,
            lastName: user.user_metadata?.last_name || userProfile.lastName
          }}
          onProfileUpdate={handleProfileUpdate}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {renderForm()}
      
      <ViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingItem(null);
        }}
        item={viewingItem}
        type={viewType}
      />
    </div>
  );
}

export default App;