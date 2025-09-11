import axios from 'axios';
import { FileInfo, FolderStatus, WebhookResponse, FolderCreate, FolderRename, UploadResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// File operations
export const uploadFile = async (file: File, folderPath: string = ''): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder_path', folderPath);
  
  const response = await api.post('/api/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const deleteFile = async (filePath: string): Promise<void> => {
  await api.delete('/api/files', {
    params: { file_path: filePath }
  });
};

export const renameFile = async (oldPath: string, newName: string): Promise<void> => {
  await api.put('/api/files/rename', null, {
    params: { old_path: oldPath, new_name: newName }
  });
};

export const downloadFile = (filePath: string): string => {
  return `${API_BASE_URL}/api/files/download${filePath}`;
};

export const listAllFiles = async (folderPath: string = ''): Promise<{ files: FileInfo[]; count: number }> => {
  const response = await api.get('/api/files/list', {
    params: { folder_path: folderPath }
  });
  return response.data;
};

// Folder operations
export const createFolder = async (folder: FolderCreate): Promise<WebhookResponse> => {
  const response = await api.post('/api/folders', folder);
  return response.data;
};

export const deleteFolder = async (folderPath: string): Promise<WebhookResponse> => {
  const response = await api.delete('/api/folders', {
    params: { folder_path: folderPath }
  });
  return response.data;
};

export const renameFolder = async (renameData: FolderRename): Promise<WebhookResponse> => {
  const response = await api.put('/api/folders/rename', renameData);
  return response.data;
};

export const getFolderStatus = async (folderPath: string = ''): Promise<FolderStatus> => {
  const response = await api.get('/api/folders/status', {
    params: { folder_path: folderPath }
  });
  return response.data;
};

// Webhook operations
export const webhookUploadFile = async (file: File, folderPath: string = ''): Promise<WebhookResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder_path', folderPath);
  
  const response = await api.post('/webhook/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const webhookDeleteFile = async (filePath: string): Promise<WebhookResponse> => {
  const response = await api.post('/webhook/files/delete', null, {
    params: { file_path: filePath }
  });
  return response.data;
};

export const webhookRenameFile = async (oldPath: string, newName: string): Promise<WebhookResponse> => {
  const response = await api.post('/webhook/files/rename', null, {
    params: { old_path: oldPath, new_name: newName }
  });
  return response.data;
};

export const webhookCreateFolder = async (folder: FolderCreate): Promise<WebhookResponse> => {
  const response = await api.post('/webhook/folders/create', folder);
  return response.data;
};

export const webhookDeleteFolder = async (folderPath: string): Promise<WebhookResponse> => {
  const response = await api.post('/webhook/folders/delete', null, {
    params: { folder_path: folderPath }
  });
  return response.data;
};

export const webhookRenameFolder = async (renameData: FolderRename): Promise<WebhookResponse> => {
  const response = await api.post('/webhook/folders/rename', renameData);
  return response.data;
};

export const webhookFolderStatus = async (folderPath: string = ''): Promise<WebhookResponse> => {
  const response = await api.get('/webhook/folders/status', {
    params: { folder_path: folderPath }
  });
  return response.data;
};
