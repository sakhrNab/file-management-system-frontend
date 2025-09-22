export interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: string;
  type: string;
}

export interface FolderStatus {
  path: string;
  files: FileInfo[];
  subfolders: string[];
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface FolderCreate {
  name: string;
  parent_path: string;
}

export interface FolderRename {
  old_name: string;
  new_name: string;
  parent_path: string;
}

export interface UploadResponse {
  filename: string;
  path: string;
  size: number;
  url: string;
}

export interface BulkDownloadRequest {
  file_paths: string[];
  archive_name?: string;
}
