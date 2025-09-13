'use client';

import { useState, useEffect } from 'react';
import { Folder, File, Plus, Trash2, Edit2, ChevronRight, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { FolderStatus, FileInfo } from '@/types';
import { getFolderStatus, createFolder, deleteFolder, renameFolder, deleteFile, renameFile } from '@/lib/api';
import toast from 'react-hot-toast';

interface FolderManagerProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  onFileSelect: (file: FileInfo) => void;
}

export default function FolderManager({ currentPath, onPathChange, onFileSelect }: FolderManagerProps) {
  const [folderStatus, setFolderStatus] = useState<FolderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [bulkRenameValue, setBulkRenameValue] = useState('');
  const [showBulkRename, setShowBulkRename] = useState(false);

  const loadFolderStatus = async (path: string) => {
    setLoading(true);
    try {
      const status = await getFolderStatus(path);
      setFolderStatus(status);
    } catch (error) {
      console.error('Error loading folder status:', error);
      toast.error('Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolderStatus(currentPath);
  }, [currentPath]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await createFolder({
        name: newFolderName,
        parent_path: currentPath
      });
      toast.success('Folder created successfully');
      setNewFolderName('');
      setShowCreateFolder(false);
      loadFolderStatus(currentPath);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    if (!confirm(`Are you sure you want to delete the folder "${folderName}"?`)) return;
    
    try {
      const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      await deleteFolder(folderPath);
      toast.success('Folder deleted successfully');
      loadFolderStatus(currentPath);
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  const handleRenameFolder = async (oldName: string) => {
    if (!editFolderName.trim()) return;
    
    try {
      await renameFolder({
        old_name: oldName,
        new_name: editFolderName,
        parent_path: currentPath
      });
      toast.success('Folder renamed successfully');
      setEditingFolder(null);
      setEditFolderName('');
      loadFolderStatus(currentPath);
    } catch (error) {
      console.error('Error renaming folder:', error);
      toast.error('Failed to rename folder');
    }
  };

  const handleDeleteFile = async (file: FileInfo) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;
    
    try {
      await deleteFile(file.path);
      toast.success('File deleted successfully');
      loadFolderStatus(currentPath);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  const navigateToFolder = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    onPathChange(newPath);
  };

  const navigateUp = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    onPathChange(pathParts.join('/'));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <File className="w-4 h-4 text-green-500" />;
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext || '')) {
      return <File className="w-4 h-4 text-blue-500" />;
    }
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const isLongFileName = (fileName: string) => {
    return fileName.length > 30; // Consider names longer than 30 characters as "long"
  };

  const toggleFileSelection = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    if (folderStatus?.files) {
      setSelectedFiles(new Set(folderStatus.files.map(f => f.path)));
    }
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    const fileCount = selectedFiles.size;
    if (!confirm(`Are you sure you want to delete ${fileCount} file(s)?`)) return;
    
    try {
      const deletePromises = Array.from(selectedFiles).map(filePath => deleteFile(filePath));
      await Promise.all(deletePromises);
      toast.success(`${fileCount} file(s) deleted successfully`);
      setSelectedFiles(new Set());
      setMultiSelectMode(false);
      loadFolderStatus(currentPath);
    } catch (error) {
      console.error('Error deleting files:', error);
      toast.error('Failed to delete some files');
    }
  };

  const handleBulkRename = async () => {
    if (selectedFiles.size === 0 || !bulkRenameValue.trim()) return;
    
    try {
      const renamePromises = Array.from(selectedFiles).map(async (filePath) => {
        const file = folderStatus?.files.find(f => f.path === filePath);
        if (file) {
          const newName = `${bulkRenameValue}_${file.name}`;
          await renameFile(filePath, newName);
        }
      });
      
      await Promise.all(renamePromises);
      toast.success(`${selectedFiles.size} file(s) renamed successfully`);
      setSelectedFiles(new Set());
      setMultiSelectMode(false);
      setShowBulkRename(false);
      setBulkRenameValue('');
      loadFolderStatus(currentPath);
    } catch (error) {
      console.error('Error renaming files:', error);
      toast.error('Failed to rename some files');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Folder className="w-5 h-5" />
          Folder Manager
          {multiSelectMode && <span className="text-sm text-blue-600">(Multi-Select Mode)</span>}
        </h3>
        <div className="flex items-center gap-2">
          {!multiSelectMode ? (
            <>
              <button
                onClick={() => setMultiSelectMode(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 text-lg"
                style={{border: '2px solid red'}}
              >
                <CheckSquare className="w-5 h-5" />
                MULTI-SELECT
              </button>
              <button
                onClick={() => setShowCreateFolder(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Folder
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600">
                {selectedFiles.size} selected
              </span>
              <button
                onClick={selectAllFiles}
                className="btn-secondary text-sm"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="btn-secondary text-sm"
              >
                Clear
              </button>
              <button
                onClick={() => setShowBulkRename(true)}
                className="btn-primary text-sm"
                disabled={selectedFiles.size === 0}
              >
                Rename
              </button>
              <button
                onClick={handleBulkDelete}
                className="btn-danger text-sm"
                disabled={selectedFiles.size === 0}
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setMultiSelectMode(false);
                  setSelectedFiles(new Set());
                }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
        <button
          onClick={() => onPathChange('')}
          className="hover:text-primary-600"
        >
          Root
        </button>
        {currentPath.split('/').filter(Boolean).map((part, index, array) => (
          <div key={index} className="flex items-center gap-2">
            <span>/</span>
            <button
              onClick={() => {
                const path = array.slice(0, index + 1).join('/');
                onPathChange(path);
              }}
              className="hover:text-primary-600"
            >
              {part}
            </button>
          </div>
        ))}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h4 className="text-lg font-semibold mb-4">Create New Folder</h4>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="input mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="btn-primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Contents */}
      <div className="space-y-2">
        {folderStatus?.subfolders.map((folder) => (
          <div key={folder} className="file-item group">
            <div className="file-name-container">
              <button
                onClick={() => toggleFolder(folder)}
                className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
              >
                {expandedFolders.has(folder) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <button
                onClick={() => navigateToFolder(folder)}
                className="file-name"
                title={folder}
              >
                <span className="file-name-text">
                  {folder}
                </span>
              </button>
            </div>
            <div className="file-actions">
              <button
                onClick={() => {
                  setEditingFolder(folder);
                  setEditFolderName(folder);
                }}
                className="action-button"
                title="Rename folder"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteFolder(folder)}
                className="action-button delete-button"
                title="Delete folder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {folderStatus?.files.map((file) => (
          <div key={file.path} className="file-item group">
            <div className="file-name-container">
              {multiSelectMode && (
                <button
                  onClick={() => toggleFileSelection(file.path)}
                  className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                  title={selectedFiles.has(file.path) ? "Deselect" : "Select"}
                >
                  {selectedFiles.has(file.path) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              )}
              {getFileIcon(file.name)}
              <button
                onClick={() => onFileSelect(file)}
                className="file-name"
                title={file.name}
              >
                <span className="file-name-text">
                  {file.name}
                </span>
              </button>
            </div>
            <div className="file-actions">
              <div className="text-sm text-gray-500 hidden sm:block">
                {formatFileSize(file.size)}
              </div>
              {!multiSelectMode && (
                <button
                  onClick={() => handleDeleteFile(file)}
                  className="action-button delete-button"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {folderStatus?.subfolders.length === 0 && folderStatus?.files.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            This folder is empty
          </div>
        )}
      </div>

      {/* Edit Folder Modal */}
      {editingFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h4 className="text-lg font-semibold mb-4">Rename Folder</h4>
            <input
              type="text"
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              placeholder="New folder name"
              className="input mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingFolder(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRenameFolder(editingFolder)}
                className="btn-primary"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Rename Modal */}
      {showBulkRename && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h4 className="text-lg font-semibold mb-4">
              Bulk Rename ({selectedFiles.size} files)
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Files will be renamed with the prefix you provide. For example: "backup_" will rename "file.txt" to "backup_file.txt"
            </p>
            <input
              type="text"
              value={bulkRenameValue}
              onChange={(e) => setBulkRenameValue(e.target.value)}
              placeholder="Enter prefix (e.g., backup_)"
              className="input mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowBulkRename(false);
                  setBulkRenameValue('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkRename}
                className="btn-primary"
                disabled={!bulkRenameValue.trim()}
              >
                Rename All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
