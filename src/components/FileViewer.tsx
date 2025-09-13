'use client';

import { useState } from 'react';
import { FileInfo } from '@/types';
import { downloadFile, deleteFile, renameFile } from '@/lib/api';
import { Download, Trash2, Edit2, X, Check, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileViewerProps {
  file: FileInfo | null;
  onClose: () => void;
  onFileDeleted: () => void;
}

export default function FileViewer({ file, onClose, onFileDeleted }: FileViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!file) return null;

  const handleDownload = () => {
    const url = downloadFile(file.path);
    window.open(url, '_blank');
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;
    
    setIsDeleting(true);
    try {
      await deleteFile(file.path);
      toast.success('File deleted successfully');
      onFileDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async () => {
    if (!editName.trim() || editName === file.name) {
      setIsEditing(false);
      return;
    }
    
    try {
      await renameFile(file.path, editName);
      toast.success('File renamed successfully');
      setIsEditing(false);
      onFileDeleted(); // Refresh the file list
    } catch (error) {
      console.error('Error renaming file:', error);
      toast.error('Failed to rename file');
    }
  };

  const startEdit = () => {
    setEditName(file.name);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setEditName('');
    setIsEditing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'Image';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext || '')) return 'Video';
    if (['pdf'].includes(ext || '')) return 'PDF';
    if (['doc', 'docx'].includes(ext || '')) return 'Document';
    if (['zip', 'rar'].includes(ext || '')) return 'Archive';
    return 'File';
  };

  const isImage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  const isVideo = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext || '');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-lg font-semibold px-2 py-1 border rounded flex-1 min-w-0"
                autoFocus
              />
            ) : (
              <h2 className="text-lg font-semibold truncate flex-1 min-w-0" title={file.name}>
                {file.name}
              </h2>
            )}
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
              {getFileType(file.name)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleRename}
                  className="p-2 hover:bg-green-100 rounded text-green-600"
                  title="Save"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Cancel"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startEdit}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Rename"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-blue-100 rounded text-blue-600"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 hover:bg-red-100 rounded text-red-600 disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {/* File Preview */}
          <div className="mb-6">
            {isImage(file.name) && (
              <div className="text-center">
                <img
                  src={downloadFile(file.path)}
                  alt={file.name}
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                />
              </div>
            )}
            
            {isVideo(file.name) && (
              <div className="text-center">
                <video
                  src={downloadFile(file.path)}
                  controls
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            
            {!isImage(file.name) && !isVideo(file.name) && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-lg mx-auto flex items-center justify-center mb-4">
                  <span className="text-2xl text-gray-400">
                    {getFileType(file.name).charAt(0)}
                  </span>
                </div>
                <p className="text-gray-500">Preview not available for this file type</p>
                <button
                  onClick={handleDownload}
                  className="btn-primary mt-4"
                >
                  Download to view
                </button>
              </div>
            )}
          </div>

          {/* File Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">File Name</label>
                <p className="text-sm break-all" title={file.name}>{file.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">File Size</label>
                <p className="text-sm">{formatFileSize(file.size)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">File Type</label>
                <p className="text-sm">{getFileType(file.name)}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Last Modified</label>
                <p className="text-sm">{formatDate(file.modified)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">File Path</label>
                <p className="text-sm font-mono text-gray-600 break-all">{file.path}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
