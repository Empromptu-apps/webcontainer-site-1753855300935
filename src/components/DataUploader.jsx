import React, { useState } from 'react';

const DataUploader = ({ apiCall }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedData, setExtractedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [summary, setSummary] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    setUploadedFile(file);
    setCurrentStep(2);
    setIsProcessing(true);

    try {
      const fileContent = await readFileContent(file);
      
      // Upload file content to API
      await apiCall('/input_data', 'POST', {
        created_object_name: 'uploaded_document',
        data_type: 'strings',
        input_data: [fileContent]
      });

      // Extract structured data
      await apiCall('/apply_prompt', 'POST', {
        created_object_names: ['extracted_data'],
        prompt_string: 'Extract key business data from this document {uploaded_document} and format as structured JSON with fields like name, type, description, pricing, etc.',
        inputs: [{
          input_object_name: 'uploaded_document',
          mode: 'combine_events'
        }]
      });

      // Get the extracted data
      const result = await apiCall('/return_data', 'POST', {
        object_name: 'extracted_data',
        return_type: 'json'
      });

      if (result.value) {
        let parsedData = [];
        try {
          if (typeof result.value === 'string') {
            parsedData = JSON.parse(result.value);
          } else {
            parsedData = result.value;
          }
          
          if (!Array.isArray(parsedData)) {
            parsedData = [parsedData];
          }
          
          setExtractedData(parsedData);
        } catch (parseError) {
          console.error('Error parsing extracted data:', parseError);
          setExtractedData([{ error: 'Failed to parse extracted data' }]);
        }
      }

      setCurrentStep(3);
    } catch (error) {
      console.error('Error processing file:', error);
      setExtractedData([{ error: 'Failed to process file' }]);
      setCurrentStep(3);
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    
    try {
      await apiCall('/apply_prompt', 'POST', {
        created_object_names: ['document_summary'],
        prompt_string: `${prompt} Based on this data: {extracted_data}`,
        inputs: [{
          input_object_name: 'extracted_data',
          mode: 'combine_events'
        }]
      });

      const result = await apiCall('/return_data', 'POST', {
        object_name: 'document_summary',
        return_type: 'pretty_text'
      });

      setSummary(result.value || 'No summary generated');
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Error generating summary');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCSV = () => {
    if (extractedData.length === 0) return;

    const headers = Object.keys(extractedData[0]);
    const csvContent = [
      headers.join(','),
      ...extractedData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setExtractedData([]);
    setPrompt('');
    setSummary('');
    setIsProcessing(false);
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Document Data Extraction
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Upload documents to extract and analyze business data
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 ${
                      currentStep > step 
                        ? 'bg-primary-600' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Step 1: Upload */}
            <div className="lg:col-span-1">
              <div className="card p-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                  1. Upload Document
                </h2>
                
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                    dragActive 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="text-6xl mb-4">ð</div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Drop your file here
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                    accept=".txt,.csv,.json,.md"
                    aria-label="Upload file"
                  />
                  <label
                    htmlFor="file-upload"
                    className="btn-primary cursor-pointer inline-block"
                  >
                    Choose File
                  </label>
                </div>

                {uploadedFile && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                    <div className="flex items-center">
                      <span className="text-green-500 mr-3">â</span>
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          {uploadedFile.name}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Processing */}
            <div className="lg:col-span-1">
              <div className="card p-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                  2. Add Instructions
                </h2>
                
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter instructions for data analysis..."
                  className="input-field mb-6"
                  rows="6"
                  aria-label="Analysis instructions"
                />
                
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {prompt.length}/500 characters
                  </span>
                </div>

                <button
                  onClick={handlePromptSubmit}
                  disabled={!prompt.trim() || isProcessing || extractedData.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-2xl transition-colors focus:outline-none focus:ring-4 focus:ring-green-200"
                  aria-label="Run analysis"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Run Analysis'
                  )}
                </button>

                {isProcessing && currentStep === 2 && (
                  <div className="mt-6 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Extracting data from your document...
                    </p>
                    <button
                      onClick={() => setIsProcessing(false)}
                      className="mt-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Results */}
            <div className="lg:col-span-1">
              <div className="card p-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                  3. Analysis Results
                </h2>
                
                {summary && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Summary</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 max-h-48 overflow-y-auto">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {summary}
                      </p>
                    </div>
                  </div>
                )}

                {extractedData.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Extracted Data ({extractedData.length} items)
                      </h3>
                      <button
                        onClick={downloadCSV}
                        className="btn-secondary text-sm"
                        aria-label="Download CSV"
                      >
                        ð¥ Download CSV
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700">
                            {Object.keys(extractedData[0] || {}).map((header) => (
                              <th
                                key={header}
                                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {extractedData.slice(0, 5).map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              {Object.values(row).map((value, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600"
                                >
                                  {String(value).substring(0, 50)}
                                  {String(value).length > 50 ? '...' : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {extractedData.length > 5 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                        Showing 5 of {extractedData.length} items. Download CSV for full data.
                      </p>
                    )}
                  </div>
                )}

                {currentStep >= 2 && (
                  <button
                    onClick={resetUpload}
                    className="w-full mt-6 btn-secondary"
                    aria-label="Upload new document"
                  >
                    Upload New Document
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUploader;
