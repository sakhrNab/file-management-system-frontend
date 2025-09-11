'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image, Video } from 'lucide-react';
import { uploadFile } from '@/lib/api';
import toast from 'react-hot-toast';

interface FileUploadProps {
  folderPath: string;
  onUploadComplete: () => void;
  useWebhook?: boolean;
}

export default function FileUpload({ folderPath, onUploadComplete, useWebhook = false }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        await uploadFile(file, folderPath);
        toast.success(`File ${file.name} uploaded successfully`);
      }
      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  }, [folderPath, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
      'application/*': ['.pdf', '.doc', '.docx', '.txt', '.zip', '.rar']
    }
  });

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" />
        Upload Files
        {useWebhook && <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Webhook</span>}
      </h3>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <Upload className="w-12 h-12 text-gray-400" />
          
          {isDragActive ? (
            <p className="text-lg text-primary-600">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-lg text-gray-600 mb-2">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports images, videos, and documents
              </p>
            </div>
          )}
          
          {isUploading && (
            <div className="flex items-center gap-2 text-primary-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              Uploading...
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Uploading to: <code className="bg-gray-100 px-2 py-1 rounded">{folderPath || '/'}</code></p>
      </div>
    </div>
  );
}
