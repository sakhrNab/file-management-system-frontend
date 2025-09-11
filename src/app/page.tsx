'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://drive-backend.aiwaverider.com';

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('access_token');
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }
  return {};
};

interface FileItem {
  name: string;
  path: string;
  size: number;
  type: string;
}

interface FolderItem {
  name: string;
  path: string;
}

function FileManager() {
  const { logout } = useAuth();
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [allFolders, setAllFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showPathSelector, setShowPathSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load folder contents when path changes
  useEffect(() => {
    loadFolderContents();
  }, [currentPath]);

  // Load all available folders for path selection
  useEffect(() => {
    loadAllFolders();
  }, []);

  const loadAllFolders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/folders/status`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        // Convert string array to object array
        const folderObjects = (data.subfolders || []).map((name: string) => ({
          name: name,
          path: name
        }));
        setAllFolders(folderObjects);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadFolderContents = async () => {
    setLoading(true);
    try {
      const url = currentPath 
        ? `${API_BASE_URL}/api/folders/status?folder_path=${encodeURIComponent(currentPath)}`
        : `${API_BASE_URL}/api/folders/status`;
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('API Response for path:', currentPath || 'root', data); // Debug log
        
        setFiles(data.files || []);
        // Convert string array to object array
        const folderObjects = (data.subfolders || []).map((name: string) => ({
          name: name,
          path: currentPath ? `${currentPath}/${name}` : name
        }));
        setFolders(folderObjects);
        setMessage('');
      } else {
        setMessage('Error loading folder contents');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
         formData.append('folder_path', currentPath || '');

        const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setMessage(`File ${result.filename} uploaded successfully!`);
          loadFolderContents(); // Refresh the list
          loadAllFolders(); // Refresh the folder browser
        } else {
          setMessage('Error uploading file');
        }
      }
    } catch (error) {
      setMessage('Error uploading file');
    }
    setLoading(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setMessage('Please enter a folder name');
      return;
    }

    const folderName = newFolderName.trim();
    
    // Check if folder already exists in current location
    const folderExists = folders.some(folder => 
      folder.name.toLowerCase() === folderName.toLowerCase()
    );
    
    if (folderExists) {
      setMessage(`Folder "${folderName}" already exists in this location. Please choose a different name.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
         body: JSON.stringify({
           parent_path: currentPath || '',
           name: folderName,
         }),
      });

      if (response.ok) {
        setMessage(`Folder "${folderName}" created successfully!`);
        setNewFolderName('');
        loadFolderContents(); // Refresh the list
        loadAllFolders(); // Refresh the folder browser
      } else {
        const errorText = await response.text();
        setMessage(`Error creating folder: ${errorText}`);
      }
    } catch (error) {
      setMessage(`Error creating folder: ${error}`);
    }
    setLoading(false);
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    setLoading(true);
    try {
      const filePath = currentPath ? `${currentPath}/${fileName}`.replace(/\/+/g, '/') : fileName;
      const response = await fetch(`${API_BASE_URL}/api/files?file_path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setMessage(`File "${fileName}" deleted successfully!`);
        loadFolderContents(); // Refresh the list
        loadAllFolders(); // Refresh the folder browser
      } else {
        const errorText = await response.text();
        setMessage(`Error deleting file: ${errorText}`);
      }
    } catch (error) {
      setMessage(`Error deleting file: ${error}`);
    }
    setLoading(false);
  };

  const handleDeleteFolder = async (folderName: string) => {
    if (!confirm(`Are you sure you want to delete folder "${folderName}"?`)) return;

    setLoading(true);
    try {
      const folderPath = currentPath ? `${currentPath}/${folderName}`.replace(/\/+/g, '/') : folderName;
      const response = await fetch(`${API_BASE_URL}/api/folders?folder_path=${encodeURIComponent(folderPath)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setMessage(`Folder "${folderName}" deleted successfully!`);
        loadFolderContents(); // Refresh the list
        loadAllFolders(); // Refresh the folder browser
      } else {
        const errorText = await response.text();
        setMessage(`Error deleting folder: ${errorText}`);
      }
    } catch (error) {
      setMessage(`Error deleting folder: ${error}`);
    }
    setLoading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📁</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">File Manager</h1>
              <span className="text-sm text-gray-500">AI Waverider</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                API: {API_BASE_URL}
              </div>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">File Manager Controls</h3>
            
            {message && (
              <div className={`mb-4 p-3 rounded-lg ${
                message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Path:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentPath || ''}
                    onChange={(e) => setCurrentPath(e.target.value)}
                    placeholder="Enter folder path (e.g., videos/instagram/ai.waverider)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setShowPathSelector(!showPathSelector)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg"
                  >
                    📁 Browse
                  </button>
                </div>
                
                {/* Path Selector Dropdown */}
                {showPathSelector && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Select from existing folders:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      <button
                        onClick={() => {
                          setCurrentPath('');
                          setShowPathSelector(false);
                        }}
                        className="p-2 text-left bg-white hover:bg-blue-50 border border-gray-200 rounded text-sm"
                      >
                        📁 Root
                      </button>
                      {allFolders.map((folder, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentPath(folder.name);
                            setShowPathSelector(false);
                          }}
                          className="p-2 text-left bg-white hover:bg-blue-50 border border-gray-200 rounded text-sm"
                        >
                          📁 {folder.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    {loading ? 'Uploading...' : 'Upload Files'}
                  </button>
                  <span className="text-sm text-gray-600">
                    to: <span className="font-medium">{currentPath || 'Root'}</span>
                  </span>
                </div>
                
                {currentPath && (
                  <button
                    onClick={() => {
                      const pathParts = currentPath.split('/');
                      pathParts.pop();
                      setCurrentPath(pathParts.join('/'));
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    ← Back
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setCurrentPath('');
                    setShowPathSelector(false);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg"
                >
                  View Root
                </button>
                
                <button
                  onClick={loadFolderContents}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Refresh
                </button>
              </div>

              {/* Create Folder */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Create New Folder:</label>
                  <input
                    type="text"
                    value={newFolderName || ''}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleCreateFolder}
                  disabled={loading || !newFolderName.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Create
                </button>
              </div>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          {currentPath && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Path:</span>
                <button
                  onClick={() => setCurrentPath('')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Root
                </button>
                {currentPath.split('/').map((segment, index, array) => {
                  const path = array.slice(0, index + 1).join('/');
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-gray-400">/</span>
                      <button
                        onClick={() => setCurrentPath(path)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {segment}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* File List */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Contents of: {currentPath || 'Root'}</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Folders */}
                {folders.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">Folders:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {folders.map((folder, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div 
                            className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-gray-100 rounded p-1"
                            onClick={() => {
                              const newPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
                              setCurrentPath(newPath);
                            }}
                          >
                            <span className="text-yellow-500">📁</span>
                            <span className="font-medium">{folder.name}</span>
                            <span className="text-xs text-gray-400">(click to enter)</span>
                          </div>
                          <button
                            onClick={() => handleDeleteFolder(folder.name)}
                            className="text-red-600 hover:text-red-800 text-sm ml-2"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                {files.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">Files:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-500">📄</span>
                            <div>
                              <div className="font-medium">{file.name}</div>
                              <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteFile(file.name)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {folders.length === 0 && files.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No files or folders found in this directory.</p>
                    <p className="text-sm mt-1">Upload files or create folders to get started.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <FileManager />
    </ProtectedRoute>
  );
}
