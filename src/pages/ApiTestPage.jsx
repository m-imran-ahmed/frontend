import React, { useState } from 'react';
import { testDirectFetch, testBackendConnection, api } from '../services/api';

const ApiTestPage = () => {
  const [results, setResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [testUrl, setTestUrl] = useState('http://localhost:5001/api/test');

  const runTest = async (testName, testFunction) => {
    try {
      setIsLoading(true);
      const result = await testFunction();
      setResults(prev => ({ ...prev, [testName]: { success: true, data: result }}));
    } catch (error) {
      console.error(`${testName} error:`, error);
      setResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: false, 
          error: error.message || 'Unknown error'
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const runCustomTest = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(testUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      setResults(prev => ({ 
        ...prev, 
        customTest: { 
          success: true, 
          data,
          status: response.status,
          headers: Object.fromEntries([...response.headers])
        }
      }));
    } catch (error) {
      console.error('Custom test error:', error);
      setResults(prev => ({ 
        ...prev, 
        customTest: { 
          success: false, 
          error: error.message || 'Unknown error'
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const checkRoutes = async () => {
    const routes = [
      '/api/test',
      '/api/auth/login',
      '/api/auth/register',
      '/api/venues'
    ];
    
    setIsLoading(true);
    const routeResults = {};
    
    for (const route of routes) {
      try {
        const response = await fetch(`http://localhost:5000${route}`);
        routeResults[route] = {
          status: response.status,
          ok: response.ok
        };
      } catch (error) {
        routeResults[route] = {
          error: error.message
        };
      }
    }
    
    setResults(prev => ({ ...prev, routeCheck: routeResults }));
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
      
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Test Backend Connection</h2>
          <div className="flex gap-4">
            <button
              onClick={() => runTest('directFetch', testDirectFetch)}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test Direct Fetch
            </button>
            
            <button
              onClick={() => runTest('axiosTest', testBackendConnection)}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test Axios Connection
            </button>
            
            <button
              onClick={checkRoutes}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Check All Routes
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Custom API Test</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
              placeholder="Enter API URL"
            />
            <button
              onClick={runCustomTest}
              disabled={isLoading}
              className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50"
            >
              Test URL
            </button>
          </div>
        </div>
      </div>
      
      {isLoading && (
        <div className="text-center my-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          <p className="mt-2">Testing API connection...</p>
        </div>
      )}
      
      {Object.entries(results).length > 0 && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTestPage; 