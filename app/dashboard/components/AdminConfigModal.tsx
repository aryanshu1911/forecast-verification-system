'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import type { RainfallConfig, MultiModeClassification } from '@/app/utils/useRainfallConfig';

interface AdminConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminConfigModal({ isOpen, onClose }: AdminConfigModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState<RainfallConfig | null>(null);
  const [editedConfig, setEditedConfig] = useState<RainfallConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModeConfirm, setShowModeConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<'dual' | 'multi' | null>(null);

  useEffect(() => {
    if (isAuthenticated && !config) {
      loadConfig();
    }
  }, [isAuthenticated]);



  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/rainfall-config');
      const result = await response.json();

      if (result.success) {
        setConfig(result.config);
        setEditedConfig(JSON.parse(JSON.stringify(result.config)));
      } else {
        toast.error('Failed to load configuration');
      }
    } catch (error: any) {
      console.error('Load error:', error);
      toast.error('Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === 'admin123') {
      setIsAuthenticated(true);
      toast.success('Access granted');
    } else {
      toast.error('Invalid password');
      setPassword('');
    }
  };

  const handleModeChange = (newMode: 'dual' | 'multi') => {
    if (!editedConfig || editedConfig.mode === newMode) return;
    
    setPendingMode(newMode);
    setShowModeConfirm(true);
  };

  const confirmModeSwitch = async () => {
    if (!pendingMode) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/rainfall-config/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'admin123',
          mode: pendingMode
        })
      });

      const result = await response.json();

      if (result.success) {
        setConfig(result.config);
        setEditedConfig(JSON.parse(JSON.stringify(result.config)));
        toast.success(`Switched to ${pendingMode} mode`);
        setShowModeConfirm(false);
        setPendingMode(null);
      } else {
        toast.error(result.error || 'Failed to switch mode');
      }
    } catch (error: any) {
      console.error('Mode switch error:', error);
      toast.error('Failed to switch mode');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!editedConfig) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/rainfall-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'admin123',
          config: editedConfig
        })
      });

      const result = await response.json();

      if (result.success) {
        setConfig(result.config);
        setEditedConfig(JSON.parse(JSON.stringify(result.config)));
        toast.success('Configuration saved successfully!');
      } else {
        toast.error(result.error || 'Failed to save configuration');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (config) {
      setEditedConfig(JSON.parse(JSON.stringify(config)));
      toast.success('Changes discarded');
    }
  };

  const handleAddClassification = () => {
    if (!editedConfig) return;

    const newItem: MultiModeClassification = {
      id: `NEW_${Date.now()}`,
      variableName: 'NEW',
      label: 'New Classification',
      thresholdMm: 0,
      codes: [],
      enabled: true,
      order: editedConfig.classifications.multi.items.length + 1
    };

    setEditedConfig({
      ...editedConfig,
      classifications: {
        ...editedConfig.classifications,
        multi: {
          ...editedConfig.classifications.multi,
          items: [...editedConfig.classifications.multi.items, newItem]
        }
      }
    });
  };

  const handleDeleteClassification = (index: number) => {
    if (!editedConfig) return;

    if (confirm('Are you sure you want to delete this classification?')) {
      const newItems = editedConfig.classifications.multi.items.filter((_, i) => i !== index);
      setEditedConfig({
        ...editedConfig,
        classifications: {
          ...editedConfig.classifications,
          multi: {
            ...editedConfig.classifications.multi,
            items: newItems
          }
        }
      });
      toast.success('Classification removed');
    }
  };

  const handleUpdateClassification = (index: number, field: keyof MultiModeClassification, value: any) => {
    if (!editedConfig) return;

    const newItems = [...editedConfig.classifications.multi.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };

    setEditedConfig({
      ...editedConfig,
      classifications: {
        ...editedConfig.classifications,
        multi: {
          ...editedConfig.classifications.multi,
          items: newItems
        }
      }
    });
  };

  const handleCodesChange = (index: number, codesString: string) => {
    const codes = codesString
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '')
      .map(s => parseInt(s))
      .filter(n => !isNaN(n));

    handleUpdateClassification(index, 'codes', codes);
  };

  const handleAddCode = (index: number, code: number) => {
    if (!editedConfig) return;

    const currentItem = editedConfig.classifications.multi.items[index];
    
    // Check if code already exists in current classification
    if (currentItem.codes.includes(code)) {
      toast.error(`Code ${code} already exists in this classification`);
      return;
    }

    // Check if code exists in other classifications
    const otherUsedCodes = getAllUsedCodes(index);
    if (otherUsedCodes.includes(code)) {
      toast.error(`Code ${code} is already used in another classification`);
      return;
    }

    // Add the code
    const newCodes = [...currentItem.codes, code].sort((a, b) => a - b);
    handleUpdateClassification(index, 'codes', newCodes);
    toast.success(`Code ${code} added successfully`);
  };

  const handleRemoveCode = (index: number, code: number) => {
    if (!editedConfig) return;

    const currentItem = editedConfig.classifications.multi.items[index];
    const newCodes = currentItem.codes.filter(c => c !== code);
    handleUpdateClassification(index, 'codes', newCodes);
    toast.success(`Code ${code} removed`);
  };



  const getAllUsedCodes = (excludeIndex?: number): number[] => {
    if (!editedConfig) return [];
    
    const allCodes: number[] = [];
    editedConfig.classifications.multi.items.forEach((item, idx) => {
      if (excludeIndex === undefined || idx !== excludeIndex) {
        allCodes.push(...item.codes);
      }
    });
    
    return allCodes;
  };

  const getDuplicateCodes = (index: number): number[] => {
    if (!editedConfig) return [];
    
    const currentCodes = editedConfig.classifications.multi.items[index].codes;
    const otherCodes = getAllUsedCodes(index);
    
    return currentCodes.filter(code => otherCodes.includes(code));
  };

  const handleClose = () => {
    setIsAuthenticated(false);
    setPassword('');
    setConfig(null);
    setEditedConfig(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              Admin Configuration - Rainfall Classification System
            </h2>
            <button onClick={handleClose} className="text-white hover:text-gray-200 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {!isAuthenticated ? (
              // Password Form
              <div className="max-w-md mx-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-yellow-800 font-medium">Admin Access Required</span>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Admin Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Authenticate
                  </button>
                </form>
              </div>
            ) : isLoading ? (
              // Loading State
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading configuration...</p>
                </div>
              </div>
            ) : editedConfig ? (
              // Configuration Interface
              <div className="space-y-6">
                {/* Mode Selector */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Classification Mode</h3>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        value="dual"
                        checked={editedConfig.mode === 'dual'}
                        onChange={() => handleModeChange('dual')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        <strong>Dual Mode</strong> (Simple Binary)
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        value="multi"
                        checked={editedConfig.mode === 'multi'}
                        onChange={() => handleModeChange('multi')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        <strong>Multi Mode</strong> (Advanced Custom)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Dual Mode Panel */}
                {editedConfig.mode === 'dual' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Dual Mode Configuration</h3>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Fixed Binary Classification:</strong>
                      </p>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Below 64.5mm → <strong className="ml-1 text-blue-700">L (Less)</strong>
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          ≥ 64.5mm → <strong className="ml-1 text-red-700">H (Heavy)</strong>
                        </li>
                      </ul>
                      <p className="text-xs text-gray-500 mt-4 italic">
                        No editable fields in dual mode. Threshold is fixed at 64.5mm.
                      </p>
                    </div>
                  </div>
                )}

                {/* Multi Mode Panel */}
                {editedConfig.mode === 'multi' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-green-900 mb-2">Multi Mode Configuration</h3>
                      <p className="text-xs text-green-700 mb-2">
                        Define custom classifications with variable names and associated codes. Thresholds are managed internally.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 mt-2">
                        <p className="text-xs text-blue-800">
                          <strong>💡 Tip:</strong> Use the Add button to include codes. Duplicate codes across classifications are prevented automatically.
                        </p>
                      </div>
                    </div>

                    {/* Classification Cards */}
                    <div className="space-y-4">
                      {editedConfig.classifications.multi.items.map((item, index) => {
                        const duplicates = getDuplicateCodes(index);
                        const otherUsedCodes = getAllUsedCodes(index);
                        
                        return (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="grid grid-cols-12 gap-4">
                              {/* Variable Name Column */}
                              <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Variable Name
                                </label>
                                <input
                                  type="text"
                                  value={item.variableName}
                                  onChange={(e) => handleUpdateClassification(index, 'variableName', e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              {/* Codes Management Column */}
                              <div className="col-span-7">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Associated Codes
                                </label>
                                
                                {/* Add Code Input */}
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="number"
                                    id={`code-input-${index}`}
                                    placeholder="Enter code number"
                                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.currentTarget;
                                        const code = parseInt(input.value);
                                        if (!isNaN(code)) {
                                          handleAddCode(index, code);
                                          input.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      const input = document.getElementById(`code-input-${index}`) as HTMLInputElement;
                                      if (input) {
                                        const code = parseInt(input.value);
                                        if (!isNaN(code)) {
                                          handleAddCode(index, code);
                                          input.value = '';
                                        }
                                      }
                                    }}
                                    className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center gap-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add
                                  </button>
                                </div>

                                {/* Codes List */}
                                {item.codes.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {item.codes.map((code) => {
                                      const isDuplicate = otherUsedCodes.includes(code);
                                      return (
                                        <div
                                          key={code}
                                          className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                                            isDuplicate
                                              ? 'bg-red-100 border border-red-300 text-red-800'
                                              : 'bg-blue-100 border border-blue-300 text-blue-800'
                                          }`}
                                        >
                                          <span className="font-medium">{code}</span>
                                          {isDuplicate && (
                                            <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                          )}
                                          <button
                                            onClick={() => handleRemoveCode(index, code)}
                                            className="ml-1 hover:bg-white hover:bg-opacity-50 rounded p-0.5 transition-colors"
                                            title="Remove code"
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 italic">No codes added yet</p>
                                )}

                                {/* Duplicate Warning */}
                                {duplicates.length > 0 && (
                                  <div className="flex items-start gap-1 text-xs text-red-600 mt-2 bg-red-50 border border-red-200 rounded px-2 py-1">
                                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span><strong>Warning:</strong> Duplicate codes detected: {duplicates.join(', ')}</span>
                                  </div>
                                )}
                              </div>

                              {/* Enabled & Delete Column */}
                              <div className="col-span-2 flex flex-col items-center justify-start gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.enabled}
                                    onChange={(e) => handleUpdateClassification(index, 'enabled', e.target.checked)}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-xs text-gray-700">Enabled</span>
                                </label>
                                <button
                                  onClick={() => handleDeleteClassification(index)}
                                  className="text-red-600 hover:text-red-800 transition-colors p-1"
                                  title="Delete classification"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={handleAddClassification}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New Classification
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel Changes
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Configuration
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mode Switch Confirmation Dialog */}
      {showModeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Mode Switch</h3>
            <p className="text-sm text-gray-600 mb-6">
              {pendingMode === 'dual' 
                ? 'Switching to Dual Mode will use a fixed 64.5mm threshold for binary classification (L/H).'
                : 'Switching to Multi Mode will enable advanced custom classifications with multiple levels.'}
            </p>
            <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3 mb-6">
              <strong>Warning:</strong> All verification results will be recalculated based on the new mode.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModeConfirm(false);
                  setPendingMode(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmModeSwitch}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
              >
                {isSaving ? 'Switching...' : 'Confirm Switch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
