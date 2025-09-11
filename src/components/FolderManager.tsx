'use client';

import { useState, useEffect } from 'react';
import { Folder, File, Plus, Trash2, Edit2, ChevronRight, ChevronDown } from 'lucide-react';
import { FolderStatus, FileInfo } from '@/types';
import { getFolderStatus, createFolder, deleteFolder, renameFolder } from '@/lib/api';
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
        </h3>
        <button
          onClick={() => setShowCreateFolder(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Folder
        </button>
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
          <div key={folder} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleFolder(folder)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {expandedFolders.has(folder) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              <Folder className="w-5 h-5 text-blue-500" />
              <button
                onClick={() => navigateToFolder(folder)}
                className="text-left hover:text-primary-600"
              >
                {folder}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingFolder(folder);
                  setEditFolderName(folder);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteFolder(folder)}
                className="p-1 hover:bg-red-100 rounded text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {folderStatus?.files.map((file) => (
          <div key={file.path} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {getFileIcon(file.name)}
              <button
                onClick={() => onFileSelect(file)}
                className="text-left hover:text-primary-600"
              >
                {file.name}
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {formatFileSize(file.size)}
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
    </div>
  );
}
