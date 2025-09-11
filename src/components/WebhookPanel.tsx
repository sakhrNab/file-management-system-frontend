'use client';

import { useState } from 'react';
import { Code, Copy, Play, Check } from 'lucide-react';
import { webhookUploadFile, webhookDeleteFile, webhookRenameFile, webhookCreateFolder, webhookDeleteFolder, webhookRenameFolder, webhookFolderStatus } from '@/lib/api';
import toast from 'react-hot-toast';

interface WebhookPanelProps {
  currentPath: string;
  onRefresh: () => void;
}

export default function WebhookPanel({ currentPath, onRefresh }: WebhookPanelProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [copied, setCopied] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://drive-backend.aiwaverider.com';

  const webhookEndpoints = {
    upload: {
      method: 'POST',
      url: `${baseUrl}/webhook/files/upload`,
      description: 'Upload a file via webhook',
      params: ['file (multipart)', 'folder_path (optional)']
    },
    delete: {
      method: 'POST',
      url: `${baseUrl}/webhook/files/delete`,
      description: 'Delete a file via webhook',
      params: ['file_path']
    },
    rename: {
      method: 'POST',
      url: `${baseUrl}/webhook/files/rename`,
      description: 'Rename a file via webhook',
      params: ['old_path', 'new_name']
    },
    createFolder: {
      method: 'POST',
      url: `${baseUrl}/webhook/folders/create`,
      description: 'Create a folder via webhook',
      params: ['name', 'parent_path (optional)']
    },
    deleteFolder: {
      method: 'POST',
      url: `${baseUrl}/webhook/folders/delete`,
      description: 'Delete a folder via webhook',
      params: ['folder_path']
    },
    renameFolder: {
      method: 'POST',
      url: `${baseUrl}/webhook/folders/rename`,
      description: 'Rename a folder via webhook',
      params: ['old_name', 'new_name', 'parent_path (optional)']
    },
    status: {
      method: 'GET',
      url: `${baseUrl}/webhook/folders/status`,
      description: 'Get folder status via webhook',
      params: ['folder_path (optional)']
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const testWebhook = async () => {
    try {
      let result;
      switch (activeTab) {
        case 'upload':
          // Create a test file
          const testFile = new File(['Test content'], 'test.txt', { type: 'text/plain' });
          result = await webhookUploadFile(testFile, currentPath);
          break;
        case 'delete':
          result = await webhookDeleteFile('/test.txt');
          break;
        case 'rename':
          result = await webhookRenameFile('/test.txt', 'renamed.txt');
          break;
        case 'createFolder':
          result = await webhookCreateFolder({ name: 'test-folder', parent_path: currentPath });
          break;
        case 'deleteFolder':
          result = await webhookDeleteFolder(`${currentPath}/test-folder`);
          break;
        case 'renameFolder':
          result = await webhookRenameFolder({ old_name: 'test-folder', new_name: 'renamed-folder', parent_path: currentPath });
          break;
        case 'status':
          result = await webhookFolderStatus(currentPath);
          break;
        default:
          return;
      }
      setTestResults(result);
      toast.success('Webhook test completed');
      onRefresh();
    } catch (error) {
      console.error('Webhook test error:', error);
      setTestResults({ error: 'Test failed', details: error });
      toast.error('Webhook test failed');
    }
  };

  const generateCurlCommand = () => {
    const endpoint = webhookEndpoints[activeTab as keyof typeof webhookEndpoints];
    let curl = `curl -X ${endpoint.method} "${endpoint.url}"`;
    
    if (activeTab === 'upload') {
      curl += ` \\\n  -F "file=@/path/to/your/file.jpg" \\\n  -F "folder_path=${currentPath}"`;
    } else if (activeTab === 'delete') {
      curl += ` \\\n  -F "file_path=${currentPath}/filename.jpg"`;
    } else if (activeTab === 'rename') {
      curl += ` \\\n  -F "old_path=${currentPath}/oldname.jpg" \\\n  -F "new_name=newname.jpg"`;
    } else if (activeTab === 'createFolder') {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '{"name": "new-folder", "parent_path": "${currentPath}"}'`;
    } else if (activeTab === 'deleteFolder') {
      curl += ` \\\n  -F "folder_path=${currentPath}/folder-name"`;
    } else if (activeTab === 'renameFolder') {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '{"old_name": "old-folder", "new_name": "new-folder", "parent_path": "${currentPath}"}'`;
    } else if (activeTab === 'status') {
      curl += ` \\\n  -G -d "folder_path=${currentPath}"`;
    }
    
    return curl;
  };

  const generateJavaScriptExample = () => {
    const endpoint = webhookEndpoints[activeTab as keyof typeof webhookEndpoints];
    let js = `// ${endpoint.description}\n`;
    js += `const response = await fetch('${endpoint.url}', {\n`;
    js += `  method: '${endpoint.method}',\n`;
    
    if (activeTab === 'upload') {
      js += `  body: new FormData()\n`;
      js += `    .append('file', file)\n`;
      js += `    .append('folder_path', '${currentPath}')\n`;
    } else if (activeTab === 'delete') {
      js += `  body: new FormData()\n`;
      js += `    .append('file_path', '${currentPath}/filename.jpg')\n`;
    } else if (activeTab === 'rename') {
      js += `  body: new FormData()\n`;
      js += `    .append('old_path', '${currentPath}/oldname.jpg')\n`;
      js += `    .append('new_name', 'newname.jpg')\n`;
    } else if (activeTab === 'createFolder') {
      js += `  headers: { 'Content-Type': 'application/json' },\n`;
      js += `  body: JSON.stringify({\n`;
      js += `    name: 'new-folder',\n`;
      js += `    parent_path: '${currentPath}'\n`;
      js += `  })\n`;
    } else if (activeTab === 'deleteFolder') {
      js += `  body: new FormData()\n`;
      js += `    .append('folder_path', '${currentPath}/folder-name')\n`;
    } else if (activeTab === 'renameFolder') {
      js += `  headers: { 'Content-Type': 'application/json' },\n`;
      js += `  body: JSON.stringify({\n`;
      js += `    old_name: 'old-folder',\n`;
      js += `    new_name: 'new-folder',\n`;
      js += `    parent_path: '${currentPath}'\n`;
      js += `  })\n`;
    } else if (activeTab === 'status') {
      js += `  // GET request with query parameters\n`;
      js += `});\n`;
      js += `\nconst data = await response.json();\n`;
      js += `console.log(data);`;
      return js;
    }
    
    js += `});\n`;
    js += `\nconst data = await response.json();\n`;
    js += `console.log(data);`;
    
    return js;
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Code className="w-5 h-5" />
        Webhook API
      </h3>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(webhookEndpoints).map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Endpoint Info */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Endpoint Information</h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              webhookEndpoints[activeTab as keyof typeof webhookEndpoints].method === 'GET' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {webhookEndpoints[activeTab as keyof typeof webhookEndpoints].method}
            </span>
            <code className="text-sm">{webhookEndpoints[activeTab as keyof typeof webhookEndpoints].url}</code>
            <button
              onClick={() => copyToClipboard(webhookEndpoints[activeTab as keyof typeof webhookEndpoints].url, 'url')}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {copied === 'url' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {webhookEndpoints[activeTab as keyof typeof webhookEndpoints].description}
          </p>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Parameters:</p>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {webhookEndpoints[activeTab as keyof typeof webhookEndpoints].params.map((param, index) => (
                <li key={index}>{param}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Code Examples</h4>
        <div className="space-y-4">
          {/* cURL Example */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">cURL Command</label>
              <button
                onClick={() => copyToClipboard(generateCurlCommand(), 'curl')}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                {copied === 'curl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{generateCurlCommand()}</code>
            </pre>
          </div>

          {/* JavaScript Example */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">JavaScript</label>
              <button
                onClick={() => copyToClipboard(generateJavaScriptExample(), 'js')}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                {copied === 'js' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{generateJavaScriptExample()}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <div className="mb-4">
        <button
          onClick={testWebhook}
          className="btn-primary flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Test Webhook
        </button>
      </div>

      {/* Test Results */}
      {testResults && (
        <div>
          <h4 className="font-medium mb-2">Test Results</h4>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
            <code>{JSON.stringify(testResults, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
